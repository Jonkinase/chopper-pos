import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { useAuthStore } from '../../store/authStore';
import DataTable from '../../components/ui/DataTable';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmModal from '../../components/ui/ConfirmModal';
import Badge from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/formatters';
import { ShoppingCart, Ban, FileText, Search, Plus } from 'lucide-react';
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

  const fetchSales = async () => {
    if (!activeBranch) return;
    setIsLoading(true);
    try {
      const { data } = await api.get(`/sales?sucursal_id=${activeBranch}`);
      setSales(data.data);
    } catch (error) {
      toast.error('Error al cargar ventas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [activeBranch]);

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
    { header: 'Cliente', cell: (row) => row.customer_name || 'Consumidor Final', className: 'font-semibold text-dark-50' },
    { header: 'Total', cell: (row) => <span className="font-bold text-primary-400">{formatCurrency(row.total)}</span> },
    { header: 'Pago', cell: (row) => <span className="capitalize text-xs text-dark-300">{row.payment_method.replace('_', ' ')}</span> },
    { header: 'Estado', cell: (row) => <StatusBadge status={row.status} /> },
    {
      header: 'Acciones',
      cell: (row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => viewDetail(row.id)}
            className="p-1.5 bg-dark-800 hover:bg-dark-700 text-dark-300 rounded-lg transition-colors"
            title="Ver Detalle"
          >
            <FileText className="w-4 h-4" />
          </button>
          {row.status !== 'anulada' && (user.role === 'admin' || user.role === 'encargado') && (
            <button
              onClick={() => { setSaleToCancel(row); setIsCancelOpen(true); }}
              className="p-1.5 bg-dark-800 hover:bg-red-900/50 text-red-400 rounded-lg transition-colors"
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
          <h3 className="font-bold text-dark-50">{row.customer_name || 'Consumidor Final'}</h3>
          <p className="text-xs text-dark-400">{new Date(row.created_at).toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-primary-400">{formatCurrency(row.total)}</p>
          <StatusBadge status={row.status} />
        </div>
      </div>
      <div className="flex space-x-2 mt-4 pt-4 border-t border-dark-800">
        <button
          onClick={() => viewDetail(row.id)}
          className="flex-1 flex justify-center items-center space-x-2 bg-dark-800 py-1.5 rounded-lg text-dark-200 text-sm"
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
          <h1 className="text-2xl font-bold text-dark-50">Historial de Ventas</h1>
          <p className="text-sm text-dark-400">Consulta las operaciones realizadas</p>
        </div>
        <button
          onClick={() => navigate('/sales/new')}
          className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Nueva Venta</span>
        </button>
      </div>

      {sales.length === 0 && !isLoading ? (
        <EmptyState
          icon={ShoppingCart}
          title="No hay ventas registradas"
          description="Aún no se han realizado ventas en esta sucursal."
          action={
            <button
              onClick={() => navigate('/sales/new')}
              className="mt-4 bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg"
            >
              Ir al POS
            </button>
          }
        />
      ) : (
        <DataTable columns={columns} data={sales} mobileRender={mobileRender} isLoading={isLoading} />
      )}

      {/* Cancel Modal */}
      <Modal isOpen={isCancelOpen} onClose={() => setIsCancelOpen(false)} title="Anular Venta">
        <div className="space-y-4 pt-2">
          <p className="text-sm text-dark-300">
            Estás a punto de anular la venta por <b>{saleToCancel && formatCurrency(saleToCancel.total)}</b>. 
            El stock será devuelto al inventario.
          </p>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">Motivo de Anulación</label>
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-dark-50 focus:ring-2 focus:ring-red-500 outline-none"
              placeholder="Ej: Error de carga, cliente devolvió..."
            />
          </div>
          <div className="flex space-x-3 pt-4 border-t border-dark-800">
            <button onClick={() => setIsCancelOpen(false)} className="flex-1 py-2 bg-dark-800 hover:bg-dark-700 rounded-lg text-dark-200">Cancelar</button>
            <button onClick={handleCancelSale} className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium">Confirmar Anulación</button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title={`Detalle de Venta #${saleDetail?.id.substring(0,8)}`} maxWidth="max-w-2xl">
        {saleDetail && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 bg-dark-800 p-4 rounded-xl text-sm">
              <div>
                <p className="text-dark-400">Fecha</p>
                <p className="font-medium text-dark-50">{new Date(saleDetail.created_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-dark-400">Vendedor</p>
                <p className="font-medium text-dark-50">{saleDetail.user_name}</p>
              </div>
              <div>
                <p className="text-dark-400">Cliente</p>
                <p className="font-medium text-dark-50">{saleDetail.customer_name || 'Consumidor Final'}</p>
              </div>
              <div>
                <p className="text-dark-400">Método de Pago</p>
                <p className="font-medium text-dark-50 capitalize">{saleDetail.payment_method.replace('_', ' ')}</p>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-dark-50 mb-3 border-b border-dark-800 pb-2">Productos</h3>
              <div className="space-y-3">
                {saleDetail.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <div>
                      <p className="font-medium text-dark-50">{item.product_name}</p>
                      <p className="text-xs text-dark-400">{item.quantity} {item.unidad_display} x {formatCurrency(item.unit_price_applied)} <span className="uppercase text-[9px] bg-dark-700 px-1 rounded ml-1">{item.price_type}</span></p>
                    </div>
                    <span className="font-bold text-dark-200">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-dark-800">
              <span className="text-dark-300 font-bold">TOTAL</span>
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
