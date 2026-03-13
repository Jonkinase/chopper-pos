import { create } from 'zustand';
import { io } from 'socket.io-client';
import api from '../api/api';
import toast from 'react-hot-toast';

export const useNotificationsStore = create((set, get) => ({
  socket: null,
  notifications: [],
  unreadCount: 0,
  isConnected: false,

  connect: () => {
    if (get().socket) return;

    // Obtener token del localStorage (authStore)
    const authStorage = localStorage.getItem('auth-storage');
    let token = null;
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      token = parsed?.state?.token; // Asumiendo estructura de Zustand persist
    }

    if (!token) return;

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const baseUrl = API_URL.replace('/api', '');

    const socket = io(baseUrl, {
      auth: { token }
    });

    socket.on('connect', () => {
      set({ isConnected: true });
    });

    socket.on('disconnect', () => {
      set({ isConnected: false });
    });

    socket.on('new_notification', (notification) => {
      set((state) => ({
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + 1
      }));
      
      // Mostrar Toast interactivo
      toast.custom((t) => (
        <div 
          className="flex items-start bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-4 max-w-sm w-full cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          onClick={() => {
            toast.dismiss(t.id);
            if (!notification.is_read) get().markAsRead(notification.id);
          }}
        >
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {notification.title}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {notification.message}
            </p>
          </div>
        </div>
      ), { duration: 5000, position: 'bottom-right' });
    });

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },

  fetchNotifications: async () => {
    try {
      const { data } = await api.get('/notifications');
      if (data.success) {
        set({
          notifications: data.data.notifications,
          unreadCount: data.data.unreadCount
        });
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  },

  markAsRead: async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      set((state) => {
        const notif = state.notifications.find(n => n.id === id);
        // Evitar descontar si ya estaba leída (por seguridad)
        if (notif && notif.is_read) return state;

        return {
          notifications: state.notifications.map((n) => 
            n.id === id ? { ...n, is_read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1)
        };
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await api.put('/notifications/read-all');
      set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, is_read: true })),
        unreadCount: 0
      }));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }
}));
