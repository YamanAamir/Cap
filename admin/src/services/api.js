import axios from 'axios';
import Cookies from 'js-cookie';

// Dynamic API URL detection
const getBaseUrl = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3000/api';
  }
  return 'https://cap-dev-backend-one.vercel.app/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
});

// Request interceptor to add token from cookies
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
