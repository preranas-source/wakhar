import apiClient from './apiClient';

const purchaseOrderService = {
  getPurchaseOrders: async (params = {}) => {
    const response = await apiClient.get('/api/purchase-orders/', { params });
    return response.data;
  },
  getPurchaseOrder: async (id) => {
    const response = await apiClient.get(`/api/purchase-orders/${id}`);
    return response.data;
  },
  createPurchaseOrder: async (payload) => {
    const response = await apiClient.post('/api/purchase-orders/', payload);
    return response.data;
  },
  updatePurchaseOrder: async (id, payload) => {
    const response = await apiClient.put(`/api/purchase-orders/${id}`, payload);
    return response.data;
  }
};

export default purchaseOrderService;
