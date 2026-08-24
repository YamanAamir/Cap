import axios from 'axios';
import Cookies from 'js-cookie';

// Dynamic API URL detection
const getBaseUrl = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }
  return import.meta.env.VITE_API_URL;
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

function safeParseJson(value) {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        const parsed = JSON.parse(value);
        return safeParseJson(parsed);
      } catch (e) {
        return value;
      }
    }
  }
  if (Array.isArray(value)) {
    return value.map(safeParseJson);
  }
  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    const parsedObj = {};
    for (const key of Object.keys(value)) {
      parsedObj[key] = safeParseJson(value[key]);
    }
    return parsedObj;
  }
  return value;
}

// Response interceptor to safely parse any JSON string fields
api.interceptors.response.use(
  (response) => {
    response.data = safeParseJson(response.data);
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
