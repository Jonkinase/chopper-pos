import React from 'react';

const FormField = ({ label, error, children, className = '' }) => {
  return (
    <div className={`flex flex-col space-y-1.5 ${className}`}>
      {label && <label className="text-sm font-medium text-gray-700 dark:text-slate-300">{label}</label>}
      {children}
      {error && <span className="text-xs text-red-500 dark:text-red-400 mt-1">{error}</span>}
    </div>
  );
};

export default FormField;
