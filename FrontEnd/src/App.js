import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import SatelliteTracker from './components/SatelliteTracker';
import ViewImages from './components/ViewImages';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tracker" element={<SatelliteTracker />} />
            <Route path="/images" element={<ViewImages />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
