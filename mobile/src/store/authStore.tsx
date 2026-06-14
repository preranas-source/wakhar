import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, Farmer, FPO, AuthState } from '@/types';
import { UserRole } from '@/types';
import api from '@/utils/api';

const AUTH_STORAGE_KEY = '@wakhar_auth';

interface AuthContextType extends AuthState {
  login: (phone: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  farmerProfile: null,
  fpo: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => false,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    farmerProfile: null,
    fpo: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const loadDependencies = async (user: User) => {
    let fpo = null;
    let farmerProfile = null;
    
    if (user.fpo_id) {
      try {
        const { data: fpoData } = await api.get(`/api/fpos/${user.fpo_id}`);
        fpo = fpoData;
        
        if (user.role === UserRole.FARMER) {
          // Fetch farmers for this FPO to find this user's profile
          const { data: farmers } = await api.get(`/api/farmers?fpo_id=${user.fpo_id}`);
          farmerProfile = farmers.find((f: any) => f.user_id === user.id) || null;
        }
      } catch (err) {
        console.error("Failed to load user dependencies", err);
      }
    }
    return { fpo, farmerProfile };
  };

  // Hydrate from storage on mount
  useEffect(() => {
    (async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        if (storedToken) {
          // Verify token and fetch user
          const { data: user } = await api.get('/api/auth/me');
          if (user) {
            const { fpo, farmerProfile } = await loadDependencies(user);
            setState({
              user,
              farmerProfile,
              fpo,
              token: storedToken,
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          }
        }
      } catch (err) {
        // Token invalid or network error
        console.error("Hydration failed", err);
      }
      setState(prev => ({ ...prev, isLoading: false }));
    })();
  }, []);

  const login = useCallback(async (phone: string, password: string): Promise<boolean> => {
    try {
      const { data } = await api.post('/api/auth/login', { phone, password });
      
      if (data && data.access_token && data.user) {
        const { access_token, user } = data;
        await AsyncStorage.setItem('userToken', access_token);
        // Force API interceptor to use the new token immediately
        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

        const { fpo, farmerProfile } = await loadDependencies(user);

        setState({
          user,
          farmerProfile,
          fpo,
          token: access_token,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error("Login failed", err);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem('userToken');
    delete api.defaults.headers.common['Authorization'];
    setState({
      user: null,
      farmerProfile: null,
      fpo: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
