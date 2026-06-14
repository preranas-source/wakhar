import apiClient from './apiClient';

const stockMovementService = {
  getStockMovements: async (params = {}) => {
    const response = await apiClient.get('/api/stock-movements/', { params });
    return response.data;
  },
  getStockMovement: async (id) => {
    const response = await apiClient.get(`/api/stock-movements/${id}`);
    return response.data;
  },
  createStockMovement: async (payload) => {
    const response = await apiClient.post('/api/stock-movements/', payload);
    return response.data;
  }
};

export default stockMovementService;
