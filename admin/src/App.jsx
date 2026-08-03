import React from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import FlagsPage from './pages/FlagsPage';
import CustomersPage from './pages/CustomersPage';
import ProductionPage from './pages/ProductionPage';
import OrderStatusesPage from './pages/OrderStatusesPage';
import DiscountCodesPage from './pages/DiscountCodesPage';
import SmsCampaignsPage from './pages/SmsCampaignsPage';
import ExcelConfigPage from './pages/ExcelConfigPage';
import EmailTemplatesPage from './pages/EmailTemplatesPage';
import UsersPage from './pages/UsersPage';
import ConfiguratorSettingsPage from './pages/ConfiguratorSettingsPage';
import ProductionFactoryPage from './pages/ProductionFactoryPage';

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <AuthProvider>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="production" element={<ProductionPage />} />
            <Route path="statuses" element={<OrderStatusesPage />} />
            <Route path="discounts" element={<DiscountCodesPage />} />
            <Route path="sms" element={<SmsCampaignsPage />} />
            <Route path="excel" element={<ExcelConfigPage />} />
            <Route path="emails" element={<EmailTemplatesPage />} />
            <Route path="flags" element={<FlagsPage />} />
            <Route path="settings/configurator" element={<ConfiguratorSettingsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="factory" element={<ProductionFactoryPage />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
