import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

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

export const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload || typeof payload.exp !== 'number') return true;
    return payload.exp * 1000 < Date.now();
  } catch (e) {
    return true; // Safe fallback: treat malformed/errored token as expired
  }
};

const decodeTokenPayload = (token) => {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1]));
  } catch (e) {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('vpms_token'));

  // Inactivity tracking using useRef to avoid re-renders during event listeners
  const lastActivityRef = useRef(Date.now());

  // Centralized logout function
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('vpms_token');
    localStorage.removeItem('vpms_last_activity');
  };

  // Synchronize state and validate on mount / token change
  useEffect(() => {
    if (token) {
      if (isTokenExpired(token)) {
        logout();
        return;
      }

      localStorage.setItem('vpms_token', token);
      const payload = decodeTokenPayload(token);
      if (payload) {
        setUser({
          username: payload.unique_name,
          fullName: payload.sub,
          roles: payload.role ? (Array.isArray(payload.role) ? payload.role : [payload.role]) : [],
          permissions: payload.permission ? (Array.isArray(payload.permission) ? payload.permission : [payload.permission]) : []
        });
      } else {
        logout();
      }
    } else {
      logout();
    }
  }, [token]);

  // Session checking and inactivity listeners
  useEffect(() => {
    if (!token || isTokenExpired(token)) return;

    // Set up local activity tracking
    const storedActivity = localStorage.getItem('vpms_last_activity');
    lastActivityRef.current = storedActivity ? parseInt(storedActivity, 10) : Date.now();
    if (!storedActivity) {
      localStorage.setItem('vpms_last_activity', lastActivityRef.current.toString());
    }

    let throttleTimeout = null;
    const updateActivity = () => {
      const now = Date.now();
      lastActivityRef.current = now;
      if (!throttleTimeout) {
        localStorage.setItem('vpms_last_activity', now.toString());
        throttleTimeout = setTimeout(() => {
          throttleTimeout = null;
        }, 10000); // Throttle writes to localStorage (once every 10 seconds)
      }
    };

    // Reset inactivity timer on click, keydown, touchstart, mousemove, scroll
    const events = ['click', 'keydown', 'touchstart', 'mousemove', 'scroll'];
    events.forEach(event => window.addEventListener(event, updateActivity, { passive: true }));

    // Inactivity timeout limit: exactly 1 hour (3,600,000 ms)
    const timeoutLimit = 3600000;

    // 30-Second Session Check (Order: JWT Expired? -> YES: logout -> NO: Inactive for 1h? -> YES: logout)
    const checkSession = () => {
      // Step 1: Is JWT expired?
      if (isTokenExpired(token)) {
        logout();
        return;
      }

      // Step 2: Has user been inactive for more than 1 hour?
      const now = Date.now();
      if (now - lastActivityRef.current > timeoutLimit) {
        logout();
      }
    };

    // 30 seconds check interval
    const intervalId = setInterval(checkSession, 30000);

    // Initial check right away
    checkSession();

    return () => {
      events.forEach(event => window.removeEventListener(event, updateActivity));
      clearInterval(intervalId);
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
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

  const apiRequest = async (endpoint, options = {}) => {
    // Before executing API request, do a quick check of local expiration
    if (isTokenExpired(token)) {
      logout();
      throw new Error('Session has expired.');
    }

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
      // Backend 401 Handling
      if (response.status === 401) {
        logout();
      }
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

