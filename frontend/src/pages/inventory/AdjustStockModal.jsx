import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import FormField from '../../components/ui/FormField';
import api from '../../api/api';
import toast from 'react-hot-toast';

const adjustSchema = z.object({
  type: z.enum(['ajuste_manual', 'entrada', 'devolucion']),
  quantity: z.coerce.number(), // Puede ser negativo
  reason: z.string().min(3, 'Motivo obligatorio'),
});

const AdjustStockModal = ({ product, branchId, onClose, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(adjustSchema),
    defaultValues: { type: 'entrada', quantity: '', reason: '' }
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await api.put(`/inventory/${product.product_id}/adjust`, {
        ...data,
        branch_id: branchId
      });
      toast.success('Stock ajustado correctamente');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al ajustar stock');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="bg-dark-800 p-4 rounded-lg mb-4 flex justify-between items-center">
        <div>
          <p className="text-sm text-dark-400">Producto</p>
          <p className="font-bold text-dark-50">{product.product_name}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-dark-400">Stock Actual</p>
          <p className="font-bold text-primary-400">{product.stock_actual}</p>
        </div>
      </div>

      <FormField label="Tipo de Movimiento" error={errors.type?.message}>
        <select
          {...register('type')}
          className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-dark-50 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
        >
          <option value="entrada">Entrada (Sumar)</option>
          <option value="ajuste_manual">Ajuste Manual (Sumar/Restar)</option>
          <option value="devolucion">Devolución (Sumar)</option>
        </select>
      </FormField>

      <FormField label={`Cantidad`} error={errors.quantity?.message}>
        <input
          type="number"
          step="0.001"
          {...register('quantity')}
          className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-dark-50 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
          placeholder="Use negativos para restar si es ajuste manual"
        />
      </FormField>

      <FormField label="Motivo" error={errors.reason?.message}>
        <input
          {...register('reason')}
          className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-dark-50 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
          placeholder="Ej: Recepción de proveedor"
        />
      </FormField>

      <div className="flex space-x-3 pt-4 border-t border-dark-800">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2 px-4 bg-dark-800 hover:bg-dark-700 text-dark-200 rounded-lg transition-colors font-medium"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-2 px-4 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
        >
          {isLoading ? 'Guardando...' : 'Guardar Ajuste'}
        </button>
      </div>
    </form>
  );
};

export default AdjustStockModal;
