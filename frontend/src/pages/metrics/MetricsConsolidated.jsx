import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { SkeletonChart } from '../../components/metrics/Skeletons';
import { formatCurrency } from '../../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MetricsConsolidated = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/metrics/consolidated`);
      setData(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-900 border border-dark-700 p-3 rounded-xl shadow-xl">
          <p className="text-dark-50 font-bold mb-2">{label}</p>
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
      <div>
        <h1 className="text-2xl font-bold text-dark-50">Reporte Consolidado</h1>
        <p className="text-sm text-dark-400">Rendimiento global de la empresa</p>
      </div>

      {isLoading || !data ? (
        <div className="grid grid-cols-1 gap-6">
          <SkeletonChart />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="bg-primary-900/20 border border-primary-900/50 p-6 rounded-2xl text-center">
                <p className="text-primary-300 font-medium mb-1">Ingresos Globales</p>
                <p className="text-3xl font-black text-primary-500">{formatCurrency(data.global_stats.total_sales)}</p>
             </div>
             <div className="bg-emerald-900/20 border border-emerald-900/50 p-6 rounded-2xl text-center">
                <p className="text-emerald-300 font-medium mb-1">Ganancia Neta Global</p>
                <p className="text-3xl font-black text-emerald-500">{formatCurrency(data.global_stats.total_profit)}</p>
             </div>
             <div className="bg-dark-900 border border-dark-800 p-6 rounded-2xl text-center">
                <p className="text-dark-400 font-medium mb-1">Margen Global Promedio</p>
                <p className="text-3xl font-black text-dark-50">{data.global_stats.overall_margin.toFixed(1)}%</p>
             </div>
          </div>

          <div className="bg-dark-900 p-6 rounded-2xl border border-dark-800">
            <h3 className="text-lg font-bold text-dark-50 mb-6">Comparativa de Sucursales (Ventas y Ganancia)</h3>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.branch_performance} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" vertical={false} />
                  <XAxis dataKey="label" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" fontSize={12} tickFormatter={(val) => `$${val/1000}k`} />
                  <Tooltip cursor={{fill: '#2d2d2d'}} content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Ventas" fill="#3b66f5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" name="Ganancia" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetricsConsolidated;
