import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {createContext, useContext, useEffect, useMemo, useState} from 'react';

import {loginAdmin, AdminUser} from '../services/api/admin';
import {ADMIN_TOKEN_KEY, ADMIN_USER_KEY} from '../services/api/client';
import {disconnectAdminSocket} from '../services/socket/adminSocket';

type AuthContextValue = {
  isBootstrapping: boolean;
  isAuthenticated: boolean;
  user: AdminUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({children}: React.PropsWithChildren) => {
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [token, setToken] = useState('');
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    async function restoreSession() {
      const [savedToken, savedUser] = await Promise.all([
        AsyncStorage.getItem(ADMIN_TOKEN_KEY),
        AsyncStorage.getItem(ADMIN_USER_KEY),
      ]);

      setToken(savedToken || '');
      setUser(savedUser ? JSON.parse(savedUser) : null);
      setIsBootstrapping(false);
    }

    restoreSession().catch(() => setIsBootstrapping(false));
  }, []);

  async function login(email: string, password: string) {
    const response = await loginAdmin(email, password);
    const token = response.token;
    const user = response.user;

    if (!token || !user) {
      throw new Error('Admin login did not return a valid session. Please try again.');
    }

    await Promise.all([
      AsyncStorage.setItem(ADMIN_TOKEN_KEY, token),
      AsyncStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user)),
    ]);

    setToken(token);
    setUser(user);
  }

  async function logout() {
    await Promise.all([
      AsyncStorage.removeItem(ADMIN_TOKEN_KEY),
      AsyncStorage.removeItem(ADMIN_USER_KEY),
    ]);

    disconnectAdminSocket();
    setToken('');
    setUser(null);
  }

  const value = useMemo(
    () => ({
      isBootstrapping,
      isAuthenticated: Boolean(token),
      user,
      login,
      logout,
    }),
    [isBootstrapping, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAdminAuth = () => {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('useAdminAuth must be used within AuthProvider');
  }

  return value;
};
