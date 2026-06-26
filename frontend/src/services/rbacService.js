import apiClient from './apiClient';

const rbacService = {
  getRoles: async () => {
    const response = await apiClient.get('/api/rbac/roles');
    return response.data;
  },
  getRole: async (roleId) => {
    const response = await apiClient.get(`/api/rbac/roles/${roleId}`);
    return response.data;
  },
  createRole: async (payload) => {
    const response = await apiClient.post('/api/rbac/roles', payload);
    return response.data;
  },
  updateRole: async (roleId, payload) => {
    const response = await apiClient.put(`/api/rbac/roles/${roleId}`, payload);
    return response.data;
  },
  deleteRole: async (roleId) => {
    const response = await apiClient.delete(`/api/rbac/roles/${roleId}`);
    return response.data;
  },
  getPermissions: async (roleId) => {
    const response = await apiClient.get(`/api/rbac/roles/${roleId}/permissions`);
    return response.data;
  },
  updatePermissions: async (roleId, permissions) => {
    const response = await apiClient.put(`/api/rbac/roles/${roleId}/permissions`, { permissions });
    return response.data;
  },
  assignRole: async (userId, roleId) => {
    const response = await apiClient.put(`/api/rbac/users/${userId}/role`, { role_id: roleId });
    return response.data;
  },
  getModules: async () => {
    const response = await apiClient.get('/api/rbac/modules');
    return response.data;
  },
  getUsers: async () => {
    const response = await apiClient.get('/api/users');
    return response.data;
  }
};

export default rbacService;
