import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Line } from '@react-three/drei';
import * as THREE from 'three';
import './SatellitePass3D.css';

// Utility functions
const normalizeAzimuth = (az) => {
  az = az % 360;
  if (az < 0) az += 360;
  return az;
};

const interpolateAzimuth = (startAz, endAz, t) => {
  // Convert to radians for proper unwrapping
  const startRad = startAz * (Math.PI / 180);
  const endRad = endAz * (Math.PI / 180);
  
  // Calculate the shortest angular distance
  let diff = endRad - startRad;
  
  // Normalize to [-π, π] range (shortest path)
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  
  // Linear interpolation in radians
  const resultRad = startRad + t * diff;
  
  // Convert back to degrees and normalize to [0, 360)
  const resultDeg = (resultRad * 180 / Math.PI) % 360;
  const normalized = resultDeg < 0 ? resultDeg + 360 : resultDeg;
  
  return normalized;
};

const sphericalToCartesian = (azimuth, elevation, radius = 1.1) => {
  const azRad = azimuth * (Math.PI / 180);
  const elRad = elevation * (Math.PI / 180);
  
  // Simple coordinate system that keeps satellite on the "front" side
  // This prevents the "back of sphere" issue by using a different approach
  
  // Use a coordinate system where:
  // - X: East-West (positive = East)
  // - Y: Up-Down (positive = Up)
  // - Z: North-South (positive = North, but constrained to front side)
  
  const x = radius * Math.cos(elRad) * Math.sin(azRad);  // East-West
  const y = radius * Math.sin(elRad);                    // Up-Down
  const z = radius * Math.cos(elRad) * Math.cos(azRad); // North-South
  
  // Force the satellite to stay on the "front" side by constraining Z
  // If Z would be negative (back side), flip it to positive (front side)
  const constrainedZ = Math.abs(z);
  
  return [x, y, constrainedZ];
};

const calculateSatellitePosition = (passData, t) => {
  // Only show the descent portion (from max elevation to end)
  // Convert t (0-1) to time between max and end
  const maxTime = passData.maxUTC;
  const endTime = passData.endUTC;
  const currentTime = maxTime + t * (endTime - maxTime);
  
  // Only interpolate from max to end (descent portion)
  const timeRatio = (currentTime - maxTime) / (endTime - maxTime);
  const azimuth = interpolateAzimuth(passData.maxAz, passData.endAz, timeRatio);
  const elevation = passData.maxEl + timeRatio * (passData.endEl - passData.maxEl);
  
  return { azimuth, elevation };
};

// Error boundary for 3D components
const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = (error) => {
      console.error('3D Component Error:', error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="error-fallback">
        <h3>3D Visualization Error</h3>
        <p>There was an error rendering the 3D visualization.</p>
        <button onClick={() => setHasError(false)}>Retry</button>
      </div>
    );
  }

  return children;
};

// Earth component
const Earth = ({ observerPosition }) => {
  return (
    <group>
      <Sphere args={[1, 64, 64]}>
        <meshPhongMaterial 
          color="#4A90E2" 
          shininess={100}
          specular="#ffffff"
        />
      </Sphere>
      
      <mesh position={observerPosition}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
      
      <group>
        <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
          <torusGeometry args={[1.01, 0.01, 8, 100]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
        </mesh>
        
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.01, 0.01, 8, 100]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
        </mesh>
      </group>

      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1.005, 32, 32]} />
        <meshBasicMaterial 
          color="#000000" 
          transparent 
          opacity={0.3}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
};

// Satellite trajectory line
const SatellitePath = ({ pathPoints }) => {
  const points = useMemo(() => {
    if (!pathPoints || pathPoints.length === 0) {
      return [];
    }
    
    const validPoints = pathPoints.filter(point => 
      Array.isArray(point) && 
      point.length === 3 && 
      point.every(coord => typeof coord === 'number' && !isNaN(coord))
    );
    
    if (validPoints.length === 0) {
      return [];
    }
    
    return validPoints.map(point => new THREE.Vector3(...point));
  }, [pathPoints]);

  if (points.length === 0) {
    return null;
  }

  return (
    <Line
      points={points}
      color="#ff0000"
      lineWidth={5}
    />
  );
};

// Animated satellite
const Satellite = ({ position, isAnimating }) => {
  const meshRef = useRef();
  
  useFrame(() => {
    if (meshRef.current && isAnimating) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[0.05, 0.05, 0.05]} />
      <meshBasicMaterial color="#ffffff" />
    </mesh>
  );
};

// Main 3D scene component
const Scene3D = ({ 
  passData, 
  observerCoords, 
  isAnimating, 
  animationProgress,
  onAnimationComplete,
  onCurrentTimeChange
}) => {
  const [pathPoints, setPathPoints] = useState([]);
  const [satellitePosition, setSatellitePosition] = useState([0, 0, 0]);

  // Convert observer coordinates to 3D position on Earth
  const observerPosition = useMemo(() => {
    const lat = observerCoords.latitude * (Math.PI / 180);
    const lng = observerCoords.longitude * (Math.PI / 180);
    const radius = 1.01;
    
    return [
      radius * Math.cos(lat) * Math.cos(lng),
      radius * Math.sin(lat),
      radius * Math.cos(lat) * Math.sin(lng)
    ];
  }, [observerCoords]);

  // Generate satellite path points
  useEffect(() => {
    if (!passData || !passData.startUTC || !passData.endUTC) {
      setPathPoints([]);
      return;
    }

    if (pathPoints.length > 0) {
      return;
    }

    const points = [];
    const maxTime = passData.maxUTC;
    const endTime = passData.endUTC;
    const duration = endTime - maxTime; // Only descent duration
    
    if (duration <= 0) {
      setPathPoints([]);
      return;
    }
    
    // Generate points for descent portion only (from max to end)
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      
      try {
        const { azimuth, elevation } = calculateSatellitePosition(passData, t);
        const satelliteAltitude = 1.2;
        const point = sphericalToCartesian(azimuth, elevation, satelliteAltitude);
        points.push(point);
      } catch (error) {
        console.warn('Error generating satellite path point:', error);
      }
    }
      
    setPathPoints(points);
  }, [passData, pathPoints.length]);

  // Update satellite position during animation
  useEffect(() => {
    if (!passData || pathPoints.length === 0) return;

    const t = animationProgress;
    const { azimuth, elevation } = calculateSatellitePosition(passData, t);
    
    const satelliteAltitude = 1.2;
    const satellitePos = sphericalToCartesian(azimuth, elevation, satelliteAltitude);
    setSatellitePosition(satellitePos);
    
    // Calculate current time (descent portion only)
    const maxTime = passData.maxUTC;
    const endTime = passData.endUTC;
    const duration = endTime - maxTime;
    const currentTime = maxTime + (duration * animationProgress);

    if (onCurrentTimeChange) {
      onCurrentTimeChange(currentTime);
    }

    if (animationProgress >= 1 && onAnimationComplete) {
      onAnimationComplete();
    }
  }, [animationProgress, pathPoints, passData, onAnimationComplete, onCurrentTimeChange]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      
      <Earth observerPosition={observerPosition} />
      <SatellitePath pathPoints={pathPoints} />
      <Satellite position={satellitePosition} isAnimating={isAnimating} />

      <OrbitControls 
        enablePan={true} 
        enableZoom={true} 
        enableRotate={true}
        enableDamping={true}
        dampingFactor={0.05}
        minPolarAngle={0}
        maxPolarAngle={Math.PI}
        minAzimuthAngle={-Infinity}
        maxAzimuthAngle={Infinity}
      />
    </>
  );
};

// Time formatting utility
const formatTime = (timestamp) => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });
};

// Main component
const SatellitePass3D = ({ passData, observerCoords, onClose }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const animationRef = useRef();

  const startAnimation = () => {
    if (!passData) return;
    
    setIsAnimating(true);
    setIsPlaying(true);
    setAnimationProgress(0);
    
    const startTime = Date.now();
    const descentDuration = (passData.endUTC - passData.maxUTC); // Only descent duration
    const animationDuration = Math.min(descentDuration * 1000, 15000);
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      setAnimationProgress(progress);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        setIsPlaying(false);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
  };

  const stopAnimation = () => {
    setIsAnimating(false);
    setIsPlaying(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const resetAnimation = () => {
    stopAnimation();
    setAnimationProgress(0);
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  if (!passData) {
    return (
      <div className="satellite-3d-container">
        <div className="no-data">
          <h3>No Pass Data Available</h3>
          <p>Please fetch satellite pass data first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="satellite-3d-container">
      <div className="satellite-3d-header">
        <h2>3D Satellite Pass Visualization</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      
      <div className="satellite-3d-content">
        <div className="satellite-3d-canvas">
          <ErrorBoundary>
            <Canvas camera={{ position: [3, 3, 3], fov: 60 }}>
              <Scene3D 
                passData={passData}
                observerCoords={observerCoords}
                isAnimating={isAnimating}
                animationProgress={animationProgress}
                onCurrentTimeChange={setCurrentTime}
                onAnimationComplete={() => {
                  setIsAnimating(false);
                  setIsPlaying(false);
                }}
              />
            </Canvas>
          </ErrorBoundary>
        </div>
        
        <div className="satellite-3d-controls">
          <div className="pass-info">
            <h3>Pass Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <strong>Start Time:</strong> {formatTime(passData.startUTC)}
              </div>
              <div className="info-item">
                <strong>Max Elevation:</strong> {passData.maxEl}° at {formatTime(passData.maxUTC)}
              </div>
              <div className="info-item">
                <strong>End Time:</strong> {formatTime(passData.endUTC)}
              </div>
              <div className="info-item">
                <strong>Duration:</strong> {Math.round((passData.endUTC - passData.startUTC) / 60)} minutes
              </div>
            </div>
          </div>
          
          <div className="animation-controls">
            <h3>Animation Controls</h3>
            <div className="control-buttons">
              <button 
                onClick={isPlaying ? stopAnimation : startAnimation}
                className={`control-btn ${isPlaying ? 'stop' : 'play'}`}
              >
                {isPlaying ? '⏸️ Pause' : '▶️ Play'}
              </button>
              <button onClick={resetAnimation} className="control-btn reset">
                🔄 Reset
              </button>
            </div>
            
            <div className="progress-container">
              <div className="current-time-display">
                <strong>Current Time:</strong> {formatTime(currentTime)}
              </div>
              <label>Time: </label>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${animationProgress * 100}%` }}
                />
              </div>
              <div className="progress-times">
                <span className="start-time">
                  {formatTime(passData.maxUTC)}
                </span>
                <span className="end-time">
                  {formatTime(passData.endUTC)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SatellitePass3D;