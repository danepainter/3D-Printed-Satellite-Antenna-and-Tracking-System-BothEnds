import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Navigation, Target } from 'lucide-react';
import './SatelliteTracker.css';

const SatelliteTracker = () => {
  const [satellites, setSatellites] = useState([
    {
      //Can be connected via API to get the actual data
      id: 1,
      name: 'ISS',
      elevation: 45,
      azimuth: 120,
      distance: 408,
      status: 'visible'
    },
    {
      id: 2,
      name: 'NOAA-18',
      elevation: 30,
      azimuth: 200,
      distance: 850,
      status: 'visible'
    },
    {
      id: 3,
      name: 'METEOR-M2',
      elevation: 15,
      azimuth: 300,
      distance: 820,
      status: 'visible'
    }
  ]);

  const [selectedSatellite, setSelectedSatellite] = useState(satellites[0]);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    // Simulate real-time satellite position updates
    const interval = setInterval(() => {
      setSatellites(prev => prev.map(sat => ({
        ...sat,
        elevation: Math.max(0, Math.min(90, sat.elevation + (Math.random() - 0.5) * 2)),
        azimuth: (sat.azimuth + (Math.random() - 0.5) * 4 + 360) % 360
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Update selected satellite when satellites array changes
  useEffect(() => {
    const updatedSelected = satellites.find(sat => sat.id === selectedSatellite.id);
    if (updatedSelected) {
      setSelectedSatellite(updatedSelected);
    }
  }, [satellites, selectedSatellite.id]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'tracking': return '#00ff88';
      case 'visible': return '#00d4ff';
      case 'hidden': return '#ff6b6b';
      default: return '#888';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'tracking': return 'Tracking';
      case 'visible': return 'Visible';
      case 'hidden': return 'Hidden';
      default: return 'Unknown';
    }
  };

  const handleStartTracking = () => {
    setIsTracking(true);
    setSatellites(prev => prev.map(sat => 
      sat.id === selectedSatellite.id 
        ? { ...sat, status: 'tracking' }
        : sat.status === 'tracking' 
          ? { ...sat, status: 'visible' }
          : sat
    ));
  };

  const handleStopTracking = () => {
    setIsTracking(false);
    setSatellites(prev => prev.map(sat => 
      sat.id === selectedSatellite.id 
        ? { ...sat, status: 'visible' }
        : sat
    ));
  };

  const handleSatelliteSelect = (satellite) => {
    setSelectedSatellite(satellite);
    // If we're currently tracking a different satellite, stop tracking it
    if (isTracking && satellite.id !== selectedSatellite.id) {
      setSatellites(prev => prev.map(sat => 
        sat.id === selectedSatellite.id 
          ? { ...sat, status: 'visible' }
          : sat
      ));
    }
  };

  return (
    <div className="satellite-tracker">
      <div className="tracker-header">
        <h2>Satellite Tracker</h2>
        <p>Real-time satellite positions and tracking information</p>
      </div>

      <div className="tracker-content">
        <div className="satellite-list">
          <h3>Available Satellites</h3>
          <div className="satellites">
            {satellites.map(satellite => (
              <div
                key={satellite.id}
                className={`satellite-item ${selectedSatellite.id === satellite.id ? 'selected' : ''}`}
                onClick={() => handleSatelliteSelect(satellite)}
              >
                <div className="satellite-info">
                  <h4>{satellite.name}</h4>
                  <div className="satellite-status">
                    <div 
                      className="status-indicator"
                      style={{ backgroundColor: getStatusColor(satellite.status) }}
                    ></div>
                    {getStatusText(satellite.status)}
                  </div>
                </div>
                <div className="satellite-position">
                  <div className="position-item">
                    <span className="label">Elevation:</span>
                    <span className="value">{satellite.elevation.toFixed(1)}°</span>
                  </div>
                  <div className="position-item">
                    <span className="label">Azimuth:</span>
                    <span className="value">{satellite.azimuth.toFixed(1)}°</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="tracking-details">
          <h3>Tracking Details</h3>
          <div className="details-card">
            <div className="detail-header">
              <Target className="detail-icon" />
              <h4>{selectedSatellite.name}</h4>
            </div>
            
            <div className="detail-grid">
              <div className="detail-item">
                <Navigation className="detail-icon" />
                <div className="detail-content">
                  <span className="detail-label">Elevation</span>
                  <span className="detail-value">{selectedSatellite.elevation.toFixed(1)}°</span>
                </div>
              </div>
              
              <div className="detail-item">
                <MapPin className="detail-icon" />
                <div className="detail-content">
                  <span className="detail-label">Azimuth</span>
                  <span className="detail-value">{selectedSatellite.azimuth.toFixed(1)}°</span>
                </div>
              </div>
              
              <div className="detail-item">
                <Clock className="detail-icon" />
                <div className="detail-content">
                  <span className="detail-label">Distance</span>
                  <span className="detail-value">{selectedSatellite.distance} km</span>
                </div>
              </div>
            </div>

            <div className="tracking-controls">
              <button 
                className="track-btn primary"
                onClick={handleStartTracking}
                disabled={selectedSatellite.status === 'tracking'}
              >
                {selectedSatellite.status === 'tracking' ? 'Tracking...' : 'Start Tracking'}
              </button>
              <button 
                className="track-btn secondary"
                onClick={handleStopTracking}
                disabled={selectedSatellite.status !== 'tracking'}
              >
                Stop Tracking
              </button>
            </div>
          </div>

          <div className="position-visualization">
            <h4>Antenna Position</h4>
            <div className="compass">
              <div className="compass-ring">
                <div className="compass-needle" style={{
                  transform: `rotate(${selectedSatellite.azimuth}deg)`
                }}></div>
                <div className="compass-center"></div>
              </div>
              <div className="elevation-indicator">
                <div className="elevation-bar">
                  <div 
                    className="elevation-fill"
                    style={{ height: `${(selectedSatellite.elevation / 90) * 100}%` }}
                  ></div>
                </div>
                <span className="elevation-label">Elevation</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SatelliteTracker;