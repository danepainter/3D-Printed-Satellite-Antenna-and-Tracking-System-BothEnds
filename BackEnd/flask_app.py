#JUSTIN ISARAPHANICH 9/3/2025 LAST MODIFIED
#FLASK APP FILE, CREATE THE FLASK APP AND THE ROUTES

from flask import Flask, jsonify, request
import os
from flask_cors import CORS
from config import Config
from database import db, init_db
from models import Data, Positions
from src.sd_control import live_process, record_process, offline_process
from src.n2yo_call import fetch_visualPasses
from sattracker.satpass import SatPass
from sattracker.satinterpolation import SatInterpolation
from sattracker.satserial import SatSerial
import threading
from datetime import datetime
from dotenv import load_dotenv

load_dotenv
app = Flask(__name__)
app.config.from_object(Config)

init_db(app)
CORS(app)

# Add near the top after imports
live_process_status = {
    'is_running': False,
    'completed': False,
    'success': False,
    'message': '',
    'completed_at': None,
    'return_code': None
}

@app.route('/')
def hello_world():
    return 'Testing!'

@app.route('/<int:id>', methods=['GET'])
def get_data(id):
    data = Data.query.get(id)
    if data:
        return jsonify({
            'id': data.id,
            'title': data.title,
            'satellite': data.satellite
        })
    return jsonify({'Error': 'Data not found'})

@app.route('/add', methods=['POST'])
def add_data():
    data = Data(title=request.json['title'], satellite=request.json['satellite'])
    db.session.add(data)
    db.session.commit()
    return jsonify({'message': 'Data added successfully'})

# New endpoints for calling Python functions

@app.route('/satellite/start-recording', methods=['POST'])
def start_recording():
    try:
        record_process()  # Call your Python function
        return jsonify({'success': True, 'message': 'Recording started successfully'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/satellite/process-offline', methods=['POST'])
def process_offline():
    try:
        offline_process()
        # Call your Python function
        return jsonify({'success': True, 'message': 'Offline processing completed successfully'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/satellite/visual-passes', methods=['POST'])
def get_visual_passes():
    try:
        data = request.get_json()
        # Extract parameters from request

        # COMMENTED OUT - No testing parameters, incorporating user input
        # sat_id = data.get('id', 25544)  # Default to ISS
        # observer_lat = data.get('observer_lat', 41.702)
        # observer_lng = data.get('observer_lng', -76.014)
        # observer_alt = data.get('observer_alt', 0)
        # days = data.get('days', 2)
        # min_visibility = data.get('min_visibility', 300)


        # Validate required parameters
        required_params = ['id', 'observer_lat', 'observer_lng', 'observer_alt', 'days', 'min_visibility']
        missing_params = [param for param in required_params if param not in data]
        
        if missing_params:
            return jsonify({
                'success': False, 
                'error': f'Missing required parameters: {", ".join(missing_params)}'
            }), 400
        
        # Extract parameters (no defaults for user inputs)
        sat_id = data['id']
        observer_lat = data['observer_lat']
        observer_lng = data['observer_lng']
        observer_alt = data['observer_alt']
        days = data['days']
        min_visibility = data['min_visibility']
        api_key = data.get('api_key', os.getenv("API_KEY"))
        
        # Fetch visual passes from N2YO API
        json_data = fetch_visualPasses(sat_id, observer_lat, observer_lng, observer_alt, days, min_visibility, api_key)
        return jsonify({'success': True, 'data': json_data})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/satellite/interpolate-path', methods=['POST'])
def interpolate_pass():
    """Process a specific pass through sattracker pipeline and attempt serial communication"""
    try:
        data = request.get_json()
        
        # Validate required pass data fields
        required_fields = ['startAz', 'startEl', 'startUTC', 'maxAz', 'maxEl', 'maxUTC', 'endAz', 'endEl', 'endUTC']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({
                'success': False,
                'error': f'Missing required pass fields: {", ".join(missing_fields)}'
            }), 400
        
        # Convert to SatPass object 
        sat_pass = SatPass(
            data['startAz'],
            data['startEl'],
            int(data['startUTC']),
            data['maxAz'],
            data['maxEl'],
            int(data['maxUTC']),
            data['endAz'],
            data['endEl'],
            int(data['endUTC'])
        )
        
        # Generate interpolated satellite path (20 second intervals)
        sat_interpolation = SatInterpolation(sat_pass)
        sat_path = sat_interpolation.interp_satellite_path(20)
        
        # Attempt serial communication (will fail without hardware)
        serial_status = None
        try:
            serial = SatSerial()
            serial.connect()
            serial.send_ping_command()
            # Send first position as test
            if sat_path:
                first_pos = sat_path[0]  # (az, el, time)
                serial.send_got_command(first_pos[1], first_pos[0], first_pos[2])
                serial_status = 'Success: Serial commands sent'
            serial.close()
        except Exception as serial_error:
            serial_status = f'Expected failure (no hardware): {str(serial_error)}'
        
        return jsonify({
            'success': True,
            'interpolated_path': sat_path,
            'serial_attempt': serial_status
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# For long-running processes, use threading
@app.route('/satellite/start-live', methods=['POST'])
def start_live_tracking():
    try:
        print("Received request to start live tracking")
        
        # Reset status
        global live_process_status
        live_process_status = {
            'is_running': True,
            'completed': False,
            'success': False,
            'message': 'Live process started',
            'completed_at': None,
            'return_code': None
        }
        
        # Run in background thread so it doesn't block the API
        thread = threading.Thread(target=live_process_wrapper)
        thread.daemon = True
        thread.start()
        
        print("Live tracking thread started successfully")
        return jsonify({'success': True, 'message': 'Live tracking started in background'})
    except Exception as e:
        print(f"Error starting live tracking: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

# Add new wrapper function
def live_process_wrapper():
    """Wrapper to track status of live_process"""
    global live_process_status
    try:
        return_code = live_process()  # Will need to modify this to return status
        live_process_status.update({
            'is_running': False,
            'completed': True,
            'success': return_code == 0 if return_code is not None else True,
            'message': 'Live process completed successfully' if return_code == 0 else 'Live process completed with errors',
            'completed_at': datetime.now().isoformat(),
            'return_code': return_code
        })
    except Exception as e:
        live_process_status.update({
            'is_running': False,
            'completed': True,
            'success': False,
            'message': f'Live process failed: {str(e)}',
            'completed_at': datetime.now().isoformat(),
            'return_code': None
        })

# Add new status check endpoint
@app.route('/satellite/live-status', methods=['GET'])
def get_live_status():
    """Check the status of the live process"""
    return jsonify({
        'success': True,
        'status': live_process_status
    })

# Add endpoint to reset/acknowledge the completion
@app.route('/satellite/live-status/reset', methods=['POST'])
def reset_live_status():
    """Reset the live process status (call after user acknowledges)"""
    global live_process_status
    live_process_status = {
        'is_running': False,
        'completed': False,
        'success': False,
        'message': '',
        'completed_at': None,
        'return_code': None
    }
    return jsonify({'success': True, 'message': 'Status reset'})

if __name__ == '__main__':
    app.run(debug=True)

# TEST for Flask