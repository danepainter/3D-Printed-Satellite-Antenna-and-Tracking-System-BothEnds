from sattracker.satpass import SatPass
from sattracker.satinterpolation import SatInterpolation
from sattracker.satserial import SatSerial
from n2yo_call import fetch_visualPasses, user_input, display_json_response
import json


def main():
    # Get user input for satellite parameters
    id, observer_lat, observer_lng, observer_alt, days, min_visibility, api_key = user_input()
    
    # Get satellite pass data from N2YO API using user input
    json_data = fetch_visualPasses(id, observer_lat, observer_lng, observer_alt, days, min_visibility, api_key)
    
    # Display the JSON response data in a readable format
    display_json_response(json_data)
    
    # Extract pass data from JSON response
    if 'passes' in json_data and len(json_data['passes']) > 0:
        pass_data = json_data['passes'][0]  # Get first pass
        
        # Convert JSON data to SatPass format
        sat_pass = SatPass(
            pass_data['startAz'], 
            pass_data['startEl'], 
            int(pass_data['startUTC']),
            pass_data['maxAz'], 
            pass_data['maxEl'], 
            int(pass_data['maxUTC']),
            pass_data['endAz'], 
            pass_data['endEl'], 
            int(pass_data['endUTC'])
        )
        
        sat_interpolation = SatInterpolation(sat_pass)
        sat_path = sat_interpolation.interp_satellite_path(20)
        print("Satellite path:", sat_path)

        try:
            serial = SatSerial()
            serial.connect()
            serial.send_ping_command()
            serial.send_got_command(25,30,25)
            print(serial.receive())
            serial.close()
        except Exception as e:
            print(f"Serial connection failed (expected without hardware): {e}")
            print("Satellite path processing completed successfully!")
    else:
        print("No satellite passes found in API response")


main()