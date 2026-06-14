import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import '../landing.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    password: '',
    role: 'farmer',
    fpoId: ''
  });
  const [fpos, setFpos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch FPOs on mount to support signup selector
  useEffect(() => {
    const fetchFPOs = async () => {
      try {
        const data = await authService.getFPOs();
        setFpos(data);
        if (data.length > 0) {
          setForm(f => ({ ...f, fpoId: data[0].id }));
        }
      } catch (err) {
        console.error('Failed to fetch FPOs:', err);
      }
    };
    fetchFPOs();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Prepare register payload
    const payload = {
      phone: form.phone,
      password: form.password,
      full_name: form.fullName,
      role: form.role,
      fpo_id: ['farmer', 'fpo_manager', 'fpo_staff'].includes(form.role) && form.fpoId ? parseInt(form.fpoId) : null
    };

    try {
      await authService.register(payload);
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        // Redirect to specific portal login page
        const loginRoutes = {
          farmer: '/farmer-login',
          fpo_manager: '/fpo-login',
          fpo_staff: '/fpo-login',
          aggregator: '/aggregator-login',
          market_partner: '/market-login'
        };
        navigate(loginRoutes[form.role] || '/');
      }, 2000);
    } catch (err) {
      console.error('Registration failed:', err);
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Network error. Make sure the backend server is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  const showFpoDropdown = ['farmer', 'fpo_manager', 'fpo_staff'].includes(form.role);

  return (
    <div className="lp-login-page">
      <div className="lp-login-card" style={{ maxWidth: '480px' }}>
        <span className="lp-login-icon">🌾</span>
        <h1 className="lp-login-title">Create Account</h1>
        <p className="lp-login-sub">Join the secure Wakhar Warehouse Management System</p>

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

        {success && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '6px',
            color: '#10B981',
            padding: '10px 12px',
            fontSize: '13px',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            ✅ {success}
          </div>
        )}

        <form className="lp-login-form" onSubmit={handleSubmit}>
          <div>
            <label className="lp-login-label">Full Name</label>
            <input
              className="lp-login-input"
              type="text"
              placeholder="Enter your full name"
              value={form.fullName}
              onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="lp-login-label">Phone Number</label>
            <input
              className="lp-login-input"
              type="text"
              placeholder="e.g. +919876543210"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="lp-login-label">Password</label>
            <input
              className="lp-login-input"
              type="password"
              placeholder="Create a password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="lp-login-label">Role</label>
            <select
              className="lp-login-input"
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'white',
                padding: '12px',
                borderRadius: '8px',
                outline: 'none',
                cursor: 'pointer'
              }}
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
            >
              <option value="farmer" style={{ background: '#1e3020', color: 'white' }}>Farmer</option>
              <option value="fpo_manager" style={{ background: '#1e3020', color: 'white' }}>FPO Manager</option>
              <option value="fpo_staff" style={{ background: '#1e3020', color: 'white' }}>FPO Staff</option>
              <option value="aggregator" style={{ background: '#1e3020', color: 'white' }}>Aggregator</option>
              <option value="market_partner" style={{ background: '#1e3020', color: 'white' }}>Market Partner (Buyer)</option>
            </select>
          </div>

          {showFpoDropdown && (
            <div>
              <label className="lp-login-label">Select FPO / Warehouse</label>
              <select
                className="lp-login-input"
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  padding: '12px',
                  borderRadius: '8px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
                value={form.fpoId}
                onChange={e => setForm(f => ({ ...f, fpoId: e.target.value }))}
                required
              >
                {fpos.map(fpo => (
                  <option key={fpo.id} value={fpo.id} style={{ background: '#1e3020', color: 'white' }}>
                    {fpo.name} ({fpo.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button className="lp-login-submit" type="submit" disabled={loading}>
            {loading ? '🔄 Creating Account...' : 'Sign Up →'}
          </button>
        </form>

        <button className="lp-login-back" onClick={() => navigate('/')}>
          ← Back to Home
        </button>
      </div>
    </div>
  );
}
