import { api } from './api.js';
import { useAuthStore } from '../store/authStore.js';
import { queryClient } from '../lib/queryClient.js';
let restorePromise;
export const authService = {
  async login(credentials) {
    const { data } = await api.post('/auth/login', credentials);
    queryClient.clear();
    useAuthStore.getState().setSession(data.data);
    if (['employee', 'executive', 'team_leader'].includes(data.data.user.role)) {
      try {
        await api.post('/hrms/attendance/check-in', {});
      } catch (error) {
        if (error.response?.status !== 409) throw error;
      }
    }
    return data.data.user;
  },
  restoreSession() {
    restorePromise ||= (async () => {
      if (useAuthStore.getState().accessToken) {
        const { data } = await api.get('/auth/me');
        useAuthStore.getState().setSession({
          user: data.data,
          accessToken: useAuthStore.getState().accessToken,
        });
      } else {
        const { data } = await api.post('/auth/refresh');
        useAuthStore.getState().setSession(data.data);
      }
    })()
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
    if (['employee', 'executive', 'team_leader'].includes(role)) {
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
