import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import COLORS from '../../utils/colors';

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState(null);
  const [showResend, setShowResend] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!email.includes('@')) {
      newErrors.email = 'Invalid email format';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    const result = await login(email.trim().toLowerCase(), password);
    setLoading(false);

    if (result.success) {
      // Navigation handled by AppNavigator
    } else {
      const errorMsg = result.error || 'Invalid credentials';
      Alert.alert('Login Failed', errorMsg);

      // If backend blocked login because email not verified, show resend UI
      // We check for substrings to keep it robust to small message changes.
      const lower = (errorMsg || '').toLowerCase();
      if (lower.includes('verify') || lower.includes('not verified') || lower.includes('unverified')) {
        setShowResend(true);
        setResendMessage('Your email is not verified. You can resend the verification email.');
      }
    }
  };

  const handleResend = async () => {
    // small guard
    if (!email || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter your email to resend verification.');
      return;
    }

    setResendLoading(true);
    setResendMessage(null);
    try {
      await authAPI.resendVerification({ email: email.trim().toLowerCase() });
      setResendMessage('Verification email sent. Check your inbox.');
    } catch (err) {
      // api returns string errors via interceptor
      const msg = err?.toString() || 'Failed to resend verification email';
      setResendMessage(msg);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>
            Sign in to continue to findMate
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="your.email@eng.pdn.ac.lk"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setErrors({ ...errors, email: null });
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWithToggle}>
              <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                placeholder="Enter your password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setErrors({ ...errors, password: null });
                }}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.showButton}
                onPress={() => setShowPassword((s) => !s)}
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                <Text style={styles.showButtonText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
          </View>

          {/* Forgot Password */}
          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotButton}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* Resend verification area shown when login fails due to unverified email */}
          {showResend && (
            <View style={styles.resendContainer}>
              {resendMessage ? (
                <Text style={styles.resendMessage}>{resendMessage}</Text>
              ) : (
                <Text style={styles.resendMessage}>Your account is not verified.</Text>
              )}

              <TouchableOpacity
                style={[styles.resendButton, resendLoading && styles.loginButtonDisabled]}
                onPress={handleResend}
                disabled={resendLoading}
              >
                {resendLoading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.resendButtonText}>Resend verification email</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24
  },
  header: {
    marginBottom: 40,
    alignItems: 'center'
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center'
  },
  form: {
    width: '100%'
  },
  inputContainer: {
    marginBottom: 20
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: COLORS.white
  },
  inputError: {
    borderColor: COLORS.error
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 24
  },
  forgotText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600'
  },
  loginButton: {
    height: 50,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  loginButtonDisabled: {
    opacity: 0.6
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600'
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  signupText: {
    color: COLORS.textSecondary,
    fontSize: 14
  },
  signupLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600'
  }
  ,
  resendContainer: {
    marginTop: 18,
    alignItems: 'center'
  },
  resendMessage: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 8,
    textAlign: 'center'
  },
  resendButton: {
    height: 44,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16
  },
  resendButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600'
  }
});

// Extra styles for password toggle
const extraStyles = StyleSheet.create({
  inputWithToggle: {
    position: 'relative'
  },
  showButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    paddingVertical: 4,
    paddingHorizontal: 8
  },
  showButtonText: {
    color: COLORS.primary,
    fontWeight: '600'
  }
});

// Merge styles for convenience
Object.assign(styles, extraStyles);

export default LoginScreen;