import apiClient from './apiClient';

const farmerService = {
  getFarmers: async (params = {}) => {
    const response = await apiClient.get('/api/farmers/', { params });
    return response.data;
  },
  getFarmer: async (id) => {
    const response = await apiClient.get(`/api/farmers/${id}`);
    return response.data;
  },
  createFarmer: async (payload) => {
    const response = await apiClient.post('/api/farmers/', payload);
    return response.data;
  },
  updateFarmer: async (id, payload) => {
    const response = await apiClient.put(`/api/farmers/${id}`, payload);
    return response.data;
  },
  deleteFarmer: async (id) => {
    const response = await apiClient.delete(`/api/farmers/${id}`);
    return response.data;
  }
};

export default farmerService;
