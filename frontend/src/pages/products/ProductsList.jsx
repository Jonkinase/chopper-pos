import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import DataTable from '../../components/ui/DataTable';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import Badge from '../../components/ui/Badge';
import ProductForm from './ProductForm';
import { useAuthStore } from '../../store/authStore';
import { Package, Plus, Edit2, Trash2, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const ProductsList = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { activeBranch } = useAuthStore();
  
  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const fetchProducts = async () => {
    if (!activeBranch) return;
    setIsLoading(true);
    try {
      const { data } = await api.get(`/products?sucursal_id=${activeBranch}`);
      setProducts(data.data);
      setFilteredProducts(data.data);
    } catch (error) {
      toast.error('Error al cargar productos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [activeBranch]);

  useEffect(() => {
    let result = products;
    if (search) {
      result = result.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    }
    if (typeFilter !== 'all') {
      result = result.filter(p => p.type === typeFilter);
    }
    setFilteredProducts(result);
  }, [search, typeFilter, products]);

  const handleSave = async (formData) => {
    try {
      if (editingProduct) {
        // En edit mandamos sucursal_id para que el backend sepa de donde es el update
        await api.put(`/products/${editingProduct.id}`, { ...formData, sucursal_id: activeBranch });
        toast.success('Producto actualizado');
      } else {
        await api.post('/products', formData);
        toast.success('Producto creado');
      }
      setIsFormOpen(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/products/${productToDelete.id}`);
      toast.success('Producto eliminado');
      fetchProducts();
    } catch (error) {
      toast.error('Error al eliminar producto');
    }
  };

  const TypeBadge = ({ type }) => {
    const variants = { liquido: 'info', seco: 'warning', alimento: 'success' };
    return <Badge variant={variants[type] || 'default'} className="uppercase">{type}</Badge>;
  };

  const columns = [
    { header: 'Producto', cell: (row) => (
      <div>
        <p className="font-semibold text-slate-900 dark:text-slate-100">{row.name}</p>
        <p className="text-xs text-slate-600 dark:text-slate-400">Costo: ${row.cost}</p>
      </div>
    )},
    { header: 'Tipo', cell: (row) => <TypeBadge type={row.type} /> },
    { header: 'Precio Menudeo', cell: (row) => `$${row.retail_price}` },
    { header: 'Precio Mayoreo', cell: (row) => row.wholesale_price ? `$${row.wholesale_price} (min ${row.wholesale_min_qty})` : '-' },
    { header: 'Stock Actual', cell: (row) => (
      row.requires_stock ? (
        <span className={`font-medium ${parseFloat(row.stock_actual) <= 10 ? 'text-red-400' : 'text-emerald-400'}`}>
          {row.stock_actual}
        </span>
      ) : (
        <span className="text-slate-500 italic">N/A</span>
      )
    )},
    {
      header: 'Acciones',
      cell: (row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => { setEditingProduct(row); setIsFormOpen(true); }}
            className="p-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-primary-900/50 text-primary-400 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setProductToDelete(row); setIsDeleteOpen(true); }}
            className="p-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-red-900/50 text-red-400 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const mobileRender = (row) => (
    <div>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-slate-100">{row.name}</h3>
          <TypeBadge type={row.type} />
        </div>
        <div className="flex space-x-2">
          <button onClick={() => { setEditingProduct(row); setIsFormOpen(true); }} className="text-primary-400 p-1">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => { setProductToDelete(row); setIsDeleteOpen(true); }} className="text-red-400 p-1">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
        <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-lg">
          <span className="text-slate-600 dark:text-slate-400 block text-xs">Menudeo</span>
          <span className="text-slate-900 dark:text-slate-100 font-medium">${row.retail_price}</span>
        </div>
        <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-lg">
          <span className="text-slate-600 dark:text-slate-400 block text-xs">Stock</span>
          {row.requires_stock ? (
            <span className={`font-medium ${parseFloat(row.stock_actual) <= 10 ? 'text-red-400' : 'text-emerald-400'}`}>
              {row.stock_actual}
            </span>
          ) : (
            <span className="text-slate-500 italic">N/A</span>
          )}
        </div>
      </div>
    </div>
  );

  if (!activeBranch) return <div className="text-slate-600 dark:text-slate-400">Seleccione una sucursal para ver los productos.</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Catálogo de Productos</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Gestiona precios y productos de la sucursal</p>
        </div>
        <button
          onClick={() => { setEditingProduct(null); setIsFormOpen(true); }}
          className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Producto</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-600 dark:text-slate-400" />
          <input
            type="text"
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-primary-500"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-primary-500"
          >
            <option value="all">Todos los tipos</option>
            <option value="liquido">Líquidos</option>
            <option value="seco">Secos</option>
            <option value="alimento">Alimentos</option>
          </select>
        </div>
      </div>

      {products.length === 0 && !isLoading ? (
        <EmptyState
          icon={Package}
          title="No hay productos"
          description="Comienza a agregar productos al catálogo de esta sucursal."
          action={
            <button
              onClick={() => { setEditingProduct(null); setIsFormOpen(true); }}
              className="mt-4 bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg"
            >
              Crear Producto
            </button>
          }
        />
      ) : (
        <DataTable columns={columns} data={filteredProducts} mobileRender={mobileRender} isLoading={isLoading} />
      )}

      {/* Modals */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
        maxWidth="max-w-2xl"
      >
        <ProductForm 
          initialData={editingProduct} 
          onSubmit={handleSave} 
          onCancel={() => setIsFormOpen(false)} 
        />
      </Modal>

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar Producto"
        message={`¿Estás seguro de eliminar "${productToDelete?.name}"? Esto también lo ocultará del inventario.`}
        isDanger={true}
      />
    </div>
  );
};

export default ProductsList;
