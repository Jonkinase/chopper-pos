import { create } from 'zustand';
import { configApi } from '../api/config.api';

export const useConfigStore = create((set) => ({
  config: {},
  isLoading: false,

  fetchConfig: async () => {
    set({ isLoading: true });
    try {
      const { data } = await configApi.getAll();
      set({ config: data.data, isLoading: false });
    } catch (error) {
      console.error('Error fetching config', error);
      set({ isLoading: false });
    }
  },

  updateConfig: (newConfig) => {
    set((state) => ({
      config: { ...state.config, ...newConfig }
    }));
  }
}));
