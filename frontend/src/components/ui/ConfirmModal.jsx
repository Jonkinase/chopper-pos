import React from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', isDanger = false }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col items-center text-center pt-2 pb-4">
        {isDanger && (
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
        )}
        <p className="text-gray-600 dark:text-slate-300 mb-6">{message}</p>
        <div className="flex w-full space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-lg transition-colors font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 py-2 px-4 rounded-lg transition-colors font-medium text-white ${
              isDanger ? 'bg-red-600 hover:bg-red-500' : 'bg-primary-600 hover:bg-primary-500'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
