import { useState, useRef } from 'react';
import { FiUploadCloud, FiImage, FiAlertCircle, FiCheckCircle, FiShield, FiActivity, FiAlertTriangle, FiHelpCircle, FiBarChart2 } from 'react-icons/fi';
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

  const treatment = results?.treatment_plan;
  const uq = results?.uncertainty_analysis;

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1>Uncertainty-Aware Plant Disease Diagnosis</h1>
        <p className="text-muted">
          YOLO11 foliar pathology diagnosis augmented with Epistemic Uncertainty Quantification, Differential Diagnosis, and Actionable Agronomic Recovery Plans.
        </p>
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
                <span className="spinner"></span> Analyzing Leaf with YOLO & AI...
              </>
            ) : (
              "Analyze Leaf"
            )}
          </button>
          
          {error && (
            <div className="alert error" style={{ marginTop: '1rem' }}>
              <FiAlertCircle /> {error}
            </div>
          )}
        </div>

        <div className="results-section">
          {results ? (
            <div className="card results-card fade-in">
              <h3>Diagnosis & Agronomic Treatment Plan</h3>
              
              {results.status === 'inappropriate_image' || results.is_leaf === false ? (
                <div className="inappropriate-alert-box fade-in">
                  <div className="inappropriate-icon">⚠️</div>
                  <h4 className="inappropriate-title">Inappropriate Image Detected</h4>
                  <div className="alert alert-warning mb-3">
                    <FiAlertCircle size={20} />
                    <span>{results.message || "The uploaded image does not appear to be a crop leaf."}</span>
                  </div>
                  {results.reason && (
                    <p className="inappropriate-reason">
                      <strong>Detection Reason:</strong> {results.reason}
                    </p>
                  )}
                  <div className="guidance-box">
                    <strong>Misinformation Prevention:</strong>
                    <p>To ensure diagnostic accuracy, our model only analyzes verified crop leaves. Please upload a clear, focused photo of a plant leaf.</p>
                  </div>
                </div>
              ) : results.predictions && results.predictions.length > 0 ? (
                <div className="predictions-list">
                  {/* Primary Diagnosis Label */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Primary Detected Condition (Top-1)
                    </span>
                    {uq && (
                      <span style={{
                        fontSize: '0.78rem',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontWeight: 600,
                        backgroundColor: uq.defer_to_expert ? '#fff3cd' : '#dcfce7',
                        color: uq.defer_to_expert ? '#854d0e' : '#166534',
                        border: `1px solid ${uq.defer_to_expert ? '#fde047' : '#86efac'}`
                      }}>
                        {uq.defer_to_expert ? '⚠️ Low Confidence / Ambiguous' : '✓ Statistically Certain'}
                      </span>
                    )}
                  </div>

                  {results.predictions.slice(0, 1).map((pred, idx) => (
                    <div key={idx} className="prediction-item" style={{ borderLeft: '4px solid var(--primary)' }}>
                      <div className="prediction-header">
                        <span className="disease-name" style={{ fontSize: '1.25rem', color: '#14532d', fontWeight: 700 }}>
                          {pred.class}
                        </span>
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
                        <p className="detection-coords" style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.3rem' }}>
                          Bounding Box Coordinates: [{pred.box.map(b => b.toFixed(0)).join(', ')}]
                        </p>
                      )}
                    </div>
                  ))}

                  {/* Uncertainty Quantification & Deferral Section */}
                  {uq && (
                    <div className="uq-panel" style={{ marginTop: '1.5rem', borderTop: '1px solid #e0e0e0', paddingTop: '1.2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1a365d' }}>
                          <FiBarChart2 color="#2b6cb0" /> Uncertainty Quantification & Model Calibration
                        </h4>
                        <span className={`uq-grade-pill ${uq.reliability_grade?.toLowerCase()}`}>
                          {uq.reliability_grade?.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {/* Deferral Alert if Uncertainty Exceeds Safety Threshold */}
                      {uq.defer_to_expert ? (
                        <div className="uq-defer-box warning" style={{
                          background: '#fffbeb',
                          border: '1px solid #fef08a',
                          borderLeft: '4px solid #ca8a04',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          marginBottom: '1rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                            <FiAlertTriangle size={22} color="#ca8a04" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <div>
                              <strong style={{ color: '#854d0e', display: 'block', fontSize: '0.95rem' }}>
                                Selective Classification Alert: Defer to Agronomic Expert
                              </strong>
                              <p style={{ margin: '4px 0 6px 0', fontSize: '0.85rem', color: '#713f12' }}>
                                <strong>Abstention Reason:</strong> {uq.abstention_reason}
                              </p>
                              <p style={{ margin: 0, fontSize: '0.83rem', color: '#78350f', fontStyle: 'italic' }}>
                                💡 {uq.clinical_guidance}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="uq-defer-box safe" style={{
                          background: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          borderLeft: '4px solid #16a34a',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          marginBottom: '1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}>
                          <FiCheckCircle size={20} color="#16a34a" />
                          <span style={{ fontSize: '0.88rem', color: '#166534', fontWeight: 500 }}>
                            High Decision Margin & Low Entropy. Diagnostic confidence is sufficient for automated protocol deployment.
                          </span>
                        </div>
                      )}

                      {/* UQ Metrics Grid */}
                      <div className="uq-metrics-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                        gap: '0.75rem',
                        marginBottom: '1.2rem'
                      }}>
                        <div className="uq-metric-card" style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', textTransform: 'uppercase' }}>Shannon Entropy H(p)</span>
                          <strong style={{ fontSize: '1.15rem', color: '#1e293b' }}>{uq.entropy?.toFixed(3)} bits</strong>
                        </div>
                        <div className="uq-metric-card" style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', textTransform: 'uppercase' }}>Norm. Uncertainty</span>
                          <strong style={{ fontSize: '1.15rem', color: uq.normalized_entropy > 0.45 ? '#e11d48' : '#059669' }}>
                            {(uq.normalized_entropy * 100)?.toFixed(1)}%
                          </strong>
                        </div>
                        <div className="uq-metric-card" style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', textTransform: 'uppercase' }}>Decision Margin Δ</span>
                          <strong style={{ fontSize: '1.15rem', color: '#2563eb' }}>
                            {(uq.margin_gap * 100)?.toFixed(1)}%
                          </strong>
                        </div>
                      </div>

                      {/* Differential Diagnosis Distribution (Top Candidates) */}
                      {uq.differential_diagnosis && uq.differential_diagnosis.length > 0 && (
                        <div className="differential-diagnosis-container" style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '14px 16px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <strong style={{ fontSize: '0.9rem', color: '#1e293b' }}>
                              Differential Diagnosis Spectrum (Competing Possibilities)
                            </strong>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Post-Softmax Analysis</span>
                          </div>
                          <p style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4 }}>
                            💡 <em>Note: Your leaf only has one active infection. When symptoms are subtle, the AI lists these competing candidate diseases to prevent misdiagnosis.</em>
                          </p>

                          <div className="diff-items" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {uq.differential_diagnosis.map((diff, dIdx) => (
                              <div key={dIdx} style={{ fontSize: '0.82rem', background: '#ffffff', padding: '8px 10px', borderRadius: '6px', border: '1px solid #edf2f7' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'center' }}>
                                  <span style={{ fontWeight: dIdx === 0 ? 700 : 500, color: dIdx === 0 ? '#15803d' : '#334155' }}>
                                    #{diff.rank || dIdx + 1} {diff.class_name}
                                    {dIdx === 0 ? (
                                      <span style={{ marginLeft: '6px', fontSize: '0.7rem', padding: '1px 6px', background: '#dcfce7', color: '#15803d', borderRadius: '4px' }}>
                                        Primary Match
                                      </span>
                                    ) : (
                                      <span style={{ marginLeft: '6px', fontSize: '0.7rem', padding: '1px 6px', background: '#f1f5f9', color: '#64748b', borderRadius: '4px' }}>
                                        Alternative Candidate
                                      </span>
                                    )}
                                  </span>
                                  <span style={{ fontWeight: 700, color: dIdx === 0 ? '#15803d' : '#64748b' }}>
                                    {diff.percentage || `${(diff.probability * 100).toFixed(1)}%`}
                                  </span>
                                </div>
                                <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div style={{
                                    height: '100%',
                                    width: `${diff.probability * 100}%`,
                                    background: dIdx === 0 ? '#16a34a' : dIdx === 1 ? '#3b82f6' : '#94a3b8',
                                    borderRadius: '3px'
                                  }}></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI Treatment Section */}
                  {treatment && (
                    <div className="treatment-details" style={{ marginTop: '1.5rem', borderTop: '1px solid #e0e0e0', paddingTop: '1.2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.6rem' }}>
                        <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FiShield color="#2e7d32" /> Actionable Agronomic Plan
                        </h4>
                        {treatment.severity_level && (
                          <span style={{
                            padding: '6px 14px',
                            borderRadius: '16px',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            letterSpacing: '0.3px',
                            border: `1px solid ${
                              treatment.severity_level.includes('High') ? '#ef9a9a' :
                              treatment.severity_level.includes('Moderate') ? '#ffcc80' :
                              treatment.severity_level.includes('Low') ? '#81d4fa' : '#a5d6a7'
                            }`,
                            backgroundColor:
                              treatment.severity_level.includes('High') ? '#ffebee' :
                              treatment.severity_level.includes('Moderate') ? '#fff3e0' :
                              treatment.severity_level.includes('Low') ? '#e1f5fe' : '#e8f5e9',
                            color:
                              treatment.severity_level.includes('High') ? '#c62828' :
                              treatment.severity_level.includes('Moderate') ? '#e65100' :
                              treatment.severity_level.includes('Low') ? '#0277bd' : '#1b5e20'
                          }}>
                            {treatment.severity_level} Severity ({treatment.confidence_score || (results.predictions[0]?.confidence * 100).toFixed(1)}% Match Score)
                          </span>
                        )}
                      </div>

                      {treatment.summary && (
                        <p style={{ fontSize: '0.95rem', color: '#444', lineHeight: 1.5, marginBottom: '1rem' }}>
                          {treatment.summary}
                        </p>
                      )}

                      {/* Immediate Actions */}
                      {treatment.immediate_actions && treatment.immediate_actions.length > 0 && (
                        <div style={{ marginBottom: '1.2rem' }}>
                          <h5 style={{ margin: '0 0 0.5rem 0', color: '#1b5e20', fontSize: '0.9rem' }}>⚡ Immediate Actions:</h5>
                          <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.9rem', color: '#333' }}>
                            {treatment.immediate_actions.map((act, i) => (
                              <li key={i} style={{ marginBottom: '0.3rem' }}>{act}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Organic Remedies */}
                      {treatment.organic_remedies && treatment.organic_remedies.length > 0 && (
                        <div style={{ marginBottom: '1.2rem' }}>
                          <h5 style={{ margin: '0 0 0.5rem 0', color: '#2e7d32', fontSize: '0.9rem' }}>🌿 Organic & Bio Remedies:</h5>
                          {treatment.organic_remedies.map((org, i) => (
                            <div key={i} style={{ background: '#f1f8e9', padding: '8px 12px', borderRadius: '6px', marginBottom: '6px', fontSize: '0.85rem' }}>
                              <strong>{org.name}</strong> — <span>{org.dosage}</span>
                              <div style={{ color: '#555', marginTop: '2px' }}>{org.instructions}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Chemical Treatments */}
                      {treatment.chemical_treatments && treatment.chemical_treatments.length > 0 && (
                        <div style={{ marginBottom: '1.2rem' }}>
                          <h5 style={{ margin: '0 0 0.5rem 0', color: '#d84315', fontSize: '0.9rem' }}>🧪 Chemical Fungicides / Insecticides:</h5>
                          {treatment.chemical_treatments.map((chem, i) => (
                            <div key={i} style={{ background: '#fbe9e7', padding: '8px 12px', borderRadius: '6px', marginBottom: '6px', fontSize: '0.85rem' }}>
                              <strong>{chem.name}</strong> — <span>{chem.dosage}</span>
                              {chem.safety_interval_days && (
                                <span style={{ marginLeft: '8px', color: '#bf360c', fontSize: '0.78rem' }}>
                                  (Wait {chem.safety_interval_days} days before harvest)
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Prognosis */}
                      {treatment.prognosis && (
                        <div style={{ background: '#e8f5e9', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', color: '#1b5e20' }}>
                          <FiActivity style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                          <strong>Prognosis:</strong> {treatment.prognosis}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="alert success mt-4" style={{ marginTop: '1rem' }}>
                    <FiCheckCircle /> Scan saved to local database. Ask our AI Assistant for follow-up questions!
                  </div>
                </div>
              ) : (
                <div className="no-disease-found">
                  <FiCheckCircle size={48} className="text-success mb-2" />
                  <h4>No Diseases Detected</h4>
                  <p className="text-muted">The leaf appears healthy based on current visual assessment.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="card empty-results-card">
              <div className="empty-state">
                <FiImage size={48} className="text-muted mb-3" />
                <h4>No Results Yet</h4>
                <p className="text-muted">Upload an image and click analyze to see YOLO predictions and AI recovery plan here.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiseaseDetection;
