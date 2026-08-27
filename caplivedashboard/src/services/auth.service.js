import api from './api';
import Cookies from 'js-cookie';

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  if (response.data.token) {
    Cookies.set('token', response.data.token, { expires: 1 }); // 1 day
  }
  return response.data;
};

export const logout = async () => {
  await api.post('/auth/logout');
  Cookies.remove('token');
};

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

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

export const resendOrderEmails = async (id) => {
  const response = await api.post(`/orders/${id}/resend-email`);
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
