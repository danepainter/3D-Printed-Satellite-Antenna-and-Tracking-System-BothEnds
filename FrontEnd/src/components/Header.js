import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Satellite, Activity, ListChecks } from 'lucide-react';
import './Header.css';

const Header = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Activity },
    { path: '/tracker', label: 'Satellite Tracker', icon: Satellite },
    { path: '/logs', label: 'View Logs', icon: ListChecks },
  ];

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <Satellite className="logo-icon" />
          <h1>Satellite Tracker</h1>
        </div>
        <nav className="nav">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`nav-link ${location.pathname === path ? 'active' : ''}`}
            >
              <Icon className="nav-icon" />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;
