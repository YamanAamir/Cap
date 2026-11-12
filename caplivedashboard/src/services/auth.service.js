import api from './api';
import Cookies from 'js-cookie';

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  if (response.data.token) {
    Cookies.set('token', response.data.token, { expires: 1 }); // 1 day
  }
  return response.data;
};

export const login2fa = async (mfaToken, code) => {
  const response = await api.post('/auth/login/2fa', { mfaToken, code });
  if (response.data.token) {
    Cookies.set('token', response.data.token, { expires: 1 });
  }
  return response.data;
};

export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } catch (e) {
    // ignore
  }
  Cookies.remove('token');
};

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// Forgot / Reset password
export const forgotPassword = async (email, redirectPath = '') => {
  const response = await api.post('/auth/forgot-password', { email, redirectPath });
  return response.data;
};

export const resetPassword = async (token, email, password) => {
  const response = await api.post('/auth/reset-password', { token, email, password });
  return response.data;
};

export const changePassword = async (currentPassword, newPassword) => {
  const response = await api.post('/auth/change-password', { currentPassword, newPassword });
  return response.data;
};

// Two-Factor Authentication (Self-service)
export const get2faStatus = async () => {
  const response = await api.get('/auth/2fa/status');
  return response.data;
};

export const setup2fa = async (name = 'Authenticator') => {
  const response = await api.post('/auth/2fa/setup', { name });
  return response.data;
};

export const verify2faSetup = async (id, code) => {
  const response = await api.post('/auth/2fa/verify', { id, code });
  return response.data;
};

export const remove2faDevice = async (id, password) => {
  const response = await api.post(`/auth/2fa/authenticators/${id}/remove`, { password });
  return response.data;
};

export const disable2fa = async (password, code) => {
  const response = await api.post('/auth/2fa/disable', { password, code });
  return response.data;
};

export const regenerateBackupCodes = async (password) => {
  const response = await api.post('/auth/2fa/backup-codes', { password });
  return response.data;
};

export const getMyLoginHistory = async () => {
  const response = await api.get('/auth/login-history');
  return response.data;
};

// Orders and Statuses
export const getOrders = async (params) => {
  const response = await api.get('/orders', { params });
  return response.data;
};

export const getOrder = async (id) => {
  const response = await api.get(`/orders/${id}`);
  return response.data;
};

export const updateOrderStatus = async (id, data) => {
  const payload = typeof data === 'string' ? { status: data } : data;
  const response = await api.patch(`/orders/${id}/status`, payload);
  return response.data;
};

export const bulkUpdateOrderStatus = async (orderIds, statusId) => {
  const response = await api.post('/orders/bulk-status', { orderIds, statusId });
  return response.data;
};

export const bulkDeleteOrders = async (orderIds) => {
  const response = await api.post('/orders/bulk-delete', { orderIds });
  return response.data;
};

export const resendOrderEmails = async (id, data = {}) => {
  const response = await api.post(`/orders/${id}/resend-email`, data);
  return response.data;
};

export const resendInstallmentEmail = async (id, data = {}) => {
  const response = await api.post(`/orders/${id}/resend-installment-email`, data);
  return response.data;
};

export const updateOrder = async (id, data) => {
  const response = await api.put(`/orders/${id}`, data);
  return response.data;
};

export const deleteOrder = async (id) => {
  const response = await api.delete(`/orders/${id}`);
  return response.data;
};
