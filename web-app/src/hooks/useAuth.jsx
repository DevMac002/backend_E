import { useEffect, useState } from 'react';
import api, { setAccessToken, clearAccessToken } from '../api';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }
    api.get('/users/me')
      .then((response) => setUser(response.data))
      .catch(() => {
        clearAccessToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password, device) => {
    const response = await api.post('/auth/login', { email, password, device });
    const { accessToken, user: userData } = response.data;
    setAccessToken(accessToken);
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearAccessToken();
      window.location.href = '/login';
    }
  };

  return { user, loading, login, logout };
}
