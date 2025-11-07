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
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import useThemedStyles from '../../hooks/useThemedStyles';
import { ALLOWED_EMAIL_DOMAIN } from '../../utils/constants';

const SignupScreen = ({ navigation }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentId: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      fontSize: 32,
      fontWeight: 'bold',
      color: c.textPrimary,
      marginBottom: 8
    },
    subtitle: {
      fontSize: 16,
      color: c.textSecondary,
      textAlign: 'center'
    },
    form: { width: '100%' },
    inputContainer: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: c.textPrimary, marginBottom: 8 },
    input: { height: 50, borderWidth: 1, borderColor: c.border, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, backgroundColor: c.white },
    inputError: { borderColor: c.error },
    errorText: { color: c.error, fontSize: 12, marginTop: 4 },
    signupButton: { height: 50, backgroundColor: c.primary, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 8, marginBottom: 16 },
    signupButtonDisabled: { opacity: 0.6 },
    signupButtonText: { color: c.white, fontSize: 16, fontWeight: '600' },
    termsText: { fontSize: 12, color: c.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 18 },
    loginContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 24 },
    loginText: { color: c.textSecondary, fontSize: 14 },
    loginLink: { color: c.primary, fontSize: 14, fontWeight: '600' },
    inputWithToggle: { position: 'relative' },
    showButton: { position: 'absolute', right: 12, top: 12, paddingVertical: 4, paddingHorizontal: 8 },
    showButtonText: { color: c.primary, fontWeight: '600' }
  }));

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    // Clear error for this field
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!formData.email.includes('@')) {
      newErrors.email = 'Invalid email format';
    } else if (!formData.email.toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN)) {
      newErrors.email = `Only ${ALLOWED_EMAIL_DOMAIN} email addresses are allowed`;
    }

    // Student ID validation (optional but recommended)
    if (formData.studentId.trim() && formData.studentId.trim().length < 3) {
      newErrors.studentId = 'Student ID must be at least 3 characters';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setLoading(true);

    const userData = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      student_id: formData.studentId.trim(),
      password: formData.password
    };

    const result = await register(userData);
    setLoading(false);

    if (result.success) {
      // navigate to OTP verification screen with email prefilled
      navigation.navigate('VerifyOtp', { email: userData.email });
    } else {
      Alert.alert('Registration Failed', result.error || 'Something went wrong');
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
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Join findMate - Peradeniya Campus
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Enter your full name"
              value={formData.name}
              onChangeText={(text) => handleInputChange('name', text)}
              autoCapitalize="words"
              autoCorrect={false}
            />
            {errors.name && (
              <Text style={styles.errorText}>{errors.name}</Text>
            )}
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="your.email@eng.pdn.ac.lk"
              value={formData.email}
              onChangeText={(text) => handleInputChange('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          {/* Student ID Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Student ID (Optional)</Text>
            <TextInput
              style={[styles.input, errors.studentId && styles.inputError]}
              placeholder="E/18/001"
              value={formData.studentId}
              onChangeText={(text) => handleInputChange('studentId', text)}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            {errors.studentId && (
              <Text style={styles.errorText}>{errors.studentId}</Text>
            )}
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password *</Text>
            <View style={styles.inputWithToggle}>
              <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                placeholder="At least 6 characters"
                value={formData.password}
                onChangeText={(text) => handleInputChange('password', text)}
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

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password *</Text>
            <View style={styles.inputWithToggle}>
              <TextInput
                style={[styles.input, errors.confirmPassword && styles.inputError]}
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChangeText={(text) => handleInputChange('confirmPassword', text)}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                style={styles.showButton}
                onPress={() => setShowConfirmPassword((s) => !s)}
                accessibilityLabel={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                <Text style={styles.showButtonText}>{showConfirmPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            )}
          </View>

          {/* Signup Button */}
          <TouchableOpacity
            style={[styles.signupButton, loading && styles.signupButtonDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.signupButtonText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          {/* Terms Text */}
          <Text style={styles.termsText}>
            By signing up, you agree to our Terms of Service and Privacy Policy
          </Text>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignupScreen;