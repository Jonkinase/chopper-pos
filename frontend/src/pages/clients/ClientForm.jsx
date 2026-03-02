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
      });
    } else {
      reset({ name: '', email: '', phone: '', address: '' });
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Nombre Completo" error={errors.name?.message}>
        <input
          {...register('name')}
          className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-dark-50 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
        />
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Email" error={errors.email?.message}>
          <input
            {...register('email')}
            type="email"
            className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-dark-50 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
          />
        </FormField>
        <FormField label="Teléfono" error={errors.phone?.message}>
          <input
            {...register('phone')}
            className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-dark-50 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
          />
        </FormField>
      </div>

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
          {isLoading ? 'Guardando...' : 'Guardar Cliente'}
        </button>
      </div>
    </form>
  );
};

export default ClientForm;
