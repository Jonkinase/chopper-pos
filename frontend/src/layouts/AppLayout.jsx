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
  ChevronRight,
  Sun,
  Moon,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useDarkMode } from '../hooks/useDarkMode';
import { useConfigStore } from '../store/configStore';
import NotificationBell from '../components/ui/NotificationBell';

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [branches, setBranches] = useState([]);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [localBranchName, setLocalBranchName] = useState('Cargando sucursal...');
  const { user, logout, activeBranch, setActiveBranch } = useAuthStore();
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { config, fetchConfig } = useConfigStore();

  useEffect(() => {
    fetchConfig();
  }, []);

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
      const { data } = await api.get(`/branches/${id}`);
      setLocalBranchName(data.data?.name || 'Mi Sucursal');
    } catch (error) {
      setLocalBranchName('Mi Sucursal');
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchBranches();
    }
  }, [user?.role]);

  useEffect(() => {
    if (activeBranch && user?.role !== 'admin') {
      fetchSingleBranch(activeBranch);
    }
  }, [activeBranch, user?.role]);

  useEffect(() => {
    if (user?.role === 'admin' && !activeBranch && branches.length > 0) {
      setShowBranchModal(true);
    }
  }, [user, activeBranch, branches]);

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
    { name: 'Configuración', path: '/config', icon: Settings, roles: ['admin'] },
  ].filter(item => item.roles.includes(user?.role));

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Error al cerrar sesión en el servidor', err);
    }
    logout();
    navigate('/login');
    toast.success('Sesión cerrada');
  };

  const activeBranchName = user?.role === 'admin'
    ? (branches.find(b => b.id === activeBranch)?.name || 'Sin sucursal')
    : localBranchName;

  const logoUrl = config.sidebar_logo_path
  ? config.sidebar_logo_path.startsWith('data:')
    ? config.sidebar_logo_path
    : `${import.meta.env.VITE_API_URL.replace('/api', '')}${config.sidebar_logo_path}`
  : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row transition-colors duration-200">
      {/* Mobile Header */}
      <header className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between sticky top-0 z-50">
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="w-[140px] h-auto object-contain" />
        ) : (
          <h1 className="text-xl font-bold text-primary-500 dark:text-primary-400">Chopper POS</h1>
        )}
        <div className="flex items-center space-x-2">
          <button onClick={toggleDarkMode} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-700 dark:text-slate-100">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 flex flex-col md:relative md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex items-center justify-between shrink-0">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-[160px] h-auto object-contain hidden md:block" />
          ) : (
            <h1 className="text-2xl font-bold text-primary-500 dark:text-primary-400 hidden md:block">Chopper POS</h1>
          )}
          <button className="md:hidden text-slate-500 dark:text-slate-400" onClick={() => setSidebarOpen(false)}>
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
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="shrink-0 p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center space-x-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center font-bold text-white shrink-0">
              {user?.name?.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 rounded-lg transition-all"
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
        <header className="hidden md:flex bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4 items-center justify-between sticky top-0 z-30">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-sm text-slate-700 dark:text-slate-300">
              <MapPin className="w-4 h-4 text-primary-500" />
              <span className="font-medium">{activeBranchName}</span>
              {user?.role === 'admin' && (
                <button 
                  onClick={() => setShowBranchModal(true)}
                  className="ml-2 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-primary-400 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button 
              onClick={toggleDarkMode}
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              title="Alternar tema"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <NotificationBell />
          </div>
        </header>

        <div className="p-4 md:p-8 flex-1">
          <Outlet />
        </div>
      </main>

      {/* Branch Selector Modal (Simple) */}
      {showBranchModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Seleccionar Sucursal</h2>
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
                      ? 'bg-primary-50 dark:bg-primary-600/20 border-primary-500 text-primary-700 dark:text-primary-100'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
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
