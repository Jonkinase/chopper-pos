import React, { useState, useRef, useEffect } from 'react';
import { Bell, Package, AlertTriangle, ShieldAlert, Check, CheckCircle2 } from 'lucide-react';
import { useNotificationsStore } from '../../store/notificationsStore';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    connect,
    disconnect
  } = useNotificationsStore();

  useEffect(() => {
    connect();
    fetchNotifications();
    return () => disconnect();
  }, [connect, fetchNotifications, disconnect]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'LOW_STOCK': return <Package className="w-5 h-5 text-orange-500" />;
      case 'HIGH_SALE': return <AlertTriangle className="w-5 h-5 text-emerald-500" />;
      case 'SECURITY_ALERT': return <ShieldAlert className="w-5 h-5 text-red-500" />;
      default: return <Bell className="w-5 h-5 text-primary-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[80vh]">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Notificaciones</h3>
            {unreadCount > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}
                className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium flex items-center space-x-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Marcar leídas</span>
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1 overscroll-contain">
            {notifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                  <Bell className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">No tienes notificaciones</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => !notif.is_read && markAsRead(notif.id)}
                    className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer flex gap-3 ${!notif.is_read ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''}`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <p className={`text-sm ${!notif.is_read ? 'font-semibold text-slate-900 dark:text-slate-100' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                          {notif.title}
                        </p>
                        {!notif.is_read && (
                          <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className={`text-sm mb-1 ${!notif.is_read ? 'text-slate-600 dark:text-slate-400' : 'text-slate-500 dark:text-slate-500'}`}>
                        {notif.message}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: es })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
