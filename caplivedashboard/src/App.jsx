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
import CustomersPage from './pages/CustomersPage';
import ProductionPage from './pages/ProductionPage';
import OrderStatusesPage from './pages/OrderStatusesPage';
import DiscountCodesPage from './pages/DiscountCodesPage';
import SmsCampaignsPage from './pages/SmsCampaignsPage';
import ExcelConfigPage from './pages/ExcelConfigPage';
import EmailTemplatesPage from './pages/EmailTemplatesPage';
import UsersPage from './pages/UsersPage';
import ConfiguratorSettingsPage from './pages/ConfiguratorSettingsPage';
import ProductionSettingsPage from './pages/ProductionSettingsPage';
import ProductionFactoryPage from './pages/ProductionFactoryPage';
import ProductionOrderDetailPage from './pages/ProductionOrderDetailPage';
import ExcelTemplatesPage from './pages/ExcelTemplatesPage';
import InstallmentPlansPage from './pages/InstallmentPlansPage';
import MediaPage from './pages/MediaPage';

// Webshop Dashboard Pages
import WebshopDashboardPage from './pages/webshop/WebshopDashboardPage';
import WebshopProductsPage from './pages/webshop/WebshopProductsPage';
import WebshopOrdersPage from './pages/webshop/WebshopOrdersPage';
import WebshopCustomersPage from './pages/webshop/WebshopCustomersPage';
import WebshopEmailSettingsPage from './pages/webshop/WebshopEmailSettingsPage';
import WebshopOrderStatusesPage from './pages/webshop/WebshopOrderStatusesPage';

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
            <Route path="media" element={<MediaPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="excel-templates" element={<ExcelTemplatesPage />} />
            <Route path="production" element={<ProductionPage />} />
            <Route path="discounts" element={<DiscountCodesPage />} />
            <Route path="installments" element={<InstallmentPlansPage />} />

            <Route path="statuses" element={<OrderStatusesPage />} />
            <Route path="sms" element={<SmsCampaignsPage />} />
            <Route path="excel" element={<ExcelConfigPage />} />
            <Route path="emails" element={<EmailTemplatesPage />} />
            <Route path="settings/configurator" element={<ConfiguratorSettingsPage />} />
            <Route path="settings/production" element={<ProductionSettingsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="factory" element={<ProductionFactoryPage />} />
            <Route path="factory/media" element={<MediaPage isFactoryView={true} />} />
            <Route path="factory/orders/:id" element={<ProductionOrderDetailPage />} />

            {/* Webshop Dashboard Sub-Routes */}
            <Route path="webshop" element={<WebshopDashboardPage />} />
            <Route path="webshop/products" element={<WebshopProductsPage />} />
            <Route path="webshop/orders" element={<WebshopOrdersPage />} />
            <Route path="webshop/customers" element={<WebshopCustomersPage />} />
            <Route path="webshop/statuses" element={<WebshopOrderStatusesPage />} />
            <Route path="webshop/emails" element={<WebshopEmailSettingsPage />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
