import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { useAuthStore } from '../../store/authStore';
import SaleCart from '../../components/sales/SaleCart';
import toast from 'react-hot-toast';

const SalesNew = () => {
  const navigate = useNavigate();
  const { activeBranch } = useAuthStore();
  const [cart, setCart] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!activeBranch) {
    return <div className="p-8 text-center text-dark-400">Por favor seleccione una sucursal para operar.</div>;
  }

  const handleSubmit = async (saleData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...saleData,
        sucursal_id: activeBranch,
      };

      await api.post('/sales', payload);
      toast.success('Venta completada exitosamente');
      setCart([]);
      // Optional: navigate away or clear context completely
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al procesar venta');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)]">
      <SaleCart 
        activeBranch={activeBranch}
        cart={cart}
        setCart={setCart}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitLabel="Confirmar Venta"
      />
    </div>
  );
};

export default SalesNew;
