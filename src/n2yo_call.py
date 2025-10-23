import sqlite3
import requests
import json
import logging

#Compiler Directives for DB Connection Needed: For TEST and PROD
#Establish DB Connection (Should be set for VisualPass or SatellitePos)
con = sqlite3.connect("visualPass.db")
api_url = "https://api.n2yo.com/rest/v1/satellite/"
api_key = ""

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

def write_to_visualPass_db(json_data):
    #Create DB cursor and table
    cur = con.cursor()
    cur.execute("CREATE TABLE visualPass(satid INTEGER, satname TEXT, transactionscount INTEGER, passescount INTEGER, startAz REAL, startAzCompass TEXT, startEl REAL, startUTC TEXT, maxAz REAL, maxAzcompass TEXT, maxEl REAL, maxUTC TEXT, endAz REAL, endAzCompass TEXT, endEl REAL, endUTC TEXT, mag REAL, duration REAL)")
    cur.execute("INSERT INTO visualPass(satid, satname, transactionscount, passescount, startAz, startAzCompass, startEl, startUTC, maxAz, maxAzcompass, maxEl, maxUTC, endAz, endAzCompass, endEl, endUTC, mag, duration) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", (json_data['satid'], json_data['satname'], json_data['transactionscount'], json_data['passescount'], json_data['startAz'], json_data['startAzCompass'], json_data['startEl'], json_data['startUTC'], json_data['maxAz'], json_data['maxAzcompass'], json_data['maxEl'], json_data['maxUTC'], json_data['endAz'], json_data['endAzCompass'], json_data['endEl'], json_data['endUTC'], json_data['mag'], json_data['duration']))

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