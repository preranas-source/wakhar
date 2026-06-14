import apiClient from './apiClient';

const warehouseService = {
  getWarehouses: async (params = {}) => {
    const response = await apiClient.get('/api/warehouses/', { params });
    return response.data;
  },
  getWarehouse: async (id) => {
    const response = await apiClient.get(`/api/warehouses/${id}`);
    return response.data;
  },
  createWarehouse: async (payload) => {
    const response = await apiClient.post('/api/warehouses/', payload);
    return response.data;
  },
  updateWarehouse: async (id, payload) => {
    const response = await apiClient.put(`/api/warehouses/${id}`, payload);
    return response.data;
  },
  deleteWarehouse: async (id) => {
    const response = await apiClient.delete(`/api/warehouses/${id}`);
    return response.data;
  }
};

export default warehouseService;
