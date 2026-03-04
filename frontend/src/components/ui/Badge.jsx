import React from 'react';

const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-200',
    primary: 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300',
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
    warning: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400',
    danger: 'bg-red-50 text-red-700 dark:bg-red-900/50 dark:text-red-400',
    info: 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
