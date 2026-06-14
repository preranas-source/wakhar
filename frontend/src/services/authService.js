import apiClient from './apiClient';

const authService = {
  login: async (payload) => {
    const response = await apiClient.post('/api/auth/login', payload);
    return response.data;
  },
  getMe: async () => {
    const response = await apiClient.get('/api/auth/me');
    return response.data;
  },
  getFPOs: async () => {
    const response = await apiClient.get('/api/auth/fpos');
    return response.data;
  },
  register: async (payload) => {
    const response = await apiClient.post('/api/auth/register', payload);
    return response.data;
  },
  changePassword: async (payload) => {
    const response = await apiClient.post('/api/auth/change-password', payload);
    return response.data;
  }
};

export default authService;
