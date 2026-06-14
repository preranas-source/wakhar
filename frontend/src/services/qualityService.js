import apiClient from './apiClient';

const qualityService = {
  getQualityRecords: async (params = {}) => {
    const response = await apiClient.get('/api/quality-records/', { params });
    return response.data;
  },
  getQualityRecord: async (id) => {
    const response = await apiClient.get(`/api/quality-records/${id}`);
    return response.data;
  },
  createQualityRecord: async (payload) => {
    const response = await apiClient.post('/api/quality-records/', payload);
    return response.data;
  },
  updateQualityRecord: async (id, payload) => {
    const response = await apiClient.put(`/api/quality-records/${id}`, payload);
    return response.data;
  },
  deleteQualityRecord: async (id) => {
    const response = await apiClient.delete(`/api/quality-records/${id}`);
    return response.data;
  }
};

export default qualityService;
