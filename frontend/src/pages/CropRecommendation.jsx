import { useState } from 'react';
import { FiMapPin, FiTrendingUp, FiClock, FiDroplet, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { getCropRecommendations } from '../services/api';

const SOIL_OPTIONS = [
  "Red Sandy Loam",
  "Black Cotton Soil (Regur)",
  "Alluvial Soil",
  "Clay Loam",
  "Sandy Soil",
  "Laterite Soil"
];

const WATER_OPTIONS = [
  "Borewell with Drip Irrigation",
  "Canal Irrigation",
  "Open Well / Tube Well",
  "Rainfed (Monsoon Dependent)",
  "River / Tank Irrigation"
];

const CropRecommendation = () => {
  const [formData, setFormData] = useState({
    location: 'Coimbatore, Tamil Nadu',
    land_area: 2.0,
    soil_type: 'Red Sandy Loam',
    water_source: 'Borewell with Drip Irrigation',
    budget: 50000
  });

  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'land_area' || name === 'budget' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await getCropRecommendations(formData);
      setRecommendations(res.recommendations);
    } catch (err) {
      setError(err.message || 'Failed to fetch recommendations.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1>AI Crop Recommendation</h1>
        <p className="text-muted">Enter your farm details to get scientifically ranked crop options with expected yield, costs, and profit analysis.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Form Card */}
        <div className="card" style={{ padding: '1.5rem', height: 'fit-content' }}>
          <h3 style={{ marginBottom: '1.2rem' }}>Farm Parameters</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', fontWeight: 500 }}>
                Location / District
              </label>
              <input 
                type="text" 
                name="location" 
                value={formData.location} 
                onChange={handleChange} 
                required 
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', fontWeight: 500 }}>
                Land Area (Acres)
              </label>
              <input 
                type="number" 
                step="0.5" 
                min="0.5" 
                name="land_area" 
                value={formData.land_area} 
                onChange={handleChange} 
                required 
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', fontWeight: 500 }}>
                Soil Type
              </label>
              <select 
                name="soil_type" 
                value={formData.soil_type} 
                onChange={handleChange}
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #ccc' }}
              >
                {SOIL_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', fontWeight: 500 }}>
                Water Source
              </label>
              <select 
                name="water_source" 
                value={formData.water_source} 
                onChange={handleChange}
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #ccc' }}
              >
                {WATER_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', fontWeight: 500 }}>
                Available Budget (₹)
              </label>
              <input 
                type="number" 
                step="5000" 
                min="5000" 
                name="budget" 
                value={formData.budget} 
                onChange={handleChange} 
                required 
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={isLoading}
              style={{ width: '100%', padding: '0.8rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
            >
              {isLoading ? 'Analyzing Soil & Market Data...' : 'Get Crop Recommendations'}
            </button>
          </form>

          {error && (
            <div className="alert error" style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiAlertCircle /> {error}
            </div>
          )}
        </div>

        {/* Results View */}
        <div>
          {recommendations ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FiCheckCircle color="#2e7d32" /> Ranked Crops for Your Land
              </h3>
              {recommendations.map((crop, idx) => (
                <div key={idx} className="card fade-in" style={{ padding: '1.2rem', position: 'relative', borderLeft: '5px solid #2e7d32' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '1.2rem', color: '#1b5e20' }}>
                        {crop.crop_name}
                      </h4>
                      <span style={{ fontSize: '0.85rem', color: '#666', fontStyle: 'italic' }}>
                        Variety: {crop.variety || 'Recommended Hybrid'}
                      </span>
                    </div>
                    <span style={{
                      backgroundColor: '#e8f5e9',
                      color: '#2e7d32',
                      padding: '4px 10px',
                      borderRadius: '16px',
                      fontWeight: 600,
                      fontSize: '0.85rem'
                    }}>
                      {crop.suitability_score}% Match
                    </span>
                  </div>

                  <p style={{ margin: '0.8rem 0', fontSize: '0.9rem', color: '#444' }}>
                    {crop.key_benefits}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.8rem', background: '#f9f9f9', padding: '0.8rem', borderRadius: '8px', margin: '0.8rem 0' }}>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: '#666' }}>Duration</span>
                      <strong style={{ fontSize: '0.85rem' }}><FiClock size={12} /> {crop.duration_days}</strong>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: '#666' }}>Water Need</span>
                      <strong style={{ fontSize: '0.85rem' }}><FiDroplet size={12} /> {crop.water_requirement}</strong>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: '#666' }}>Est. Yield / Acre</span>
                      <strong style={{ fontSize: '0.85rem' }}>{crop.estimated_yield_per_acre}</strong>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: '#666' }}>Est. Net Profit</span>
                      <strong style={{ fontSize: '0.85rem', color: '#2e7d32' }}><FiTrendingUp size={12} /> ₹{crop.estimated_net_profit?.toLocaleString()}</strong>
                    </div>
                  </div>

                  {crop.cultivation_tips && (
                    <div style={{ fontSize: '0.85rem', color: '#555', background: '#f1f8e9', padding: '6px 10px', borderRadius: '6px' }}>
                      <strong>Agronomy Tip:</strong> {crop.cultivation_tips}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>
              <FiMapPin size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <h4>Ready to find the ideal crop</h4>
              <p>Fill out the farm parameters on the left and click recommend to generate AI-backed crop choices.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CropRecommendation;
