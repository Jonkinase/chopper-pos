import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { useAuthStore } from '../../store/authStore';
import MetricsFilters from '../../components/metrics/MetricsFilters';
import { SkeletonChart } from '../../components/metrics/Skeletons';
import { formatCurrency } from '../../utils/formatters';
import { getMetricsQueryParams, isCustomRangeComplete } from '../../utils/metricsFilters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MetricsClients = () => {
  const { activeBranch, user } = useAuthStore();
  const [period, setPeriod] = useState('mes');
  const [customRange, setCustomRange] = useState({ from: '', to: '' });
  const [branchFilter, setBranchFilter] = useState(user.role === 'admin' ? 'all' : activeBranch);
  const [branches, setBranches] = useState([]);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    if (!isCustomRangeComplete(period, customRange)) {
      return;
    }

    setIsLoading(true);
    try {
      const params = {
        sucursal_id: branchFilter === 'all' && user.role === 'admin' ? 'all' : branchFilter,
        ...getMetricsQueryParams({
          period,
          dateFrom: customRange.from,
          dateTo: customRange.to,
        }),
      };

      const res = await api.get('/metrics/clients', { params });
      setData(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user.role === 'admin') api.get('/branches').then((res) => setBranches(res.data.data));
  }, [user.role]);

  useEffect(() => {
    if (branchFilter && isCustomRangeComplete(period, customRange)) {
      fetchData();
    }
  }, [period, branchFilter, customRange.from, customRange.to]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 p-3 rounded-xl shadow-xl">
          <p className="text-slate-900 dark:text-slate-100 font-bold mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-bold">{formatCurrency(entry.value)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <MetricsFilters
        period={period}
        setPeriod={setPeriod}
        customRange={customRange}
        setCustomRange={setCustomRange}
        branchFilter={branchFilter}
        setBranchFilter={setBranchFilter}
        branches={branches}
        onRefresh={fetchData}
        isLoading={isLoading}
      />

      {isLoading || !data ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonChart />
          <SkeletonChart />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6">Top 10 Clientes (Volumen de Compras)</h3>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={data.top_clients_spending} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" horizontal={false} />
                  <XAxis type="number" stroke="#888" fontSize={12} tickFormatter={(val) => `$${val / 1000}k`} />
                  <YAxis dataKey="label" type="category" stroke="#888" fontSize={11} width={120} tick={{ fill: '#d1d1d1' }} />
                  <Tooltip cursor={{ fill: '#2d2d2d' }} content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Total Comprado" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6">Top Deudores (Cuentas Corrientes)</h3>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={data.top_clients_debt} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" horizontal={false} />
                  <XAxis type="number" stroke="#888" fontSize={12} tickFormatter={(val) => `$${val / 1000}k`} />
                  <YAxis dataKey="label" type="category" stroke="#888" fontSize={11} width={120} tick={{ fill: '#d1d1d1' }} />
                  <Tooltip cursor={{ fill: '#2d2d2d' }} content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Deuda Pendiente" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetricsClients;
