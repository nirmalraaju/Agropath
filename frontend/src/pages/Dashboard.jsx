import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCamera, FiMap, FiCloud, FiArrowRight, FiShield } from 'react-icons/fi';
import { getWeather, getDiseaseHistory, getCropHistory } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [weather, setWeather] = useState(null);
  const [diseaseCount, setDiseaseCount] = useState(0);
  const [cropCount, setCropCount] = useState(0);

  useEffect(() => {
    getWeather('Chennai').then(res => setWeather(res.data)).catch(() => { });
    getDiseaseHistory().then(res => setDiseaseCount(res.history?.length || 0)).catch(() => { });
    getCropHistory().then(res => setCropCount(res.history?.length || 0)).catch(() => { });
  }, []);

  return (
    <div className="page-container fade-in">
      {/* Welcome Banner */}
      <div className="card" style={{ padding: '2rem', background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)', color: '#fff', marginBottom: '2rem', borderRadius: '12px' }}>
        <h1 style={{ fontSize: '2.2rem', margin: '0 0 0.5rem 0' }}>AgroPath 🌱 Farm Decision Hub</h1>
        <p style={{ fontSize: '1.1rem', margin: '0 0 1.5rem 0', opacity: 0.9 }}>
          Precision agriculture powered by YOLO11 Computer Vision, Gemini Generative AI, and Microclimate Weather Intelligence.
        </p>
        <button
          className="btn"
          onClick={() => navigate('/disease-detection')}
          style={{ background: '#fff', color: '#1b5e20', fontWeight: 600, padding: '0.7rem 1.4rem', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <FiCamera /> Start Disease Leaf Scan <FiArrowRight />
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.2rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.2rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#666' }}><FiCamera /> Disease Scans</span>
          <h2 style={{ margin: '0.3rem 0', color: '#1b5e20' }}>{diseaseCount}</h2>
          <span style={{ fontSize: '0.8rem', color: '#888' }}>Total leaf diagnoses</span>
        </div>

        <div className="card" style={{ padding: '1.2rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#666' }}><FiMap /> Crop Plans</span>
          <h2 style={{ margin: '0.3rem 0', color: '#1b5e20' }}>{cropCount}</h2>
          <span style={{ fontSize: '0.8rem', color: '#888' }}>Land recommendations</span>
        </div>

        <div className="card" style={{ padding: '1.2rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#666' }}><FiCloud /> Coimbatore Climate</span>
          <h2 style={{ margin: '0.3rem 0', color: '#0277bd' }}>
            {weather ? `${Math.round(weather.temperature)}°C` : '24°C'}
          </h2>
          <span style={{ fontSize: '0.8rem', color: '#888' }}>Coimbatore • {weather?.condition || 'Live Telemetry'}</span>
        </div>

        <div className="card" style={{ padding: '1.2rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#666' }}><FiShield /> Spray Condition</span>
          <h2 style={{ margin: '0.3rem 0', color: weather?.advisory?.spraying?.status?.includes('Safe') ? '#2e7d32' : '#e65100', fontSize: '1.4rem' }}>
            {weather?.advisory?.spraying?.status || 'Safe to Spray'}
          </h2>
          <span style={{ fontSize: '0.8rem', color: '#888' }}>Optimal foliar window</span>
        </div>
      </div>

      {/* Feature Tiles */}
      <h3 style={{ marginBottom: '1rem' }}>Core Modules</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
        <div
          className="card"
          onClick={() => navigate('/disease-detection')}
          style={{ padding: '1.5rem', cursor: 'pointer', transition: 'transform 0.2s', borderTop: '4px solid #2e7d32' }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🌿</div>
          <h4 style={{ margin: '0 0 0.4rem 0' }}>YOLO11 Disease Detection</h4>
          <p style={{ fontSize: '0.9rem', color: '#666', lineHeight: 1.4 }}>
            Instantly detect foliar pathogens, leaf spots, and insect infestations with confidence percentages and treatment guides.
          </p>
        </div>

        <div
          className="card"
          onClick={() => navigate('/crop-recommendation')}
          style={{ padding: '1.5rem', cursor: 'pointer', transition: 'transform 0.2s', borderTop: '4px solid #f57c00' }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🌾</div>
          <h4 style={{ margin: '0 0 0.4rem 0' }}>Smart Crop Recommendation</h4>
          <p style={{ fontSize: '0.9rem', color: '#666', lineHeight: 1.4 }}>
            Calculate optimal crops tailored to soil texture, water availability, and budget with estimated yield & profit.
          </p>
        </div>

        <div
          className="card"
          onClick={() => navigate('/assistant')}
          style={{ padding: '1.5rem', cursor: 'pointer', transition: 'transform 0.2s', borderTop: '4px solid #0288d1' }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
          <h4 style={{ margin: '0 0 0.4rem 0' }}>Gemini AI Agronomist</h4>
          <p style={{ fontSize: '0.9rem', color: '#666', lineHeight: 1.4 }}>
            Ask questions on fertilizer timing, pest management, organic sprays, and market trends anytime.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
