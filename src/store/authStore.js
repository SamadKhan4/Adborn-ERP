import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isInitialized: false,
      setSession: ({ user, accessToken }) =>
        set({ user, accessToken, isInitialized: true }),
      clearAuth: () =>
        set({ user: null, accessToken: null, isInitialized: true }),
    }),
    {
      name: 'adborn-auth',
      partialize: ({ user, accessToken }) => ({ user, accessToken }),
    },
  ),
);
