import sqlite3
import requests
import json
from dotenv import load_dotenv


#Compiler Directives for DB Connection Needed: For TEST and PROD
#Establish DB Connection (Should be set for VisualPass or SatellitePos)
con = sqlite3.connect("visualPass.db")
api_url = "https://api.n2yo.com/rest/v1/satellite/"
load_dotenv()
# User Input for N2YO API, minimum parameters needed for visual pass or satellite positions
def user_input():
    id = int(input("Enter the satellite ID: "))
    observer_lat = float(input("Enter the observer latitude: "))
    observer_lng = float(input("Enter the observer longitude: "))
    observer_alt = float(input("Enter the observer altitude: "))
    days = int(input("Enter the number of days: "))
    min_visibility = int(input("Enter the minimum visibility: "))
    api_key = input("Enter the API key: ")
    return id, observer_lat, observer_lng, observer_alt, days, min_visibility, api_key

def fetch_visualPasses(id, observer_lat, observer_lng, observer_alt, days, min_visibility, api_key):
    response = requests.get(f"{api_url}/visualpasses/{id}/{observer_lat}/{observer_lng}/{observer_alt}/{days}/{min_visibility}/&apiKey={api_key}")
    json_data = response.json()
    return json_data

def display_json_response(json_data):
    """Display the JSON response data in the same format as the API response"""
    print("\n" + "="*60)
    print("N2YO API RESPONSE DATA")
    print("="*60)
    
    # Check for error response
    if 'error' in json_data:
        print(f"API ERROR: {json_data['error']}")
        print("="*60)
        return
    
    # Display in JSON-like format matching the example
    print("{")
    
    # Display info section
    if 'info' in json_data:
        info = json_data['info']
        print('  "info": {')
        print(f'    "satid": {info.get("satid", "null")},')
        print(f'    "satname": "{info.get("satname", "null")}",')
        print(f'    "transactionscount": {info.get("transactionscount", "null")},')
        print(f'    "passescount": {info.get("passescount", "null")}')
        print('  },')
    
    # Display passes section
    if 'passes' in json_data and len(json_data['passes']) > 0:
        print('  "passes": [')
        
        for i, pass_data in enumerate(json_data['passes']):
            print('    {')
            print(f'      "startAz": {pass_data.get("startAz", "null")},')
            print(f'      "startAzCompass": "{pass_data.get("startAzCompass", "null")}",')
            print(f'      "startEl": {pass_data.get("startEl", "null")},')
            print(f'      "startUTC": {pass_data.get("startUTC", "null")},')
            print(f'      "maxAz": {pass_data.get("maxAz", "null")},')
            print(f'      "maxAzCompass": "{pass_data.get("maxAzCompass", "null")}",')
            print(f'      "maxEl": {pass_data.get("maxEl", "null")},')
            print(f'      "maxUTC": {pass_data.get("maxUTC", "null")},')
            print(f'      "endAz": {pass_data.get("endAz", "null")},')
            print(f'      "endAzCompass": "{pass_data.get("endAzCompass", "null")}",')
            print(f'      "endEl": {pass_data.get("endEl", "null")},')
            print(f'      "endUTC": {pass_data.get("endUTC", "null")},')
            print(f'      "mag": {pass_data.get("mag", "null")},')
            print(f'      "duration": {pass_data.get("duration", "null")}')
            
            # Add comma for all passes except the last one
            if i < len(json_data['passes']) - 1:
                print('    },')
            else:
                print('    }')
        
        print('  ]')
    else:
        print('  "passes": []')
    
    print('}')
    print("="*60)

def write_to_visualPass_db(json_data):
    #Create DB cursor and table
    cur = con.cursor()
    cur.execute("CREATE TABLE IF NOT EXISTS visualPass(satid INTEGER, satname TEXT, transactionscount INTEGER, passescount INTEGER, startAz REAL, startAzCompass TEXT, startEl REAL, startUTC TEXT, maxAz REAL, maxAzcompass TEXT, maxEl REAL, maxUTC TEXT, endAz REAL, endAzCompass TEXT, endEl REAL, endUTC TEXT, mag REAL, duration REAL)")
    
    # Extract info from the correct JSON structure
    info = json_data.get('info', {})
    
    # Insert each pass into the database
    if 'passes' in json_data:
        for pass_data in json_data['passes']:
            cur.execute("INSERT INTO visualPass(satid, satname, transactionscount, passescount, startAz, startAzCompass, startEl, startUTC, maxAz, maxAzcompass, maxEl, maxUTC, endAz, endAzCompass, endEl, endUTC, mag, duration) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 
                       (info.get('satid'), info.get('satname'), info.get('transactionscount'), info.get('passescount'), 
                        pass_data.get('startAz'), pass_data.get('startAzCompass'), pass_data.get('startEl'), pass_data.get('startUTC'), 
                        pass_data.get('maxAz'), pass_data.get('maxAzcompass'), pass_data.get('maxEl'), pass_data.get('maxUTC'), 
                        pass_data.get('endAz'), pass_data.get('endAzCompass'), pass_data.get('endEl'), pass_data.get('endUTC'), 
                        pass_data.get('mag'), pass_data.get('duration')))

    con.commit()
    res = cur.execute("SELECT * FROM visualPass")
    res.fetchone()
    con.close()

# Example - retrieve Space Station (25544) passes optically visible at least 300 seconds for next 2 days. Observer is located at lat: 41.702, lng: -76.014, alt: 0
# Request: /visualpasses/{id}/{observer_lat}/{observer_lng}/{observer_alt}/{days}/{min_visibility} 
# Visual Pass: https://api.n2yo.com/rest/v1/satellite/visualpasses/25544/41.702/-76.014/0/2/300/&apiKey=

# Example - retrieve Space Station (25544) positions for next 2 seconds. Observer is located at lat: 41.702, lng: -76.014, alt: 0
# Request: /positions/{id}/{observer_lat}/{observer_lng}/{observer_alt}/{seconds}
# Satellite Positions: https://api.n2yo.com/rest/v1/satellite/positions/25544/41.702/-76.014/0/2/&apiKey=