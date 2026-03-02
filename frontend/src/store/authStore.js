import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      activeBranch: null,

      login: (userData, token, refreshToken) => {
        set({
          user: userData,
          token,
          refreshToken,
          isAuthenticated: true,
          // If admin and no active branch, it remains null until selected
          activeBranch: userData.role !== 'admin' ? userData.branch_id : null,
        });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          activeBranch: null,
        });
        localStorage.removeItem('auth-storage');
      },

      setActiveBranch: (branchId) => {
        set({ activeBranch: branchId });
      },

      setToken: (token) => set({ token }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
