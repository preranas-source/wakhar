import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { enqueueRequest, setCachedResponse, getCachedResponse } from './database';

// In Expo, EXPO_PUBLIC_* variables in .env are injected automatically
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Generate a simple UUID v4 for idempotency keys.
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ──────────────────────────────────────────────
// REQUEST INTERCEPTOR
// ──────────────────────────────────────────────
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Inject JWT token
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token && config.headers) {
        config.headers.set('Authorization', `Bearer ${token}`);
      }
    } catch (error) {
      console.error('Error retrieving token from AsyncStorage', error);
    }

    // Check network connectivity
    const netState = await NetInfo.fetch();
    const isOffline = !(netState.isConnected && netState.isInternetReachable !== false);

    if (isOffline) {
      const method = (config.method || 'get').toUpperCase();

      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        // Queue write requests for later sync
        const idempotencyKey = generateUUID();
        const url = config.url || '';
        const payload = config.data || {};
        
        let parsedPayload = {};
        try {
          parsedPayload = typeof payload === 'string' ? JSON.parse(payload) : (payload || {});
        } catch {
          parsedPayload = payload || {};
        }

        await enqueueRequest(idempotencyKey, method, url, parsedPayload);

        console.log(`[API] Offline: Queued ${method} ${url} (key: ${idempotencyKey})`);

        // Return a mock response so the UI doesn't crash
        const mockResponse: AxiosResponse = {
          data: {
            queued: true,
            offline: true,
            message: 'Saved offline. Will sync when connected.',
            idempotency_key: idempotencyKey,
            lot_code: (parsedPayload as any).lot_code || `LOT-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
            dn_code: (parsedPayload as any).dn_code || `DN-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
          },
          status: 202,
          statusText: 'Accepted (Offline Queue)',
          headers: {},
          config: config,
        };

        // Override adapter to short-circuit the request and return mockResponse directly
        config.adapter = async () => {
          return mockResponse;
        };
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ──────────────────────────────────────────────
// RESPONSE INTERCEPTOR
// ──────────────────────────────────────────────
api.interceptors.response.use(
  async (response: AxiosResponse) => {
    // Cache successful GET responses for offline reading
    const method = (response.config.method || 'get').toUpperCase();
    if (method === 'GET' && response.config.url) {
      try {
        await setCachedResponse(response.config.url, response.data);
      } catch (err) {
        console.warn('[API] Failed to cache response:', err);
      }
    }
    return response;
  },
  async (error: AxiosError | any) => {
    // If this was an offline-queued write request via request interceptor error (fallback), return the mock response
    if (error?.isOfflineQueued) {
      return error.response;
    }

    // For requests that fail due to physical network error (server unreachable / no connection), try to resolve offline
    const config = error?.config;
    if (config) {
      const method = (config.method || 'get').toUpperCase();
      const isServerDown = error.response && [502, 503, 504].includes(error.response.status);
      const isNetworkError = !error.response || error.code === 'ERR_NETWORK' || isServerDown;

      if (isNetworkError) {
        // Fallback offline queueing for write requests if NetInfo reported online but request failed
        if (['POST', 'PUT', 'PATCH'].includes(method)) {
          const idempotencyKey = generateUUID();
          const url = config.url || '';
          let parsedPayload = {};
          try {
            parsedPayload = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
          } catch {
            parsedPayload = config.data || {};
          }

          try {
            await enqueueRequest(idempotencyKey, method, url, parsedPayload);
            console.log(`[API] Network Error Intercepted: Queued ${method} ${url} (key: ${idempotencyKey})`);

            const mockResponse: AxiosResponse = {
              data: {
                queued: true,
                offline: true,
                message: 'Saved offline. Will sync when connected.',
                idempotency_key: idempotencyKey,
                lot_code: (parsedPayload as any).lot_code || `LOT-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
                dn_code: (parsedPayload as any).dn_code || `DN-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
              },
              status: 202,
              statusText: 'Accepted (Offline Queue)',
              headers: {},
              config: config,
            };
            return mockResponse;
          } catch (queueErr) {
            console.error('[API] Failed to queue request after network error:', queueErr);
          }
        }

        // Fallback cached reading for GET requests
        if (method === 'GET' && config.url) {
          try {
            const cached = await getCachedResponse(config.url);
            if (cached) {
              console.log(`[API] Returning cached response for: ${config.url}`);
              return {
                data: cached,
                status: 200,
                statusText: 'OK (Cached)',
                headers: {},
                config: config,
              } as AxiosResponse;
            }
          } catch (cacheErr) {
            console.warn('[API] Failed to retrieve cached response:', cacheErr);
          }
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
