import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className={`bg-dark-900 w-full ${maxWidth} rounded-2xl shadow-2xl border border-dark-800 flex flex-col max-h-[90vh]`}>
        <div className="flex items-center justify-between p-4 border-b border-dark-800">
          <h2 className="text-lg font-bold text-dark-50">{title}</h2>
          <button onClick={onClose} className="p-1 text-dark-400 hover:text-dark-50 transition-colors">
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
