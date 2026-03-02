import React from 'react';
import Badge from '../ui/Badge';
import { Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const CartItem = ({ item, onRemove }) => {
  return (
    <div className="bg-dark-800 p-3 rounded-xl border border-dark-700 flex justify-between items-center group">
      <div className="flex-1 min-w-0 pr-3">
        <p className="font-semibold text-sm text-dark-50 truncate">{item.name}</p>
        <div className="flex items-center space-x-2 mt-1">
          <span className="text-xs text-dark-400">
            {item.cantidad} {item.unidad} x {formatCurrency(item.precio_unitario)}
          </span>
          {item.tipo_precio === 'mayoreo' && (
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
