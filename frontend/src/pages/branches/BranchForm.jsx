import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import FormField from '../../components/ui/FormField';

const branchSchema = z.object({
  name: z.string().min(3, 'Mínimo 3 caracteres'),
  address: z.string().min(5, 'Dirección requerida'),
});

const BranchForm = ({ initialData, onSubmit, isLoading, onCancel }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(branchSchema),
    defaultValues: initialData || {
      name: '',
      address: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Nombre de Sucursal" error={errors.name?.message}>
        <input
          {...register('name')}
          className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-dark-50 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
          placeholder="Ej: Sucursal Centro"
        />
      </FormField>

      <FormField label="Dirección" error={errors.address?.message}>
        <input
          {...register('address')}
          className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-dark-50 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
        />
      </FormField>

      <div className="flex space-x-3 pt-4 border-t border-dark-800">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 px-4 bg-dark-800 hover:bg-dark-700 text-dark-200 rounded-lg transition-colors font-medium"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-2 px-4 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
        >
          {isLoading ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  );
};

export default BranchForm;
