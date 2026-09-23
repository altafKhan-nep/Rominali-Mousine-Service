import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getMe,
} from '../services/authService.js';
import { tokenStore } from '../services/api.js';
import { connectSocket, disconnectSocket } from '../services/socketService.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    tokenStore.setActiveRole(tokenStore.resolveRole());
    if (!tokenStore.access) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await getMe();
      tokenStore.setActiveRole(data.user.role);
      setUser(data.user);
    } catch {
      tokenStore.clear();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (user) connectSocket(user._id, user.role);
    return () => disconnectSocket();
  }, [user]);

  const login = async (payload) => {
    const { data } = await apiLogin(payload);
    tokenStore.setActiveRole(data.user.role);
    tokenStore.setTokens(data.tokens.accessToken, data.tokens.refreshToken);
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await apiRegister(payload);
    tokenStore.setActiveRole(data.user.role);
    tokenStore.setTokens(data.tokens.accessToken, data.tokens.refreshToken);
    setUser(data.user);
    return data; // includes user + verificationLink (dev)
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);