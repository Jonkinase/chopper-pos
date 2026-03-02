import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import DataTable from '../../components/ui/DataTable';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import BranchForm from './BranchForm';
import { Store, Plus, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const BranchesList = () => {
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState(null);

  const fetchBranches = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/branches');
      setBranches(data.data);
    } catch (error) {
      toast.error('Error al cargar sucursales');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleSave = async (formData) => {
    try {
      if (editingBranch) {
        await api.put(`/branches/${editingBranch.id}`, formData);
        toast.success('Sucursal actualizada');
      } else {
        await api.post('/branches', formData);
        toast.success('Sucursal creada');
      }
      setIsFormOpen(false);
      setEditingBranch(null);
      fetchBranches();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/branches/${branchToDelete.id}`);
      toast.success('Sucursal eliminada');
      fetchBranches();
    } catch (error) {
      toast.error('Error al eliminar sucursal');
    }
  };

  const columns = [
    { header: 'Nombre', accessorKey: 'name', className: 'font-semibold text-dark-50' },
    { header: 'Dirección', accessorKey: 'address' },
    {
      header: 'Acciones',
      cell: (row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => { setEditingBranch(row); setIsFormOpen(true); }}
            className="p-1.5 bg-dark-800 hover:bg-primary-900/50 text-primary-400 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setBranchToDelete(row); setIsDeleteOpen(true); }}
            className="p-1.5 bg-dark-800 hover:bg-red-900/50 text-red-400 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const mobileRender = (row) => (
    <div>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-dark-50">{row.name}</h3>
          <p className="text-xs text-dark-400">{row.address}</p>
        </div>
        <div className="flex space-x-2">
          <button onClick={() => { setEditingBranch(row); setIsFormOpen(true); }} className="text-primary-400 p-1">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => { setBranchToDelete(row); setIsDeleteOpen(true); }} className="text-red-400 p-1">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-50">Sucursales</h1>
          <p className="text-sm text-dark-400">Gestiona las sedes de tu negocio</p>
        </div>
        <button
          onClick={() => { setEditingBranch(null); setIsFormOpen(true); }}
          className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Nueva Sucursal</span>
        </button>
      </div>

      {branches.length === 0 && !isLoading ? (
        <EmptyState
          icon={Store}
          title="No hay sucursales"
          description="Comienza creando la primera sucursal para tu negocio."
          action={
            <button
              onClick={() => { setEditingBranch(null); setIsFormOpen(true); }}
              className="mt-4 bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg"
            >
              Crear Sucursal
            </button>
          }
        />
      ) : (
        <DataTable columns={columns} data={branches} mobileRender={mobileRender} isLoading={isLoading} />
      )}

      {/* Formularios y Modales */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingBranch ? 'Editar Sucursal' : 'Nueva Sucursal'}
      >
        <BranchForm 
          initialData={editingBranch} 
          onSubmit={handleSave} 
          onCancel={() => setIsFormOpen(false)} 
        />
      </Modal>

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar Sucursal"
        message={`¿Estás seguro que deseas eliminar la sucursal "${branchToDelete?.name}"? Esta acción no se puede deshacer de forma fácil.`}
        isDanger={true}
      />
    </div>
  );
};

export default BranchesList;
