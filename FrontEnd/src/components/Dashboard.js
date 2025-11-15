import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Satellite, Wifi, TrendingUp, ListChecks } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [systemStatus, setSystemStatus] = useState({
    antenna: 'Loading...', 
    tracking: 'Loading...', 
    signal: 'Loading...', 
    satellites: 0,
    dbConnected: false
  });

  // Fetch system status from existing backend endpoints
  useEffect(() => {
    const fetchSystemStatus = async () => {
      try {
        // Check if backend is responding
        const response = await fetch('http://localhost:5000/');
        const backendResponding = response.ok;
        
        // Fetch tracking logs count from database
        let logCount = 0;
        let dbConnected = false;
        try {
          const logsResponse = await fetch('http://localhost:5000/tracking-logs');
          const logsData = await logsResponse.json();
          if (logsData.success) {
            logCount = logsData.logs.length;
            dbConnected = true;
          }
        } catch (error) {
          console.error('Failed to fetch tracking logs:', error);
        }
        
        // Try to get satellite data (for tracking status)
        let hasSatelliteData = false;
        try {
          const satelliteResponse = await fetch('http://localhost:5000/1');
          const satelliteData = await satelliteResponse.json();
          hasSatelliteData = satelliteData.id && !satelliteData.Error;
        } catch (error) {
          hasSatelliteData = false;
        }
        
        // Set status based on backend availability
        setSystemStatus({
          antenna: backendResponding ? 'Connected' : 'Disconnected',
          tracking: hasSatelliteData ? 'Active' : 'Inactive', 
          signal: backendResponding ? 'Strong' : 'Weak',
          satellites: logCount,
          dbConnected: dbConnected
        });
        
      } catch (error) {
        console.error('Error fetching system status:', error);
        // Set default values if backend is not available
        setSystemStatus({
          antenna: 'Disconnected',
          tracking: 'Inactive',
          signal: 'Weak', 
          satellites: 0,
          dbConnected: false
        });
      }
    };

    // Fetch immediately
    fetchSystemStatus();

    // Then fetch every 10 seconds to keep data fresh
    const interval = setInterval(fetchSystemStatus, 10000);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  const statusCards = [
    {
      title: 'Antenna Status',
      value: systemStatus.antenna,
      icon: Wifi,
      color: systemStatus.antenna === 'Connected' ? '#10b981' : '#ef4444',
      status: systemStatus.antenna === 'Connected' ? 'good' : 'warning'
    },
    {
      title: 'Tracking Status', 
      value: systemStatus.tracking,
      icon: Satellite,
      color: systemStatus.tracking === 'Active' ? '#10b981' : '#ef4444',
      status: systemStatus.tracking === 'Active' ? 'good' : 'warning'
    },
    {
      title: 'Satellites Tracked',
      value: systemStatus.satellites,
      icon: TrendingUp,
      color: systemStatus.dbConnected ? '#10b981' : '#ef4444',
      status: systemStatus.dbConnected ? 'good' : 'warning'
    }
  ];

  const handleStartTracking = () => {
    navigate('/tracker');
  };

  const handleViewLogs = () => {
    navigate('/logs');
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>System Dashboard</h2>
        <p>Real-time monitoring of your satellite antenna tracking system</p>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <button className="action-btn primary" onClick={handleStartTracking}>
            <Satellite className="btn-icon" />
            Start Tracking
          </button>
          <button className="action-btn secondary" onClick={handleViewLogs}>
            <ListChecks className="btn-icon" />
            View Logs
          </button>
        </div>
      </div>

      <div className="status-grid">
        {statusCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="status-card">
              <div className="card-header">
                <Icon className="card-icon" style={{ color: card.color }} />
                <h3>{card.title}</h3>
              </div>
              <div className="card-value">{card.value}</div>
              <div className={`card-status ${card.status}`}>
                {card.status === 'good' ? 'Operational' : 'Warning'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;

