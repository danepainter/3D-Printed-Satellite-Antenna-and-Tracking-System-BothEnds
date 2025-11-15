import React, { useState, useEffect } from 'react';
import { FileText, Satellite, RefreshCw, Search } from 'lucide-react';
import './ViewLogs.css';

const ViewTrackLogs = () => {
  const [trackLogs, setTrackLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchText, setSearchText] = useState('');
  const [trackingTypeFilter, setTrackingTypeFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

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
            dateObj: date, // Keep original date for filtering
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

  // Apply all filters and sorting
  const filteredLogs = trackLogs
    .filter(log => {
      // Search filter
      if (searchText) {
        const search = searchText.toLowerCase();
        return (
          log.satellite.toLowerCase().includes(search) ||
          log.satelliteId.toString().includes(search) ||
          log.lat.includes(search) ||
          log.lng.includes(search)
        );
      }
      return true;
    })
    .filter(log => {
      // Tracking type filter
      if (trackingTypeFilter !== 'all') {
        return log.type === trackingTypeFilter;
      }
      return true;
    })
    .filter(log => {
      // Date range filter
      if (dateRangeFilter !== 'all') {
        const now = new Date();
        const logDate = log.dateObj;
        const daysDiff = Math.floor((now - logDate) / (1000 * 60 * 60 * 24));
        
        if (dateRangeFilter === '7days' && daysDiff > 7) return false;
        if (dateRangeFilter === '30days' && daysDiff > 30) return false;
        if (dateRangeFilter === 'today' && daysDiff > 0) return false;
      }
      return true;
    })
    .sort((a, b) => {
      // Sort by date
      if (sortOrder === 'newest') {
        return b.dateObj - a.dateObj;
      } else {
        return a.dateObj - b.dateObj;
      }
    });

  return (
    <div className="view-images">
      <div className="images-header">
        <h2>Track Logs</h2>
        <p>View and manage satellite tracking logs</p>
      </div>

      {/* Filter Controls */}
      <div className="images-controls" style={{ flexDirection: 'column', gap: '1.5rem', padding: '1.5rem' }}>
        {/* Top row: Search, Refresh, and Count */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search 
              size={20} 
              style={{ 
                position: 'absolute', 
                left: '0.75rem', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: '#888'
              }} 
            />
            <input
              type="text"
              placeholder="Search satellite, ID, or location..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem 0.65rem 2.75rem',
                background: '#1a1a1a',
                border: '1px solid #555',
                borderRadius: '4px',
                color: '#fff',
                fontSize: '1rem'
              }}
            />
          </div>
          
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
              whiteSpace: 'nowrap'
            }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <div className="stat-item" style={{ marginLeft: 'auto' }}>
            <FileText className="stat-icon" />
            <span>{filteredLogs.length} Logs</span>
          </div>
        </div>

        {/* Bottom row: Filters */}
        <div className="filter-section" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '180px' }}>
            <label style={{ fontSize: '0.9rem', color: '#aaa', fontWeight: '500' }}>Tracking Type:</label>
            <select 
              value={trackingTypeFilter} 
              onChange={(e) => setTrackingTypeFilter(e.target.value)}
              className="filter-select"
              style={{
                padding: '0.65rem 0.75rem',
                background: '#1a1a1a',
                border: '1px solid #555',
                borderRadius: '4px',
                color: '#fff',
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Types</option>
              <option value="live">Live</option>
              <option value="seek">Seek</option>
              <option value="interpolate">Interpolate</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '180px' }}>
            <label style={{ fontSize: '0.9rem', color: '#aaa', fontWeight: '500' }}>Date Range:</label>
            <select 
              value={dateRangeFilter} 
              onChange={(e) => setDateRangeFilter(e.target.value)}
              className="filter-select"
              style={{
                padding: '0.65rem 0.75rem',
                background: '#1a1a1a',
                border: '1px solid #555',
                borderRadius: '4px',
                color: '#fff',
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '180px' }}>
            <label style={{ fontSize: '0.9rem', color: '#aaa', fontWeight: '500' }}>Sort By:</label>
            <select 
              value={sortOrder} 
              onChange={(e) => setSortOrder(e.target.value)}
              className="filter-select"
              style={{
                padding: '0.65rem 0.75rem',
                background: '#1a1a1a',
                border: '1px solid #555',
                borderRadius: '4px',
                color: '#fff',
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
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
