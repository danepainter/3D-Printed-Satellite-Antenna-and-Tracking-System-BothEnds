import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Satellite, Wifi, TrendingUp, Image } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [systemStatus, setSystemStatus] = useState({
    antenna: 'Connected', //Can be connected to function to check if the antenna is connected from the backend
    tracking: 'Active', //Can be connected to function to check if the tracking is active from the backend
    signal: 'Strong', //Can be connected to function to check if the signal is strong from the backend
    satellites: 12 //Can be connected to function to check if the satellites are being tracked from the backend
  });

  const statusCards = [
    {
      title: 'Antenna Status',
      value: systemStatus.antenna,
      icon: Wifi,
      color: '#00d4ff',
      status: 'good' 
    },
    {
      title: 'Tracking Status',
      value: systemStatus.tracking,
      icon: Satellite,
      color: '#00ff88',
      status: 'good'
    },
    {
      title: 'Signal Strength',
      value: systemStatus.signal,
      icon: Activity,
      color: '#ff6b6b',
      status: 'good'
    },
    {
      title: 'Satellites Tracked',
      value: systemStatus.satellites,
      icon: TrendingUp,
      color: '#ffd93d',
      status: 'good'
    }
  ];

  const handleStartTracking = () => {
    navigate('/tracker');
  };

  const handleViewImages = () => {
    navigate('/images');
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
          <button className="action-btn secondary" onClick={handleViewImages}>
            <Image className="btn-icon" />
            View Images
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

