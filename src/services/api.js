import axios from 'axios';
import { useAuthStore } from '../store/authStore.js';
export const api = axios.create({
  baseURL: import.meta.env.API_BASE_URL || '/api/v1',
  withCredentials: true,
  timeout: 10000,
});
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
let refreshPromise;
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (
      error.response?.status === 401 &&
      config &&
      !config._retried &&
      !/^\/auth\/(login|refresh|logout|forgot-password|reset-password)$/.test(
        config.url,
      ) &&
      useAuthStore.getState().accessToken
    ) {
      config._retried = true;
      try {
        refreshPromise ||= api
          .post('/auth/refresh')
          .then(({ data }) => {
            useAuthStore.getState().setSession(data.data);
          })
          .finally(() => {
            refreshPromise = null;
          });
        await refreshPromise;
        return api(config);
      } catch (refreshError) {
        if (refreshError.response?.status === 401)
          useAuthStore.getState().clearAuth();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);
