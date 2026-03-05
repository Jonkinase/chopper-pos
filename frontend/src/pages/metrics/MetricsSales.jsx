import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { useAuthStore } from '../../store/authStore';
import MetricsFilters from '../../components/metrics/MetricsFilters';
import { SkeletonChart } from '../../components/metrics/Skeletons';
import { formatCurrency } from '../../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3b66f5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const MetricsSales = () => {
  const { activeBranch, user } = useAuthStore();
  const [period, setPeriod] = useState('mes');
  const [branchFilter, setBranchFilter] = useState(user.role === 'admin' ? 'all' : activeBranch);
  const [branches, setBranches] = useState([]);
  
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const endpoint = branchFilter === 'all' && user.role === 'admin' 
        ? `/metrics/sales?sucursal_id=all&periodo=${period}`
        : `/metrics/sales?sucursal_id=${branchFilter}&periodo=${period}`;
      
      const res = await api.get(endpoint);
      setData(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user.role === 'admin') {
      api.get('/branches').then(res => setBranches(res.data.data));
    }
  }, [user.role]);

  useEffect(() => {
    if (branchFilter) fetchData();
  }, [period, branchFilter]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // Para PieChart, el label suele venir en payload[0].name si label no está definido
      const displayLabel = label || payload[0].name || payload[0].payload.label;
      
      return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl shadow-xl border-l-4" style={{ borderLeftColor: payload[0].color || payload[0].fill }}>
          <p className="text-slate-900 dark:text-slate-100 font-bold mb-1 capitalize">
            {typeof displayLabel === 'string' ? displayLabel.replace('_', ' ') : displayLabel}
          </p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm text-slate-600 dark:text-slate-400">
              <span className="font-medium">{entry.name}:</span> <span className="font-bold text-slate-900 dark:text-slate-100">{entry.name === 'Transacciones' ? entry.value : formatCurrency(entry.value)}</span>
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
        period={period} setPeriod={setPeriod}
        branchFilter={branchFilter} setBranchFilter={setBranchFilter}
        branches={branches} onRefresh={fetchData} isLoading={isLoading}
      />

      {isLoading || !data ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonChart />
          <SkeletonChart />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6">Evolución de Ventas</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.sales_by_day} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" vertical={false} />
                    <XAxis dataKey="label" stroke="#888" fontSize={12} tickMargin={10} />
                    <YAxis stroke="#888" fontSize={12} tickFormatter={(val) => `$${val/1000}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="value" name="Ventas" stroke="#3b66f5" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6">Ventas por Método de Pago</h3>
              <div className="h-[300px] w-full flex items-center justify-center">
                {data.sales_by_payment.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.sales_by_payment}
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="label"
                      >
                        {data.sales_by_payment.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="bottom" height={36} formatter={(val) => <span className="text-slate-800 dark:text-slate-200 capitalize">{val.replace('_', ' ')}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-slate-600 dark:text-slate-400">No hay datos suficientes</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6">Ventas por Hora del Día</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.sales_by_hour} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" vertical={false} />
                  <XAxis dataKey="label" stroke="#888" fontSize={12} tickFormatter={(val) => `${val}hs`} />
                  <YAxis stroke="#888" fontSize={12} allowDecimals={false} />
                  <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Transacciones" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MetricsSales;
