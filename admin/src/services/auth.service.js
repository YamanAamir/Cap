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
export const updateOrderStatus = async (id, status) => {
  const response = await api.patch(`/orders/${id}/status`, { status });
  return response.data;
};
