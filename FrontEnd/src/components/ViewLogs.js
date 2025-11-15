import React, { useState, useEffect } from 'react';
import { FileText, Satellite, RefreshCw } from 'lucide-react';
import './ViewLogs.css';

const ViewTrackLogs = () => {
  const [filter, setFilter] = useState('all');
  const [trackLogs, setTrackLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch tracking logs from backend
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/tracking-logs');
      const data = await response.json();
      
      if (data.success) {
        const formattedLogs = data.logs.map(log => {
          const date = new Date(log.date);
          return {
            id: log.id,
            satellite: log.satellite_name,
            satelliteId: log.satellite_id,
            date: date.toLocaleDateString(),
            time: date.toLocaleTimeString(),
            lat: log.observer_lat.toFixed(4),
            lng: log.observer_lng.toFixed(4),
            alt: log.observer_alt,
            type: log.tracking_type,
            status: log.status
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

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = filter === 'all' 
    ? trackLogs 
    : trackLogs.filter(log => log.satellite.toLowerCase().includes(filter.toLowerCase()));

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
            <option value="goes">GOES</option>
          </select>
        </div>
        
        <div className="stats">
          <button 
            onClick={fetchLogs} 
            style={{ 
              background: 'none', 
              border: '1px solid #555', 
              borderRadius: '4px', 
              padding: '0.5rem 1rem', 
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginRight: '1rem'
            }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <div className="stat-item">
            <FileText className="stat-icon" />
            <span>{filteredLogs.length} Logs</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
          <p>Loading tracking logs...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
          <Satellite size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <p>No tracking logs found. Start tracking satellites to see logs here!</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', padding: '1rem' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            backgroundColor: '#1a1a1a',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#2a2a2a', borderBottom: '2px solid #444' }}>
                <th style={tableHeaderStyle}>ID</th>
                <th style={tableHeaderStyle}>Satellite</th>
                <th style={tableHeaderStyle}>Date</th>
                <th style={tableHeaderStyle}>Time</th>
                <th style={tableHeaderStyle}>Type</th>
                <th style={tableHeaderStyle}>Latitude</th>
                <th style={tableHeaderStyle}>Longitude</th>
                <th style={tableHeaderStyle}>Altitude (m)</th>
                <th style={tableHeaderStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, index) => (
                <tr 
                  key={log.id}
                  style={{
                    backgroundColor: index % 2 === 0 ? '#1e1e1e' : '#242424',
                    borderBottom: '1px solid #333',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2a2a2a'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#1e1e1e' : '#242424'}
                >
                  <td style={tableCellStyle}>{log.id}</td>
                  <td style={{...tableCellStyle, fontWeight: '500', color: '#4a9eff'}}>
                    {log.satellite}
                  </td>
                  <td style={tableCellStyle}>{log.date}</td>
                  <td style={tableCellStyle}>{log.time}</td>
                  <td style={tableCellStyle}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                      backgroundColor: log.type === 'live' ? '#1a4d2e' : log.type === 'seek' ? '#4d2e1a' : '#1a2e4d',
                      color: log.type === 'live' ? '#4ade80' : log.type === 'seek' ? '#fb923c' : '#60a5fa'
                    }}>
                      {log.type}
                    </span>
                  </td>
                  <td style={tableCellStyle}>{log.lat}°</td>
                  <td style={tableCellStyle}>{log.lng}°</td>
                  <td style={tableCellStyle}>{log.alt}</td>
                  <td style={tableCellStyle}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                      backgroundColor: log.status === 'Completed' ? '#1a4d2e' : '#4d1a1a',
                      color: log.status === 'Completed' ? '#4ade80' : '#f87171'
                    }}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Table styling constants
const tableHeaderStyle = {
  padding: '1rem',
  textAlign: 'left',
  color: '#fff',
  fontWeight: '600',
  fontSize: '0.9rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const tableCellStyle = {
  padding: '0.75rem 1rem',
  color: '#ccc',
  fontSize: '0.9rem',
  whiteSpace: 'nowrap'
};

export default ViewTrackLogs;
