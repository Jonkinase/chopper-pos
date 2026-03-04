import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className={`bg-white dark:bg-slate-800 w-full ${maxWidth} rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]`}>
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">{title}</h2>
          <button onClick={onClose} className="p-1 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
