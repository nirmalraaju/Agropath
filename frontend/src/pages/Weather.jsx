import { useState, useEffect, useCallback } from 'react';
import { FiCloud, FiWind, FiDroplet, FiAlertTriangle, FiCheckCircle, FiRefreshCw, FiMapPin, FiActivity, FiCompass, FiSun } from 'react-icons/fi';
import { getWeather, getForecast } from '../services/api';

const Weather = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date().toLocaleTimeString());

  const fetchCoimbatoreWeather = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [curr, fc] = await Promise.all([
        getWeather('Coimbatore'),
        getForecast('Coimbatore')
      ]);
      setWeatherData(curr.data);
      setForecastData(fc.data);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err.message || 'Failed to fetch live Coimbatore weather data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoimbatoreWeather();
  }, [fetchCoimbatoreWeather]);

  const advisory = weatherData?.advisory;

  return (
    <div className="page-container fade-in">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1b5e20', fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.2rem' }}>
            <FiMapPin /> Coimbatore Agro-Climatic Station • Western Zone (11.0168°N, 76.9558°E)
          </div>
          <h1 style={{ margin: '0 0 0.2rem 0' }}>Coimbatore Precision Weather & Farm Advisory</h1>
          <p className="text-muted" style={{ margin: 0 }}>
            Live microclimate telemetry, foliar spray drift analytics, and FAO-56 crop evapotranspiration.
          </p>
        </div>

        <button 
          onClick={fetchCoimbatoreWeather} 
          disabled={loading}
          className="btn" 
          style={{ background: '#e8f5e9', border: '1px solid #a5d6a7', color: '#1b5e20', fontWeight: 600, padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <FiRefreshCw className={loading ? 'spinner' : ''} /> Refresh Live Telemetry
        </button>
      </div>

      {loading && !weatherData ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <span className="spinner"></span> Connecting to Coimbatore Agro-Meteorological Station...
        </div>
      ) : error ? (
        <div className="alert error">{error}</div>
      ) : weatherData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Main Coimbatore Hero Weather Banner */}
          <div className="card" style={{ padding: '2rem', background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)', color: '#fff', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9 }}>
                  {weatherData.zone || 'Western Agro-Climatic Zone of Tamil Nadu'}
                </span>
                <h2 style={{ fontSize: '2.5rem', margin: '0.3rem 0', fontWeight: 700 }}>Coimbatore</h2>
                <p style={{ margin: 0, fontSize: '1.2rem', opacity: 0.95, textTransform: 'capitalize' }}>
                  {weatherData.condition}
                </p>
                <span style={{ display: 'block', fontSize: '0.8rem', opacity: 0.8, marginTop: '0.5rem' }}>
                  Station: {weatherData.source} • Telemetry updated at {lastRefreshed}
                </span>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '3.6rem', fontWeight: 800, lineHeight: 1 }}>
                  {weatherData.temperature}°C
                </div>
                <span style={{ opacity: 0.9, fontSize: '0.95rem', display: 'block', marginTop: '0.3rem' }}>
                  Feels like {weatherData.feels_like}°C
                </span>
              </div>
            </div>

            {/* Precision Agro-Meteo Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
              <div>
                <span style={{ opacity: 0.8, fontSize: '0.8rem' }}><FiDroplet /> Relative Humidity</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{weatherData.humidity}%</div>
              </div>

              <div>
                <span style={{ opacity: 0.8, fontSize: '0.8rem' }}><FiWind /> Wind Velocity</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{weatherData.wind_speed_kmh} km/h</div>
              </div>

              <div>
                <span style={{ opacity: 0.8, fontSize: '0.8rem' }}><FiCompass /> Wind Direction</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{weatherData.wind_direction || 'SW'}</div>
              </div>

              <div>
                <span style={{ opacity: 0.8, fontSize: '0.8rem' }}><FiActivity /> Crop ET₀ (Water Loss)</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{weatherData.fao_evapotranspiration_mm || 4.2} mm/day</div>
              </div>

              <div>
                <span style={{ opacity: 0.8, fontSize: '0.8rem' }}><FiSun /> UV Index</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{weatherData.uv_index || 7.0} (High)</div>
              </div>
            </div>
          </div>

          {/* 3 Specialized Agricultural Advisories */}
          {advisory && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.2rem' }}>
              {/* Spraying Advisory */}
              <div className="card" style={{ padding: '1.4rem', borderTop: `5px solid ${advisory.spraying?.status?.includes('Safe') ? '#2e7d32' : '#c62828'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                  {advisory.spraying?.status?.includes('Safe') ? <FiCheckCircle color="#2e7d32" size={20} /> : <FiAlertTriangle color="#c62828" size={20} />}
                  <h4 style={{ margin: 0, fontSize: '1.05rem' }}>Foliar Spraying Viability</h4>
                </div>
                <div style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  backgroundColor: advisory.spraying?.status?.includes('Safe') ? '#e8f5e9' : '#ffebee',
                  color: advisory.spraying?.status?.includes('Safe') ? '#2e7d32' : '#c62828',
                  marginBottom: '0.8rem'
                }}>
                  {advisory.spraying?.status}
                </div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#444', lineHeight: 1.5 }}>
                  {advisory.spraying?.reason}
                </p>
              </div>

              {/* Irrigation Advisory */}
              <div className="card" style={{ padding: '1.4rem', borderTop: '5px solid #0288d1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                  <FiDroplet color="#0288d1" size={20} />
                  <h4 style={{ margin: 0, fontSize: '1.05rem' }}>FAO-56 Irrigation Schedule</h4>
                </div>
                <div style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  backgroundColor: '#e1f5fe',
                  color: '#0277bd',
                  marginBottom: '0.8rem'
                }}>
                  {advisory.irrigation?.status}
                </div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#444', lineHeight: 1.5 }}>
                  {advisory.irrigation?.reason}
                </p>
              </div>

              {/* Fungal Disease Risk */}
              <div className="card" style={{ padding: '1.4rem', borderTop: '5px solid #ef6c00' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                  <FiAlertTriangle color="#ef6c00" size={20} />
                  <h4 style={{ margin: 0, fontSize: '1.05rem' }}>Fungal Inoculum Risk</h4>
                </div>
                <div style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  backgroundColor: '#fff3e0',
                  color: '#e65100',
                  marginBottom: '0.8rem'
                }}>
                  {advisory.disease_risk?.level}
                </div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#444', lineHeight: 1.5 }}>
                  {advisory.disease_risk?.details}
                </p>
              </div>
            </div>
          )}

          {/* High-Resolution Hourly Forecast for Coimbatore */}
          {forecastData?.forecast && (
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiCloud /> Coimbatore 36-Hour Precision Microclimate Forecast
                </h3>
                <span style={{ fontSize: '0.85rem', color: '#666' }}>3-Hour Sampling Intervals</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${forecastData.forecast.length}, 1fr)`, gap: '0.8rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {forecastData.forecast.map((fc, i) => (
                  <div key={i} style={{ textAlign: 'center', padding: '1rem 0.6rem', background: '#f8f9fa', borderRadius: '10px', minWidth: '120px', border: '1px solid #eee' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#555', marginBottom: '0.4rem' }}>{fc.datetime}</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1b5e20', margin: '0.2rem 0' }}>{fc.temperature}°C</div>
                    <div style={{ fontSize: '0.75rem', color: '#666', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {fc.condition}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#0288d1', marginTop: '0.4rem', fontWeight: 500 }}>
                      <FiDroplet size={11} /> {fc.rain_prob}% Rain
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#777', marginTop: '0.2rem' }}>
                      <FiWind size={10} /> {fc.wind_speed} km/h
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Weather;
