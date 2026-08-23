import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api, {
  getAccessToken,
  setAccessToken,
  setRefreshToken,
  clearTokens,
} from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return null;
    }
    try {
      const { data } = await api.get('/users/me');
      setUser(data);
      return data;
    } catch {
      clearTokens();
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  useEffect(() => {
    const handler = () => {
      clearTokens();
      setUser(null);
      window.location.href = '/login';
    };
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, []);

  const register = useCallback(async ({ username, email, password }) => {
    const { data } = await api.post('/auth/register', {
      username,
      email,
      password,
      device: 'web',
    });
    return data;
  }, []);

  const sendVerificationCode = useCallback(async (email) => {
    const { data } = await api.post('/auth/send-verification-code', { email });
    return data;
  }, []);

  const verifyEmail = useCallback(async ({ email, code }) => {
    const { data } = await api.post('/auth/verify-email', { email, code });
    if (data.accessToken) setAccessToken(data.accessToken);
    if (data.refreshToken) setRefreshToken(data.refreshToken);
    if (data.user) setUser(data.user);
    return data;
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const { data } = await api.post('/auth/login', {
      email,
      password,
      device: 'web',
    });
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    setUser(data.user);
    return data;
  }, []);

  const loginWithGoogle = useCallback(async (credential) => {
    const { data } = await api.post('/auth/google', {
      credential,
      device: 'web',
    });
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    setUser(data.user);
    return data;
  }, []);

  const refreshToken = useCallback(async () => {
    const refresh = getRefreshToken();
    if (!refresh) return null;
    const { data } = await api.post('/auth/refresh', { refreshToken: refresh });
    setAccessToken(data.accessToken);
    return data.accessToken;
  }, []);

  const logout = useCallback(async () => {
    try {
      const refresh = getRefreshToken();
      if (refresh) {
        await api.post('/auth/logout', { refreshToken: refresh });
      }
    } finally {
      clearTokens();
      setUser(null);
      window.location.href = '/login';
    }
  }, []);

  const updateProfile = useCallback(async (payload) => {
    const { data } = await api.put('/users/me', payload);
    setUser(data);
    return data;
  }, []);

  const value = {
    user,
    setUser,
    loading,
    register,
    sendVerificationCode,
    verifyEmail,
    login,
    loginWithGoogle,
    refreshToken,
    logout,
    updateProfile,
    fetchCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
