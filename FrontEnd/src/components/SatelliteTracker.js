import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Clock, Navigation, Target, Search } from 'lucide-react';
import './SatelliteTracker.css';
import SatellitePass3D from './SatellitePass3d';

const SatelliteTracker = () => {
  // User input state
  const [observerCoords, setObserverCoords] = useState({
    latitude: 26.3737,
    longitude: 80.1019,
    altitude: 0
  });

  const [searchParams, setSearchParams] = useState({
    satelliteId: 25544, // Default to ISS
    days: 2,
    minVisibility: 300
  });

  //3d pass vars 
  const [show3DView, setShow3DView] = useState(false);
  const [selectedPass, setSelectedPass] = useState(null);
  const [satellites, setSatellites] = useState([]);
  const [visualPasses, setVisualPasses] = useState([]);
  const [selectedSatellite, setSelectedSatellite] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // New state for interpolate-pass endpoint
  const [interpolatedPath, setInterpolatedPath] = useState(null);
  const [serialAttempt, setSerialAttempt] = useState(null);

  const [liveParams, setLiveParams] = useState({
    pipeline: 'generic_analog_demod',
    outDir: '',           // leave empty to use backend default
    source: 'rtlsdr',
    frequency: '100.7e6',
    sampleRate: '2.4e6',
    gain: 30,
    timeout: 30,
    extraArgs: ''
  });

  const [recordParams, setRecordParams] = useState({
    outputName: '',
    source: 'rtlsdr',
    sampleRate: '2000000',
    frequency: '100700000',
    basebandFormat: 'w16',
    bitDepth: 8,
    timeout: '',
    extraArgs: ''
  });

  const [offlineParams, setOfflineParams] = useState({
    pipeline: '',
    inputLevel: 'baseband',
    inputFile: '',
    outputDir: '',
    samplerate: '',
    basebandFormat: '',
    dcBlock: false,
    freqShift: '',
    iqSwap: false,
    extraArgs: ''
  });

  const [isLiveOptionsOpen, setIsLiveOptionsOpen] = useState(false);
  const [isRecordOptionsOpen, setIsRecordOptionsOpen] = useState(false);
  const [isOfflineOptionsOpen, setIsOfflineOptionsOpen] = useState(false);

  //3d pass functions
  const handleView3D = (pass) => {
    setSelectedPass(pass);
    setShow3DView(true);
  };
  const handleClose3D = () => {
    setShow3DView(false);
    setSelectedPass(null);
  };

  // Tracking log helper - saves tracking session to database
  const saveTrackingLog = async (satelliteName, satelliteId, trackingType) => {
    try {
      await fetch('http://localhost:5000/tracking-logs/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          satellite_name: satelliteName || 'Unknown',
          satellite_id: satelliteId || 0,
          observer_lat: observerCoords.latitude,
          observer_lng: observerCoords.longitude,
          observer_alt: observerCoords.altitude,
          tracking_type: trackingType,
          status: 'Completed'
        })
      });
    } catch (error) {
      console.error('Failed to save tracking log:', error);
    }
  };

// Common satellite IDs for dropdown
const commonSatellites = [
  { id: 25544, name: 'International Space Station (ISS)' },
  { id: 40069, name: 'METEOR-M2' },
  { id: 43013, name: 'NOAA-20' },
  { id: 33591, name: 'NOAA-19' },
  { id: 28654, name: 'NOAA-18' },
  { id: 25338, name: 'NOAA-15' },
  { id: 27424, name: 'AQUA' },
  { id: 25994, name: 'TERRA' },
  { id: 44387, name: 'METEOR-M2-2' },

  // --- Geostationary weather satellites ---

  // GOES (NOAA, Americas)
  { id: 41866, name: 'GOES-16 (GOES-East)' },    // NORAD 41866
  { id: 43226, name: 'GOES-17' },                // NORAD 43226 (spare / limited ops)
  { id: 51850, name: 'GOES-18 (GOES-West)' },    // NORAD 51850
  { id: 60133, name: 'GOES-19 (GOES-U)' },       // NORAD 60133

  // Himawari (JMA, Western Pacific)
  { id: 40267, name: 'Himawari-8' },             // NORAD 40267
  { id: 41836, name: 'Himawari-9' },             // NORAD 41836

  // Elektro-L (Russia)
  { id: 37344, name: 'Elektro-L 1' },            // NORAD 37344
  { id: 41105, name: 'Elektro-L 2' },            // NORAD 41105
  { id: 44903, name: 'Elektro-L 3' },            // NORAD 44903
  { id: 55506, name: 'Elektro-L 4' },            // NORAD 55506

  // Meteosat (EUMETSAT, Europe/Africa)
  { id: 38552, name: 'Meteosat-10 (MSG-3)' },    // NORAD 38552
  { id: 40732, name: 'Meteosat-11 (MSG-4)' },    // NORAD 40732

  // Korea (GK-2A / GEO-KOMPSAT-2A)
  { id: 43823, name: 'GK-2A (GEO-KOMPSAT-2A)' }, // NORAD 43823

  // China (Fengyun-4 series)
  { id: 41882, name: 'Fengyun-4A' },             // NORAD 41882

];


  // Function to call backend API
  const callBackendFunction = async (endpoint, data = {}) => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:5000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (!result.success) {
        alert(`Error: ${result.error}`);
      }
      
      return result;
    } catch (error) {
      alert(`Network error: ${error.message}`);
      console.error('Error calling backend:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch visual passes for selected satellite
  const fetchVisualPasses = async () => {
    const data = {
      id: searchParams.satelliteId,
      observer_lat: observerCoords.latitude,
      observer_lng: observerCoords.longitude,
      observer_alt: observerCoords.altitude,
      days: searchParams.days,
      min_visibility: searchParams.minVisibility
    };
    
    const result = await callBackendFunction('/satellite/visual-passes', data);
    
    if (result?.success) {
      console.log('Visual passes data:', result.data);
      setVisualPasses(result.data.passes || []);
      
      // Update satellites list with fetched data
      const satelliteInfo = {
        id: result.data.info?.satid || searchParams.satelliteId,
        name: result.data.info?.satname || commonSatellites.find(s => s.id === searchParams.satelliteId)?.name,
        passes: result.data.passes || [],
        status: 'visible'
      };
      
      setSatellites([satelliteInfo]);
      setSelectedSatellite(satelliteInfo);
      
      alert(`Found ${result.data.passes?.length || 0} visual passes for ${satelliteInfo.name}`);
    }
  };

  // NEW: seek directly to current satellite position (good for GEO)
  const handleSeekToPosition = async () => {
    const data = {
      id: searchParams.satelliteId,
      observer_lat: observerCoords.latitude,
      observer_lng: observerCoords.longitude,
      observer_alt: observerCoords.altitude
    };

    const result = await callBackendFunction('/satellite/seek-position', data);

    if (result?.success) {
      const { azimuth, elevation, timestamp, serial_attempt } = result.data || {};

      if (typeof azimuth === 'number' && typeof elevation === 'number') {
        // Reuse interpolatedPath UI with a single point
        setInterpolatedPath([
          [azimuth, elevation, timestamp || Math.floor(Date.now() / 1000)]
        ]);
      }

      if (serial_attempt) {
        setSerialAttempt(serial_attempt);
      } else {
        setSerialAttempt('Seek command sent to rotator.');
      }

      // Make sure selectedSatellite exists so tracking UI looks sane
      if (!selectedSatellite) {
        const satName =
          commonSatellites.find(s => s.id === searchParams.satelliteId)?.name ||
          `NORAD ${searchParams.satelliteId}`;

        setSelectedSatellite({
          id: searchParams.satelliteId,
          name: satName,
          passes: [],
          status: 'tracking'
        });
      } else {
        setSelectedSatellite(prev => prev ? { ...prev, status: 'tracking' } : prev);
      }

      // Log tracking session
      const satName = commonSatellites.find(s => s.id === searchParams.satelliteId)?.name || 'Unknown';
      await saveTrackingLog(satName, searchParams.satelliteId, 'seek');

      alert(
        `Seeking to satellite position:\nAz: ${azimuth?.toFixed?.(1) ?? 'N/A'}°\nEl: ${elevation?.toFixed?.(1) ?? 'N/A'}°`
      );
    }
  };

   // Process a specific pass through sattracker pipeline
   const handleInterpolatePass = async (pass) => {
    const passData = {
      startAz: pass.startAz,
      startEl: pass.startEl,
      startUTC: pass.startUTC,
      maxAz: pass.maxAz,
      maxEl: pass.maxEl,
      maxUTC: pass.maxUTC,
      endAz: pass.endAz,
      endEl: pass.endEl,
      endUTC: pass.endUTC
    };
    
    const result = await callBackendFunction('/satellite/interpolate-path', passData);
    
    if (result?.success) {
      setSelectedPass(pass);
      setInterpolatedPath(result.interpolated_path);
      setSerialAttempt(result.serial_attempt);
      console.log('Interpolated path:', result.interpolated_path);
      console.log('Serial attempt:', result.serial_attempt);
      
      // Log tracking session
      const satName = commonSatellites.find(s => s.id === searchParams.satelliteId)?.name || 'Unknown';
      await saveTrackingLog(satName, searchParams.satelliteId, 'interpolate');
      
      alert('Pass processed successfully! Check interpolated path below.');
    }
  };


  const handleStartTracking = async () => {
    const result = await callBackendFunction('/satellite/start-live', liveParams);
  
    if (result?.success) {
      setIsTracking(true);
      if (selectedSatellite) {
        setSelectedSatellite(prev => ({ ...prev, status: 'tracking' }));
      }
  
      if (!statusCheckIntervalRef.current) {
        statusCheckIntervalRef.current = setInterval(checkLiveStatus, 2000);
      }
  
      // Log tracking session
      const satName = selectedSatellite?.name || searchParams.satelliteId || 'Live Tracking';
      const satId = selectedSatellite?.id || searchParams.satelliteId || 0;
      await saveTrackingLog(satName, satId, 'live');
  
      setIsLiveOptionsOpen(false);
      alert(result.message);
    }
  };

  const handleStopTracking = () => {
    if (statusCheckIntervalRef.current) {
      clearInterval(statusCheckIntervalRef.current);
      statusCheckIntervalRef.current = null;
    }
    setIsTracking(false);
    if (selectedSatellite) {
      setSelectedSatellite(prev => ({ ...prev, status: 'visible' }));
    }
  };

  const handleStartRecording = async () => {
    const trimmedOutput = recordParams.outputName.trim();
    const trimmedSource = recordParams.source.trim();
    const sampleRateValue = recordParams.sampleRate.toString().trim();
    const frequencyValue = recordParams.frequency.toString().trim();

    if (!trimmedOutput || !trimmedSource || sampleRateValue === '' || frequencyValue === '') {
      alert('Please fill in all required recording parameters.');
      return;
    }

    const payload = {
      outputName: trimmedOutput,
      source: trimmedSource,
      sampleRate: sampleRateValue,
      frequency: frequencyValue,
      basebandFormat: recordParams.basebandFormat
    };

    if (recordParams.basebandFormat === 'ziq' && recordParams.bitDepth !== '' && recordParams.bitDepth !== null) {
      payload.bitDepth = Number(recordParams.bitDepth);
    }

    if (recordParams.timeout !== '' && recordParams.timeout !== null) {
      const timeoutValue = Number(recordParams.timeout);
      if (!Number.isNaN(timeoutValue)) {
        payload.timeout = timeoutValue;
      }
    }

    if (recordParams.extraArgs.trim()) {
      payload.extraArgs = recordParams.extraArgs.trim();
    }

    const result = await callBackendFunction('/satellite/start-recording', payload);
    if (result?.success) {
      setIsRecordOptionsOpen(false);
      alert(result.message);
    }
  };

  const handleProcessOffline = async () => {
    const payload = {
      pipeline: offlineParams.pipeline.trim(),
      inputLevel: offlineParams.inputLevel.trim(),
      inputFile: offlineParams.inputFile.trim()
    };

    const missing = Object.entries(payload).filter(([_, value]) => !value);
    if (missing.length) {
      alert('Please fill in pipeline, input level, and input file.');
      return;
    }

    const trimmedOutputDir = offlineParams.outputDir.trim();
    if (trimmedOutputDir) {
      payload.outputDir = trimmedOutputDir;
    }

    if (offlineParams.samplerate.toString().trim()) {
      payload.samplerate = offlineParams.samplerate.toString().trim();
    }

    if (offlineParams.basebandFormat.trim()) {
      payload.basebandFormat = offlineParams.basebandFormat.trim();
    }

    if (offlineParams.dcBlock) {
      payload.dcBlock = true;
    }

    if (offlineParams.freqShift.toString().trim()) {
      payload.freqShift = offlineParams.freqShift.toString().trim();
    }

    if (offlineParams.iqSwap) {
      payload.iqSwap = true;
    }

    if (offlineParams.extraArgs.trim()) {
      payload.extraArgs = offlineParams.extraArgs.trim();
    }

    const result = await callBackendFunction('/satellite/process-offline', payload);
    if (result?.success) {
      setIsOfflineOptionsOpen(false);
      alert(result.message);
    }
  };

  const isRecordDisabled =
    isLoading ||
    !recordParams.outputName.trim() ||
    !recordParams.source.trim() ||
    recordParams.sampleRate.toString().trim() === '' ||
    recordParams.frequency.toString().trim() === '';

  const isOfflineDisabled =
    isLoading ||
    !offlineParams.pipeline.trim() ||
    !offlineParams.inputLevel.trim() ||
    !offlineParams.inputFile.trim();

  const getStatusColor = (status) => {
    switch (status) {
      case 'tracking': return '#00ff88';
      case 'visible': return '#00d4ff';
      case 'hidden': return '#ff6b6b';
      default: return '#888';
    }
  };

  const formatDateTime = (utcString) => {
    if (!utcString) return 'N/A';
    return new Date(utcString * 1000).toLocaleString();
  };

  // Add state for live process status
  const [liveProcessStatus, setLiveProcessStatus] = useState(null);
  const statusCheckIntervalRef = useRef(null);

  // Add function to check status
  const checkLiveStatus = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/satellite/live-status');
      const result = await response.json();
      
      if (result.success && result.status.completed && !result.status.is_running) {
        // Process has completed!
        setLiveProcessStatus(result.status);
        
        // Show alert to user
        alert(`Live Process Completed!\n${result.status.message}\nCompleted at: ${new Date(result.status.completed_at).toLocaleString()}`);
        
        // Stop polling
        if (statusCheckIntervalRef.current) {
          clearInterval(statusCheckIntervalRef.current);
          statusCheckIntervalRef.current = null;
        }
        
        // Reset backend status after user sees it
        await fetch('http://127.0.0.1:5000/satellite/live-status/reset', {
          method: 'POST'
        });
        
        setIsTracking(false);
      }
    } catch (error) {
      console.error('Error checking live status:', error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current);
        statusCheckIntervalRef.current = null;
      }
    };
  }, []);

  // Optional: Add visual indicator in the UI
  return (
    <div className="satellite-tracker">
      <div className="tracker-header">
        <h2>Satellite Tracker</h2>
        <p>Search and track satellites using real N2YO data</p>
      </div>

      <div className="tracker-content">
        {/* Settings Panel - Always Visible */}
        <div className="settings-panel">
          <div className="settings-header">
            <h3>Search Parameters</h3>
          </div>

          <div className="settings-content">
            <div className="input-group">
              <h4>Observer Location</h4>
              <div className="coord-inputs">
                <div className="input-field">
                  <label>Latitude:</label>
                  <input
                    type="number"
                    step="0.001"
                    value={observerCoords.latitude}
                    onChange={(e) => setObserverCoords(prev => ({
                      ...prev,
                      latitude: parseFloat(e.target.value) || 0
                    }))}
                  />
                </div>
                <div className="input-field">
                  <label>Longitude:</label>
                  <input
                    type="number"
                    step="0.001"
                    value={observerCoords.longitude}
                    onChange={(e) => setObserverCoords(prev => ({
                      ...prev,
                      longitude: parseFloat(e.target.value) || 0
                    }))}
                  />
                </div>
                <div className="input-field">
                  <label>Altitude (m):</label>
                  <input
                    type="number"
                    value={observerCoords.altitude}
                    onChange={(e) => setObserverCoords(prev => ({
                      ...prev,
                      altitude: parseInt(e.target.value) || 0
                    }))}
                  />
                </div>
              </div>
            </div>

            <div className="input-group">
              <h4>Satellite & Search Options</h4>
              <div className="search-inputs">
                <div className="input-field">
                  <label>Satellite:</label>
                  <select
                    value={searchParams.satelliteId}
                    onChange={(e) => setSearchParams(prev => ({
                      ...prev,
                      satelliteId: parseInt(e.target.value)
                    }))}
                  >
                    {commonSatellites.map(sat => (
                      <option key={sat.id} value={sat.id} className="satellite-select">
                        {sat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="input-field">
                  <label>Days ahead:</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={searchParams.days}
                    onChange={(e) => setSearchParams(prev => ({
                      ...prev,
                      days: parseInt(e.target.value) || 1
                    }))}
                  />
                </div>
                <div className="input-field">
                  <label>Min visibility (sec):</label>
                  <input
                    type="number"
                    min="0"
                    value={searchParams.minVisibility}
                    onChange={(e) => setSearchParams(prev => ({
                      ...prev,
                      minVisibility: parseInt(e.target.value) || 0
                    }))}
                  />
                </div>
              </div>
            </div>

            <button 
              className="search-btn primary"
              onClick={fetchVisualPasses}
              disabled={isLoading}
            >
              <Search size={20} />
              {isLoading ? 'Searching...' : 'Search Visual Passes'}
            </button>
            <button
              className="search-btn primary"
              onClick={handleSeekToPosition}
              disabled={isLoading}
            >
              Seek To Position
            </button>
          </div>
        </div>

        {/* Visual Passes Results */}
        {visualPasses.length > 0 && (
          <div className="visual-passes">
            <h3>Visual Passes Found</h3>
            <div className="passes-list">
              {visualPasses.map((pass, index) => (
                <div key={index} className="pass-item">
                  <div className="pass-header">
                    <h4>Pass #{index + 1}</h4>
                    <span className="pass-duration">{pass.duration}s</span>
                  </div>
                  <div className="pass-details">
                    <button 
                      className="view-3d-btn"
                      onClick={() => handleView3D(pass)}
                    >
                      🌍 View 3D Pass
                    </button>
                    <div className="pass-time">
                      <strong>Start:</strong> {formatDateTime(pass.startUTC)}
                    </div>
                    <div className="pass-time">
                      <strong>Max Elevation:</strong> {formatDateTime(pass.maxUTC)} ({pass.maxEl}°)
                    </div>
                    <div className="pass-time">
                      <strong>End:</strong> {formatDateTime(pass.endUTC)}
                    </div>
                    <div className="pass-magnitude">
                      <strong>Magnitude:</strong> {pass.mag}
                    </div>
                    <div className="start-azimuth">
                      <strong>Starting Azimuth:</strong> {pass.startAz}
                    </div>
                    <div className="max-azimuth">
                      <strong>Maximum Azimuth:</strong> {pass.maxAz}
                    </div>
                    <div className="max-elevation">
                      <strong>Maximum Elevation:</strong> {pass.maxEl}
                    </div>
                    <div className="end-azimuth">
                      <strong>Ending Azimuth:</strong> {pass.endAz}
                    </div>
                    <button 
                      className="track-btn primary"
                      onClick={() => handleInterpolatePass(pass)}
                      disabled={isLoading}
                    >
                      Calculate Path
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {interpolatedPath && (
          <div className="interpolated-results">
            <h3>Interpolated Path Results</h3>
            <div className="interpolation-card">
              <div className="serial-status">
                <h4>Serial Connection Status:</h4>
                <div className={`status-message ${serialAttempt?.includes('Success') ? 'success' : 'failed'}`}>
                  {serialAttempt || 'No attempt made'}
                </div>
              </div>
              
              <div className="path-data">
                <h4>Interpolated Positions ({interpolatedPath.length} points):</h4>
                <div className="path-table-container">
                  <table className="path-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Azimuth (°)</th>
                        <th>Elevation (°)</th>
                        <th>Time (UTC)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {interpolatedPath.map((point, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>{point[0].toFixed(2)}</td>
                          <td>{point[1].toFixed(2)}</td>
                          <td>{formatDateTime(point[2])}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Selected Satellite Details */}
        {selectedSatellite && (
          <div className="tracking-details">
            <h3>Tracking Controls</h3>
            <div className="details-card">
              <div className="detail-header">
                <Target className="detail-icon" />
                <h4>{selectedSatellite.name}</h4>
                <div 
                  className="status-indicator"
                  style={{ backgroundColor: getStatusColor(selectedSatellite.status) }}
                ></div>
              </div>
              <div className="tracking-controls">
                <div className="split-button">
                  <button 
                    className="track-btn primary"
                    onClick={handleStartTracking}
                    disabled={isTracking || isLoading}
                  >
                    {isTracking ? 'Tracking...' : 'Start Live Tracking'}
                  </button>
                  <button
                    className="track-btn split caret"
                    onClick={() => {
                      setIsLiveOptionsOpen(v => !v);
                      setIsRecordOptionsOpen(false);
                      setIsOfflineOptionsOpen(false);
                    }}
                    aria-expanded={isLiveOptionsOpen}
                    disabled={isLoading}
                    title="Live options"
                  >
                    ▾
                  </button>

                  {isLiveOptionsOpen && (
                    <div className="dropdown-panel live-options">
                      <h4>Live RF Parameters</h4>
                      <div className="rf-grid">
                        <div className="input-field">
                          <label>Pipeline</label>
                          <input
                            type="text"
                            placeholder="e.g. generic_analog_demod"
                            value={liveParams.pipeline}
                            onChange={(e) => setLiveParams(p => ({ ...p, pipeline: e.target.value }))}
                          />
                        </div>
                        <div className="input-field">
                          <label>Output Dir (optional)</label>
                          <input
                            type="text"
                            placeholder="e.g. C:\\path\\to\\SatDumpOut\\test"
                            value={liveParams.outDir}
                            onChange={(e) => setLiveParams(p => ({ ...p, outDir: e.target.value }))}
                          />
                        </div>
                        <div className="input-field">
                          <label>Source</label>
                          <input
                            type="text"
                            value={liveParams.source}
                            onChange={(e) => setLiveParams(p => ({ ...p, source: e.target.value }))}
                          />
                        </div>
                        <div className="input-field">
                          <label>Frequency</label>
                          <input
                            type="text"
                            placeholder='e.g. 100.7e6 or 100700000'
                            value={liveParams.frequency}
                            onChange={(e) => setLiveParams(p => ({ ...p, frequency: e.target.value }))}
                          />
                        </div>
                        <div className="input-field">
                          <label>Sample Rate</label>
                          <input
                            type="text"
                            placeholder='e.g. 2.4e6 or 2400000'
                            value={liveParams.sampleRate}
                            onChange={(e) => setLiveParams(p => ({ ...p, sampleRate: e.target.value }))}
                          />
                        </div>
                        <div className="input-field">
                          <label>Gain</label>
                          <input
                            type="number"
                            value={liveParams.gain}
                            onChange={(e) => setLiveParams(p => ({ ...p, gain: Number(e.target.value) }))}
                          />
                        </div>
                        <div className="input-field">
                          <label>Timeout (s)</label>
                          <input
                            type="number"
                            value={liveParams.timeout}
                            onChange={(e) => setLiveParams(p => ({ ...p, timeout: Number(e.target.value) }))}
                          />
                        </div>
                        <div className="input-field" style={{ gridColumn: '1 / -1' }}>
                          <label>Extra Args</label>
                          <input
                            type="text"
                            placeholder="any additional satdump flags"
                            value={liveParams.extraArgs}
                            onChange={(e) => setLiveParams(p => ({ ...p, extraArgs: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="split-button">
                  <button 
                    className="track-btn primary"
                    onClick={handleStartRecording}
                    disabled={isRecordDisabled}
                  >
                    Start Recording
                  </button>
                  <button
                    className="track-btn split caret"
                    onClick={() => {
                      setIsRecordOptionsOpen(v => !v);
                      setIsLiveOptionsOpen(false);
                      setIsOfflineOptionsOpen(false);
                    }}
                    aria-expanded={isRecordOptionsOpen}
                    disabled={isLoading}
                    title="Recording options"
                  >
                    ▾
                  </button>

                  {isRecordOptionsOpen && (
                    <div className="dropdown-panel record-options">
                      <h4>Recording Parameters</h4>
                      <div className="rf-grid">
                        <div className="input-field">
                          <label>Output Baseband Name</label>
                          <input
                            type="text"
                            placeholder="e.g. recordings/test_capture"
                            value={recordParams.outputName}
                            onChange={(e) => setRecordParams(p => ({ ...p, outputName: e.target.value }))}
                          />
                        </div>
                        <div className="input-field">
                          <label>Source</label>
                          <input
                            type="text"
                            placeholder="e.g. rtlsdr"
                            value={recordParams.source}
                            onChange={(e) => setRecordParams(p => ({ ...p, source: e.target.value }))}
                          />
                        </div>
                        <div className="input-field">
                          <label>Samplerate (Hz)</label>
                          <input
                            type="text"
                            placeholder="e.g. 2000000"
                            value={recordParams.sampleRate}
                            onChange={(e) => setRecordParams(p => ({ ...p, sampleRate: e.target.value }))}
                          />
                        </div>
                        <div className="input-field">
                          <label>Frequency (Hz)</label>
                          <input
                            type="text"
                            placeholder="e.g. 137100000"
                            value={recordParams.frequency}
                            onChange={(e) => setRecordParams(p => ({ ...p, frequency: e.target.value }))}
                          />
                        </div>
                        <div className="input-field">
                          <label>Baseband Format</label>
                          <select
                            value={recordParams.basebandFormat}
                            onChange={(e) => {
                              const value = e.target.value;
                              setRecordParams(p => ({
                                ...p,
                                basebandFormat: value,
                                bitDepth: value === 'ziq' ? (p.bitDepth || 8) : ''
                              }));
                            }}
                          >
                            <option value="w16">w16 (16-bit WAV)</option>
                            <option value="ziq">ziq (I/Q)</option>
                          </select>
                        </div>
                        {recordParams.basebandFormat === 'ziq' && (
                          <div className="input-field">
                            <label>Bit Depth (8/16/32)</label>
                            <input
                              type="number"
                              min="8"
                              max="32"
                              step="8"
                              value={recordParams.bitDepth}
                              onChange={(e) => setRecordParams(p => ({
                                ...p,
                                bitDepth: e.target.value === '' ? '' : Number(e.target.value)
                              }))}
                            />
                          </div>
                        )}
                        <div className="input-field">
                          <label>Timeout (s, optional)</label>
                          <input
                            type="number"
                            min="0"
                            value={recordParams.timeout}
                            onChange={(e) => setRecordParams(p => ({ ...p, timeout: e.target.value }))}
                          />
                        </div>
                        <div className="input-field" style={{ gridColumn: '1 / -1' }}>
                          <label>Extra Flags (optional)</label>
                          <input
                            type="text"
                            placeholder="e.g. --bit_depth 16"
                            value={recordParams.extraArgs}
                            onChange={(e) => setRecordParams(p => ({ ...p, extraArgs: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="split-button">
                  <button 
                    className="track-btn secondary"
                    onClick={handleProcessOffline}
                    disabled={isOfflineDisabled}
                  >
                    Process Offline Data
                  </button>
                  <button
                    className="track-btn split caret"
                    onClick={() => {
                      setIsOfflineOptionsOpen(v => !v);
                      setIsLiveOptionsOpen(false);
                      setIsRecordOptionsOpen(false);
                    }}
                    aria-expanded={isOfflineOptionsOpen}
                    disabled={isLoading}
                    title="Offline options"
                  >
                    ▾
                  </button>

                  {isOfflineOptionsOpen && (
                    <div className="dropdown-panel offline-options">
                      <h4>Offline Processing Parameters</h4>
                      <div className="rf-grid">
                        <div className="input-field" style={{ gridColumn: '1 / -1' }}>
                          <label>Pipeline</label>
                          <input
                            type="text"
                            placeholder="e.g. metop_ahrpt"
                            value={offlineParams.pipeline}
                            onChange={(e) => setOfflineParams(p => ({ ...p, pipeline: e.target.value }))}
                          />
                        </div>
                        <div className="input-field">
                          <label>Input Level</label>
                          <input
                            type="text"
                            placeholder="e.g. baseband"
                            value={offlineParams.inputLevel}
                            onChange={(e) => setOfflineParams(p => ({ ...p, inputLevel: e.target.value }))}
                          />
                        </div>
                        <div className="input-field">
                          <label>Input File</label>
                          <input
                            type="text"
                            placeholder="relative to SatDumpIn"
                            value={offlineParams.inputFile}
                            onChange={(e) => setOfflineParams(p => ({ ...p, inputFile: e.target.value }))}
                          />
                        </div>
                        <div className="input-field">
                          <label>Output Dir</label>
                          <input
                            type="text"
                            placeholder="relative or absolute"
                            value={offlineParams.outputDir}
                            onChange={(e) => setOfflineParams(p => ({ ...p, outputDir: e.target.value }))}
                          />
                        </div>
                        <div className="input-field">
                          <label>Samplerate (optional)</label>
                          <input
                            type="text"
                            value={offlineParams.samplerate}
                            onChange={(e) => setOfflineParams(p => ({ ...p, samplerate: e.target.value }))}
                          />
                        </div>
                        <div className="input-field">
                          <label>Baseband Format (optional)</label>
                          <input
                            type="text"
                            placeholder="e.g. s16, ziq"
                            value={offlineParams.basebandFormat}
                            onChange={(e) => setOfflineParams(p => ({ ...p, basebandFormat: e.target.value }))}
                          />
                        </div>
                        <div className="input-field">
                          <label>Freq Shift (Hz, optional)</label>
                          <input
                            type="text"
                            value={offlineParams.freqShift}
                            onChange={(e) => setOfflineParams(p => ({ ...p, freqShift: e.target.value }))}
                          />
                        </div>
                        <div className="input-field">
                          <label>Extra Args</label>
                          <input
                            type="text"
                            placeholder="any additional satdump flags"
                            value={offlineParams.extraArgs}
                            onChange={(e) => setOfflineParams(p => ({ ...p, extraArgs: e.target.value }))}
                          />
                        </div>
                        <label className="checkbox-row">
                          <input
                            type="checkbox"
                            checked={offlineParams.dcBlock}
                            onChange={(e) => setOfflineParams(p => ({ ...p, dcBlock: e.target.checked }))}
                          />
                          <span>Enable DC Block</span>
                        </label>
                        <label className="checkbox-row">
                          <input
                            type="checkbox"
                            checked={offlineParams.iqSwap}
                            onChange={(e) => setOfflineParams(p => ({ ...p, iqSwap: e.target.checked }))}
                          />
                          <span>IQ Swap</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Current Location Display */}
        <div className="location-info">
          <h3>Observer Location</h3>
          <div className="location-details">
            <div className="location-item">
              <MapPin className="location-icon" />
              <span>Lat: {observerCoords.latitude}°, Lng: {observerCoords.longitude}°</span>
            </div>
            <div className="location-item">
              <Clock className="location-icon" />
              <span>Altitude: {observerCoords.altitude}m</span>
            </div>
          </div>
        </div>
      </div>
      {show3DView && (
        <SatellitePass3D
          passData={selectedPass}
          observerCoords={observerCoords}
          onClose={handleClose3D}
        />
      )}
      {liveProcessStatus && liveProcessStatus.completed && (
        <div className={`process-complete-banner ${liveProcessStatus.success ? 'success' : 'error'}`}>
          <h4>Live Process Status</h4>
          <p>{liveProcessStatus.message}</p>
          <p>Completed at: {new Date(liveProcessStatus.completed_at).toLocaleString()}</p>
          <button onClick={() => setLiveProcessStatus(null)}>Dismiss</button>
        </div>
      )}
    </div>
  );
};

export default SatelliteTracker;
