import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import FormField from '../../components/ui/FormField';
import api from '../../api/api';
import { useAuthStore } from '../../store/authStore';

const ProductForm = ({ initialData, onSubmit, isLoading, onCancel }) => {
  const { activeBranch } = useAuthStore();

  const productSchema = z.object({
    nombre: z.string().min(3, 'Mínimo 3 caracteres'),
    tipo: z.enum(['liquido', 'seco', 'alimento']),
    costo: z.coerce.number().min(0),
    precio_menudeo: z.coerce.number().min(0),
    tiene_mayoreo: z.boolean(),
    precio_mayoreo: z.coerce.number().optional(),
    cantidad_minima_mayoreo: z.coerce.number().optional(),
    stock_actual: z.coerce.number().min(0),
    stock_minimo: z.coerce.number().min(0).optional(),
    sucursal_id: z.string(),
  }).refine((data) => {
    if (data.tiene_mayoreo) {
      return data.precio_mayoreo > 0 && data.cantidad_minima_mayoreo > 0;
    }
    return true;
  }, {
    message: 'Si tiene mayoreo, precio y cantidad mínima son requeridos',
    path: ['precio_mayoreo'],
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: initialData ? {
      nombre: initialData.name,
      tipo: initialData.type,
      costo: initialData.cost,
      precio_menudeo: initialData.retail_price,
      tiene_mayoreo: !!initialData.wholesale_price,
      precio_mayoreo: initialData.wholesale_price || '',
      cantidad_minima_mayoreo: initialData.wholesale_min_qty || '',
      stock_actual: initialData.stock_actual || 0,
      stock_minimo: initialData.stock_minimo || 0,
      sucursal_id: activeBranch,
    } : {
      nombre: '',
      tipo: 'liquido',
      costo: '',
      precio_menudeo: '',
      tiene_mayoreo: false,
      precio_mayoreo: '',
      cantidad_minima_mayoreo: '',
      stock_actual: 0,
      stock_minimo: 0,
      sucursal_id: activeBranch,
    },
  });

  const tieneMayoreo = watch('tiene_mayoreo');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Nombre del Producto" error={errors.nombre?.message}>
        <input
          {...register('nombre')}
          className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
        />
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Tipo de Producto" error={errors.tipo?.message}>
          <select
            {...register('tipo')}
            disabled={!!initialData} // No permitir cambiar tipo si se está editando
            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none transition-all disabled:opacity-50"
          >
            <option value="liquido">Líquido a granel</option>
            <option value="seco">Seco / Envasado</option>
            <option value="alimento">Alimento a granel</option>
          </select>
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Costo (Global)" error={errors.costo?.message}>
          <input
            type="number"
            step="0.01"
            {...register('costo')}
            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
          />
        </FormField>
        
        <FormField label="Precio Menudeo" error={errors.precio_menudeo?.message}>
          <input
            type="number"
            step="0.01"
            {...register('precio_menudeo')}
            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
          />
        </FormField>
      </div>

      <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-xl space-y-4">
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            {...register('tiene_mayoreo')}
            className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500 bg-slate-100 dark:bg-slate-700"
          />
          <span className="text-slate-900 dark:text-slate-100 font-medium">Habilitar Precio de Mayoreo</span>
        </label>
        
        {errors.precio_mayoreo?.message && <p className="text-sm text-red-400">{errors.precio_mayoreo.message}</p>}

        {tieneMayoreo && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <FormField label="Precio Mayoreo" error={errors.precio_mayoreo?.message}>
              <input
                type="number"
                step="0.01"
                {...register('precio_mayoreo')}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              />
            </FormField>
            <FormField label={`Cant. Mínima`} error={errors.cantidad_minima_mayoreo?.message}>
              <input
                type="number"
                step="0.001"
                {...register('cantidad_minima_mayoreo')}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              />
            </FormField>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Stock Actual" error={errors.stock_actual?.message}>
          <input
            type="number"
            step="0.001"
            disabled={!!initialData} // Solo editable al crear
            {...register('stock_actual')}
            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none transition-all disabled:opacity-50"
          />
        </FormField>
        <FormField label="Stock Mínimo (Alerta)" error={errors.stock_minimo?.message}>
          <input
            type="number"
            step="0.001"
            {...register('stock_minimo')}
            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
          />
        </FormField>
      </div>

      <div className="flex space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg transition-colors font-medium"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-2 px-4 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
        >
          {isLoading ? 'Guardando...' : 'Guardar Producto'}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
