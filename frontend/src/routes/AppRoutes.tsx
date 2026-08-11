import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../pages/Login/LoginPage';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { DashboardPage } from '../pages/Dashboard/DashboardPage';
import { CustomerListPage } from '../pages/Customers/CustomerListPage';
import { CustomerDetailPage } from '../pages/Customers/CustomerDetailPage';
import { ProductListPage } from '../pages/Products/ProductListPage';
import { InventoryPage } from '../pages/Inventory/InventoryPage';
import { ChallanListPage } from '../pages/Challans/ChallanListPage';
import { ChallanCreatePage } from '../pages/Challans/ChallanCreatePage';
import { ChallanDetailPage } from '../pages/Challans/ChallanDetailPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Protected ERP Dashboard Shell */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/customers" element={<CustomerListPage />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
          <Route path="/products" element={<ProductListPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/challans" element={<ChallanListPage />} />
          <Route path="/challans/create" element={<ChallanCreatePage />} />
          <Route path="/challans/:id" element={<ChallanDetailPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
