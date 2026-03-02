import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import DataTable from '../../components/ui/DataTable';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import AdjustStockModal from './AdjustStockModal';
import { useAuthStore } from '../../store/authStore';
import { ClipboardList, AlertCircle, History, SlidersHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';

const InventoryList = () => {
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { activeBranch } = useAuthStore();
  
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [productToAdjust, setProductToAdjust] = useState(null);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchInventory = async () => {
    if (!activeBranch) return;
    setIsLoading(true);
    try {
      const { data } = await api.get(`/inventory?sucursal_id=${activeBranch}`);
      setInventory(data.data);
    } catch (error) {
      toast.error('Error al cargar inventario');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [activeBranch]);

  const viewHistory = async (product) => {
    setHistoryLoading(true);
    setIsHistoryOpen(true);
    try {
      const { data } = await api.get(`/inventory/${product.product_id}/movements?sucursal_id=${activeBranch}`);
      setHistoryData(data.data);
    } catch (error) {
      toast.error('Error al cargar historial');
      setIsHistoryOpen(false);
    } finally {
      setHistoryLoading(false);
    }
  };

  const StockBadge = ({ actual }) => {
    const isLow = parseFloat(actual) <= 10;
    return (
      <div className={`flex items-center space-x-1 ${isLow ? 'text-red-400' : 'text-emerald-400'}`}>
        {isLow && <AlertCircle className="w-4 h-4" />}
        <span className="font-bold">{actual}</span>
      </div>
    );
  };

  const columns = [
    { header: 'Producto', cell: (row) => <span className="font-semibold text-dark-50">{row.product_name}</span> },
    { header: 'Tipo', cell: (row) => <Badge className="uppercase">{row.product_type}</Badge> },
    { header: 'Stock Actual', cell: (row) => (
      <div className="flex items-baseline space-x-1">
        <StockBadge actual={row.stock_actual} />
      </div>
    )},
    {
      header: 'Acciones',
      cell: (row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => { setProductToAdjust(row); setIsAdjustOpen(true); }}
            className="flex items-center space-x-1 px-2 py-1.5 bg-dark-800 hover:bg-primary-900/50 text-primary-400 rounded-lg transition-colors text-sm font-medium"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Ajustar</span>
          </button>
          <button
            onClick={() => viewHistory(row)}
            className="p-1.5 bg-dark-800 hover:bg-dark-700 text-dark-300 rounded-lg transition-colors"
            title="Historial de movimientos"
          >
            <History className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const mobileRender = (row) => (
    <div>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-dark-50">{row.product_name}</h3>
          <p className="text-xs text-dark-400 uppercase">{row.product_type}</p>
        </div>
        <div className="text-right">
           <StockBadge actual={row.stock_actual} />
        </div>
      </div>
      <div className="flex space-x-2 mt-4 pt-4 border-t border-dark-800">
        <button
          onClick={() => { setProductToAdjust(row); setIsAdjustOpen(true); }}
          className="flex-1 flex justify-center items-center space-x-2 bg-dark-800 py-1.5 rounded-lg text-primary-400 text-sm"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Ajustar</span>
        </button>
        <button
          onClick={() => viewHistory(row)}
          className="flex-1 flex justify-center items-center space-x-2 bg-dark-800 py-1.5 rounded-lg text-dark-300 text-sm"
        >
          <History className="w-4 h-4" />
          <span>Historial</span>
        </button>
      </div>
    </div>
  );

  if (!activeBranch) return <div className="text-dark-400">Seleccione una sucursal para ver el inventario.</div>;

  const lowStockCount = inventory.filter(i => parseFloat(i.stock_actual) <= parseFloat(i.stock_minimo)).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-50">Inventario</h1>
          <p className="text-sm text-dark-400">Control de stock de la sucursal activa</p>
        </div>
        {lowStockCount > 0 && (
          <div className="flex items-center space-x-2 bg-red-900/30 text-red-400 px-3 py-1.5 rounded-full text-sm font-medium border border-red-900/50">
            <AlertCircle className="w-4 h-4" />
            <span>{lowStockCount} productos con stock bajo</span>
          </div>
        )}
      </div>

      {inventory.length === 0 && !isLoading ? (
        <EmptyState
          icon={ClipboardList}
          title="Inventario vacío"
          description="Los productos aparecerán aquí automáticamente al ser creados en el catálogo."
        />
      ) : (
        <DataTable columns={columns} data={inventory} mobileRender={mobileRender} isLoading={isLoading} />
      )}

      {/* Modals */}
      <Modal
        isOpen={isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
        title="Ajuste Manual de Stock"
      >
        {productToAdjust && (
          <AdjustStockModal 
            product={productToAdjust} 
            branchId={activeBranch}
            onSuccess={() => {
              setIsAdjustOpen(false);
              fetchInventory();
            }}
            onClose={() => setIsAdjustOpen(false)}
          />
        )}
      </Modal>

      <Modal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        title="Historial de Movimientos"
        maxWidth="max-w-2xl"
      >
        {historyLoading ? (
          <div className="text-center py-8 text-dark-400">Cargando historial...</div>
        ) : (
          <div className="space-y-4">
            {historyData.length === 0 ? (
              <p className="text-center text-dark-400">No hay movimientos registrados.</p>
            ) : (
              <div className="relative border-l border-dark-700 ml-3 space-y-6">
                {historyData.map((mov) => (
                  <div key={mov.id} className="pl-6 relative">
                    <div className={`absolute w-3 h-3 rounded-full -left-[6.5px] top-1.5 border-2 border-dark-900 ${
                      mov.quantity > 0 ? 'bg-emerald-500' : 'bg-red-500'
                    }`} />
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-dark-50">{mov.reason}</p>
                        <p className="text-xs text-dark-400 capitalize">{mov.type} • Por: {mov.user_name}</p>
                        <p className="text-xs text-dark-500 mt-1">{new Date(mov.created_at).toLocaleString()}</p>
                      </div>
                      <span className={`font-bold ${mov.quantity > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {mov.quantity > 0 ? '+' : ''}{mov.quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

    </div>
  );
};

export default InventoryList;
