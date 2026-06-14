import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('wakhar_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const setupInterceptors = (onUnauthorized, onForbidden) => {
  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response) {
        const { status, data } = error.response;
        if (status === 401) {
          onUnauthorized();
        } else if (status === 403) {
          if (onForbidden) {
            onForbidden();
          } else {
            alert(`Permission Denied: ${data?.detail || 'You do not have access to this resource.'}`);
            window.location.href = '/access-denied';
          }
        } else if (status === 404) {
          alert(`Resource Not Found: ${data?.detail || 'The requested resource was not found.'}`);
        } else if (status === 422) {
          const errors = data?.detail;
          const errorMsg = Array.isArray(errors)
            ? errors.map(err => `${err.loc.join('.')}: ${err.msg}`).join(', ')
            : data?.detail || 'Validation error occurred.';
          alert(`Validation Error: ${errorMsg}`);
        }
      } else {
        console.error('API client error:', error.message);
      }
      return Promise.reject(error);
    }
  );
};

export default apiClient;
