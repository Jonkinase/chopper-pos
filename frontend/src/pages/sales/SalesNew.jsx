import React, { useState } from 'react';
import api from '../../api/api';
import { useAuthStore } from '../../store/authStore';
import SaleCart from '../../components/sales/SaleCart';
import toast from 'react-hot-toast';

const downloadInvoice = async (saleId) => {
  const response = await api.get(`/sales/${saleId}/invoice/pdf`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Factura_${saleId.slice(0, 8)}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const SalesNew = () => {
  const { activeBranch } = useAuthStore();
  const [cart, setCart] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!activeBranch) {
    return <div className="p-8 text-center text-slate-600 dark:text-slate-400">Por favor seleccione una sucursal para operar.</div>;
  }

  const handleSubmit = async (saleData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...saleData,
        sucursal_id: activeBranch,
      };
      delete payload.onSuccess;

      const { data } = await api.post('/sales', payload);
      const result = data.data;
      saleData.onSuccess?.();

      if (!result.billing || result.billing.billing_status === 'not_requested') {
        toast.success('Venta completada exitosamente');
        return;
      }

      if (result.billing.billing_status === 'approved') {
        toast.success('Venta y factura aprobadas');
        await downloadInvoice(result.sale_id);
        return;
      }

      toast.success('Venta completada. La factura quedó pendiente para reintento.');
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
