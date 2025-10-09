import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import './SatellitePass3D.css';



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


// Convert spherical coordinates (azimuth, elevation) to 3D Cartesian
const sphericalToCartesian = (azimuth, elevation, radius = 1.1) => {
  const phi = (90 - elevation) * (Math.PI / 180); // Convert elevation to phi
  const theta = (azimuth - 90) * (Math.PI / 180); // Convert azimuth to theta
  
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  
  return [x, y, z];
};



// Enhanced Earth component with realistic features
const Earth = ({ observerPosition }) => {
    return (
      <group>
        {/* Main Earth sphere with texture */}
        <Sphere args={[1, 64, 64]}>
          <meshPhongMaterial 
            color="#4A90E2" 
            shininess={100}
            specular="#ffffff"
          />
        </Sphere>
        
        {/* Observer position marker */}
        <mesh position={observerPosition}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshBasicMaterial color="#ff0000" />
        </mesh>
        
        {/* Simple grid lines for position reference */}
        <group>
          {/* Equator line */}
          <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
            <torusGeometry args={[1.01, 0.01, 8, 100]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
          </mesh>
          
          {/* Prime meridian */}
          <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.01, 0.01, 8, 100]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
          </mesh>
        </group>

        
        {/* Day/Night terminator - MOVED OUTSIDE GRID GROUP */}
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
// Satellite trajectory line
const SatellitePath = ({ pathPoints }) => {
    const points = useMemo(() => {
      // Validate pathPoints before processing
      if (!pathPoints || pathPoints.length === 0) {
        return [];
      }
      
      // Filter out invalid points and ensure they have 3 coordinates
      const validPoints = pathPoints.filter(point => 
        Array.isArray(point) && 
        point.length === 3 && 
        point.every(coord => typeof coord === 'number' && !isNaN(coord))
      );
      
      // Return empty array if no valid points
      if (validPoints.length === 0) {
        return [];
      }
      
      return validPoints.map(point => new THREE.Vector3(...point));
    }, [pathPoints]);
  
    // Don't render if no valid points
    if (points.length === 0) {
      return null;
    }
  
    return (
      <Line
        points={points}
        color="#ffff00"
        lineWidth={3}
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
  onAnimationComplete 
}) => {
  const [pathPoints, setPathPoints] = useState([]);
  const [satellitePosition, setSatellitePosition] = useState([0, 0, 0]);
  const [currentTime, setCurrentTime] = useState(0);

// Convert observer coordinates to 3D position on Earth
  const observerPosition = useMemo(() => {
    const lat = observerCoords.latitude * (Math.PI / 180);
    const lng = observerCoords.longitude * (Math.PI / 180);
    const radius = 1.01; // Slightly above Earth surface
    
    // More accurate spherical to Cartesian conversion
    return [
      radius * Math.cos(lat) * Math.cos(lng), //X cord
      radius * Math.sin(lat), //Y cord
      radius * Math.cos(lat) * Math.sin(lng) //Z cord
    ];
  }, [observerCoords]);
    
   

  // Generate satellite path points with Bezier curve
useEffect(() => {
    if (!passData) {
      setPathPoints([]);
      return;
    }
  
    const points = [];
    const startTime = passData.startUTC;
    const endTime = passData.endUTC;
    const duration = endTime - startTime;
    
    // Validate time data
    if (!startTime || !endTime || duration <= 0) {
      setPathPoints([]);
      return;
    }
    
    // Create control points for Bezier curve
    const startPoint = { az: passData.startAz, el: passData.startEl };
    const maxPoint = { az: passData.maxAz, el: passData.maxEl };
    const endPoint = { az: passData.endAz, el: passData.endEl };
    
    // Generate points along the trajectory
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      
      try {
        // Quadratic Bezier interpolation
        const azimuth = Math.pow(1-t, 2) * startPoint.az + 
                       2 * (1-t) * t * maxPoint.az + 
                       Math.pow(t, 2) * endPoint.az;
        
        const elevation = Math.pow(1-t, 2) * startPoint.el + 
                         2 * (1-t) * t * maxPoint.el + 
                         Math.pow(t, 2) * endPoint.el;
        
        // Validate coordinates
        if (typeof azimuth === 'number' && typeof elevation === 'number' && 
            !isNaN(azimuth) && !isNaN(elevation) &&
            elevation >= 0 && elevation <= 90) {
          
          const point = sphericalToCartesian(azimuth, elevation);
          points.push(point);
        }
      } catch (error) {
        console.warn('Error generating path point:', error);
      }
    }
    
    setPathPoints(points);
  }, [passData]);
    

  // Update satellite position during animation
  useEffect(() => {
    if (!passData || pathPoints.length === 0) return;

    const pointIndex = Math.floor(animationProgress * (pathPoints.length - 1));
    const clampedIndex = Math.min(pointIndex, pathPoints.length - 1);
    
    setSatellitePosition(pathPoints[clampedIndex]);
    
    // Calculate current time
    const startTime = passData.startUTC;
    const endTime = passData.endUTC;
    const duration = endTime - startTime;
    const currentTime = startTime + (duration * animationProgress);
    setCurrentTime(currentTime);
    
    // Check if animation is complete
    if (animationProgress >= 1 && onAnimationComplete) {
      onAnimationComplete();
    }
  }, [animationProgress, pathPoints, passData, onAnimationComplete]);

  // In your Scene3D component, update the return statement (around line 222):
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      
      <Earth observerPosition={observerPosition} />
      <SatellitePath pathPoints={pathPoints} />
      <Satellite position={satellitePosition} isAnimating={isAnimating} />

        {/* Add OrbitControls for manual rotation */}
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


// Main component
const SatellitePass3D = ({ passData, observerCoords, onClose }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const animationRef = useRef();

  const startAnimation = () => {
    setIsAnimating(true);
    setIsPlaying(true);
    setAnimationProgress(0);
    
    const startTime = Date.now();
    const duration = 10000; // 10 seconds animation
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
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

  const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleTimeString();
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
              <label>Animation Progress:</label>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${animationProgress * 100}%` }}
                />
              </div>
              <span className="progress-text">
                {Math.round(animationProgress * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SatellitePass3D;