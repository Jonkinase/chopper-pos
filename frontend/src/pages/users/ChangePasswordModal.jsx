import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import FormField from '../../components/ui/FormField';
import api from '../../api/api';
import toast from 'react-hot-toast';

const passwordSchema = z.object({
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

const ChangePasswordModal = ({ user, onClose, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await api.put(`/users/${user.id}/password`, { password: data.password });
      toast.success('Contraseña actualizada correctamente');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al actualizar contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Nueva Contraseña" error={errors.password?.message}>
        <input
          {...register('password')}
          type="password"
          className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-dark-50 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
        />
      </FormField>

      <FormField label="Confirmar Contraseña" error={errors.confirmPassword?.message}>
        <input
          {...register('confirmPassword')}
          type="password"
          className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-dark-50 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
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
          {isLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
        </button>
      </div>
    </form>
  );
};

export default ChangePasswordModal;
