import { useState, useRef } from 'react';
import { FiUploadCloud, FiImage, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { detectDisease } from '../services/api';
import './DiseaseDetection.css';

const DiseaseDetection = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResults(null);
      setError(null);
    } else {
      setError("Please select a valid image file.");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResults(null);
      setError(null);
    } else {
      setError("Please drop a valid image file.");
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const data = await detectDisease(selectedFile);
      setResults(data);
    } catch (err) {
      setError(err.message || "Failed to analyze the image. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1>Disease Detection</h1>
        <p className="text-muted">Upload a clear photo of the affected crop leaf to instantly identify diseases.</p>
      </div>

      <div className="detection-grid">
        <div className="upload-section">
          <div 
            className={`upload-dropzone card ${previewUrl ? 'has-image' : ''}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              hidden 
            />
            
            {previewUrl ? (
              <div className="image-preview-container">
                <img src={previewUrl} alt="Crop preview" className="image-preview" />
                <div className="preview-overlay">
                  <FiImage size={24} />
                  <span>Click or drag to change image</span>
                </div>
              </div>
            ) : (
              <div className="dropzone-content">
                <FiUploadCloud className="upload-icon" />
                <h3>Upload Crop Image</h3>
                <p>Drag and drop or click to browse</p>
                <span className="upload-hint">Supports JPG, PNG (Max 5MB)</span>
              </div>
            )}
          </div>

          <button 
            className="btn btn-primary analyze-btn" 
            onClick={handleAnalyze}
            disabled={!selectedFile || isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <span className="spinner"></span> Analyzing Image...
              </>
            ) : (
              "Analyze Crop"
            )}
          </button>
          
          {error && (
            <div className="alert error">
              <FiAlertCircle /> {error}
            </div>
          )}
        </div>

        <div className="results-section">
          {results ? (
            <div className="card results-card fade-in">
              <h3>Analysis Results</h3>
              
              {results.predictions && results.predictions.length > 0 ? (
                <div className="predictions-list">
                  {results.predictions.map((pred, idx) => (
                    <div key={idx} className="prediction-item">
                      <div className="prediction-header">
                        <span className="disease-name">{pred.class}</span>
                        <span className="confidence-badge">
                          {(pred.confidence * 100).toFixed(1)}% Match
                        </span>
                      </div>
                      
                      <div className="confidence-bar-bg">
                        <div 
                          className="confidence-bar-fill" 
                          style={{ width: `${pred.confidence * 100}%` }}
                        ></div>
                      </div>
                      
                      {pred.box && (
                        <p className="detection-coords">
                          Bounding Box: [{pred.box.map(b => b.toFixed(0)).join(', ')}]
                        </p>
                      )}
                    </div>
                  ))}
                  
                  <div className="alert success mt-4">
                    <FiCheckCircle /> Scan complete. Review recommended treatments in the assistant tab.
                  </div>
                </div>
              ) : (
                <div className="no-disease-found">
                  <FiCheckCircle size={48} className="text-success mb-2" />
                  <h4>No Diseases Detected</h4>
                  <p className="text-muted">The crop appears to be healthy based on the provided image.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="card empty-results-card">
              <div className="empty-state">
                <FiImage size={48} className="text-muted mb-3" />
                <h4>No Results Yet</h4>
                <p className="text-muted">Upload an image and click analyze to see the detection results here.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiseaseDetection;
