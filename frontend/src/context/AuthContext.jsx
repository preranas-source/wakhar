import { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { setupInterceptors } from '../services/apiClient';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('wakhar_access_token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const logout = useCallback(() => {
    localStorage.removeItem('wakhar_access_token');
    localStorage.removeItem('role');
    setToken(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
    navigate('/');
  }, [navigate]);

  useEffect(() => {
    setupInterceptors(logout);
  }, [logout]);

  const verifyToken = useCallback(async () => {
    try {
      const user = await authService.getMe();
      setCurrentUser(user);
      setIsAuthenticated(true);
      
      const mappedRole = (user.role === 'fpo_manager' || user.role === 'fpo_staff') ? 'fpo' : user.role;
      localStorage.setItem('role', mappedRole);
      return user;
    } catch (err) {
      console.error('Session verification failed:', err);
      logout();
      return null;
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setLoading(false);
    }
  }, [token, verifyToken]);

  const login = async (phone, password) => {
    setLoading(true);
    try {
      const response = await authService.login({ phone, password });
      const { access_token, user } = response;
      localStorage.setItem('wakhar_access_token', access_token);
      setToken(access_token);
      setCurrentUser(user);
      setIsAuthenticated(true);

      const mappedRole = (user.role === 'fpo_manager' || user.role === 'fpo_staff') ? 'fpo' : user.role;
      localStorage.setItem('role', mappedRole);

      // Redirect based on role
      const redirectPaths = {
        admin: '/admin',
        fpo_manager: '/dashboard',
        fpo_staff: '/staff',
        aggregator: '/aggregator',
        market_partner: '/marketplace',
        farmer: '/farmer'
      };

      const targetPath = redirectPaths[user.role] || '/';
      navigate(targetPath);
      return user;
    } catch (err) {
      setIsAuthenticated(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      token,
      isAuthenticated,
      loading,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}
export default AuthContext;
