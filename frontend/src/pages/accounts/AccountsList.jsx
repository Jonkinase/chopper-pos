import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { useAuthStore } from '../../store/authStore';
import DataTable from '../../components/ui/DataTable';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/formatters';
import { Wallet, Search, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const AccountsList = () => {
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { activeBranch } = useAuthStore();
  const navigate = useNavigate();

  const fetchAccounts = async () => {
    if (!activeBranch) return;
    setIsLoading(true);
    try {
      const { data } = await api.get(`/accounts?sucursal_id=${activeBranch}`);
      setAccounts(data.data);
    } catch (error) {
      toast.error('Error al cargar cuentas corrientes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [activeBranch]);

  const filteredAccounts = accounts.filter(acc => 
    acc.customer_name.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { header: 'Cliente', accessorKey: 'customer_name', className: 'font-semibold text-dark-50' },
    { header: 'Saldo Actual', cell: (row) => {
      const balance = parseFloat(row.current_balance);
      return (
        <span className={`font-bold ${balance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
          {formatCurrency(balance)}
        </span>
      );
    }},
    { header: 'Última Actividad', cell: (row) => new Date(row.updated_at).toLocaleDateString() },
    { header: 'Estado', cell: (row) => (
      <Badge variant={parseFloat(row.current_balance) > 0 ? 'danger' : 'success'}>
        {parseFloat(row.current_balance) > 0 ? 'CON DEUDA' : 'AL DÍA'}
      </Badge>
    )},
    {
      header: 'Acciones',
      cell: (row) => (
        <button
          onClick={() => navigate(`/accounts/${row.customer_id}`)}
          className="flex items-center space-x-1 p-1.5 bg-dark-800 hover:bg-dark-700 text-dark-300 rounded-lg transition-colors text-sm"
        >
          <FileText className="w-4 h-4" />
          <span>Ver Detalle</span>
        </button>
      ),
    },
  ];

  const mobileRender = (row) => {
    const balance = parseFloat(row.current_balance);
    return (
      <div>
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-bold text-dark-50">{row.customer_name}</h3>
            <p className="text-xs text-dark-400">Actividad: {new Date(row.updated_at).toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <span className={`font-bold block ${balance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {formatCurrency(balance)}
            </span>
          </div>
        </div>
        <button 
          onClick={() => navigate(`/accounts/${row.customer_id}`)}
          className="w-full mt-3 flex items-center justify-center space-x-2 bg-dark-800 hover:bg-dark-700 text-dark-200 py-2 rounded-lg transition-colors text-sm"
        >
          <FileText className="w-4 h-4" />
          <span>Ver Movimientos y Pagar</span>
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-50">Cuentas Corrientes</h1>
          <p className="text-sm text-dark-400">Gestiona las deudas y saldos de clientes</p>
        </div>
      </div>

      <div className="relative">
        <Search className="w-5 h-5 absolute left-3 top-2.5 text-dark-400" />
        <input
          type="text"
          placeholder="Buscar cuenta por cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-dark-900 border border-dark-800 rounded-xl text-dark-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {filteredAccounts.length === 0 && !isLoading ? (
        <EmptyState
          icon={Wallet}
          title="No hay cuentas corrientes"
          description="Los clientes aparecerán aquí automáticamente cuando se registren."
        />
      ) : (
        <DataTable columns={columns} data={filteredAccounts} mobileRender={mobileRender} isLoading={isLoading} />
      )}
    </div>
  );
};

export default AccountsList;
