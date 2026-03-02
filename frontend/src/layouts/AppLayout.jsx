import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../api/api';
import {
  LayoutDashboard,
  Store,
  Users,
  Package,
  ClipboardList,
  ShoppingCart,
  FileText,
  Users2,
  Wallet,
  PieChart,
  LogOut,
  Menu,
  X,
  MapPin,
  Bell,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [branches, setBranches] = useState([]);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [localBranchName, setLocalBranchName] = useState('Cargando sucursal...');
  const { user, logout, activeBranch, setActiveBranch } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchBranches();
    } else if (activeBranch) {
      fetchSingleBranch(activeBranch);
    }
  }, [user, activeBranch]);

  useEffect(() => {
    if (user?.role === 'admin' && !activeBranch) {
      setShowBranchModal(true);
    }
  }, [user, activeBranch]);

  const fetchBranches = async () => {
    try {
      const { data } = await api.get('/branches');
      setBranches(data.data);
    } catch (error) {
      console.error('Error fetching branches', error);
    }
  };

  const fetchSingleBranch = async (id) => {
    try {
      // Intentamos obtener el detalle de la sucursal
      const { data } = await api.get(`/branches/${id}`);
      setLocalBranchName(data.data?.name || 'Mi Sucursal');
    } catch (error) {
      setLocalBranchName('Mi Sucursal');
    }
  };

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'encargado'] },
    { name: 'Sucursales', path: '/branches', icon: Store, roles: ['admin'] },
    { name: 'Usuarios', path: '/users', icon: Users, roles: ['admin', 'encargado'] },
    { name: 'Productos', path: '/products', icon: Package, roles: ['admin', 'encargado'] },
    { name: 'Inventario', path: '/inventory', icon: ClipboardList, roles: ['admin', 'encargado'] },
    { name: 'Ventas', path: '/sales', icon: ShoppingCart, roles: ['admin', 'encargado', 'cajero'] },
    { name: 'Presupuestos', path: '/quotes', icon: FileText, roles: ['admin', 'encargado', 'cajero'] },
    { name: 'Clientes', path: '/clients', icon: Users2, roles: ['admin', 'encargado', 'cajero'] },
    { name: 'Métricas', path: '/metrics', icon: PieChart, roles: ['admin', 'encargado'] },
  ].filter(item => item.roles.includes(user?.role));

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Sesión cerrada');
  };

  const activeBranchName = user?.role === 'admin' 
    ? (branches.find(b => b.id === activeBranch)?.name || 'Sin sucursal')
    : localBranchName;

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden bg-dark-900 border-b border-dark-800 p-4 flex items-center justify-between sticky top-0 z-50">
        <h1 className="text-xl font-bold text-primary-500">Chopper POS</h1>
        <button onClick={() => setSidebarOpen(true)}>
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-dark-900 border-r border-dark-800 transition-transform duration-300 flex flex-col md:relative md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex items-center justify-between shrink-0">
          <h1 className="text-2xl font-bold text-primary-500 hidden md:block">Chopper POS</h1>
          <button className="md:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20'
                      : 'text-dark-400 hover:bg-dark-800 hover:text-dark-50'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="shrink-0 p-4 border-t border-dark-800 bg-dark-900">
          <div className="flex items-center space-x-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center font-bold text-white shrink-0">
              {user?.name?.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-dark-50 truncate">{user?.name}</p>
              <p className="text-xs text-dark-400 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="hidden md:flex bg-dark-900/50 backdrop-blur-md border-b border-dark-800 p-4 items-center justify-between sticky top-0 z-30">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-dark-800 rounded-full text-sm text-dark-300">
              <MapPin className="w-4 h-4 text-primary-500" />
              <span className="font-medium">{activeBranchName}</span>
              {user?.role === 'admin' && (
                <button 
                  onClick={() => setShowBranchModal(true)}
                  className="ml-2 p-1 hover:bg-dark-700 rounded-full text-primary-400 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-dark-400 hover:bg-dark-800 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              {/* Indicator if low stock? */}
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-dark-900"></span>
            </button>
          </div>
        </header>

        <div className="p-4 md:p-8 flex-1">
          <Outlet />
        </div>
      </main>

      {/* Branch Selector Modal (Simple) */}
      {showBranchModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-dark-900 w-full max-w-md rounded-2xl shadow-2xl border border-dark-800 p-6">
            <h2 className="text-xl font-bold text-dark-50 mb-4">Seleccionar Sucursal</h2>
            <div className="space-y-2">
              {branches.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setActiveBranch(b.id);
                    setShowBranchModal(false);
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    activeBranch === b.id
                      ? 'bg-primary-600/20 border-primary-500 text-primary-100'
                      : 'bg-dark-800 border-dark-700 text-dark-300 hover:border-dark-600'
                  }`}
                >
                  <p className="font-semibold">{b.name}</p>
                  <p className="text-xs opacity-70">{b.address}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppLayout;
