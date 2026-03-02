import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/api';
import toast from 'react-hot-toast';
import { LogIn, Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', data);
      const { user, accessToken, refreshToken } = response.data.data;
      
      login(user, accessToken, refreshToken);
      toast.success('¡Bienvenido!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 p-4">
      <div className="w-full max-w-md bg-dark-900 rounded-2xl shadow-xl border border-dark-800 p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-500 mb-2">Chopper POS</h1>
          <p className="text-dark-400">Ingresa tus credenciales para continuar</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">Email</label>
            <input
              type="email"
              {...register('email')}
              className={`w-full px-4 py-2 bg-dark-800 border ${
                errors.email ? 'border-red-500' : 'border-dark-700'
              } rounded-lg text-dark-50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all`}
              placeholder="admin@chopper.com"
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">Contraseña</label>
            <input
              type="password"
              {...register('password')}
              className={`w-full px-4 py-2 bg-dark-800 border ${
                errors.password ? 'border-red-500' : 'border-dark-700'
              } rounded-lg text-dark-50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all`}
              placeholder="••••••••"
            />
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-lg shadow-lg shadow-primary-900/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Iniciar Sesión</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
