import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignupScreen from './src/screens/auth/SignupScreen';
import MainNavigator from './src/navigation/AppNavigator';
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import COLORS from './src/utils/colors';

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

  return (
    <NavigationContainer>
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