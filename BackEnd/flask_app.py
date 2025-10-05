#JUSTIN ISARAPHANICH 9/3/2025 LAST MODIFIED
#FLASK APP FILE, CREATE THE FLASK APP AND THE ROUTES

from flask import Flask, jsonify, request
from flask_cors import CORS
from config import Config
from database import db, init_db
from models import Data, Positions
from src.sd_control import live_process, record_process, offline_process
from src.n2yo_call import fetch_visualPasses
import threading


app = Flask(__name__)
app.config.from_object(Config)

init_db(app)
CORS(app)

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
        offline_process()  # Call your Python function
        return jsonify({'success': True, 'message': 'Offline processing completed successfully'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/satellite/visual-passes', methods=['POST'])
def get_visual_passes():
    try:
        data = request.get_json()
        # Extract parameters from request
        sat_id = data.get('id', 25544)  # Default to ISS
        observer_lat = data.get('observer_lat', 41.702)
        observer_lng = data.get('observer_lng', -76.014)
        observer_alt = data.get('observer_alt', 0)
        days = data.get('days', 2)
        min_visibility = data.get('min_visibility', 300)
        api_key = data.get('api_key', '47PJFS-Y3V2DK-H5B8CH-5JF4')
        
        # Call your Python function
        result = fetch_visualPasses(sat_id, observer_lat, observer_lng, observer_alt, days, min_visibility, api_key)
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# For long-running processes, use threading
@app.route('/satellite/start-live', methods=['POST'])
def start_live_tracking():
    try:
        # Run in background thread so it doesn't block the API
        thread = threading.Thread(target=live_process)
        thread.daemon = True
        thread.start()
        
        return jsonify({'success': True, 'message': 'Live tracking started in background'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)

# TEST for Flask