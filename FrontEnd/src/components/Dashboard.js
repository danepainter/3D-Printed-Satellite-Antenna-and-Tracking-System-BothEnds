import React, { useState, useEffect } from 'react';
import { Activity, Satellite, Wifi, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

const Dashboard = () => {
  const [systemStatus, setSystemStatus] = useState({
    antenna: 'Connected',
    tracking: 'Active',
    signal: 'Strong',
    satellites: 12
  });

  const [signalData, setSignalData] = useState([]);

  useEffect(() => {
    // Simulate real-time data updates
    const interval = setInterval(() => {
      const newData = {
        time: new Date().toLocaleTimeString(),
        signal: Math.random() * 100,
        elevation: Math.random() * 90,
        azimuth: Math.random() * 360
      };
      setSignalData(prev => [...prev.slice(-9), newData]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>System Dashboard</h2>
        <p>Real-time monitoring of your satellite antenna tracking system</p>
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

      <div className="charts-section">
        <div className="chart-container">
          <h3>Signal Strength Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={signalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="time" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1a1a2e', 
                  border: '1px solid #333',
                  borderRadius: '8px'
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="signal" 
                stroke="#00d4ff" 
                strokeWidth={2}
                dot={{ fill: '#00d4ff', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <button className="action-btn primary">
            <Satellite className="btn-icon" />
            Start Tracking
          </button>
          <button className="action-btn secondary">
            <Activity className="btn-icon" />
            Calibrate Antenna
          </button>
          <button className="action-btn secondary">
            <Wifi className="btn-icon" />
            Test Connection
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

