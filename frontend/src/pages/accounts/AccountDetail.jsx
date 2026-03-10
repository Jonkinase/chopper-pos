import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { formatCurrency } from '../../utils/formatters';
import { ArrowLeft, Wallet, TrendingDown, TrendingUp, Calendar } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import FormField from '../../components/ui/FormField';
import { useAuthStore } from '../../store/authStore';

// --- PAYMENT MODAL COMPONENT ---
const paymentSchema = z.object({
  monto: z.coerce.number().min(0.01, 'Monto inválido'),
  metodo_pago: z.enum(['efectivo', 'transferencia', 'otro']),
  observaciones: z.string().optional(),
});

const PaymentModal = ({ customerId, currentBalance, isOpen, onClose, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { activeBranch } = useAuthStore();
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: { monto: '', metodo_pago: 'efectivo', observaciones: '' }
  });

  const watchMonto = watch('monto');
  const resultingBalance = currentBalance - (parseFloat(watchMonto) || 0);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await api.post(`/accounts/${customerId}/payment`, { ...data, branch_id: activeBranch });
      toast.success('Pago registrado correctamente');
      onSuccess();
    } catch (err) {
      toast.error('Error al registrar el pago');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar Pago de Cuenta Corriente">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-xl flex justify-between items-center">
          <span className="text-slate-600 dark:text-slate-400">Deuda Actual:</span>
          <span className="text-xl font-bold text-red-400">{formatCurrency(currentBalance)}</span>
        </div>

        <div className="flex items-center space-x-2">
          <button type="button" onClick={() => setValue('monto', currentBalance)} className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-primary-400 hover:bg-slate-200 dark:bg-slate-600">Pagar Total</button>
        </div>

        <FormField label="Monto a Pagar ($)" error={errors.monto?.message}>
          <input
            type="number"
            step="0.01"
            {...register('monto')}
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 text-lg font-bold focus:ring-2 focus:ring-primary-500 outline-none"
            placeholder="0.00"
          />
        </FormField>

        <FormField label="Método de Pago" error={errors.metodo_pago?.message}>
          <select
            {...register('metodo_pago')}
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none"
          >
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="otro">Otro</option>
          </select>
        </FormField>

        <FormField label="Observaciones (Opcional)" error={errors.observaciones?.message}>
          <input
            {...register('observaciones')}
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none"
            placeholder="Referencia de transferencia..."
          />
        </FormField>

        <div className="flex justify-between items-center py-2 border-t border-slate-200 dark:border-slate-700 mt-4">
          <span className="text-slate-600 dark:text-slate-400">Saldo Resultante:</span>
          <span className={`font-bold ${resultingBalance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {formatCurrency(Math.max(0, resultingBalance))}
          </span>
        </div>

        <div className="flex space-x-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg">Cancelar</button>
          <button type="submit" disabled={isLoading || !watchMonto || resultingBalance < 0} className="flex-1 py-2 px-4 bg-primary-600 hover:bg-primary-500 text-white rounded-lg disabled:opacity-50">Confirmar Pago</button>
        </div>
      </form>
    </Modal>
  );
};


// --- ACCOUNT DETAIL PAGE ---
const AccountDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const { activeBranch } = useAuthStore();

  const fetchDetail = async () => {
    try {
      const res = await api.get(`/accounts/${id}?branch_id=${activeBranch}`);
      setData(res.data.data);
    } catch (error) {
      toast.error('Error al cargar la cuenta corriente');
      navigate('/clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-slate-600 dark:text-slate-400">Cargando detalles de cuenta...</div>;
  if (!data) return null;

  const { account, recent_movements } = data;
  const currentBalance = parseFloat(account.current_balance);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center space-x-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-white dark:bg-slate-800 rounded-full hover:bg-slate-100 dark:bg-slate-700 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-800 dark:text-slate-200" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{account.customer_name}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Cuenta Corriente</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col justify-center">
          <p className="text-slate-600 dark:text-slate-400 font-medium mb-2 flex items-center"><Wallet className="w-4 h-4 mr-2" /> Estado de Cuenta</p>
          <div className="flex items-end space-x-3">
            <span className={`text-4xl font-black ${currentBalance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
              {formatCurrency(currentBalance)}
            </span>
            <Badge variant={currentBalance > 0 ? 'danger' : 'success'} className="mb-1">
              {currentBalance > 0 ? 'DEUDA PENDIENTE' : 'SALDADA'}
            </Badge>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col justify-center items-center sm:items-end">
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            disabled={currentBalance <= 0}
            className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <TrendingDown className="w-5 h-5" />
            <span>Registrar Pago</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-bold text-slate-900 dark:text-slate-100">Historial de Movimientos</h2>
        </div>
        <div className="p-4">
          {recent_movements.length === 0 ? (
            <p className="text-center text-slate-600 dark:text-slate-400 py-8">No hay movimientos registrados.</p>
          ) : (
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent">
              {recent_movements.map((mov, i) => {
                const isCargo = mov.type === 'cargo'; // Venta
                return (
                  <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    {/* Icon */}
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-100 dark:border-slate-800 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${isCargo ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
                      {isCargo ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    </div>
                    
                    {/* Card */}
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700/50 shadow-sm">
                      <div className="flex items-center justify-between space-x-2 mb-1">
                        <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center">
                          {isCargo ? 'Venta a Crédito' : 'Pago Recibido'}
                        </div>
                        <time className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(mov.created_at).toLocaleDateString()}
                        </time>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">{mov.description}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Monto:</span>
                        <span className={`font-bold ${isCargo ? 'text-red-400' : 'text-emerald-400'}`}>
                          {isCargo ? '+' : '-'}{formatCurrency(mov.amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <PaymentModal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)} 
        customerId={id} 
        currentBalance={currentBalance}
        onSuccess={() => {
          setIsPaymentModalOpen(false);
          fetchDetail();
        }}
      />
    </div>
  );
};

export default AccountDetail;
