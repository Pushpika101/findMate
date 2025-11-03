import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import {
  saveToken,
  getToken,
  removeToken,
  saveUser,
  getUser,
  removeUser,
  clearStorage
} from '../services/storage';
import { initializeSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Load token and user from storage on mount
    const init = async () => {
      setLoading(true);
      try {
        const storedToken = await getToken();
        const storedUser = await getUser();
        if (storedToken) {
          setToken(storedToken);
          if (storedUser) setUser(storedUser);
          // Try to initialize socket if token exists
          await initializeSocket();
        }
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      if (response && response.success && response.data) {
        const { token: newToken, user: newUser } = response.data;
        await saveToken(newToken);
        await saveUser(newUser);
        setToken(newToken);
        setUser(newUser);
        // initialize socket
        await initializeSocket();
        return { success: true, data: response.data };
      }
      return { success: false, error: response?.error || 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error?.toString() || 'Login error' };
    }
  };

  const register = async (payload) => {
    try {
      const response = await authAPI.register(payload);
      if (response && response.success && response.data) {
        // Optionally auto-login after register if token returned
        if (response.data.token) {
          await saveToken(response.data.token);
          setToken(response.data.token);
        }
        if (response.data.user) {
          await saveUser(response.data.user);
          setUser(response.data.user);
        }
        return { success: true, data: response.data };
      }
      return { success: false, error: response?.error || 'Registration failed' };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: error?.toString() || 'Register error' };
    }
  };

  const logout = async () => {
    try {
      disconnectSocket();
      await clearStorage();
      setToken(null);
      setUser(null);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error };
    }
  };

  const value = {
    loading,
    isAuthenticated: !!token,
    token,
    user,
    login,
    register,
    logout,
    setUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;