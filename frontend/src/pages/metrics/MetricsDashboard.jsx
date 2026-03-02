import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { useAuthStore } from '../../store/authStore';
import MetricsFilters from '../../components/metrics/MetricsFilters';
import { SkeletonCard, SkeletonChart } from '../../components/metrics/Skeletons';
import { formatCurrency } from '../../utils/formatters';
import { TrendingUp, TrendingDown, DollarSign, Target, ShoppingCart, Users } from 'lucide-react';

const KPICard = ({ title, value, icon: Icon, trend, prefix = '' }) => (
  <div className="bg-dark-900 border border-dark-800 p-6 rounded-2xl flex flex-col justify-between">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-dark-800 rounded-xl text-primary-400">
        <Icon className="w-6 h-6" />
      </div>
      {trend !== undefined && (
        <div className={`flex items-center space-x-1 text-sm font-medium px-2 py-1 rounded-lg ${trend >= 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
          {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span>{Math.abs(trend).toFixed(1)}%</span>
        </div>
      )}
    </div>
    <div>
      <h3 className="text-sm font-medium text-dark-400 mb-1">{title}</h3>
      <p className="text-2xl font-black text-dark-50">{prefix}{value}</p>
    </div>
  </div>
);

const MetricsDashboard = () => {
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
        ? `/metrics/dashboard?sucursal_id=all&periodo=${period}`
        : `/metrics/dashboard?sucursal_id=${branchFilter}&periodo=${period}`;
      
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-50">Dashboard General</h1>
        <p className="text-sm text-dark-400">Resumen ejecutivo del período</p>
      </div>

      <MetricsFilters 
        period={period} 
        setPeriod={setPeriod}
        branchFilter={branchFilter}
        setBranchFilter={setBranchFilter}
        branches={branches}
        onRefresh={fetchData}
        isLoading={isLoading}
      />

      {isLoading || !data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard 
            title="Ventas Totales" 
            value={formatCurrency(data.total_sales).replace('$', '')} 
            prefix="$"
            icon={DollarSign} 
            trend={data.variation_pct} 
          />
          <KPICard 
            title="Ganancia Bruta" 
            value={`${formatCurrency(data.gross_profit).replace('$', '')} (${data.margin_pct.toFixed(1)}%)`} 
            prefix="$"
            icon={Target} 
          />
          <KPICard 
            title="Ticket Promedio" 
            value={formatCurrency(data.ticket_promedio).replace('$', '')} 
            prefix="$"
            icon={ShoppingCart} 
          />
          <KPICard 
            title="Nuevos Clientes" 
            value={data.new_clients} 
            icon={Users} 
          />
        </div>
      )}

      {/* Alertas Rápidas */}
      {!isLoading && data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-red-900/10 border border-red-900/30 p-6 rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="text-red-400 font-bold mb-1">Productos con Stock Crítico</h3>
              <p className="text-sm text-red-400/70">Requieren reabastecimiento inmediato</p>
            </div>
            <span className="text-3xl font-black text-red-500">{data.low_stock_count}</span>
          </div>

          <div className="bg-yellow-900/10 border border-yellow-900/30 p-6 rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="text-yellow-400 font-bold mb-1">Cuentas Corrientes</h3>
              <p className="text-sm text-yellow-400/70">Saldo total pendiente de cobro</p>
            </div>
            <span className="text-2xl font-black text-yellow-500">{formatCurrency(data.total_debt)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetricsDashboard;
