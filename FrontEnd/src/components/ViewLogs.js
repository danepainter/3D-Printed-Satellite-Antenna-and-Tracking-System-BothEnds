import React, { useState } from 'react';
import { FileText, Download, Eye, Calendar, Satellite, Clock, MapPin, Activity } from 'lucide-react';
import './ViewLogs.css';

const ViewTrackLogs = () => {
  const [selectedLog, setSelectedLog] = useState(null);
  const [filter, setFilter] = useState('all');

  // Sample track log data - replace with your actual track log data
  const trackLogs = [
    {
      id: 1,
      name: 'ISS_Track_001',
      date: '2024-01-15',
      time: '14:30:25',
      satellite: 'ISS',
      duration: '6m 23s',
      maxElevation: '67°',
      startAzimuth: 'SW',
      endAzimuth: 'NE',
      status: 'Completed',
      fileSize: '2.4 MB',
      url: '/api/logs/iss_track_001.log'
    },
    {
      id: 2,
      name: 'NOAA_18_Track_002',
      date: '2024-01-15',
      time: '16:45:12',
      satellite: 'NOAA-18',
      duration: '12m 45s',
      maxElevation: '89°',
      startAzimuth: 'W',
      endAzimuth: 'E',
      status: 'Completed',
      fileSize: '3.1 MB',
      url: '/api/logs/noaa_18_track_002.log'
    },
    {
      id: 3,
      name: 'METEOR_M2_Track_003',
      date: '2024-01-14',
      time: '09:22:45',
      satellite: 'METEOR-M2',
      duration: '8m 12s',
      maxElevation: '45°',
      startAzimuth: 'NW',
      endAzimuth: 'SE',
      status: 'Completed',
      fileSize: '1.8 MB',
      url: '/api/logs/meteor_m2_track_003.log'
    },
    {
      id: 4,
      name: 'ISS_Track_004',
      date: '2024-01-14',
      time: '11:15:30',
      satellite: 'ISS',
      duration: '5m 18s',
      maxElevation: '23°',
      startAzimuth: 'S',
      endAzimuth: 'N',
      status: 'Completed',
      fileSize: '2.7 MB',
      url: '/api/logs/iss_track_004.log'
    }
  ];

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
