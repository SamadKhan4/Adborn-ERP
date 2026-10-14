import { api } from './api.js';
import { useAuthStore } from '../store/authStore.js';
import { queryClient } from '../lib/queryClient.js';
let restorePromise;
export const authService = {
  async login(credentials) {
    const { data } = await api.post('/auth/login', credentials);
    queryClient.clear();
    useAuthStore.getState().setSession(data.data);
    if (['employee', 'executive'].includes(data.data.user.role)) {
      try {
        await api.post('/hrms/attendance/check-in', {});
      } catch (error) {
        if (error.response?.status !== 409) throw error;
      }
    }
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
    const role = useAuthStore.getState().user?.role;
    if (['employee', 'executive'].includes(role)) {
      try {
        await api.post('/hrms/attendance/check-out', {});
      } catch (error) {
        if (
          error.response?.status !== 409 ||
          !/no open attendance punch/i.test(
            error.response?.data?.error?.message || '',
          )
        )
          throw error;
      }
    }
    await api.post('/auth/logout');
    useAuthStore.getState().clearAuth();
    queryClient.clear();
  },
};
