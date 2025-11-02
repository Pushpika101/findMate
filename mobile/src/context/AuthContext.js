import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../services/api';
import { saveToken, getToken, removeToken, saveUser, getUser, clearStorage } from '../services/storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Check if user is logged in on app start
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

  // Register
  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error };
    }
  };

  // Login
  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      
      if (response.success && response.data) {
        const { token: newToken, user: newUser } = response.data;
        
        // Save to storage
        await saveToken(newToken);
        await saveUser(newUser);
        
        // Update state
        setToken(newToken);
        setUser(newUser);
        
        return { success: true, data: response.data };
      }
      
      return { success: false, error: 'Login failed' };
    } catch (error) {
      return { success: false, error };
    }
  };

  // Logout
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

  // Update user
  const updateUser = async (userData) => {
    try {
      await saveUser(userData);
      setUser(userData);
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  // Verify email
  const verifyEmail = async (verificationToken) => {
    try {
      const response = await authAPI.verifyEmail(verificationToken);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error };
    }
  };

  // Forgot password
  const forgotPassword = async (email) => {
    try {
      const response = await authAPI.forgotPassword(email);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error };
    }
  };

  // Reset password
  const resetPassword = async (resetToken, newPassword) => {
    try {
      const response = await authAPI.resetPassword({ 
        token: resetToken, 
        password: newPassword 
      });
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error };
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    try {
      const response = await authAPI.getMe();
      if (response.success && response.data) {
        await saveUser(response.data.user);
        setUser(response.data.user);
        return { success: true, data: response.data.user };
      }
      return { success: false, error: 'Failed to refresh user' };
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
    updateUser,
    verifyEmail,
    forgotPassword,
    resetPassword,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};