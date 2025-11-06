import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import NotificationHandler from './src/components/NotificationHandler';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignupScreen from './src/screens/auth/SignupScreen';
import ForgotPassword from './src/screens/auth/ForgotPassword';
import ResetPassword from './src/screens/auth/ResetPassword';
import VerifyOtp from './src/screens/auth/VerifyOtp';
import MainNavigator from './src/navigation/AppNavigator';
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import COLORS from './src/utils/colors';

// Optional Sentry for React Native. We attempt to require it so the package is
// optional during development. To enable Sentry in production, install
// @sentry/react-native and provide SENTRY_DSN via app config or environment.
let SENTRY = null;
try {
  // eslint-disable-next-line global-require
  const SentryLib = require('@sentry/react-native');
  // Try common places for a DSN: process.env (CI), or Expo config extras
  let dsn = process.env.SENTRY_DSN;
  try {
    // eslint-disable-next-line global-require
    const Constants = require('expo-constants').default;
    dsn = dsn || (Constants?.manifest?.extra && Constants.manifest.extra.SENTRY_DSN) || dsn;
  } catch (e) {
    // ignore expo-constants absence
  }

  if (dsn) {
    SentryLib.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
    });
    SENTRY = SentryLib;
    console.log('Sentry (RN) initialized');
  } else {
    console.log('Sentry DSN not provided - skipping Sentry (RN) initialization');
  }
} catch (err) {
  console.log('Optional dependency @sentry/react-native not installed. To enable Sentry run: npm install @sentry/react-native');
}

const Stack = createStackNavigator();

// Auth Navigator
function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: COLORS.background }
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
      <Stack.Screen name="ResetPassword" component={ResetPassword} />
  <Stack.Screen name="VerifyOtp" component={VerifyOtp} />
    </Stack.Navigator>
  );
}

// Root Navigator
function RootNavigator() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const linking = {
    prefixes: ['findmate://', 'https://findmate.example.com'],
    config: {
      screens: {
        // Map the reset-password path to the ResetPassword screen
        ResetPassword: {
          path: 'reset-password',
          parse: {
            token: (token) => token
          }
        }
      }
    }
  };

  return (
    <NavigationContainer linking={linking}>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

// Root App Component
export default function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <RootNavigator />
        <NotificationHandler />
      </ErrorBoundary>
      <StatusBar style="auto" />
    </AuthProvider>
  );
}

// Simple error boundary to show runtime errors instead of a blank screen
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Uncaught error:', error, info);
    if (SENTRY && typeof SENTRY.captureException === 'function') {
      try { SENTRY.captureException(error, { extra: info }); } catch (e) { console.warn('Sentry capture failed', e); }
    }
    this.setState({ info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={{ color: COLORS.error, fontSize: 18, marginBottom: 12 }}>Something went wrong.</Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginBottom: 12 }}>{this.state.error?.toString()}</Text>
          <TouchableOpacity
            onPress={() => this.setState({ hasError: false, error: null, info: null })}
            style={{ paddingVertical: 10, paddingHorizontal: 16, backgroundColor: COLORS.primary, borderRadius: 8 }}
          >
            <Text style={{ color: COLORS.white }}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background
  }
});