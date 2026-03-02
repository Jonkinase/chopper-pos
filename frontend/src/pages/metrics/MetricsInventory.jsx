import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { useAuthStore } from '../../store/authStore';
import { SkeletonChart } from '../../components/metrics/Skeletons';
import { formatCurrency } from '../../utils/formatters';
import { AlertCircle, Package } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';

const MetricsInventory = () => {
  const { activeBranch, user } = useAuthStore();
  const [branchFilter, setBranchFilter] = useState(user.role === 'admin' ? 'all' : activeBranch);
  const [branches, setBranches] = useState([]);
  
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const endpoint = branchFilter === 'all' && user.role === 'admin' 
        ? `/metrics/inventory?sucursal_id=all`
        : `/metrics/inventory?sucursal_id=${branchFilter}`;
      
      const res = await api.get(endpoint);
      setData(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user.role === 'admin') api.get('/branches').then(res => setBranches(res.data.data));
  }, [user.role]);

  useEffect(() => {
    if (branchFilter) fetchData();
  }, [branchFilter]);

  const columns = [
    { header: 'Sucursal', accessorKey: 'branch_name' },
    { header: 'Producto', accessorKey: 'name', className: 'font-bold text-dark-50' },
    { header: 'Stock Actual', cell: (row) => <span className="text-red-400 font-bold">{row.stock_actual}</span> },
  ];

  return (
    <div className="space-y-6">
      {user.role === 'admin' && (
        <div className="bg-dark-900 p-4 rounded-2xl border border-dark-800 flex items-center justify-between">
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
        </div>
      )}

      {isLoading || !data ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonChart />
          <SkeletonChart />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="bg-dark-900 p-6 rounded-2xl border border-dark-800">
            <h3 className="text-lg font-bold text-dark-50 mb-6 flex items-center"><Package className="w-5 h-5 mr-2 text-primary-400" /> Valorización de Inventario</h3>
            <div className="space-y-4">
              {data.inventory_valuation.map((val, idx) => (
                <div key={idx} className="flex justify-between items-center p-4 bg-dark-800 rounded-xl border border-dark-700">
                  <span className="font-medium text-dark-200">{val.label}</span>
                  <span className="text-xl font-bold text-primary-400">{formatCurrency(val.value)}</span>
                </div>
              ))}
              {data.inventory_valuation.length === 0 && (
                <p className="text-dark-400 text-center py-4">No hay datos de valorización</p>
              )}
            </div>
          </div>

          <div className="bg-dark-900 p-6 rounded-2xl border border-red-900/30">
            <h3 className="text-lg font-bold text-red-400 mb-6 flex items-center"><AlertCircle className="w-5 h-5 mr-2" /> Alertas de Stock Bajo</h3>
            {data.low_stock_details.length > 0 ? (
              <DataTable columns={columns} data={data.low_stock_details} mobileRender={(row) => (
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-dark-50">{row.name}</p>
                    <p className="text-xs text-dark-400">{row.branch_name}</p>
                  </div>
                  <span className="text-red-400 font-bold">{row.stock_actual}</span>
                </div>
              )} />
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-emerald-900/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-emerald-400 font-medium">Stock en óptimas condiciones</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Necesitamos importar CheckCircle2 si no está, lo agregamos en el mismo archivo para simplificar:
import { CheckCircle2 } from 'lucide-react';

export default MetricsInventory;
