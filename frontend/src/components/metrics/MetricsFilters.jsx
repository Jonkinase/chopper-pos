import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { RefreshCcw } from 'lucide-react';
import { CUSTOM_PERIOD, hasInvalidCustomRange } from '../../utils/metricsFilters';

const MetricsFilters = ({ 
  period, setPeriod,
  customRange, setCustomRange,
  branchFilter, setBranchFilter,
  branches,
  onRefresh,
  isLoading
}) => {
  const { user } = useAuthStore();
  const isCustom = period === CUSTOM_PERIOD;
  const customRangeIncomplete = isCustom && (!customRange.from || !customRange.to);
  const customRangeInvalid = hasInvalidCustomRange(period, customRange);

  const handleDateChange = (field) => (event) => {
    setCustomRange((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  return (
    <div className="flex flex-col gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 mb-6">
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          {user.role === 'admin' && (
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Todas las sucursales</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}

          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="hoy">Hoy</option>
            <option value="semana">Esta Semana</option>
            <option value="mes">Este Mes</option>
            <option value="año">Este Año</option>
            <option value={CUSTOM_PERIOD}>Personalizado</option>
          </select>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading || customRangeIncomplete || customRangeInvalid}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl transition-colors text-sm font-medium w-full lg:w-auto justify-center disabled:opacity-50"
        >
          <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refrescar</span>
        </button>
      </div>

      {isCustom && (
        <div className="flex flex-col sm:flex-row gap-4">
          <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-300 w-full sm:w-auto">
            <span>Desde</span>
            <input
              type="date"
              value={customRange.from}
              onChange={handleDateChange('from')}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-300 w-full sm:w-auto">
            <span>Hasta</span>
            <input
              type="date"
              value={customRange.to}
              onChange={handleDateChange('to')}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </label>
        </div>
      )}

      {customRangeIncomplete && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          Seleccioná fecha desde y fecha hasta para consultar un rango personalizado.
        </p>
      )}

      {customRangeInvalid && (
        <p className="text-sm text-red-600 dark:text-red-400">
          La fecha desde no puede ser mayor que la fecha hasta.
        </p>
      )}
    </div>
  );
};

export default MetricsFilters;
