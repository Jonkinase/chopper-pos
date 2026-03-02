import React from 'react';

export const SkeletonCard = ({ className = '' }) => (
  <div className={`bg-dark-900 border border-dark-800 rounded-2xl p-6 animate-pulse ${className}`}>
    <div className="h-4 bg-dark-800 rounded w-1/3 mb-4"></div>
    <div className="h-8 bg-dark-800 rounded w-1/2 mb-2"></div>
    <div className="h-3 bg-dark-800 rounded w-1/4"></div>
  </div>
);

export const SkeletonChart = ({ className = 'h-[300px]' }) => (
  <div className={`bg-dark-900 border border-dark-800 rounded-2xl p-6 animate-pulse w-full ${className}`}>
    <div className="h-5 bg-dark-800 rounded w-1/4 mb-6"></div>
    <div className="w-full h-full bg-dark-800/50 rounded-xl"></div>
  </div>
);
