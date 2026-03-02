import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { RefreshCcw } from 'lucide-react';

const MetricsFilters = ({ 
  period, setPeriod, 
  branchFilter, setBranchFilter, 
  branches, 
  onRefresh, 
  isLoading 
}) => {
  const { user, activeBranch } = useAuthStore();

  return (
    <div className="flex flex-col sm:flex-row gap-4 bg-dark-900 p-4 rounded-2xl border border-dark-800 items-start sm:items-center justify-between mb-6">
      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        
        {user.role === 'admin' && (
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-4 py-2 bg-dark-800 border border-dark-700 rounded-xl text-sm text-dark-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Todas las sucursales</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        )}

        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 bg-dark-800 border border-dark-700 rounded-xl text-sm text-dark-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="hoy">Hoy</option>
          <option value="semana">Esta Semana</option>
          <option value="mes">Este Mes</option>
          <option value="año">Este Año</option>
        </select>
      </div>

      <button
        onClick={onRefresh}
        disabled={isLoading}
        className="flex items-center space-x-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 text-dark-200 rounded-xl transition-colors text-sm font-medium w-full sm:w-auto justify-center disabled:opacity-50"
      >
        <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        <span>Refrescar</span>
      </button>
    </div>
  );
};

export default MetricsFilters;
