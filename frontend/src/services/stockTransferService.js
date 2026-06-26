import apiClient from './apiClient';

const stockTransferService = {
  getTransfers: async (params = {}) => {
    const response = await apiClient.get('/api/stock-transfers/', { params });
    return response.data;
  },
  getTransfer: async (id) => {
    const response = await apiClient.get(`/api/stock-transfers/${id}`);
    return response.data;
  },
  createTransfer: async (payload) => {
    const response = await apiClient.post('/api/stock-transfers/', payload);
    return response.data;
  },
  reconcileTransfer: async (id) => {
    const response = await apiClient.post(`/api/stock-transfers/${id}/reconcile`);
    return response.data;
  }
};

export default stockTransferService;
