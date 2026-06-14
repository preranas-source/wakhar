import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../landing.css';

export default function LoginPage({ role, icon, route }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ id: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const labels = {
    farmer: { idLabel: 'Farmer ID / Phone', idPlaceholder: 'e.g. +919876543210', heading: 'Farmer Portal', sub: 'Access your warehouse receipts, stock status, and more.' },
    fpo: { idLabel: 'FPO User Phone', idPlaceholder: 'e.g. +919876500001', heading: 'FPO Manager Portal', sub: 'Manage warehouse operations, intake, grading, and dispatch.' },
    aggregator: { idLabel: 'Aggregator Phone', idPlaceholder: 'e.g. +919876500003', heading: 'Aggregator Console', sub: 'Oversee multiple warehouses, transfers, and bulk dispatch.' },
    market: { idLabel: 'Market Partner Phone', idPlaceholder: 'e.g. +919876500004', heading: 'Market Partner Portal', sub: 'Browse stock, place orders, and track deliveries.' },
  }[role] || {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('http://localhost:8000/api/auth/login', {
        phone: form.id,
        password: form.password
      });
      
      const { access_token, user } = response.data;
      localStorage.setItem('wakhar_access_token', access_token);
      
      // Map roles fpo_manager/fpo_staff to fpo
      const mappedRole = (user.role === 'fpo_manager' || user.role === 'fpo_staff') ? 'fpo' : user.role;
      localStorage.setItem('role', mappedRole);
      
      const defaultTab = mappedRole === 'farmer' ? 'farmer' : 'dashboard';
      navigate(`/${mappedRole}/${defaultTab}`);
    } catch (err) {
      console.error('Login failed:', err);
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Network error. Make sure the backend server is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lp-login-page">
      <div className="lp-login-card">
        <span className="lp-login-icon">{icon}</span>
        <h1 className="lp-login-title">{labels.heading}</h1>
        <p className="lp-login-sub">{labels.sub}</p>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '6px',
            color: '#EF4444',
            padding: '10px 12px',
            fontSize: '13px',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            ❌ {error}
          </div>
        )}

        <form className="lp-login-form" onSubmit={handleSubmit}>
          <div>
            <label className="lp-login-label">{labels.idLabel}</label>
            <input
              className="lp-login-input"
              type="text"
              placeholder={labels.idPlaceholder}
              value={form.id}
              onChange={e => setForm(f => ({ ...f, id: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="lp-login-label">Password / PIN</label>
            <input
              className="lp-login-input"
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
          </div>
          <button className="lp-login-submit" type="submit" disabled={loading}>
            {loading ? '🔄 Signing in...' : `Continue as ${role.charAt(0).toUpperCase() + role.slice(1)} →`}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13.5px', color: 'rgba(255, 255, 255, 0.7)' }}>
          Don't have an account?{' '}
          <span
            style={{ color: '#10B981', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}
            onClick={() => navigate('/register')}
          >
            Register here
          </span>
        </div>

        <button className="lp-login-back" onClick={() => navigate('/')}>
          ← Back to Home
        </button>

        {/* Branding */}
        <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 20 }}>🌾</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: 'white' }}>WAKHAR</span>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Digital Agriculture Ecosystem</div>
        </div>
      </div>
    </div>
  );
}
