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

const VerifyOtp = ({ navigation, route }) => {
  const emailFromParams = route?.params?.email || '';
  const [email, setEmail] = useState(emailFromParams);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let t;
    if (cooldown > 0) {
      t = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    // Do NOT auto-send OTP on mount. The backend already sends an OTP during registration.
    // Auto-sending here caused duplicate OTPs (one sent on register, another sent by the app).
  }, []);

  const handleVerify = async () => {
    if (!email || !code) {
      Alert.alert('Validation', 'Please enter your email and code');
      return;
    }
    setLoading(true);
    try {
      await authAPI.verifyOtp({ email: email.trim().toLowerCase(), otp: code.trim() });
      setLoading(false);
      Alert.alert('Verified', 'Your account is now verified', [{ text: 'OK', onPress: () => navigation.navigate('Login') }]);
    } catch (err) {
      setLoading(false);
      Alert.alert('Error', err?.toString() || 'Verification failed');
    }
  };

  const handleResend = async () => {
    if (!email) {
      Alert.alert('Email required', 'Please enter your email first');
      return;
    }
    setResendLoading(true);
    setMessage(null);
    try {
      await authAPI.sendOtp({ email: email.trim().toLowerCase() });
      setMessage('Verification code sent. Check your email.');
      setCooldown(60);
    } catch (err) {
      setMessage(err?.toString() || 'Failed to send code');
    } finally {
      setResendLoading(false);
    }
  };

  const { colors } = useTheme();
  const styles = useThemedStyles((c) => ({
    container: { flex: 1, backgroundColor: c.background },
    scrollContent: { flexGrow: 1, padding: 24, paddingTop: 60 },
    header: { marginBottom: 24, alignItems: 'center' },
    title: { fontSize: 24, fontWeight: '700', color: c.textPrimary },
    subtitle: { fontSize: 14, color: c.textSecondary, textAlign: 'center' },
    form: { width: '100%', marginTop: 20 },
    inputContainer: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '600', color: c.textPrimary, marginBottom: 8 },
    input: { height: 50, borderWidth: 1, borderColor: c.border, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, backgroundColor: c.white },
    verifyButton: { height: 50, backgroundColor: c.primary, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 12 },
    verifyText: { color: c.white, fontWeight: '700' },
    disabled: { opacity: 0.6 },
    resendRow: { marginTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    resendText: { color: c.textSecondary },
    resendButton: { color: c.primary, fontWeight: '700' },
    disabledText: { color: c.textSecondary },
    loginContainer: { marginTop: 24, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    loginText: { color: c.textSecondary },
    loginLink: { color: c.primary, fontWeight: '700' }
  }));

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Verify Account</Text>
          <Text style={styles.subtitle}>Enter the 6-digit code sent to your email.</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="your.email@eng.pdn.ac.lk"
              value={email}
              onChangeText={(t) => setEmail(t)}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Verification Code</Text>
            <TextInput
              style={styles.input}
              placeholder="123456"
              value={code}
              onChangeText={(t) => setCode(t)}
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>

          <TouchableOpacity style={[styles.verifyButton, loading && styles.disabled]} onPress={handleVerify} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.verifyText}>Verify</Text>}
          </TouchableOpacity>

          <View style={styles.resendRow}>
            <Text style={styles.resendText}>{message || 'Didn\'t receive a code?'}</Text>
            <TouchableOpacity onPress={handleResend} disabled={resendLoading || cooldown > 0}>
              <Text style={[styles.resendButton, (resendLoading || cooldown > 0) && styles.disabledText]}>
                {resendLoading ? 'Sending...' : cooldown > 0 ? `Resend (${cooldown}s)` : 'Resend code'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Back to </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// styles defined inside component via useThemedStyles

export default VerifyOtp;
