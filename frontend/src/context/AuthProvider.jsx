import { useCallback, useMemo, useState } from 'react';
import axios from '../api/axios';
import { AuthContext } from './AuthContext';

function getStoredUser() {
  try {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      return null;
    }

    const user = JSON.parse(storedUser);

    if (typeof user?.username !== 'string' || typeof user?.role !== 'string') {
      return null;
    }

    return { username: user.username, role: user.role, token };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);

  const login = useCallback(async (username, password) => {
    const { data } = await axios.post('/auth/login', { username, password }, {
      skipAuthRedirect: true,
    });
    const authenticatedUser = {
      username: data.username,
      role: data.role,
      token: data.token,
    };

    localStorage.setItem('token', authenticatedUser.token);
    localStorage.setItem('user', JSON.stringify(authenticatedUser));
    setUser(authenticatedUser);

    return authenticatedUser;
  }, []);

  const register = useCallback(async (username, password, fullName, role) => {
    const { data } = await axios.post('/auth/register', {
      username,
      password,
      fullName,
      role,
    }, {
      skipAuthRedirect: true,
    });

    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const value = useMemo(() => ({
    user,
    login,
    register,
    logout,
    isAuthenticated: Boolean(user?.token),
  }), [user, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
