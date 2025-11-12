import React, { useState } from 'react';
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

const ForgotPassword = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const validate = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!email.includes('@')) {
      setError('Invalid email format');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setError(null);
    try {
      // Use OTP-based reset: backend will send a 6-digit code and short expiry
      await authAPI.forgotPasswordOtp({ email: email.trim().toLowerCase() });
      setLoading(false);
      Alert.alert('Email Sent', 'A 6-digit reset code has been sent to that email. Please check your inbox.', [
        { text: 'OK', onPress: () => navigation.navigate('ResetPassword', { email: email.trim().toLowerCase() }) }
      ]);
    } catch (err) {
      setLoading(false);
      const msg = err?.toString() || 'Failed to send reset code';
      setError(msg);
      Alert.alert('Error', msg);
    }
  };

  const { colors } = useTheme();

  const styles = useThemedStyles((c) => ({
    container: {
      flex: 1,
      backgroundColor: c.background
    },
    scrollContent: {
      flexGrow: 1,
      padding: 24,
      paddingTop: 60
    },
    header: {
      marginBottom: 32,
      alignItems: 'center'
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: c.textInverse,
      marginBottom: 8
    },
    subtitle: { fontSize: 14, color: c.textSecondary, textAlign: 'center' },
    form: { width: '100%' },
    inputContainer: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: c.textInverse, marginBottom: 8 },
    input: { height: 50, borderWidth: 1, borderColor: c.border, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, backgroundColor: c.white },
    inputError: { borderColor: c.error },
    errorText: { color: c.error, fontSize: 12, marginTop: 4 },
    sendButton: { height: 50, backgroundColor: c.primary, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 8, marginBottom: 16 },
    sendButtonDisabled: { opacity: 0.6 },
    sendButtonText: { color: c.white, fontSize: 16, fontWeight: '600' },
    loginContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 24 },
    loginText: { color: c.textSecondary, fontSize: 14 },
    loginLink: { color: c.primary, fontSize: 14, fontWeight: '600' }
  }));

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>Enter your email to receive reset instructions.</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, error && styles.inputError]}
              placeholder="your.email@eng.pdn.ac.lk"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError(null);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>

          <TouchableOpacity
            style={[styles.sendButton, loading && styles.sendButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.sendButtonText}>Send reset email</Text>
            )}
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

export default ForgotPassword;
