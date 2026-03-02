import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import LoginPage from '../pages/auth/LoginPage';
import ProtectedRoute from './ProtectedRoute';
import { Toaster } from 'react-hot-toast';

import BranchesList from '../pages/branches/BranchesList';
import UsersList from '../pages/users/UsersList';
import ProductsList from '../pages/products/ProductsList';
import InventoryList from '../pages/inventory/InventoryList';
import SalesList from '../pages/sales/SalesList';
import SalesNew from '../pages/sales/SalesNew';
import ClientsList from '../pages/clients/ClientsList';
import AccountsList from '../pages/accounts/AccountsList';
import AccountDetail from '../pages/accounts/AccountDetail';
import QuotesList from '../pages/quotes/QuotesList';
import QuoteNew from '../pages/quotes/QuoteNew';
import MetricsLayout from '../pages/metrics/MetricsLayout';
import MetricsDashboard from '../pages/metrics/MetricsDashboard';
import MetricsSales from '../pages/metrics/MetricsSales';
import MetricsProducts from '../pages/metrics/MetricsProducts';
import MetricsClients from '../pages/metrics/MetricsClients';
import MetricsInventory from '../pages/metrics/MetricsInventory';
import MetricsConsolidated from '../pages/metrics/MetricsConsolidated';
import NotFound from '../pages/NotFound';

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={
            <ProtectedRoute allowedRoles={['admin', 'encargado']}>
              <MetricsDashboard />
            </ProtectedRoute>
          } />
          <Route path="branches" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <BranchesList />
            </ProtectedRoute>
          } />
          <Route path="users" element={
            <ProtectedRoute allowedRoles={['admin', 'encargado']}>
              <UsersList />
            </ProtectedRoute>
          } />
          <Route path="products" element={
            <ProtectedRoute allowedRoles={['admin', 'encargado']}>
              <ProductsList />
            </ProtectedRoute>
          } />
          <Route path="inventory" element={
            <ProtectedRoute allowedRoles={['admin', 'encargado']}>
              <InventoryList />
            </ProtectedRoute>
          } />
          <Route path="sales" element={<SalesList />} />
          <Route path="sales/new" element={<SalesNew />} />
          <Route path="quotes" element={<QuotesList />} />
          <Route path="quotes/new" element={<QuoteNew />} />
          <Route path="clients" element={<ClientsList />} />
          <Route path="accounts/:id" element={
            <ProtectedRoute allowedRoles={['admin', 'encargado']}>
              <AccountDetail />
            </ProtectedRoute>
          } />
          
          <Route path="metrics" element={
            <ProtectedRoute allowedRoles={['admin', 'encargado']}>
              <MetricsLayout />
            </ProtectedRoute>
          }>
            <Route index element={<MetricsDashboard />} />
            <Route path="sales" element={<MetricsSales />} />
            <Route path="products" element={<MetricsProducts />} />
            <Route path="clients" element={<MetricsClients />} />
            <Route path="inventory" element={<MetricsInventory />} />
            <Route path="consolidated" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <MetricsConsolidated />
              </ProtectedRoute>
            } />
          </Route>
          
          {/* Catch All 404 */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
