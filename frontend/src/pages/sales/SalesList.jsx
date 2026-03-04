import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { useAuthStore } from '../../store/authStore';
import DataTable from '../../components/ui/DataTable';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmModal from '../../components/ui/ConfirmModal';
import Badge from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/formatters';
import { ShoppingCart, Ban, FileText, Search, Plus, Filter, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';

const SalesList = () => {
  const navigate = useNavigate();
  const { activeBranch, user } = useAuthStore();
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [saleToCancel, setSaleToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [saleDetail, setSaleDetail] = useState(null);

  // Filters state
  const today = new Date().toISOString().split('T')[0];
  const [fechaDesde, setFechaDesde] = useState(today);
  const [fechaHasta, setFechaHasta] = useState(today);
  const [search, setSearch] = useState('');
  const [tipoPago, setTipoPago] = useState('');
  const [estado, setEstado] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchSales = async () => {
    if (!activeBranch) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        sucursal_id: activeBranch,
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
        ...(search && { search }),
        ...(tipoPago && { tipo_pago: tipoPago }),
        ...(estado && { estado })
      });
      const { data } = await api.get(`/sales?${params.toString()}`);
      setSales(data.data);
    } catch (error) {
      toast.error('Error al cargar ventas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchSales();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [activeBranch, fechaDesde, fechaHasta, search, tipoPago, estado]);

  const handleClearFilters = () => {
    setFechaDesde(today);
    setFechaHasta(today);
    setSearch('');
    setTipoPago('');
    setEstado('');
  };

  const activeFiltersCount = 
    (search ? 1 : 0) + 
    (tipoPago ? 1 : 0) + 
    (estado ? 1 : 0) + 
    (fechaDesde !== today ? 1 : 0) + 
    (fechaHasta !== today ? 1 : 0);

  const handleCancelSale = async () => {
    if (!cancelReason.trim()) {
      return toast.error('El motivo de anulación es obligatorio');
    }
    try {
      await api.put(`/sales/${saleToCancel.id}/cancel`, { reason: cancelReason });
      toast.success('Venta anulada correctamente');
      setIsCancelOpen(false);
      setSaleToCancel(null);
      setCancelReason('');
      fetchSales();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al anular venta');
    }
  };

  const viewDetail = async (id) => {
    try {
      const { data } = await api.get(`/sales/${id}`);
      setSaleDetail(data.data);
      setIsDetailOpen(true);
    } catch (error) {
      toast.error('Error al cargar detalle');
    }
  };

  const StatusBadge = ({ status }) => {
    return status === 'completada' 
      ? <Badge variant="success">COMPLETADA</Badge>
      : <Badge variant="danger">ANULADA</Badge>;
  };

  const columns = [
    { header: 'Fecha', cell: (row) => new Date(row.created_at).toLocaleDateString() + ' ' + new Date(row.created_at).toLocaleTimeString().slice(0, 5) },
    { header: 'Cliente', cell: (row) => row.customer_name || 'Consumidor Final', className: 'font-semibold text-slate-900 dark:text-slate-100' },
    { header: 'Total', cell: (row) => <span className="font-bold text-primary-400">{formatCurrency(row.total)}</span> },
    { header: 'Pago', cell: (row) => <span className="capitalize text-xs text-slate-700 dark:text-slate-300">{row.payment_method.replace('_', ' ')}</span> },
    { header: 'Estado', cell: (row) => <StatusBadge status={row.status} /> },
    {
      header: 'Acciones',
      cell: (row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => viewDetail(row.id)}
            className="p-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
            title="Ver Detalle"
          >
            <FileText className="w-4 h-4" />
          </button>
          {row.status !== 'anulada' && (user.role === 'admin' || user.role === 'encargado') && (
            <button
              onClick={() => { setSaleToCancel(row); setIsCancelOpen(true); }}
              className="p-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-red-900/50 text-red-400 rounded-lg transition-colors"
              title="Anular"
            >
              <Ban className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const mobileRender = (row) => (
    <div>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-slate-100">{row.customer_name || 'Consumidor Final'}</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">{new Date(row.created_at).toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-primary-400">{formatCurrency(row.total)}</p>
          <StatusBadge status={row.status} />
        </div>
      </div>
      <div className="flex space-x-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={() => viewDetail(row.id)}
          className="flex-1 flex justify-center items-center space-x-2 bg-slate-100 dark:bg-slate-700 py-1.5 rounded-lg text-slate-800 dark:text-slate-200 text-sm"
        >
          <FileText className="w-4 h-4" />
          <span>Detalle</span>
        </button>
        {row.status !== 'anulada' && (user.role === 'admin' || user.role === 'encargado') && (
          <button
            onClick={() => { setSaleToCancel(row); setIsCancelOpen(true); }}
            className="flex-1 flex justify-center items-center space-x-2 bg-red-900/20 py-1.5 rounded-lg text-red-400 text-sm"
          >
            <Ban className="w-4 h-4" />
            <span>Anular</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Historial de Ventas</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Consulta las operaciones realizadas</p>
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`md:hidden flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${showFilters || activeFiltersCount > 0 ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
          >
            <Filter className="w-4 h-4" />
            <span>Filtros {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
          </button>
          <button
            onClick={() => navigate('/sales/new')}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>Nueva Venta</span>
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      <div className={`${showFilters ? 'block' : 'hidden'} md:block bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4`}>
        <div className="flex items-center justify-between md:hidden mb-2">
          <h3 className="font-bold text-slate-900 dark:text-slate-100">Filtros de búsqueda</h3>
          <button onClick={() => setShowFilters(false)} className="p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar cliente o Nº venta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          <div>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none"
              title="Fecha Desde"
            />
          </div>

          <div>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none"
              title="Fecha Hasta"
            />
          </div>

          <div className="flex space-x-2">
            <select
              value={tipoPago}
              onChange={(e) => setTipoPago(e.target.value)}
              className="w-1/2 px-2 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="">Todo Pago</option>
              <option value="contado">Contado</option>
              <option value="cuenta_corriente">Cta. Corriente</option>
            </select>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="w-1/2 px-2 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="">Todo Estado</option>
              <option value="completada">Completada</option>
              <option value="anulada">Anulada</option>
            </select>
          </div>
        </div>

        {activeFiltersCount > 0 && (
          <div className="flex justify-end pt-2">
            <button
              onClick={handleClearFilters}
              className="text-sm text-red-500 hover:text-red-600 font-medium transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center text-sm text-slate-600 dark:text-slate-400 px-1">
        <span>Mostrando {sales.length} ventas</span>
      </div>

      {sales.length === 0 && !isLoading ? (
        <EmptyState
          icon={ShoppingCart}
          title={activeFiltersCount > 0 ? "No se encontraron ventas" : "No hay ventas registradas"}
          description={activeFiltersCount > 0 ? "Prueba cambiando los filtros de búsqueda o el rango de fechas." : "Aún no se han realizado ventas en esta sucursal."}
          action={
            !activeFiltersCount && (
              <button
                onClick={() => navigate('/sales/new')}
                className="mt-4 bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg"
              >
                Ir al POS
              </button>
            )
          }
        />
      ) : (
        <DataTable columns={columns} data={sales} mobileRender={mobileRender} isLoading={isLoading} />
      )}

      {/* Cancel Modal */}
      <Modal isOpen={isCancelOpen} onClose={() => setIsCancelOpen(false)} title="Anular Venta">
        <div className="space-y-4 pt-2">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Estás a punto de anular la venta por <b>{saleToCancel && formatCurrency(saleToCancel.total)}</b>. 
            El stock será devuelto al inventario.
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Motivo de Anulación</label>
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-red-500 outline-none"
              placeholder="Ej: Error de carga, cliente devolvió..."
            />
          </div>
          <div className="flex space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button onClick={() => setIsCancelOpen(false)} className="flex-1 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:bg-slate-600 rounded-lg text-slate-800 dark:text-slate-200">Cancelar</button>
            <button onClick={handleCancelSale} className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium">Confirmar Anulación</button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title={`Detalle de Venta #${saleDetail?.id.substring(0,8)}`} maxWidth="max-w-2xl">
        {saleDetail && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 bg-slate-100 dark:bg-slate-700 p-4 rounded-xl text-sm">
              <div>
                <p className="text-slate-600 dark:text-slate-400">Fecha</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">{new Date(saleDetail.created_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-600 dark:text-slate-400">Vendedor</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">{saleDetail.user_name}</p>
              </div>
              <div>
                <p className="text-slate-600 dark:text-slate-400">Cliente</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">{saleDetail.customer_name || 'Consumidor Final'}</p>
              </div>
              <div>
                <p className="text-slate-600 dark:text-slate-400">Método de Pago</p>
                <p className="font-medium text-slate-900 dark:text-slate-100 capitalize">{saleDetail.payment_method.replace('_', ' ')}</p>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">Productos</h3>
              <div className="space-y-3">
                {saleDetail.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{item.product_name}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{item.quantity} {item.unidad_display} x {formatCurrency(item.unit_price_applied)} <span className="uppercase text-[9px] bg-slate-200 dark:bg-slate-600 px-1 rounded ml-1">{item.price_type}</span></p>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700">
              <span className="text-slate-700 dark:text-slate-300 font-bold">TOTAL</span>
              <span className="text-2xl font-black text-primary-400">{formatCurrency(saleDetail.total)}</span>
            </div>

            {saleDetail.status === 'anulada' && (
              <div className="bg-red-900/20 border border-red-900/50 p-3 rounded-lg text-center text-red-400 text-sm font-medium">
                ESTA VENTA SE ENCUENTRA ANULADA
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SalesList;
