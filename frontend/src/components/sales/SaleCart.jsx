import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, CheckCircle2 } from 'lucide-react';
import CartItem from './CartItem';
import ProductInputModal from './ProductInputModal';
import { formatCurrency } from '../../utils/formatters';
import api from '../../api/api';
import toast from 'react-hot-toast';

const SaleCart = ({
  activeBranch,
  cart,
  setCart,
  onSubmit,
  isSubmitting,
  submitLabel = 'Confirmar Venta',
  allowAccount = true,
  defaultPayment = 'contado',
  requireClientForAccount = true,
}) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(defaultPayment);
  const [observations, setObservaciones] = useState('');
  const [mobileTab, setMobileTab] = useState('productos'); // 'productos' | 'carrito'

  // Load Products & Clients
  useEffect(() => {
    if (!activeBranch) return;
    const loadData = async () => {
      try {
        const [prodRes, clientRes] = await Promise.all([
          api.get(`/products?sucursal_id=${activeBranch}`),
          api.get(`/clients`)
        ]);
        setProducts(prodRes.data.data);
        setFilteredProducts(prodRes.data.data);
        setClients(clientRes.data.data);
      } catch (error) {
        toast.error('Error al cargar datos del POS');
      }
    };
    loadData();
  }, [activeBranch]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!searchQuery) {
        setFilteredProducts(products);
        return;
      }
      const lower = searchQuery.toLowerCase();
      setFilteredProducts(
        products.filter(p => p.name.toLowerCase().includes(lower))
      );
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, products]);

  const handleAddToCart = (item) => {
    setCart(prev => {
      const existing = prev.findIndex(p => p.producto_id === item.producto_id);
      if (existing >= 0) {
        const newCart = [...prev];
        newCart[existing] = item;
        return newCart;
      }
      return [...prev, item];
    });
    toast.success('Agregado al carrito');
  };

  const removeFromCart = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const total = cart.reduce((acc, item) => acc + item.subtotal, 0);

  const handleSubmit = () => {
    if (cart.length === 0) return toast.error('El carrito está vacío');
    if (allowAccount && paymentMethod === 'cuenta_corriente' && requireClientForAccount && !selectedClient) {
      return toast.error('Seleccione un cliente para enviar a cuenta corriente');
    }

    onSubmit({
      cliente_id: selectedClient || null,
      tipo_pago: paymentMethod,
      observaciones: observations,
      items: cart,
      total
    });
  };

  const selectedClientData = clients.find(c => c.id === selectedClient);

  return (
    <div className="flex flex-col h-full gap-4">
      {/* MOBILE TABS */}
      <div className="lg:hidden flex p-1 bg-dark-900 rounded-xl border border-dark-800 shrink-0">
        <button
          onClick={() => setMobileTab('productos')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${mobileTab === 'productos' ? 'bg-primary-600 text-white shadow-sm' : 'text-dark-400 hover:text-dark-200'}`}
        >
          Productos
        </button>
        <button
          onClick={() => setMobileTab('carrito')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors flex items-center justify-center space-x-2 ${mobileTab === 'carrito' ? 'bg-primary-600 text-white shadow-sm' : 'text-dark-400 hover:text-dark-200'}`}
        >
          <span>Carrito</span>
          {cart.length > 0 && (
            <span className="bg-white text-primary-600 px-2 py-0.5 rounded-full text-xs">
              {cart.length}
            </span>
          )}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
        {/* LEFT COLUMN: BUSCADOR */}
        <div className={`flex-1 flex-col min-h-0 bg-dark-900 rounded-2xl border border-dark-800 shadow-sm overflow-hidden ${mobileTab === 'productos' ? 'flex' : 'hidden lg:flex'}`}>
          <div className="p-4 border-b border-dark-800">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-dark-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar productos..."
                className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-dark-700 rounded-xl text-dark-50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 content-start">
            {filteredProducts.map(prod => (
              <div 
                key={prod.id}
                onClick={() => setSelectedProduct(prod)}
                className="bg-dark-800 border border-dark-700 hover:border-primary-500 rounded-xl p-3 cursor-pointer transition-all hover:-translate-y-1 flex flex-col justify-between"
              >
                <div>
                  <p className="font-bold text-sm text-dark-50 leading-tight mb-1">{prod.name}</p>
                  <div className="flex items-center gap-1 mb-2">
                    <span className={`w-2 h-2 rounded-full ${parseFloat(prod.stock_actual) > 10 ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    <span className="text-xs text-dark-400">{prod.stock_actual} disp.</span>
                  </div>
                </div>
                <div>
                  <p className="text-lg font-bold text-primary-400">{formatCurrency(prod.retail_price)}</p>
                  {prod.wholesale_price && (
                    <p className="text-[10px] text-dark-400">Mayoreo: {formatCurrency(prod.wholesale_price)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: CARRITO Y CIERRE */}
        <div className={`w-full lg:w-[400px] flex-col min-h-0 bg-dark-900 rounded-2xl border border-dark-800 shadow-sm overflow-hidden ${mobileTab === 'carrito' ? 'flex' : 'hidden lg:flex'}`}>
        <div className="p-4 border-b border-dark-800 flex items-center space-x-2">
          <ShoppingCart className="w-5 h-5 text-primary-500" />
          <h2 className="font-bold text-dark-50">Resumen de Operación</h2>
        </div>

        {/* Lista de Carrito */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-dark-500">
              <ShoppingCart className="w-12 h-12 mb-2 opacity-20" />
              <p className="text-sm">El carrito está vacío</p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <CartItem key={idx} item={item} onRemove={() => removeFromCart(idx)} />
            ))
          )}
        </div>

        {/* Panel de Cierre */}
        <div className="bg-dark-950 p-4 border-t border-dark-800 space-y-4">
          
          <div className="space-y-3">
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-sm text-dark-50 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
            >
              <option value="">Consumidor Final</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            {allowAccount && (
              <div className="flex p-1 bg-dark-800 rounded-lg">
                <button
                  onClick={() => setPaymentMethod('contado')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${paymentMethod === 'contado' ? 'bg-primary-600 text-white' : 'text-dark-400 hover:text-dark-200'}`}
                >
                  CONTADO
                </button>
                <button
                  onClick={() => setPaymentMethod('cuenta_corriente')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${paymentMethod === 'cuenta_corriente' ? 'bg-warning text-yellow-900 bg-yellow-500' : 'text-dark-400 hover:text-dark-200'}`}
                >
                  CTA. CORRIENTE
                </button>
              </div>
            )}

            {allowAccount && paymentMethod === 'cuenta_corriente' && selectedClientData && (
              <div className="text-xs text-yellow-500 bg-yellow-900/20 p-2 rounded-lg border border-yellow-900/50">
                Se cargará deuda a la cuenta de <b>{selectedClientData.name}</b>
              </div>
            )}
            {allowAccount && paymentMethod === 'cuenta_corriente' && !selectedClientData && requireClientForAccount && (
              <div className="text-xs text-red-400 bg-red-900/20 p-2 rounded-lg border border-red-900/50">
                Debe seleccionar un cliente.
              </div>
            )}
          </div>

          <div className="flex justify-between items-end pt-2 border-t border-dark-800">
            <span className="text-dark-300 font-medium">Total:</span>
            <span className="text-3xl font-black text-white">{formatCurrency(total)}</span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={cart.length === 0 || isSubmitting || (allowAccount && paymentMethod === 'cuenta_corriente' && requireClientForAccount && !selectedClient)}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span>Procesando...</span>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>{submitLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>
      </div>

      <ProductInputModal 
        isOpen={!!selectedProduct} 
        product={selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
        onAdd={handleAddToCart}
      />
    </div>
  );
};

export default SaleCart;
