import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const MetricsLayout = () => {
  const { user } = useAuthStore();
  
  const navItems = [
    { name: 'Dashboard', path: '/metrics', end: true },
    { name: 'Ventas', path: '/metrics/sales' },
    { name: 'Productos', path: '/metrics/products' },
    { name: 'Clientes', path: '/metrics/clients' },
    { name: 'Inventario', path: '/metrics/inventory' },
  ];

  if (user.role === 'admin') {
    navItems.push({ name: 'Consolidado', path: '/metrics/consolidated' });
  }

  return (
    <div className="space-y-6">
      <div className="flex overflow-x-auto space-x-2 bg-dark-900 p-2 rounded-2xl border border-dark-800">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              `px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-900/20'
                  : 'text-dark-400 hover:text-dark-50 hover:bg-dark-800'
              }`
            }
          >
            {item.name}
          </NavLink>
        ))}
      </div>

      <div>
        <Outlet />
      </div>
    </div>
  );
};

export default MetricsLayout;
