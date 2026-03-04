import React from 'react';

const EmptyState = ({ icon: Icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700 border-dashed">
      {Icon && (
        <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-gray-500 dark:text-slate-400">
          <Icon className="w-8 h-8" />
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-slate-400 mb-6 max-w-sm">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
