import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import DataTable from '../../components/ui/DataTable';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import ClientForm from './ClientForm';
import { formatCurrency } from '../../utils/formatters';
import { Users2, Plus, Edit2, Search, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const ClientsList = () => {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { activeBranch } = useAuthStore();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const navigate = useNavigate();

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get(`/clients?search=${search}&branch_id=${activeBranch}`);
      setClients(data.data);
    } catch (error) {
      toast.error('Error al cargar clientes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchClients, 300);
    return () => clearTimeout(timer);
  }, [search, activeBranch]);

  const handleSave = async (formData) => {
    try {
      if (editingClient) {
        await api.put(`/clients/${editingClient.id}`, {
          name: formData.name,
          contact_info: JSON.stringify({
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
          }),
          branch_id: activeBranch
        });
        toast.success('Cliente actualizado');
      } else {
        await api.post('/clients', {
          ...formData,
          branch_id: activeBranch
        });
        toast.success('Cliente creado');
      }
      setIsFormOpen(false);
      setEditingClient(null);
      fetchClients();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar');
    }
  };

  const getContactInfo = (client) => {
    try {
      return JSON.parse(client.contact_info || '{}');
    } catch (e) {
      return {};
    }
  };

  const columns = [
    { header: 'Cliente', cell: (row) => (
      <div>
        <p className="font-semibold text-slate-900 dark:text-slate-100">{row.name}</p>
        <p className="text-xs text-slate-600 dark:text-slate-400">{getContactInfo(row).email}</p>
      </div>
    )},
    { header: 'Teléfono', cell: (row) => getContactInfo(row).phone || '-' },
    { header: 'Saldo CTA. CTE', cell: (row) => {
      const balance = parseFloat(row.current_balance || 0);
      return (
        <Badge variant={balance > 0 ? 'danger' : 'success'}>
          {balance > 0 ? `DEUDA: ${formatCurrency(balance)}` : 'AL DÍA'}
        </Badge>
      );
    }},
    {
      header: 'Acciones',
      cell: (row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => { setEditingClient(row); setIsFormOpen(true); }}
            className="p-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-primary-900/50 text-primary-400 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(`/accounts/${row.id}`)}
            className="p-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
            title="Ver Cuenta Corriente"
          >
            <FileText className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const mobileRender = (row) => {
    const contact = getContactInfo(row);
    const balance = parseFloat(row.current_balance || 0);
    return (
      <div>
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100">{row.name}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">{contact.phone || contact.email}</p>
          </div>
          <div className="flex space-x-2">
            <button onClick={() => { setEditingClient(row); setIsFormOpen(true); }} className="text-primary-400 p-1">
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="mt-3 flex justify-between items-center border-t border-slate-200 dark:border-slate-700 pt-3">
          <Badge variant={balance > 0 ? 'danger' : 'success'}>
            {balance > 0 ? `DEUDA: ${formatCurrency(balance)}` : 'AL DÍA'}
          </Badge>
          <button onClick={() => navigate(`/accounts/${row.id}`)} className="text-sm font-medium text-primary-400 hover:text-primary-300 flex items-center">
            Ver Cuenta <FileText className="w-3 h-3 ml-1" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Clientes</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Directorio y saldos</p>
        </div>
        <button
          onClick={() => { setEditingClient(null); setIsFormOpen(true); }}
          className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      <div className="relative">
        <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-600 dark:text-slate-400" />
        <input
          type="text"
          placeholder="Buscar cliente por nombre, email o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {clients.length === 0 && !isLoading ? (
        <EmptyState
          icon={Users2}
          title="No hay clientes"
          description="Aún no hay clientes registrados o la búsqueda no arrojó resultados."
        />
      ) : (
        <DataTable columns={columns} data={clients} mobileRender={mobileRender} isLoading={isLoading} />
      )}

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
      >
        <ClientForm 
          initialData={editingClient} 
          onSubmit={handleSave} 
          onCancel={() => setIsFormOpen(false)} 
        />
      </Modal>
    </div>
  );
};

export default ClientsList;
