import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, guestLogin } from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    try {
      await guestLogin();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Guest access failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f6f8' }}>
      <div className="card fade-in" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.4rem' }}>🌱</div>
          <h2 style={{ margin: '0 0 0.4rem 0', color: '#1b5e20' }}>AgroPath Sign In</h2>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>Access your agricultural management dashboard</p>
        </div>

        {error && (
          <div className="alert error" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 500 }}>
              Email Address
            </label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              style={{ width: '100%', padding: '0.7rem', borderRadius: '6px', border: '1px solid #ccc' }} 
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 500 }}>
              Password
            </label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              style={{ width: '100%', padding: '0.7rem', borderRadius: '6px', border: '1px solid #ccc' }} 
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{ width: '100%', padding: '0.8rem', fontSize: '0.95rem' }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div style={{ margin: '1.2rem 0', textAlign: 'center', position: 'relative' }}>
          <span style={{ background: '#fff', padding: '0 10px', color: '#888', fontSize: '0.85rem' }}>or</span>
        </div>

        <button 
          onClick={handleGuest}
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: '#e8f5e9',
            border: '1px solid #a5d6a7',
            color: '#1b5e20',
            fontWeight: 600,
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          🚀 Instant Demo / Continue as Guest Farmer
        </button>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: '#666' }}>
          Don't have an account? <Link to="/register" style={{ color: '#2e7d32', fontWeight: 600 }}>Register here</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
