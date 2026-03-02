import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchX, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="w-20 h-20 bg-dark-800 text-dark-400 rounded-full flex items-center justify-center mb-6">
        <SearchX className="w-10 h-10" />
      </div>
      <h1 className="text-4xl font-black text-dark-50 mb-2">404</h1>
      <h2 className="text-xl font-medium text-dark-300 mb-6">Página no encontrada</h2>
      <p className="text-dark-400 text-center max-w-md mb-8">
        La ruta a la que intentas acceder no existe o no tienes los permisos necesarios para verla.
      </p>
      <button
        onClick={() => navigate('/')}
        className="flex items-center space-x-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-primary-900/20"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Volver al Dashboard</span>
      </button>
    </div>
  );
};

export default NotFound;
