# JUSTIN ISARAPHANICH 9/3/2025 LAST MODIFIED
# FLASK APP FILE, CREATE THE FLASK APP AND THE ROUTES

import time
from flask import Flask, jsonify, request
import os
from flask_cors import CORS
from config import Config
from database import db, init_db
from models import Data, Positions, TrackingLog
from src.sd_control import live_process, record_process, offline_process
from src.n2yo_call import fetch_visualPasses, fetch_positions
from sattracker.satpass import SatPass
from sattracker.satinterpolation import SatInterpolation
from sattracker.satserial import SatSerial
import threading
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config.from_object(Config)

DEBUG_MODE = False  # use fake api data for testing

init_db(app)
CORS(app)

# Add near the top after imports
live_process_status = {
    "is_running": False,
    "completed": False,
    "success": False,
    "message": "",
    "completed_at": None,
    "return_code": None,
}


@app.route("/")
def hello_world():
    return "Testing!"


@app.route("/<int:id>", methods=["GET"])
def get_data(id):
    data = Data.query.get(id)
    if data:
        return jsonify({"id": data.id, "title": data.title, "satellite": data.satellite})
    return jsonify({"Error": "Data not found"})


@app.route("/add", methods=["POST"])
def add_data():
    data = Data(title=request.json["title"], satellite=request.json["satellite"])
    db.session.add(data)
    db.session.commit()
    return jsonify({"message": "Data added successfully"})


# New endpoints for calling Python functions


@app.route("/satellite/start-recording", methods=["POST"])
def start_recording():
    try:
        data = request.get_json() or {}

        required_fields = ["outputName", "source", "sampleRate", "frequency", "basebandFormat"]
        missing = [field for field in required_fields if not data.get(field)]

        if missing:
            return jsonify(
                {
                    "success": False,
                    "error": f"Missing required recording parameters: {', '.join(missing)}",
                }
            ), 400

        payload = {
            "outputName": data["outputName"],
            "source": data["source"],
            "sampleRate": data["sampleRate"],
            "frequency": data["frequency"],
            "basebandFormat": data["basebandFormat"],
        }

        if data.get("bitDepth") is not None:
            payload["bitDepth"] = data["bitDepth"]

        if data.get("timeout") is not None:
            payload["timeout"] = data["timeout"]

        extra_args = data.get("extraArgs")
        if isinstance(extra_args, str) and extra_args.strip():
            payload["extraArgs"] = extra_args

        return_code = record_process(payload)

        if return_code != 0:
            return jsonify(
                {
                    "success": False,
                    "error": f"Recording process exited with code {return_code}",
                }
            ), 500

        return jsonify({"success": True, "message": "Recording finished successfully"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/satellite/process-offline", methods=["POST"])
def process_offline():
    try:
        data = request.get_json() or {}

        required_fields = ["pipeline", "inputLevel", "inputFile"]
        missing = [field for field in required_fields if not data.get(field)]

        if missing:
            return jsonify(
                {
                    "success": False,
                    "error": f"Missing required offline parameters: {', '.join(missing)}",
                }
            ), 400

        payload = {
            "pipeline": data["pipeline"],
            "inputLevel": data["inputLevel"],
            "inputFile": data["inputFile"],
        }

        if data.get("outputDir"):
            payload["outputDir"] = data["outputDir"]

        if data.get("samplerate") not in (None, "", "null"):
            payload["samplerate"] = data["samplerate"]

        if data.get("basebandFormat"):
            payload["basebandFormat"] = data["basebandFormat"]

        if bool(data.get("dcBlock")):
            payload["dcBlock"] = True

        if data.get("freqShift") not in (None, "", "null"):
            payload["freqShift"] = data["freqShift"]

        if bool(data.get("iqSwap")):
            payload["iqSwap"] = True

        extra_args = data.get("extraArgs")
        if isinstance(extra_args, str) and extra_args.strip():
            payload["extraArgs"] = extra_args

        return_code = offline_process(payload)

        if return_code != 0:
            return jsonify(
                {
                    "success": False,
                    "error": f"Offline process exited with code {return_code}",
                }
            ), 500

        return jsonify({"success": True, "message": "Offline processing completed successfully"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/satellite/visual-passes", methods=["POST"])
def get_visual_passes():
    try:
        data = request.get_json()
        # Validate required parameters
        required_params = ["id", "observer_lat", "observer_lng", "observer_alt", "days", "min_visibility"]
        missing_params = [param for param in required_params if param not in data]

        if missing_params:
            return jsonify(
                {
                    "success": False,
                    "error": f"Missing required parameters: {', '.join(missing_params)}",
                }
            ), 400

        # Extract parameters (no defaults for user inputs)
        sat_id = data["id"]
        observer_lat = data["observer_lat"]
        observer_lng = data["observer_lng"]
        observer_alt = data["observer_alt"]
        days = data["days"]
        min_visibility = data["min_visibility"]
        api_key = data.get("api_key", os.getenv("API_KEY"))

        # Fetch visual passes from N2YO API
        json_data = fetch_visualPasses(
            sat_id, observer_lat, observer_lng, observer_alt, days, min_visibility, api_key
        )
        return jsonify({"success": True, "data": json_data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/satellite/interpolate-path", methods=["POST"])
def interpolate_pass():
    """Process a specific pass through sattracker pipeline and attempt serial communication"""
    try:
        data = request.get_json()

        # Validate required pass data fields
        required_fields = [
            "startAz",
            "startEl",
            "startUTC",
            "maxAz",
            "maxEl",
            "maxUTC",
            "endAz",
            "endEl",
            "endUTC",
        ]
        missing_fields = [field for field in required_fields if field not in data]

        if missing_fields:
            return jsonify(
                {
                    "success": False,
                    "error": f"Missing required pass fields: {', '.join(missing_fields)}",
                }
            ), 400

        # Convert to SatPass object
        if DEBUG_MODE:
            sat_pass = SatPass(
                311.57,
                0.00,
                time.time() + 30,  # start 30 seconds from now
                37.98,
                52.19,
                time.time() + 180,  # peak at 3 minutes
                118.6,
                0.00,
                time.time() + 360,  # end at 6 minutes
            )
        else:
            sat_pass = SatPass(
                data["startAz"],
                data["startEl"],
                int(data["startUTC"]),
                data["maxAz"],
                data["maxEl"],
                int(data["maxUTC"]),
                data["endAz"],
                data["endEl"],
                int(data["endUTC"]),
            )

        # Generate interpolated satellite path (5 second intervals)
        increment = 5
        sat_interpolation = SatInterpolation(sat_pass)
        sat_path = sat_interpolation.interp_satellite_path(increment)

        # Attempt serial communication (will fail without hardware)
        serial_status = None
        try:
            serial = SatSerial()
            serial.connect()
            serial.send_ping_command()
            # Send full pass
            if sat_path:
                serial.execute_pass(sat_path, sat_path[0][2], increment)
                serial_status = "Success: Serial commands sent"
            serial.close()
        except Exception as serial_error:
            serial_status = f"Expected failure (no hardware): {str(serial_error)}"

        return jsonify(
            {
                "success": True,
                "interpolated_path": sat_path,
                "serial_attempt": serial_status,
            }
        )
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/satellite/seek-position", methods=["POST"])
def seek_position():
    """
    Compute the satellite's *current* azimuth/elevation for the given observer
    using N2YO /positions, and (optionally) send a seek command over serial.

    This is ideal for geostationary satellites where passes don't make sense.
    """
    try:
        data = request.get_json() or {}

        # Required parameters from frontend
        required_fields = ["id", "observer_lat", "observer_lng", "observer_alt"]
        missing_fields = [field for field in required_fields if field not in data]

        if missing_fields:
            return jsonify(
                {
                    "success": False,
                    "error": f"Missing required parameters: {', '.join(missing_fields)}",
                }
            ), 400

        sat_id = int(data["id"])
        observer_lat = float(data["observer_lat"])
        observer_lng = float(data["observer_lng"])
        observer_alt = float(data["observer_alt"])

        # Number of seconds of positions to request; we only need the first one
        seconds = int(data.get("seconds", 1))

        api_key = data.get("api_key", os.getenv("API_KEY"))

        if not api_key and not DEBUG_MODE:
            return jsonify(
                {
                    "success": False,
                    "error": "API key not provided and not found in environment",
                }
            ), 500

        # --- Get az/el either from N2YO or fake data in DEBUG_MODE ---
        if DEBUG_MODE:
            azimuth = 180.0
            elevation = 45.0
            timestamp = int(time.time())
            json_payload = {
                "positions": [
                    {
                        "azimuth": azimuth,
                        "elevation": elevation,
                        "timestamp": timestamp,
                    }
                ]
            }
        else:
            json_payload = fetch_positions(
                sat_id, observer_lat, observer_lng, observer_alt, seconds, api_key
            )

            positions = json_payload.get("positions", [])
            if not positions:
                return jsonify(
                    {
                        "success": False,
                        "error": "No positions returned from N2YO",
                    }
                ), 502

            pos = positions[0]
            azimuth = pos.get("azimuth")
            elevation = pos.get("elevation")
            timestamp = pos.get("timestamp")

            if azimuth is None or elevation is None:
                return jsonify(
                    {
                        "success": False,
                        "error": "Position data missing azimuth/elevation fields",
                    }
                ), 502

        # --- Optional: send a seek command over serial to the rotator ---
        serial_status = None
        try:
            serial = SatSerial()
            serial.connect()
            serial.send_ping_command()

            # Reuse execute_pass API with a 1-point "path"
            sat_path = [(float(azimuth), float(elevation), int(timestamp or time.time()))]
            serial.execute_pass(sat_path, sat_path[0][2], 1)

            serial_status = "Success: Serial seek command sent"
            serial.close()
        except Exception as serial_error:
            # Keep behavior similar to interpolate_pass: serial failures are expected in dev
            serial_status = f"Expected failure (no hardware): {str(serial_error)}"

        return jsonify(
            {
                "success": True,
                "data": {
                    "azimuth": float(azimuth),
                    "elevation": float(elevation),
                    "timestamp": int(timestamp or time.time()),
                    "raw": json_payload,
                    "serial_attempt": serial_status,
                },
            }
        )
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# For long-running processes, use threading
@app.route("/satellite/start-live", methods=["POST"])
def start_live_tracking():
    try:
        print("Received request to start live tracking")

        params = request.get_json() or {}

        # Reset status
        global live_process_status
        live_process_status = {
            "is_running": True,
            "completed": False,
            "success": False,
            "message": "Live process started",
            "completed_at": None,
            "return_code": None,
        }

        # Run in background thread so it doesn't block the API
        thread = threading.Thread(target=live_process_wrapper, args=(params,))
        thread.daemon = True
        thread.start()

        print("Live tracking thread started successfully")
        return jsonify({"success": True, "message": "Live tracking started in background"})
    except Exception as e:
        print(f"Error starting live tracking: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


# Add new wrapper function
def live_process_wrapper(params):
    """Wrapper to track status of live_process"""
    global live_process_status
    try:
        return_code = live_process(params)
        live_process_status.update(
            {
                "is_running": False,
                "completed": True,
                "success": return_code == 0 if return_code is not None else True,
                "message": "Live process completed successfully"
                if return_code == 0
                else "Live process completed with errors",
                "completed_at": datetime.now().isoformat(),
                "return_code": return_code,
            }
        )
    except Exception as e:
        live_process_status.update(
            {
                "is_running": False,
                "completed": True,
                "success": False,
                "message": f"Live process failed: {str(e)}",
                "completed_at": datetime.now().isoformat(),
                "return_code": None,
            }
        )


# Add new status check endpoint
@app.route("/satellite/live-status", methods=["GET"])
def get_live_status():
    """Check the status of the live process"""
    return jsonify({"success": True, "status": live_process_status})


# Add endpoint to reset/acknowledge the completion
@app.route("/satellite/live-status/reset", methods=["POST"])
def reset_live_status():
    """Reset the live process status (call after user acknowledges)"""
    global live_process_status
    live_process_status = {
        "is_running": False,
        "completed": False,
        "success": False,
        "message": "",
        "completed_at": None,
        "return_code": None,
    }
    return jsonify({"success": True, "message": "Status reset"})


# Tracking logs endpoints
@app.route("/tracking-logs/add", methods=["POST"])
def add_tracking_log():
    """Save a tracking session to the database"""
    try:
        data = request.get_json()
        log = TrackingLog(
            satellite_name=data.get('satellite_name', 'Unknown'),
            satellite_id=data.get('satellite_id', 0),
            observer_lat=data.get('observer_lat', 0),
            observer_lng=data.get('observer_lng', 0),
            observer_alt=data.get('observer_alt', 0),
            tracking_type=data.get('tracking_type', 'unknown'),
            status=data.get('status', 'Completed')
        )
        db.session.add(log)
        db.session.commit()
        return jsonify({"success": True, "message": "Tracking log saved"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/tracking-logs", methods=["GET"])
def get_tracking_logs():
    """Retrieve all tracking logs"""
    try:
        logs = TrackingLog.query.order_by(TrackingLog.date.desc()).all()
        return jsonify({
            "success": True,
            "logs": [{
                "id": log.id,
                "satellite_name": log.satellite_name,
                "satellite_id": log.satellite_id,
                "date": log.date.isoformat(),
                "observer_lat": log.observer_lat,
                "observer_lng": log.observer_lng,
                "observer_alt": log.observer_alt,
                "tracking_type": log.tracking_type,
                "status": log.status
            } for log in logs]
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)

# TEST for Flask
