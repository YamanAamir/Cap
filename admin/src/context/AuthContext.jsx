import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe, login as authLogin, login2fa as authLogin2fa, logout as authLogout } from '../services/auth.service';
import Cookies from 'js-cookie';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const userData = await getMe();
      setUser(userData);
      return userData;
    } catch (error) {
      setUser(null);
      return null;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = Cookies.get('token');
      if (token) {
        try {
          const userData = await getMe();
          setUser(userData);
        } catch (error) {
          Cookies.remove('token');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const data = await authLogin(email, password);
    if (data.user) {
      setUser(data.user);
    }
    return data;
  };

  const verify2fa = async (mfaToken, code) => {
    const data = await authLogin2fa(mfaToken, code);
    if (data.user) {
      setUser(data.user);
    }
    return data;
  };

  const logout = async () => {
    await authLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, verify2fa, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
