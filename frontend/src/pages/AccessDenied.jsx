import { useNavigate } from 'react-router-dom';

export default function AccessDenied() {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'radial-gradient(circle at 50% 50%, #FEFCF8 0%, #EDE9E0 100%)',
      color: '#1C1A14',
      fontFamily: 'var(--font-sans)',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--red-light)',
        border: '1px solid rgba(155, 35, 53, 0.2)',
        borderRadius: '50%',
        width: '100px',
        height: '100px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '48px',
        marginBottom: '24px',
        boxShadow: 'var(--shadow)'
      }}>
        🛡️
      </div>
      <h1 style={{
        fontFamily: 'var(--font-serif)',
        fontSize: '36px',
        fontWeight: 'bold',
        marginBottom: '12px',
        color: 'var(--red)'
      }}>
        Access Denied
      </h1>
      <p style={{
        fontSize: '16px',
        color: 'var(--text2)',
        maxWidth: '480px',
        marginBottom: '32px',
        lineHeight: '1.6'
      }}>
        You do not have the required permissions to view this portal page. If you believe this is an error, please contact your administrator.
      </p>
      <div style={{ display: 'flex', gap: '16px' }}>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-outline"
          style={{ background: '#fff', padding: '12px 24px', fontSize: '14px', cursor: 'pointer' }}
        >
          Go Back
        </button>
        <button
          onClick={() => navigate('/')}
          className="btn btn-primary"
          style={{ padding: '12px 24px', fontSize: '14px', cursor: 'pointer' }}
        >
          Return to Home
        </button>
      </div>
    </div>
  );
}
