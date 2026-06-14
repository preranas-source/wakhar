import apiClient from './apiClient';

const dispatchService = {
  getDispatches: async (params = {}) => {
    const response = await apiClient.get('/api/dispatch-notes/', { params });
    return response.data;
  },
  getDispatch: async (id) => {
    const response = await apiClient.get(`/api/dispatch-notes/${id}`);
    return response.data;
  },
  createDispatch: async (payload) => {
    const response = await apiClient.post('/api/dispatch-notes/', payload);
    return response.data;
  },
  updateDispatch: async (id, payload) => {
    const response = await apiClient.put(`/api/dispatch-notes/${id}`, payload);
    return response.data;
  },
  getTimeline: async (id) => {
    const response = await apiClient.get(`/api/dispatch-notes/${id}/timeline`);
    return response.data;
  },
  addTimelineEvent: async (id, payload) => {
    const response = await apiClient.post(`/api/dispatch-notes/${id}/timeline`, payload);
    return response.data;
  }
};

export default dispatchService;
