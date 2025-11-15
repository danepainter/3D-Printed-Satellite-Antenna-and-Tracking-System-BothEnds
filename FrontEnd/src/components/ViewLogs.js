import React, { useState, useEffect } from 'react';
import { FileText, Download, Eye, Calendar, Satellite, Clock, MapPin, Activity } from 'lucide-react';
import './ViewLogs.css';

const ViewTrackLogs = () => {
  const [selectedLog, setSelectedLog] = useState(null);
  const [filter, setFilter] = useState('all');
  const [trackLogs, setTrackLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch tracking logs from backend
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch('http://localhost:5000/tracking-logs');
        const data = await response.json();
        
        if (data.success) {
          // Transform backend data to UI format
          const formattedLogs = data.logs.map(log => {
            const date = new Date(log.date);
            return {
              id: log.id,
              name: `${log.satellite_name}_Track_${log.id}`,
              date: date.toLocaleDateString(),
              time: date.toLocaleTimeString(),
              satellite: log.satellite_name,
              duration: log.tracking_type,
              maxElevation: `${log.observer_lat.toFixed(2)}°`,
              startAzimuth: `${log.observer_lng.toFixed(2)}°`,
              endAzimuth: `Alt: ${log.observer_alt}m`,
              status: log.status,
              fileSize: 'N/A',
              satelliteId: log.satellite_id
            };
          });
          setTrackLogs(formattedLogs);
        }
      } catch (error) {
        console.error('Failed to fetch tracking logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const filteredLogs = filter === 'all' 
    ? trackLogs 
    : trackLogs.filter(log => log.satellite.toLowerCase().includes(filter.toLowerCase()));

  const handleLogClick = (log) => {
    setSelectedLog(log);
  };

  const handleDownload = (log) => {
    // Implement download functionality
    //Track logs can be downloaded here
    console.log('Downloading:', log.name);
  };

  const handleCloseModal = () => {
    setSelectedLog(null);
  };

  return (
    <div className="view-images">
      <div className="images-header">
        <h2>Track Logs</h2>
        <p>View and manage satellite tracking logs</p>
      </div>

      <div className="images-controls">
        <div className="filter-section">
          <label htmlFor="filter">Filter by satellite:</label>
          <select 
            id="filter" 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Logs</option>
            <option value="iss">ISS</option>
            <option value="noaa">NOAA</option>
            <option value="meteor">METEOR</option>
          </select>
        </div>
        
        <div className="stats">
          <div className="stat-item">
            <FileText className="stat-icon" />
            <span>{filteredLogs.length} Logs</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="images-grid">
          <p style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>Loading tracking logs...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="images-grid">
          <p style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>No tracking logs found. Start tracking satellites to see logs here!</p>
        </div>
      ) : (
        <div className="images-grid">
          {filteredLogs.map(log => (
          <div key={log.id} className="image-card" onClick={() => handleLogClick(log)}>
            <div className="image-preview">
              <div className="image-placeholder">
                <FileText className="placeholder-icon" />
              </div>
              <div className="image-overlay">
                <Eye className="overlay-icon" />
              </div>
            </div>
            
            <div className="image-info">
              <h4>{log.name}</h4>
              <div className="image-details">
                <div className="detail-row">
                  <Satellite className="detail-icon" />
                  <span>{log.satellite}</span>
                </div>
                <div className="detail-row">
                  <Calendar className="detail-icon" />
                  <span>{log.date} {log.time}</span>
                </div>
                <div className="detail-row">
                  <Clock className="detail-icon" />
                  <span>{log.duration}</span>
                </div>
                <div className="detail-row">
                  <Activity className="detail-icon" />
                  <span>Max: {log.maxElevation}</span>
                </div>
                <div className="detail-row">
                  <MapPin className="detail-icon" />
                  <span>{log.startAzimuth} → {log.endAzimuth}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className={`status-${log.status.toLowerCase()}`}>{log.status}</span>
                </div>
              </div>
            </div>
          </div>
          ))}
        </div>
      )}

      {selectedLog && (
        <div className="image-modal" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedLog.name}</h3>
              <button className="close-btn" onClick={handleCloseModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="modal-image">
                <div className="image-placeholder-large">
                  <FileText className="placeholder-icon-large" />
                  <p>Track Log Preview</p>
                </div>
              </div>
              
              <div className="modal-info">
                <div className="info-section">
                  <h4>Track Details</h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <Satellite className="info-icon" />
                      <span className="info-label">Satellite:</span>
                      <span className="info-value">{selectedLog.satellite}</span>
                    </div>
                    <div className="info-item">
                      <Calendar className="info-icon" />
                      <span className="info-label">Date:</span>
                      <span className="info-value">{selectedLog.date}</span>
                    </div>
                    <div className="info-item">
                      <Clock className="info-icon" />
                      <span className="info-label">Time:</span>
                      <span className="info-value">{selectedLog.time}</span>
                    </div>
                    <div className="info-item">
                      <Clock className="info-icon" />
                      <span className="info-label">Duration:</span>
                      <span className="info-value">{selectedLog.duration}</span>
                    </div>
                    <div className="info-item">
                      <Activity className="info-icon" />
                      <span className="info-label">Max Elevation:</span>
                      <span className="info-value">{selectedLog.maxElevation}</span>
                    </div>
                    <div className="info-item">
                      <MapPin className="info-icon" />
                      <span className="info-label">Path:</span>
                      <span className="info-value">{selectedLog.startAzimuth} → {selectedLog.endAzimuth}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Status:</span>
                      <span className={`info-value status-${selectedLog.status.toLowerCase()}`}>{selectedLog.status}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">File Size:</span>
                      <span className="info-value">{selectedLog.fileSize}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="download-btn"
                onClick={() => handleDownload(selectedLog)}
              >
                <Download className="btn-icon" />
                Download Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewTrackLogs;
