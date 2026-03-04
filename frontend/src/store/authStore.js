import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      activeBranch: localStorage.getItem('chopper-active-branch') || null,

      login: (userData, token, refreshToken) => {
        const initialBranch = userData.role !== 'admin' 
          ? userData.branch_id 
          : (localStorage.getItem('chopper-active-branch') || null);
        
        set({
          user: userData,
          token,
          refreshToken,
          isAuthenticated: true,
          activeBranch: initialBranch,
        });

        if (initialBranch) {
          localStorage.setItem('chopper-active-branch', initialBranch);
        }
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
        localStorage.removeItem('chopper-active-branch');
      },

      setActiveBranch: (branchId) => {
        set({ activeBranch: branchId });
        localStorage.setItem('chopper-active-branch', branchId);
      },

      setToken: (token) => set({ token }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
