import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import DataTable from '../../components/ui/DataTable';
import EmptyState from '../../components/ui/EmptyState';
import { History, Monitor, Globe } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import { formatDate } from '../../utils/formatters'; // Assuming this exists or we can write a simple formatter

const UserAccessLogsModal = ({ user, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setIsLoading(true);
        const { data } = await api.get(`/users/${user.id}/access-logs`);
        setLogs(data.data);
      } catch (error) {
        console.error('Error fetching logs', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      fetchLogs();
    }
  }, [user]);

  const columns = [
    { 
      header: 'Fecha / Hora', 
      cell: (row) => (
        <span className="text-slate-700 dark:text-slate-300">
          {new Date(row.created_at).toLocaleString()}
        </span>
      ) 
    },
    { 
      header: 'Acción', 
      cell: (row) => (
        <Badge variant={row.action === 'login' ? 'success' : 'default'} className="uppercase">
          {row.action}
        </Badge>
      ) 
    },
    { 
      header: 'Dispositivo', 
      cell: (row) => (
        <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
          <Monitor className="w-4 h-4 text-slate-400" />
          <span>{row.device_info || 'Desconocido'}</span>
        </div>
      ) 
    },
    { 
      header: 'IP', 
      cell: (row) => (
        <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
          <Globe className="w-4 h-4 text-slate-400" />
          <span>{row.ip_address || 'Desconocida'}</span>
        </div>
      ) 
    }
  ];

  const mobileRender = (row) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="font-semibold text-slate-900 dark:text-slate-100">
          {new Date(row.created_at).toLocaleString()}
        </span>
        <Badge variant={row.action === 'login' ? 'success' : 'default'} className="uppercase">
          {row.action}
        </Badge>
      </div>
      <div className="flex flex-col space-y-1 text-sm text-slate-600 dark:text-slate-400">
        <div className="flex items-center space-x-2">
          <Monitor className="w-4 h-4" />
          <span>{row.device_info || 'Desconocido'}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Globe className="w-4 h-4" />
          <span>{row.ip_address || 'Desconocida'}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {logs.length === 0 && !isLoading ? (
        <EmptyState
          icon={History}
          title="Sin historial"
          description="No se encontraron registros de acceso para este usuario."
        />
      ) : (
        <DataTable 
          columns={columns} 
          data={logs} 
          mobileRender={mobileRender} 
          isLoading={isLoading} 
        />
      )}
      <div className="flex justify-end pt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default UserAccessLogsModal;
