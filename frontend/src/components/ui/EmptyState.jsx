import React from 'react';

const EmptyState = ({ icon: Icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-dark-900/50 rounded-2xl border border-dark-800 border-dashed">
      {Icon && (
        <div className="w-16 h-16 bg-dark-800 rounded-full flex items-center justify-center mb-4 text-dark-400">
          <Icon className="w-8 h-8" />
        </div>
      )}
      <h3 className="text-lg font-medium text-dark-50 mb-1">{title}</h3>
      <p className="text-sm text-dark-400 mb-6 max-w-sm">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
