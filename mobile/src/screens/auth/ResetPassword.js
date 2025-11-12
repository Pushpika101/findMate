import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { authAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import useThemedStyles from '../../hooks/useThemedStyles';

// ResetPassword screen: accepts a token and new password, submits to backend
const ResetPassword = ({ navigation, route }) => {
  // token may be passed as route.params.token (if app is deep-linked or navigation sent it)
  const [token, setToken] = useState(route?.params?.token || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { colors } = useTheme();
  const styles = useThemedStyles((colors) => ({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { flexGrow: 1, padding: 24, paddingTop: 60 },
    header: { marginBottom: 32, alignItems: 'center' },
    title: { fontSize: 28, fontWeight: 'bold', color: colors.textInverse, marginBottom: 8 },
    subtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
    form: { width: '100%' },
    inputContainer: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: colors.textInverse, marginBottom: 8 },
  input: { height: 50, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, backgroundColor: colors.white },
  inputRow: { position: 'relative', justifyContent: 'center' },
  showToggle: { position: 'absolute', right: 12, padding: 6 },
  showToggleText: { color: colors.primary, fontWeight: '700' },
    inputError: { borderColor: colors.error },
    errorText: { color: colors.error, fontSize: 12, marginTop: 4 },
    resetButton: { height: 50, backgroundColor: colors.primary, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 8, marginBottom: 16 },
    resetButtonDisabled: { opacity: 0.6 },
    resetButtonText: { color: colors.white, fontSize: 16, fontWeight: '600' },
    loginContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 24 },
    loginText: { color: colors.textSecondary, fontSize: 14 },
    loginLink: { color: colors.primary, fontSize: 14, fontWeight: '600' }
  }));

  useEffect(() => {
    if (route?.params?.token) setToken(route.params.token);
  }, [route?.params?.token]);

  const validate = () => {
    if (!token.trim()) {
      setError('Reset token is required');
      return false;
    }
    if (!password) {
      setError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // If this screen was opened after requesting an OTP, route.params.email will be present
      if (route?.params?.email) {
        // OTP-based reset flow
        const res = await authAPI.resetPasswordWithOtp({ email: route.params.email, otp: token.trim(), password });
        setLoading(false);
        Alert.alert('Success', res?.message || 'Password reset successful', [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
        return;
      }

      // Fallback: token-based reset (link)
      const res = await authAPI.resetPassword({ token: token.trim(), password });
      setLoading(false);
      Alert.alert('Success', res?.message || 'Password reset successful', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (err) {
      setLoading(false);
      const msg = err?.toString() || 'Failed to reset password';
      setError(msg);
      Alert.alert('Error', msg);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Enter the token from your email and choose a new password.</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Reset Token</Text>
            <TextInput
              style={[styles.input, error && styles.inputError]}
              placeholder="Paste token from email"
              value={token}
              onChangeText={(t) => { setToken(t); setError(null); }}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>New Password</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, error && styles.inputError]}
                placeholder="At least 6 characters"
                value={password}
                onChangeText={(t) => { setPassword(t); setError(null); }}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity style={styles.showToggle} onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.showToggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, error && styles.inputError]}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChangeText={(t) => { setConfirmPassword(t); setError(null); }}
                secureTextEntry={!showConfirm}
              />
              <TouchableOpacity style={styles.showToggle} onPress={() => setShowConfirm(!showConfirm)}>
                <Text style={styles.showToggleText}>{showConfirm ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>

          <TouchableOpacity
            style={[styles.resetButton, loading && styles.resetButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.resetButtonText}>Set new password</Text>}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Remembered your password? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// styles are created via useThemedStyles above

export default ResetPassword;
