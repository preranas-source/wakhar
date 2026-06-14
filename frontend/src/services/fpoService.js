import apiClient from './apiClient';

const fpoService = {
  getFPOs: async (params = {}) => {
    const response = await apiClient.get('/api/fpos/', { params });
    return response.data;
  },
  getFPO: async (id) => {
    const response = await apiClient.get(`/api/fpos/${id}`);
    return response.data;
  },
  createFPO: async (payload) => {
    const response = await apiClient.post('/api/fpos/', payload);
    return response.data;
  },
  updateFPO: async (id, payload) => {
    const response = await apiClient.put(`/api/fpos/${id}`, payload);
    return response.data;
  },
  deleteFPO: async (id) => {
    const response = await apiClient.delete(`/api/fpos/${id}`);
    return response.data;
  }
};

export default fpoService;
