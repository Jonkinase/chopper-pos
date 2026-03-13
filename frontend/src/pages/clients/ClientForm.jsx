import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import FormField from '../../components/ui/FormField';

const clientSchema = z.object({
  name: z.string().min(3, 'Nombre obligatorio'),
  email: z.string().email('Email inválido').or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  overdue_days_limit: z.coerce.number().min(1, 'Mínimo 1 día'),
});

const ClientForm = ({ initialData, onSubmit, isLoading, onCancel }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      overdue_days_limit: 1,
    },
  });

  useEffect(() => {
    if (initialData) {
      let contact = {};
      try { contact = JSON.parse(initialData.contact_info || '{}'); } catch (e) {}
      reset({
        name: initialData.name,
        email: contact.email || '',
        phone: contact.phone || '',
        address: contact.address || '',
        overdue_days_limit: initialData.overdue_days_limit || 1,
      });
    } else {
      reset({ name: '', email: '', phone: '', address: '', overdue_days_limit: 1 });
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Nombre Completo" error={errors.name?.message}>
        <input
          {...register('name')}
          className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
        />
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Email" error={errors.email?.message}>
          <input
            {...register('email')}
            type="email"
            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
          />
        </FormField>
        <FormField label="Teléfono" error={errors.phone?.message}>
          <input
            {...register('phone')}
            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
          />
        </FormField>
      </div>

      <FormField label="Dirección" error={errors.address?.message}>
        <input
          {...register('address')}
          className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
        />
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Días para Vencimiento (Alerta)" error={errors.overdue_days_limit?.message}>
          <input
            {...register('overdue_days_limit')}
            type="number"
            min="1"
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
          {isLoading ? 'Guardando...' : 'Guardar Cliente'}
        </button>
      </div>
    </form>
  );
};

export default ClientForm;
