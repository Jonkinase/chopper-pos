import React from 'react';
import Badge from '../ui/Badge';
import { Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const CartItem = ({ item, onRemove, onUpdate }) => {
  const isCustom = !item.producto_id;

  return (
    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center group shadow-sm transition-all hover:border-primary-500/50">
      <div className="flex-1 min-w-0 pr-3">
        <div className="flex items-center space-x-2">
          <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{item.name}</p>
          {isCustom && (
            <Badge variant="info" className="text-[10px] py-0 px-1.5">RÁPIDO</Badge>
          )}
        </div>
        <div className="flex items-center space-x-2 mt-1.5">
          <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 px-2 py-0.5">
            <input
              type="number"
              value={item.cantidad}
              onChange={(e) => onUpdate(e.target.value)}
              step={isCustom || item.unidad === 'unidades' ? "1" : "0.001"}
              className="w-12 bg-transparent text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none"
            />
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium ml-1">{item.unidad}</span>
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">x</span>
          <span className="text-xs text-slate-600 dark:text-slate-400">
            {formatCurrency(item.precio_unitario)}
          </span>
          {!isCustom && item.tipo_precio === 'mayoreo' && (
            <Badge variant="primary" className="text-[9px] py-0">MAYOREO</Badge>
          )}
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-primary-400">{formatCurrency(item.subtotal)}</p>
        <button
          onClick={onRemove}
          className="text-red-400 hover:text-red-300 text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end w-full"
        >
          <Trash2 className="w-3 h-3 mr-1" /> Quitar
        </button>
      </div>
    </div>
  );
};

export default CartItem;
