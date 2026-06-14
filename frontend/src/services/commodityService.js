import apiClient from './apiClient';

const commodityService = {
  getCommodities: async (params = {}) => {
    const response = await apiClient.get('/api/commodities/', { params });
    return response.data;
  },
  getCommodity: async (id) => {
    const response = await apiClient.get(`/api/commodities/${id}`);
    return response.data;
  },
  createCommodity: async (payload) => {
    const response = await apiClient.post('/api/commodities/', payload);
    return response.data;
  },
  updateCommodity: async (id, payload) => {
    const response = await apiClient.put(`/api/commodities/${id}`, payload);
    return response.data;
  },
  deleteCommodity: async (id) => {
    const response = await apiClient.delete(`/api/commodities/${id}`);
    return response.data;
  }
};

export default commodityService;
