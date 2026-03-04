import React from 'react';
import { AlertTriangle, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
 constructor(props) {
 super(props);
 this.state = { hasError: false, error: null };
 }

 static getDerivedStateFromError(error) {
 return { hasError: true, error };
 }

 componentDidCatch(error, errorInfo) {
 console.error('ErrorBoundary caught an error', error, errorInfo);
 }

 render() {
 if (this.state.hasError) {
 return (
 <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
 <div className="bg-white dark:bg-slate-800 border border-red-900/30 p-8 rounded-2xl max-w-lg w-full text-center shadow-2xl">
 <div className="w-16 h-16 bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
 <AlertTriangle className="w-8 h-8" />
 </div>
 <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Algo salió mal</h1>
 <p className="text-slate-700 dark:text-slate-300 mb-6">
 Ocurrió un error inesperado en la aplicación. Hemos registrado el problema.
 </p>
 <button
 onClick={() => window.location.href = '/'}
 className="flex items-center justify-center space-x-2 w-full py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-medium transition-colors"
 >
 <Home className="w-5 h-5" />
 <span>Volver al inicio</span>
 </button>
 </div>
 </div>
 );
 }

 return this.props.children;
 }
}

export default ErrorBoundary;
