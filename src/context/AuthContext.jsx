import React, { createContext, useContext, useState, useEffect } from 'react';

const getApiUrl = () => {
  const isCapacitor = 
    (typeof window !== 'undefined' && window.Capacitor) ||
    (window.location.hostname === 'localhost' && !window.location.port) ||
    window.location.protocol === 'capacitor:';
  if (isCapacitor) {
    return 'http://148.230.67.168:8087/api';
  }
  return window.location.port === '3000' || window.location.port === '5173'
    ? 'http://localhost:5208/api'
    : `http://148.230.67.168:8087/api`;
};

const ApiUrl = getApiUrl();

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('vpms_token'));

  useEffect(() => {
    if (token) {
      localStorage.setItem('vpms_token', token);
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({
          username: payload.unique_name,
          fullName: payload.sub,
          roles: payload.role ? (Array.isArray(payload.role) ? payload.role : [payload.role]) : [],
          permissions: payload.permission ? (Array.isArray(payload.permission) ? payload.permission : [payload.permission]) : []
        });
      } catch (e) {
        logout();
      }
    } else {
      localStorage.removeItem('vpms_token');
      setUser(null);
    }
  }, [token]);

  const login = async (username, password) => {
    const res = await fetch(`${ApiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) throw new Error('Invalid login credentials.');
    const data = await res.json();
    setToken(data.data.token);
    return data;
  };

  const logout = () => {
    setToken(null);
  };

  const apiRequest = async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    };
    const response = await fetch(`${ApiUrl}${endpoint}`, {
      ...options,
      headers
    });
    if (!response.ok) {
      if (response.status === 401) logout();
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'API request failed');
    }
    return response.json().catch(() => ({}));
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, apiRequest }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export { ApiUrl };
