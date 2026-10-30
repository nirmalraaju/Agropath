import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/api';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f6f8' }}>
      <div className="card fade-in" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.4rem' }}>🌱</div>
          <h2 style={{ margin: '0 0 0.4rem 0', color: '#1b5e20' }}>Create Farmer Account</h2>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>Join AgroPath for intelligent crop decisions</p>
        </div>

        {error && (
          <div className="alert error" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 500 }}>
              Full Name
            </label>
            <input 
              type="text" 
              name="full_name" 
              value={formData.full_name} 
              onChange={handleChange} 
              style={{ width: '100%', padding: '0.7rem', borderRadius: '6px', border: '1px solid #ccc' }} 
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 500 }}>
              Username
            </label>
            <input 
              type="text" 
              name="username" 
              value={formData.username} 
              onChange={handleChange} 
              required 
              style={{ width: '100%', padding: '0.7rem', borderRadius: '6px', border: '1px solid #ccc' }} 
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 500 }}>
              Email Address
            </label>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
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
              name="password" 
              value={formData.password} 
              onChange={handleChange} 
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
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: '#666' }}>
          Already have an account? <Link to="/login" style={{ color: '#2e7d32', fontWeight: 600 }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
