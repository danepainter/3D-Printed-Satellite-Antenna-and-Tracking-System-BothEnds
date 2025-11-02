import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Satellite, Wifi, TrendingUp, Image } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [systemStatus, setSystemStatus] = useState({
    antenna: 'Loading...', 
    tracking: 'Loading...', 
    signal: 'Loading...', 
    satellites: 0 
  });

  // Fetch system status from existing backend endpoints
  useEffect(() => {
    const fetchSystemStatus = async () => {
      try {
        // Check if backend is responding
        const response = await fetch('http://localhost:5000/');
        const data = await response.text();
        
        // Check if backend is reachable (even if no specific satellite data exists)
        const backendResponding = response.ok;
        
        // Try to get satellite data, but don't fail if it doesn't exist
        let hasSatelliteData = false;
        try {
          const satelliteResponse = await fetch('http://localhost:5000/1');
          const satelliteData = await satelliteResponse.json();
          hasSatelliteData = satelliteData.id && !satelliteData.Error;
        } catch (error) {
          // Satellite data doesn't exist, but backend is still responding
          hasSatelliteData = false;
        }
        
        // Set status based on backend availability
        setSystemStatus({
          antenna: backendResponding ? 'Connected' : 'Disconnected',
          tracking: hasSatelliteData ? 'Active' : 'Inactive', 
          signal: backendResponding ? 'Strong' : 'Weak',
          satellites: hasSatelliteData ? 1 : 0
        });
        
      } catch (error) {
        console.error('Error fetching system status:', error);
        // Set default values if backend is not available
        setSystemStatus({
          antenna: 'Disconnected',
          tracking: 'Inactive',
          signal: 'Weak', 
          satellites: 0
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
      title: 'Signal Strength',
      value: systemStatus.signal,
      icon: Activity,
      color: systemStatus.signal === 'Strong' ? '#10b981' : '#ef4444',
      status: systemStatus.signal === 'Strong' ? 'good' : 'warning'
    },
    {
      title: 'Satellites Tracked',
      value: systemStatus.satellites,
      icon: TrendingUp,
      color: systemStatus.satellites > 0 ? '#10b981' : '#ef4444',
      status: systemStatus.satellites > 0 ? 'good' : 'warning'
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
            <Image className="btn-icon" />
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

