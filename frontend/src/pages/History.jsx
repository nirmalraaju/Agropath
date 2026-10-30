import { useState, useEffect, useCallback } from 'react';
import { FiClock, FiActivity, FiMap } from 'react-icons/fi';
import { getDiseaseHistory, getCropHistory } from '../services/api';

const History = () => {
  const [tab, setTab] = useState('disease');
  const [diseaseList, setDiseaseList] = useState([]);
  const [cropList, setCropList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const [dRes, cRes] = await Promise.all([
        getDiseaseHistory().catch(() => ({ history: [] })),
        getCropHistory().catch(() => ({ history: [] }))
      ]);
      setDiseaseList(dRes.history || []);
      setCropList(cRes.history || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1>Farm Diagnosis & Recommendation Archive</h1>
        <p className="text-muted">Review your past plant leaf scans, diagnosed pathogens, and historical crop planning recommendations.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #e0e0e0', marginBottom: '1.5rem' }}>
        <button 
          onClick={() => setTab('disease')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: tab === 'disease' ? '3px solid #2e7d32' : '3px solid transparent',
            padding: '0.6rem 1rem',
            fontWeight: 600,
            fontSize: '1rem',
            color: tab === 'disease' ? '#2e7d32' : '#666',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <FiActivity /> Disease Scans ({diseaseList.length})
        </button>
        <button 
          onClick={() => setTab('crop')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: tab === 'crop' ? '3px solid #2e7d32' : '3px solid transparent',
            padding: '0.6rem 1rem',
            fontWeight: 600,
            fontSize: '1rem',
            color: tab === 'crop' ? '#2e7d32' : '#666',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <FiMap /> Crop Planning ({cropList.length})
        </button>
      </div>

      {loading ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <span className="spinner"></span> Loading archive from local MongoDB...
        </div>
      ) : tab === 'disease' ? (
        diseaseList.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {diseaseList.map((item) => (
              <div key={item.id} className="card fade-in" style={{ padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.3rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#1b5e20' }}>{item.detected_class}</h4>
                    <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>
                      {(item.confidence * 100).toFixed(1)}% Confidence
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>
                    File: <strong>{item.filename}</strong> • Scanned on: {new Date(item.created_at).toLocaleString()}
                  </div>
                  {item.treatment_plan?.summary && (
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#444' }}>
                      {item.treatment_plan.summary}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>
            <FiActivity size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <h4>No Disease Scans Yet</h4>
            <p>Upload a leaf image in the Disease Detection page to see results recorded here.</p>
          </div>
        )
      ) : (
        cropList.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {cropList.map((item) => (
              <div key={item.id} className="card fade-in" style={{ padding: '1.2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.2rem 0', color: '#1b5e20' }}>{item.location}</h4>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>
                      {item.land_area} Acres • {item.soil_type} • Budget: ₹{item.budget?.toLocaleString()}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#888' }}><FiClock /> {new Date(item.created_at).toLocaleDateString()}</span>
                </div>

                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  {item.recommended_crops?.map((c, i) => (
                    <span key={i} style={{ background: '#f1f8e9', color: '#2e7d32', padding: '4px 10px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 500 }}>
                      🌾 {c.crop_name} ({c.suitability_score}% Match)
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>
            <FiMap size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <h4>No Crop Recommendations Yet</h4>
            <p>Generate your first recommendation in the Crop Rec tab to build your farming plan.</p>
          </div>
        )
      )}
    </div>
  );
};

export default History;
