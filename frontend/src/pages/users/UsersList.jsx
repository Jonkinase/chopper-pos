import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import DataTable from '../../components/ui/DataTable';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import Badge from '../../components/ui/Badge';
import UserForm from './UserForm';
import ChangePasswordModal from './ChangePasswordModal';
import { Users as UsersIcon, Plus, Edit2, Trash2, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const [isPwdOpen, setIsPwdOpen] = useState(false);
  const [userToChangePwd, setUserToChangePwd] = useState(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/users');
      setUsers(data.data);
    } catch (error) {
      toast.error('Error al cargar usuarios');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSave = async (formData) => {
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, formData);
        toast.success('Usuario actualizado');
      } else {
        await api.post('/users', formData);
        toast.success('Usuario creado');
      }
      setIsFormOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/users/${userToDelete.id}`);
      toast.success('Usuario eliminado');
      fetchUsers();
    } catch (error) {
      toast.error('Error al eliminar usuario');
    }
  };

  const RoleBadge = ({ role }) => {
    const variants = { admin: 'primary', encargado: 'warning', cajero: 'default' };
    return <Badge variant={variants[role] || 'default'} className="uppercase">{role}</Badge>;
  };

  const columns = [
    { header: 'Nombre', accessorKey: 'name', className: 'font-semibold text-dark-50' },
    { header: 'Email', accessorKey: 'email' },
    { header: 'Rol', cell: (row) => <RoleBadge role={row.role} /> },
    { header: 'Sucursal ID', cell: (row) => row.branch_id ? <span className="text-xs text-dark-400">{row.branch_id.substring(0,8)}...</span> : <span className="text-xs text-dark-500">- Global -</span> },
    {
      header: 'Acciones',
      cell: (row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => { setEditingUser(row); setIsFormOpen(true); }}
            className="p-1.5 bg-dark-800 hover:bg-primary-900/50 text-primary-400 rounded-lg transition-colors"
            title="Editar"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setUserToChangePwd(row); setIsPwdOpen(true); }}
            className="p-1.5 bg-dark-800 hover:bg-blue-900/50 text-blue-400 rounded-lg transition-colors"
            title="Cambiar Contraseña"
          >
            <KeyRound className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setUserToDelete(row); setIsDeleteOpen(true); }}
            className="p-1.5 bg-dark-800 hover:bg-red-900/50 text-red-400 rounded-lg transition-colors"
            title="Eliminar"
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
          <p className="text-xs text-dark-400">{row.email}</p>
        </div>
        <div className="flex space-x-2">
          <button onClick={() => { setEditingUser(row); setIsFormOpen(true); }} className="text-primary-400 p-1">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => { setUserToChangePwd(row); setIsPwdOpen(true); }} className="text-blue-400 p-1">
            <KeyRound className="w-4 h-4" />
          </button>
          <button onClick={() => { setUserToDelete(row); setIsDeleteOpen(true); }} className="text-red-400 p-1">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <RoleBadge role={row.role} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-50">Usuarios del Sistema</h1>
          <p className="text-sm text-dark-400">Gestiona accesos y roles del personal</p>
        </div>
        <button
          onClick={() => { setEditingUser(null); setIsFormOpen(true); }}
          className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Usuario</span>
        </button>
      </div>

      {users.length === 0 && !isLoading ? (
        <EmptyState
          icon={UsersIcon}
          title="No hay usuarios"
          description="Comienza creando cuentas para tu equipo de trabajo."
          action={
            <button
              onClick={() => { setEditingUser(null); setIsFormOpen(true); }}
              className="mt-4 bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg"
            >
              Crear Usuario
            </button>
          }
        />
      ) : (
        <DataTable columns={columns} data={users} mobileRender={mobileRender} isLoading={isLoading} />
      )}

      {/* Modals */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
      >
        <UserForm 
          initialData={editingUser} 
          onSubmit={handleSave} 
          onCancel={() => setIsFormOpen(false)} 
        />
      </Modal>

      <Modal
        isOpen={isPwdOpen}
        onClose={() => setIsPwdOpen(false)}
        title={`Cambiar Contraseña - ${userToChangePwd?.name}`}
      >
        <ChangePasswordModal 
          user={userToChangePwd}
          onSuccess={() => setIsPwdOpen(false)}
          onClose={() => setIsPwdOpen(false)}
        />
      </Modal>

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar Usuario"
        message={`¿Estás seguro de eliminar a ${userToDelete?.name}? Perderá el acceso al sistema.`}
        isDanger={true}
      />
    </div>
  );
};

export default UsersList;
