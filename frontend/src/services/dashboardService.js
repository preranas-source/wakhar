import apiClient from './apiClient';

const dashboardService = {
  getStats: async () => {
    const response = await apiClient.get('/api/dashboard/stats');
    return response.data;
  }
};

export default dashboardService;
