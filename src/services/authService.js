import { api } from './api.js';
import { useAuthStore } from '../store/authStore.js';
import { queryClient } from '../lib/queryClient.js';
let restorePromise;
export const authService = {
  async login(credentials) {
    const { data } = await api.post('/auth/login', credentials);
    queryClient.clear();
    useAuthStore.getState().setSession(data.data);
    return data.data.user;
  },
  restoreSession() {
    restorePromise ||= api
      .post('/auth/refresh')
      .then(({ data }) => {
        useAuthStore.getState().setSession(data.data);
      })
      .catch((error) => {
        if (error.response?.status === 401) useAuthStore.getState().clearAuth();
        else throw error;
      })
      .finally(() => {
        restorePromise = null;
      });
    return restorePromise;
  },
  async logout() {
    await api.post('/auth/logout');
    useAuthStore.getState().clearAuth();
    queryClient.clear();
  },
};
