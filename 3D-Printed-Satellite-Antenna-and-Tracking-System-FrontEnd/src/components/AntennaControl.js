import React, { useState } from 'react';
import { RotateCcw, RotateCw, Move, Settings, Power } from 'lucide-react';
import './AntennaControl.css';

const AntennaControl = () => {
  const [antennaPosition, setAntennaPosition] = useState({
    elevation: 45,
    azimuth: 180
  });

  const [isTracking, setIsTracking] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  const handlePositionChange = (axis, value) => {
    setAntennaPosition(prev => ({
      ...prev,
      [axis]: Math.max(0, Math.min(axis === 'elevation' ? 90 : 360, value))
    }));
  };

  const moveAntenna = (axis, direction) => {
    const step = 5;
    const newValue = antennaPosition[axis] + (direction === 'up' ? step : -step);
    handlePositionChange(axis, newValue);
  };

  const resetPosition = () => {
    setAntennaPosition({ elevation: 0, azimuth: 0 });
  };

  const toggleTracking = () => {
    setIsTracking(!isTracking);
  };

  const toggleConnection = () => {
    setIsConnected(!isConnected);
  };

  return (
    <div className="antenna-control">
      <div className="control-header">
        <h2>Antenna Control</h2>
        <p>Manual control and configuration of the satellite antenna</p>
      </div>

      <div className="control-content">
        <div className="status-panel">
          <div className="status-item">
            <div className="status-label">Connection</div>
            <div className={`status-value ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
          </div>
          <div className="status-item">
            <div className="status-label">Tracking</div>
            <div className={`status-value ${isTracking ? 'active' : 'inactive'}`}>
              {isTracking ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>

        <div className="position-display">
          <h3>Current Position</h3>
          <div className="position-values">
            <div className="position-item">
              <span className="position-label">Elevation</span>
              <span className="position-value">{antennaPosition.elevation.toFixed(1)}°</span>
            </div>
            <div className="position-item">
              <span className="position-label">Azimuth</span>
              <span className="position-value">{antennaPosition.azimuth.toFixed(1)}°</span>
            </div>
          </div>
        </div>

        <div className="manual-controls">
          <h3>Manual Control</h3>
          
          <div className="control-section">
            <h4>Elevation Control</h4>
            <div className="control-buttons">
              <button 
                className="control-btn"
                onClick={() => moveAntenna('elevation', 'up')}
                disabled={antennaPosition.elevation >= 90}
              >
                <Move className="btn-icon" />
                Up
              </button>
              <button 
                className="control-btn"
                onClick={() => moveAntenna('elevation', 'down')}
                disabled={antennaPosition.elevation <= 0}
              >
                <Move className="btn-icon" style={{ transform: 'rotate(180deg)' }} />
                Down
              </button>
            </div>
            <div className="slider-container">
              <input
                type="range"
                min="0"
                max="90"
                value={antennaPosition.elevation}
                onChange={(e) => handlePositionChange('elevation', parseFloat(e.target.value))}
                className="position-slider"
              />
              <span className="slider-value">{antennaPosition.elevation.toFixed(1)}°</span>
            </div>
          </div>

          <div className="control-section">
            <h4>Azimuth Control</h4>
            <div className="control-buttons">
              <button 
                className="control-btn"
                onClick={() => moveAntenna('azimuth', 'up')}
              >
                <RotateCw className="btn-icon" />
                Clockwise
              </button>
              <button 
                className="control-btn"
                onClick={() => moveAntenna('azimuth', 'down')}
              >
                <RotateCcw className="btn-icon" />
                Counter-clockwise
              </button>
            </div>
            <div className="slider-container">
              <input
                type="range"
                min="0"
                max="360"
                value={antennaPosition.azimuth}
                onChange={(e) => handlePositionChange('azimuth', parseFloat(e.target.value))}
                className="position-slider"
              />
              <span className="slider-value">{antennaPosition.azimuth.toFixed(1)}°</span>
            </div>
          </div>
        </div>

        <div className="system-controls">
          <h3>System Controls</h3>
          <div className="system-buttons">
            <button 
              className={`system-btn ${isTracking ? 'active' : ''}`}
              onClick={toggleTracking}
            >
              <Power className="btn-icon" />
              {isTracking ? 'Stop Tracking' : 'Start Tracking'}
            </button>
            <button 
              className={`system-btn ${isConnected ? 'active' : ''}`}
              onClick={toggleConnection}
            >
              <Settings className="btn-icon" />
              {isConnected ? 'Disconnect' : 'Connect'}
            </button>
            <button 
              className="system-btn reset"
              onClick={resetPosition}
            >
              <RotateCcw className="btn-icon" />
              Reset Position
            </button>
          </div>
        </div>

        <div className="preset-positions">
          <h3>Preset Positions</h3>
          <div className="preset-grid">
            <button 
              className="preset-btn"
              onClick={() => setAntennaPosition({ elevation: 0, azimuth: 0 })}
            >
              Home (0°, 0°)
            </button>
            <button 
              className="preset-btn"
              onClick={() => setAntennaPosition({ elevation: 45, azimuth: 90 })}
            >
              East (45°, 90°)
            </button>
            <button 
              className="preset-btn"
              onClick={() => setAntennaPosition({ elevation: 45, azimuth: 180 })}
            >
              South (45°, 180°)
            </button>
            <button 
              className="preset-btn"
              onClick={() => setAntennaPosition({ elevation: 45, azimuth: 270 })}
            >
              West (45°, 270°)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AntennaControl;


