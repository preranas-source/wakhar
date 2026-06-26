import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import '../landing.css';

export default function LoginPage({ role, icon, route }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ password: '' });
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const labels = {
    farmer: { idLabel: 'Farmer ID / Phone', idPlaceholder: 'e.g. 9876543210', heading: 'Farmer Portal', sub: 'Access your warehouse receipts, stock status, and more.' },
    fpo: { idLabel: 'FPO User Phone', idPlaceholder: 'e.g. 9876500001', heading: 'FPO Manager Portal', sub: 'Manage warehouse operations, intake, grading, and dispatch.' },
    aggregator: { idLabel: 'Aggregator Phone', idPlaceholder: 'e.g. 9876500003', heading: 'Aggregator Console', sub: 'Oversee multiple warehouses, transfers, and bulk dispatch.' },
    market: { idLabel: 'Market Partner Phone', idPlaceholder: 'e.g. 9876500004', heading: 'Market Partner Portal', sub: 'Browse stock, place orders, and track deliveries.' },
  }[role] || {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const cleanPhone = phoneNumber.trim().replace(/[^0-9]/g, '');
      const fullPhoneId = `${countryCode}${cleanPhone}`;
      await login(fullPhoneId, form.password);
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
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                value={countryCode}
                onChange={e => setCountryCode(e.target.value)}
                style={{
                  width: '110px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: 'white',
                  padding: '10px 8px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                <option value="+91" style={{ background: '#1c1a14', color: 'white' }}>+91 (IN)</option>
                <option value="+1" style={{ background: '#1c1a14', color: 'white' }}>+1 (US)</option>
                <option value="+44" style={{ background: '#1c1a14', color: 'white' }}>+44 (UK)</option>
                <option value="+971" style={{ background: '#1c1a14', color: 'white' }}>+971 (AE)</option>
              </select>
              <input
                className="lp-login-input"
                style={{ flex: 1, margin: 0 }}
                type="tel"
                placeholder={labels.idPlaceholder}
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                required
              />
            </div>
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
