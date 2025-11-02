import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import LoginScreen from './src/screens/auth/LoginScreen';

export default function App() {
  return (
    <AuthProvider>
      <LoginScreen />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}

