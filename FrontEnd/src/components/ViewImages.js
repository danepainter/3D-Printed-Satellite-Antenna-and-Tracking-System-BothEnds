import React, { useState } from 'react';
import { Image, Download, Eye, Calendar, Satellite } from 'lucide-react';
import './ViewImages.css';

const ViewImages = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [filter, setFilter] = useState('all');

  // Sample image data - replace with your actual image data
  const images = [
    {
      id: 1,
      name: 'ISS_Pass_001.jpg',
      date: '2024-01-15',
      time: '14:30:25',
      satellite: 'ISS',
      size: '2.4 MB',
      resolution: '1920x1080',
      url: '/api/images/iss_pass_001.jpg'
    },
    {
      id: 2,
      name: 'NOAA_18_Image_002.jpg',
      date: '2024-01-15',
      time: '16:45:12',
      satellite: 'NOAA-18',
      size: '3.1 MB',
      resolution: '2048x1536',
      url: '/api/images/noaa_18_002.jpg'
    },
    {
      id: 3,
      name: 'METEOR_M2_003.jpg',
      date: '2024-01-14',
      time: '09:22:45',
      satellite: 'METEOR-M2',
      size: '1.8 MB',
      resolution: '1600x1200',
      url: '/api/images/meteor_m2_003.jpg'
    },
    {
      id: 4,
      name: 'ISS_Pass_004.jpg',
      date: '2024-01-14',
      time: '11:15:30',
      satellite: 'ISS',
      size: '2.7 MB',
      resolution: '1920x1080',
      url: '/api/images/iss_pass_004.jpg'
    }
  ];

  const filteredImages = filter === 'all' 
    ? images 
    : images.filter(img => img.satellite.toLowerCase().includes(filter.toLowerCase()));

  const handleImageClick = (image) => {
    setSelectedImage(image);
  };

  const handleDownload = (image) => {
    // Implement download functionality
    //Images from SatDump or similar can be downloaded here
    console.log('Downloading:', image.name);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  return (
    <div className="view-images">
      <div className="images-header">
        <h2>Satellite Images</h2>
        <p>View and manage captured satellite images</p>
      </div>

      <div className="images-controls">
        <div className="filter-section">
          <label htmlFor="filter">Filter by satellite:</label>
          <select 
            id="filter" 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Images</option>
            <option value="iss">ISS</option>
            <option value="noaa">NOAA</option>
            <option value="meteor">METEOR</option>
          </select>
        </div>
        
        <div className="stats">
          <div className="stat-item">
            <Image className="stat-icon" />
            <span>{filteredImages.length} Images</span>
          </div>
        </div>
      </div>

      <div className="images-grid">
        {filteredImages.map(image => (
          <div key={image.id} className="image-card" onClick={() => handleImageClick(image)}>
            <div className="image-preview">
              <div className="image-placeholder">
                <Image className="placeholder-icon" />
              </div>
              <div className="image-overlay">
                <Eye className="overlay-icon" />
              </div>
            </div>
            
            <div className="image-info">
              <h4>{image.name}</h4>
              <div className="image-details">
                <div className="detail-row">
                  <Satellite className="detail-icon" />
                  <span>{image.satellite}</span>
                </div>
                <div className="detail-row">
                  <Calendar className="detail-icon" />
                  <span>{image.date} {image.time}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Size:</span>
                  <span>{image.size}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Resolution:</span>
                  <span>{image.resolution}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedImage && (
        <div className="image-modal" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedImage.name}</h3>
              <button className="close-btn" onClick={handleCloseModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="modal-image">
                <div className="image-placeholder-large">
                  <Image className="placeholder-icon-large" />
                  <p>Image Preview</p>
                </div>
              </div>
              
              <div className="modal-info">
                <div className="info-section">
                  <h4>Image Details</h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <Satellite className="info-icon" />
                      <span className="info-label">Satellite:</span>
                      <span className="info-value">{selectedImage.satellite}</span>
                    </div>
                    <div className="info-item">
                      <Calendar className="info-icon" />
                      <span className="info-label">Date:</span>
                      <span className="info-value">{selectedImage.date}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Time:</span>
                      <span className="info-value">{selectedImage.time}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Size:</span>
                      <span className="info-value">{selectedImage.size}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Resolution:</span>
                      <span className="info-value">{selectedImage.resolution}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="download-btn"
                onClick={() => handleDownload(selectedImage)}
              >
                <Download className="btn-icon" />
                Download Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewImages;
