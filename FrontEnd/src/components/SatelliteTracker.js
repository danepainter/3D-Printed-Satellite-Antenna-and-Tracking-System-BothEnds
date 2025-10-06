import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Navigation, Target, Search } from 'lucide-react';
import './SatelliteTracker.css';

const SatelliteTracker = () => {
  // User input state
  const [observerCoords, setObserverCoords] = useState({
    latitude: 26.3737,
    longitude: 80.1019,
    altitude: 0
  });

  const [searchParams, setSearchParams] = useState({
    satelliteId: 25544, // Default to ISS
    days: 2,
    minVisibility: 300
  });

  const [satellites, setSatellites] = useState([]);
  const [visualPasses, setVisualPasses] = useState([]);
  const [selectedSatellite, setSelectedSatellite] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Common satellite IDs for dropdown
  const commonSatellites = [
    { id: 25544, name: 'International Space Station (ISS)' },
    { id: 40069, name: 'METEOR-M2' },
    { id: 43013, name: 'NOAA-20' },
    { id: 33591, name: 'NOAA-19' },
    { id: 28654, name: 'NOAA-18' },
    { id: 25338, name: 'NOAA-15' },
    { id: 27424, name: 'AQUA' },
    { id: 25994, name: 'TERRA' },
    { id: 44387, name: 'METEOR-M2-2' }
  ];

  // Function to call backend API
  const callBackendFunction = async (endpoint, data = {}) => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (!result.success) {
        alert(`Error: ${result.error}`);
      }
      
      return result;
    } catch (error) {
      alert(`Network error: ${error.message}`);
      console.error('Error calling backend:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch visual passes for selected satellite
  const fetchVisualPasses = async () => {
    const data = {
      id: searchParams.satelliteId,
      observer_lat: observerCoords.latitude,
      observer_lng: observerCoords.longitude,
      observer_alt: observerCoords.altitude,
      days: searchParams.days,
      min_visibility: searchParams.minVisibility
    };
    
    const result = await callBackendFunction('/satellite/visual-passes', data);
    
    if (result?.success) {
      console.log('Visual passes data:', result.data);
      setVisualPasses(result.data.passes || []);
      
      // Update satellites list with fetched data
      const satelliteInfo = {
        id: result.data.info?.satid || searchParams.satelliteId,
        name: result.data.info?.satname || commonSatellites.find(s => s.id === searchParams.satelliteId)?.name,
        passes: result.data.passes || [],
        status: 'visible'
      };
      
      setSatellites([satelliteInfo]);
      setSelectedSatellite(satelliteInfo);
      
      alert(`Found ${result.data.passes?.length || 0} visual passes for ${satelliteInfo.name}`);
    }
  };

  const handleStartTracking = async () => {
    const result = await callBackendFunction('/satellite/start-live');
    
    if (result?.success) {
      setIsTracking(true);
      if (selectedSatellite) {
        setSelectedSatellite(prev => ({ ...prev, status: 'tracking' }));
      }
      alert(result.message);
    }
  };

  const handleStopTracking = () => {
    setIsTracking(false);
    if (selectedSatellite) {
      setSelectedSatellite(prev => ({ ...prev, status: 'visible' }));
    }
  };

  const handleStartRecording = async () => {
    const result = await callBackendFunction('/satellite/start-recording');
    if (result?.success) {
      alert(result.message);
    }
  };

  const handleProcessOffline = async () => {
    const result = await callBackendFunction('/satellite/process-offline');
    if (result?.success) {
      alert(result.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'tracking': return '#00ff88';
      case 'visible': return '#00d4ff';
      case 'hidden': return '#ff6b6b';
      default: return '#888';
    }
  };

  const formatDateTime = (utcString) => {
    if (!utcString) return 'N/A';
    return new Date(utcString * 1000).toLocaleString();
  };

  return (
    <div className="satellite-tracker">
      <div className="tracker-header">
        <h2>Satellite Tracker</h2>
        <p>Search and track satellites using real N2YO data</p>
      </div>

      <div className="tracker-content">
        {/* Settings Panel - Always Visible */}
        <div className="settings-panel">
          <div className="settings-header">
            <h3>Search Parameters</h3>
          </div>

          <div className="settings-content">
            <div className="input-group">
              <h4>Observer Location</h4>
              <div className="coord-inputs">
                <div className="input-field">
                  <label>Latitude:</label>
                  <input
                    type="number"
                    step="0.001"
                    value={observerCoords.latitude}
                    onChange={(e) => setObserverCoords(prev => ({
                      ...prev,
                      latitude: parseFloat(e.target.value) || 0
                    }))}
                  />
                </div>
                <div className="input-field">
                  <label>Longitude:</label>
                  <input
                    type="number"
                    step="0.001"
                    value={observerCoords.longitude}
                    onChange={(e) => setObserverCoords(prev => ({
                      ...prev,
                      longitude: parseFloat(e.target.value) || 0
                    }))}
                  />
                </div>
                <div className="input-field">
                  <label>Altitude (m):</label>
                  <input
                    type="number"
                    value={observerCoords.altitude}
                    onChange={(e) => setObserverCoords(prev => ({
                      ...prev,
                      altitude: parseInt(e.target.value) || 0
                    }))}
                  />
                </div>
              </div>
            </div>

            <div className="input-group">
              <h4>Satellite & Search Options</h4>
              <div className="search-inputs">
                <div className="input-field">
                  <label>Satellite:</label>
                  <select
                    value={searchParams.satelliteId}
                    onChange={(e) => setSearchParams(prev => ({
                      ...prev,
                      satelliteId: parseInt(e.target.value)
                    }))}
                  >
                    {commonSatellites.map(sat => (
                      <option key={sat.id} value={sat.id} className="satellite-select">
                        {sat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="input-field">
                  <label>Days ahead:</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={searchParams.days}
                    onChange={(e) => setSearchParams(prev => ({
                      ...prev,
                      days: parseInt(e.target.value) || 1
                    }))}
                  />
                </div>
                <div className="input-field">
                  <label>Min visibility (sec):</label>
                  <input
                    type="number"
                    min="0"
                    value={searchParams.minVisibility}
                    onChange={(e) => setSearchParams(prev => ({
                      ...prev,
                      minVisibility: parseInt(e.target.value) || 0
                    }))}
                  />
                </div>
              </div>
            </div>

            <button 
              className="search-btn primary"
              onClick={fetchVisualPasses}
              disabled={isLoading}
            >
              <Search size={20} />
              {isLoading ? 'Searching...' : 'Search Visual Passes'}
            </button>
          </div>
        </div>

        {/* Visual Passes Results */}
        {visualPasses.length > 0 && (
          <div className="visual-passes">
            <h3>Visual Passes Found</h3>
            <div className="passes-list">
              {visualPasses.map((pass, index) => (
                <div key={index} className="pass-item">
                  <div className="pass-header">
                    <h4>Pass #{index + 1}</h4>
                    <span className="pass-duration">{pass.duration}s</span>
                  </div>
                  <div className="pass-details">
                    <div className="pass-time">
                      <strong>Start:</strong> {formatDateTime(pass.startUTC)}
                    </div>
                    <div className="pass-time">
                      <strong>Max Elevation:</strong> {formatDateTime(pass.maxUTC)} ({pass.maxEl}°)
                    </div>
                    <div className="pass-time">
                      <strong>End:</strong> {formatDateTime(pass.endUTC)}
                    </div>
                    <div className="pass-magnitude">
                      <strong>Magnitude:</strong> {pass.mag}
                    </div>
                    <div className="start-azimuth">
                      <strong>Starting Azimuth:</strong> {pass.startAz}
                    </div>
                    <div className="max-azimuth">
                      <strong>Maximum Azimuth:</strong> {pass.maxAz}
                    </div>
                    <div className="max-elevation">
                      <strong>Maximum Elevation:</strong> {pass.maxEl}
                    </div>
                    <div className="end-azimuth">
                      <strong>Ending Azimuth:</strong> {pass.endAz}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Satellite Details */}
        {selectedSatellite && (
          <div className="tracking-details">
            <h3>Tracking Controls</h3>
            <div className="details-card">
              <div className="detail-header">
                <Target className="detail-icon" />
                <h4>{selectedSatellite.name}</h4>
                <div 
                  className="status-indicator"
                  style={{ backgroundColor: getStatusColor(selectedSatellite.status) }}
                ></div>
              </div>

              <div className="tracking-controls">
                <button 
                  className="track-btn primary"
                  onClick={handleStartTracking}
                  disabled={isTracking || isLoading}
                >
                  {isTracking ? 'Tracking...' : 'Start Live Tracking'}
                </button>
                
                <button 
                  className="track-btn secondary"
                  onClick={handleStopTracking}
                  disabled={!isTracking || isLoading}
                >
                  Stop Tracking
                </button>

                <button 
                  className="track-btn primary"
                  onClick={handleStartRecording}
                  disabled={isLoading}
                >
                  Start Recording
                </button>

                <button 
                  className="track-btn secondary"
                  onClick={handleProcessOffline}
                  disabled={isLoading}
                >
                  Process Offline Data
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Current Location Display */}
        <div className="location-info">
          <h3>Observer Location</h3>
          <div className="location-details">
            <div className="location-item">
              <MapPin className="location-icon" />
              <span>Lat: {observerCoords.latitude}°, Lng: {observerCoords.longitude}°</span>
            </div>
            <div className="location-item">
              <Clock className="location-icon" />
              <span>Altitude: {observerCoords.altitude}m</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SatelliteTracker;