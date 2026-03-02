import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/formatters';

const ProductInputModal = ({ product, isOpen, onClose, onAdd }) => {
  const [mode, setMode] = useState('cantidad'); // 'cantidad' | 'monto'
  const [inputValue, setInputValue] = useState('');
  
  const [calculatedQty, setCalculatedQty] = useState(0);
  const [calculatedSubtotal, setCalculatedSubtotal] = useState(0);
  const [appliedPrice, setAppliedPrice] = useState(0);
  const [priceType, setPriceType] = useState('menudeo');

  const isBulk = product?.type === 'liquido' || product?.type === 'alimento';
  const unit = product?.type === 'liquido' ? 'litros' : product?.type === 'alimento' ? 'kg' : 'unidades';

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode('cantidad');
      setInputValue('');
      setCalculatedQty(0);
      setCalculatedSubtotal(0);
      setAppliedPrice(product?.retail_price || 0);
      setPriceType('menudeo');
    }
  }, [isOpen, product]);

  // Recalculate values whenever input changes
  useEffect(() => {
    if (!product || !inputValue) {
      setCalculatedQty(0);
      setCalculatedSubtotal(0);
      setAppliedPrice(product?.retail_price || 0);
      setPriceType('menudeo');
      return;
    }

    const val = parseFloat(inputValue);
    if (isNaN(val) || val <= 0) return;

    let qty = 0;
    let subtotal = 0;
    let price = parseFloat(product.retail_price);
    let type = 'menudeo';

    const hasWholesale = product.wholesale_price && product.wholesale_min_qty;
    const pWholesale = parseFloat(product.wholesale_price);
    const minQty = parseFloat(product.wholesale_min_qty);

    if (mode === 'cantidad') {
      qty = val;
      if (hasWholesale && qty >= minQty) {
        price = pWholesale;
        type = 'mayoreo';
      }
      subtotal = qty * price;
    } else if (mode === 'monto') {
      subtotal = val;
      // Primero probamos con menudeo
      qty = subtotal / price;
      // Si con la cantidad de menudeo llega al minimo de mayoreo, recalculamos
      if (hasWholesale && (subtotal / pWholesale) >= minQty) {
        price = pWholesale;
        type = 'mayoreo';
        qty = subtotal / price;
      }
    }

    setCalculatedQty(qty);
    setCalculatedSubtotal(subtotal);
    setAppliedPrice(price);
    setPriceType(type);

  }, [inputValue, mode, product]);

  if (!product) return null;

  const handleAdd = () => {
    if (calculatedQty <= 0) return;
    
    onAdd({
      producto_id: product.product_id || product.id,
      name: product.name,
      cantidad: parseFloat(calculatedQty.toFixed(3)),
      precio_unitario: appliedPrice,
      tipo_precio: priceType,
      subtotal: parseFloat(calculatedSubtotal.toFixed(2)),
      unidad: unit
    });
    onClose();
  };

  const TypeBadge = ({ type }) => {
    const variants = { liquido: 'info', seco: 'warning', alimento: 'success' };
    return <Badge variant={variants[type] || 'default'} className="uppercase">{type}</Badge>;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={
      <div className="flex items-center space-x-2">
        <span>{product.name}</span>
        <TypeBadge type={product.type} />
      </div>
    }>
      <div className="space-y-6">
        {/* Info de Precios */}
        <div className="flex justify-between bg-dark-800 p-4 rounded-xl border border-dark-700">
          <div>
            <p className="text-xs text-dark-400">Menudeo</p>
            <p className="font-bold text-dark-50">{formatCurrency(product.retail_price)} <span className="text-xs font-normal text-dark-400">/ {unit}</span></p>
          </div>
          {product.wholesale_price && (
            <div className="text-right">
              <p className="text-xs text-primary-400">Mayoreo (desde {product.wholesale_min_qty} {unit})</p>
              <p className="font-bold text-primary-400">{formatCurrency(product.wholesale_price)} <span className="text-xs font-normal text-primary-600">/ {unit}</span></p>
            </div>
          )}
        </div>

        {/* Toggle Mode (solo granel) */}
        {isBulk && (
          <div className="flex p-1 bg-dark-800 rounded-lg">
            <button
              onClick={() => setMode('cantidad')}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === 'cantidad' ? 'bg-dark-600 text-white shadow-sm' : 'text-dark-400 hover:text-dark-200'}`}
            >
              Por Cantidad
            </button>
            <button
              onClick={() => setMode('monto')}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === 'monto' ? 'bg-dark-600 text-white shadow-sm' : 'text-dark-400 hover:text-dark-200'}`}
            >
              Por Monto ($)
            </button>
          </div>
        )}

        {/* Input */}
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            {mode === 'cantidad' ? `Cantidad a vender (${unit})` : 'Monto a vender ($)'}
          </label>
          <div className="relative">
            <input
              type="number"
              autoFocus
              step={isBulk ? "0.001" : "1"}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full text-2xl font-bold text-center py-4 bg-dark-900 border border-dark-700 rounded-xl text-dark-50 focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="0"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 font-medium">
              {mode === 'cantidad' ? unit : '$'}
            </div>
          </div>
        </div>

        {/* Resumen */}
        <div className="bg-dark-800/50 p-4 rounded-xl border border-dark-800 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-dark-400">Cantidad resultante:</span>
            <span className="font-bold text-dark-50">{calculatedQty.toFixed(3)} {unit}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-dark-400">Precio aplicado:</span>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-dark-50">{formatCurrency(appliedPrice)}</span>
              {priceType === 'mayoreo' && <Badge variant="primary" className="text-[10px]">MAYOREO</Badge>}
            </div>
          </div>
          <div className="border-t border-dark-700 pt-2 mt-2 flex justify-between items-center">
            <span className="text-dark-300 font-medium">Subtotal:</span>
            <span className="text-xl font-bold text-primary-400">{formatCurrency(calculatedSubtotal)}</span>
          </div>
        </div>

        {/* Action */}
        <button
          onClick={handleAdd}
          disabled={!inputValue || calculatedQty <= 0}
          className="w-full py-3 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Agregar al Carrito
        </button>
      </div>
    </Modal>
  );
};

export default ProductInputModal;
