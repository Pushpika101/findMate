import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../services/api';
import { saveToken, getToken, removeToken, saveUser, getUser, clearStorage } from '../services/storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const savedToken = await getToken();
      const savedUser = await getUser();

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(savedUser);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error };
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      
      if (response.success && response.data) {
        const { token: newToken, user: newUser } = response.data;
        
        await saveToken(newToken);
        await saveUser(newUser);
        
        setToken(newToken);
        setUser(newUser);
        
        return { success: true, data: response.data };
      }
      
      return { success: false, error: 'Login failed' };
    } catch (error) {
      return { success: false, error };
    }
  };

  const logout = async () => {
    try {
      await clearStorage();
      setToken(null);
      setUser(null);
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  const updateUser = async (userData) => {
    try {
      await saveUser(userData);
      setUser(userData);
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user && !!token,
    register,
    login,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};