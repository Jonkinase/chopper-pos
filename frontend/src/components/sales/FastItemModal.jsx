import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Modal from '../ui/Modal';
import FormField from '../ui/FormField';

const schema = z.object({
  description: z.string().min(1, 'La descripción es obligatoria').max(100, 'Máximo 100 caracteres'),
  quantity: z.coerce.number().min(0.01, 'Mínimo 0.01').positive('La cantidad debe ser mayor a 0'),
  price: z.coerce.number().positive('El precio debe ser mayor a 0'),
});

const FastItemModal = ({ isOpen, onClose, onAdd }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      description: '',
      quantity: 1,
      price: '',
    }
  });

  const onSubmit = (data) => {
    onAdd({
      producto_id: null,
      name: data.description,
      custom_description: data.description,
      cantidad: data.quantity,
      unidad: 'unidades',
      precio_unitario: data.price,
      tipo_precio: 'menudeo',
      subtotal: parseFloat((data.quantity * data.price).toFixed(2)),
    });
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="⚡ Item Rápido">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
        <FormField label="Descripción" error={errors.description?.message}>
          <input
            {...register('description')}
            type="text"
            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none"
            placeholder="Ej: Vuelto, Servicio Técnico..."
            autoFocus
          />
        </FormField>

        <FormField label="Cantidad" error={errors.quantity?.message}>
          <input
            {...register('quantity')}
            type="number"
            step="0.01"
            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none"
            placeholder="1"
          />
        </FormField>

        <FormField label="Precio Unitario" error={errors.price?.message}>
          <input
            {...register('price')}
            type="number"
            step="0.01"
            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none"
            placeholder="0.00"
          />
        </FormField>

        <div className="flex space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-slate-800 dark:text-slate-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-medium shadow-lg shadow-primary-900/20 transition-all"
          >
            Agregar al carrito
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default FastItemModal;
