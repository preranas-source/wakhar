import apiClient from './apiClient';

const inventoryService = {
  // Commodity Lots (/api/lots/)
  getLots: async (params = {}) => {
    const response = await apiClient.get('/api/lots/', { params });
    return response.data;
  },
  getLot: async (id) => {
    const response = await apiClient.get(`/api/lots/${id}`);
    return response.data;
  },
  createLot: async (payload) => {
    const response = await apiClient.post('/api/lots/', payload);
    return response.data;
  },
  updateLot: async (id, payload) => {
    const response = await apiClient.put(`/api/lots/${id}`, payload);
    return response.data;
  },
  deleteLot: async (id) => {
    const response = await apiClient.delete(`/api/lots/${id}`);
    return response.data;
  },

  // Warehouse Receipts (/api/warehouse-receipts/)
  getReceipts: async (params = {}) => {
    const response = await apiClient.get('/api/warehouse-receipts/', { params });
    return response.data;
  },
  getReceipt: async (id) => {
    const response = await apiClient.get(`/api/warehouse-receipts/${id}`);
    return response.data;
  },
  createReceipt: async (payload) => {
    const response = await apiClient.post('/api/warehouse-receipts/', payload);
    return response.data;
  },
  updateReceipt: async (id, payload) => {
    const response = await apiClient.put(`/api/warehouse-receipts/${id}`, payload);
    return response.data;
  },
  withdrawReceipt: async (id, withdrawKg) => {
    const response = await apiClient.post(`/api/warehouse-receipts/${id}/withdraw`, { withdraw_kg: withdrawKg });
    return response.data;
  },
  deleteReceipt: async (id) => {
    const response = await apiClient.delete(`/api/warehouse-receipts/${id}`);
    return response.data;
  }
};

export default inventoryService;
