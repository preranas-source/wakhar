import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, loading, isAuthenticated } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#FEFCF8',
        color: '#1C1A14',
        fontFamily: 'system-ui'
      }}>
        <div style={{ fontSize: '32px', marginBottom: '16px' }}>🌾</div>
        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>Wakhar WMS</div>
        <div style={{ fontSize: '14px', color: '#8A8070', marginTop: '8px' }}>Verifying permissions...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser?.role)) {
    return <Navigate to="/access-denied" replace />;
  }

  return children;
}
