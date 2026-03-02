import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { useAuthStore } from '../../store/authStore';
import DataTable from '../../components/ui/DataTable';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/formatters';
import { FileText, Plus, Edit, Trash2, Ban, CheckCircle2, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';

const QuotesList = () => {
  const navigate = useNavigate();
  const { activeBranch, user } = useAuthStore();
  const [quotes, setQuotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [quoteDetail, setQuoteDetail] = useState(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState(null);

  const fetchQuotes = async () => {
    if (!activeBranch) return;
    setIsLoading(true);
    try {
      let url = `/quotes?sucursal_id=${activeBranch}`;
      if (statusFilter !== 'all') url += `&estado=${statusFilter}`;
      const { data } = await api.get(url);
      setQuotes(data.data);
    } catch (error) {
      toast.error('Error al cargar presupuestos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, [activeBranch, statusFilter]);

  const viewDetail = async (id) => {
    try {
      const { data } = await api.get(`/quotes/${id}`);
      setQuoteDetail(data.data);
      setIsDetailOpen(true);
    } catch (error) {
      toast.error('Error al cargar detalle');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const response = await api.put(`/quotes/${id}/status`, { status });
      toast.success('Estado actualizado');
      fetchQuotes();
      if (quoteDetail && quoteDetail.id === id) {
        setQuoteDetail(response.data.data);
      }
    } catch (error) {
      toast.error('Error al cambiar estado');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/quotes/${quoteToDelete.id}`);
      toast.success('Presupuesto eliminado');
      fetchQuotes();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const downloadPDF = async (id) => {
    try {
      const response = await api.get(`/quotes/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Presupuesto_${id.substring(0,8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      toast.error('Error al descargar PDF');
    }
  };

  const QuoteStatusBadge = ({ status }) => {
    const variants = {
      borrador: 'default',
      enviado: 'info',
      aprobado: 'success',
      rechazado: 'danger',
      convertido_a_venta: 'primary'
    };
    return <Badge variant={variants[status] || 'default'} className="uppercase">{status.replace(/_/g, ' ')}</Badge>;
  };

  const columns = [
    { header: 'Nº', cell: (row) => <span className="text-xs text-dark-400 font-mono">{row.id.substring(0,8)}</span> },
    { header: 'Fecha', cell: (row) => new Date(row.created_at).toLocaleDateString() },
    { header: 'Cliente', cell: (row) => row.customer_name || 'Consumidor Final', className: 'font-semibold text-dark-50' },
    { header: 'Total', cell: (row) => <span className="font-bold text-primary-400">{formatCurrency(row.total)}</span> },
    { header: 'Estado', cell: (row) => <QuoteStatusBadge status={row.status} /> },
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
          <button
            onClick={() => downloadPDF(row.id)}
            className="p-1.5 bg-dark-800 hover:bg-blue-900/50 text-blue-400 rounded-lg transition-colors"
            title="Descargar PDF"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const mobileRender = (row) => (
    <div>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-dark-50">{row.customer_name || 'Consumidor Final'}</h3>
          <p className="text-xs text-dark-400">#{row.id.substring(0,8)} • {new Date(row.created_at).toLocaleDateString()}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-primary-400 mb-1">{formatCurrency(row.total)}</p>
          <QuoteStatusBadge status={row.status} />
        </div>
      </div>
      <div className="flex space-x-2 mt-4 pt-4 border-t border-dark-800">
        <button
          onClick={() => viewDetail(row.id)}
          className="flex-1 flex justify-center items-center space-x-2 bg-dark-800 py-1.5 rounded-lg text-dark-200 text-sm"
        >
          <FileText className="w-4 h-4" />
          <span>Detalle / Acciones</span>
        </button>
        <button
          onClick={() => downloadPDF(row.id)}
          className="flex justify-center items-center px-3 bg-dark-800 py-1.5 rounded-lg text-blue-400 text-sm"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-50">Presupuestos</h1>
          <p className="text-sm text-dark-400">Gestión de cotizaciones</p>
        </div>
        <button
          onClick={() => navigate('/quotes/new')}
          className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Presupuesto</span>
        </button>
      </div>

      <div className="flex space-x-2 bg-dark-900 p-2 rounded-xl border border-dark-800 overflow-x-auto">
        {['all', 'borrador', 'enviado', 'aprobado', 'rechazado', 'convertido_a_venta'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize whitespace-nowrap transition-colors ${
              statusFilter === s ? 'bg-dark-700 text-white' : 'text-dark-400 hover:bg-dark-800 hover:text-dark-200'
            }`}
          >
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {quotes.length === 0 && !isLoading ? (
        <EmptyState
          icon={FileText}
          title="No hay presupuestos"
          description="Aún no se han generado cotizaciones con este filtro."
        />
      ) : (
        <DataTable columns={columns} data={quotes} mobileRender={mobileRender} isLoading={isLoading} />
      )}

      {/* Detail Modal with Actions */}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title={`Presupuesto #${quoteDetail?.id.substring(0,8)}`} maxWidth="max-w-2xl">
        {quoteDetail && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-dark-800 p-4 rounded-xl">
              <div>
                <p className="text-dark-400 text-xs">Estado Actual</p>
                <QuoteStatusBadge status={quoteDetail.status} />
              </div>
              <div className="text-right">
                <p className="text-dark-400 text-xs">Total</p>
                <p className="text-xl font-bold text-primary-400">{formatCurrency(quoteDetail.total)}</p>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-dark-50 mb-3 border-b border-dark-800 pb-2">Productos ({quoteDetail.items.length})</h3>
              <div className="space-y-2">
                {quoteDetail.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm border-b border-dark-800/50 pb-2 last:border-0">
                    <div>
                      <p className="font-medium text-dark-50">{item.product_name}</p>
                      <p className="text-xs text-dark-400">{item.quantity} {item.unit_type} x {formatCurrency(item.unit_price_applied)}</p>
                    </div>
                    <span className="font-bold text-dark-200">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions Toolbar based on status */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-dark-800">
              {quoteDetail.status === 'borrador' && (
                <>
                  <button onClick={() => handleStatusChange(quoteDetail.id, 'enviado')} className="flex-1 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg font-medium text-sm transition-colors border border-blue-600/30">Marcar como Enviado</button>
                  <button onClick={() => { setIsDetailOpen(false); setQuoteToDelete(quoteDetail); setIsDeleteOpen(true); }} className="flex-1 py-2 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded-lg font-medium text-sm transition-colors border border-red-900/50">Eliminar</button>
                </>
              )}
              {quoteDetail.status === 'enviado' && (
                <>
                  <button onClick={() => handleStatusChange(quoteDetail.id, 'aprobado')} className="flex-1 py-2 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 rounded-lg font-medium text-sm transition-colors border border-emerald-600/30 flex justify-center items-center"><CheckCircle2 className="w-4 h-4 mr-1"/> Aprobar</button>
                  <button onClick={() => handleStatusChange(quoteDetail.id, 'rechazado')} className="flex-1 py-2 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded-lg font-medium text-sm transition-colors border border-red-900/50"><Ban className="w-4 h-4 mr-1 inline"/> Rechazar</button>
                </>
              )}
              {quoteDetail.status === 'aprobado' && (
                <button 
                  onClick={async () => {
                    try {
                      await api.post(`/quotes/${quoteDetail.id}/convert-to-sale`, { tipo_pago: 'contado' });
                      toast.success('¡Presupuesto convertido a Venta!');
                      fetchQuotes();
                      setIsDetailOpen(false);
                    } catch(e) {
                      toast.error('Error al convertir');
                    }
                  }} 
                  className="w-full py-3 bg-primary-600 text-white hover:bg-primary-500 rounded-lg font-bold transition-colors shadow-lg shadow-primary-900/20"
                >
                  Convertir a Venta (Contado)
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar Presupuesto"
        message="¿Estás seguro de eliminar este presupuesto en borrador?"
        isDanger={true}
      />
    </div>
  );
};

export default QuotesList;
