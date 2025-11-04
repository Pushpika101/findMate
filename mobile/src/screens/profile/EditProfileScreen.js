import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { usersAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import COLORS from '../../utils/colors';

const EditProfileScreen = ({ navigation, route }) => {
  const { profile } = route.params || {};
  const { setUser } = useAuth();

  const [name, setName] = useState(profile?.name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [studentId, setStudentId] = useState(profile?.student_id || '');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Name is required');
      return false;
    }
    if (!email.trim()) {
      Alert.alert('Validation', 'Email is required');
      return false;
    }
    // Basic email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Validation', 'Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        student_id: studentId ? studentId.trim() : undefined
      };

      const response = await usersAPI.updateProfile(payload);
      if (response && response.success) {
        // Update auth context and go back
        if (setUser && response.data?.user) setUser(response.data.user);
        Alert.alert('Success', 'Profile updated');
        navigation.goBack();
      } else {
        Alert.alert('Error', response?.error || 'Failed to update profile');
      }
    } catch (err) {
      Alert.alert('Error', err?.toString() || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Edit Profile</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Name</Text>
          <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Full name" />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput value={email} onChangeText={setEmail} style={styles.input} placeholder="Email" keyboardType="email-address" autoCapitalize="none" />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Student ID</Text>
          <TextInput value={studentId} onChangeText={setStudentId} style={styles.input} placeholder="Student ID (optional)" />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: COLORS.background,
    flexGrow: 1
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
    color: COLORS.textPrimary
  },
  field: {
    marginBottom: 16
  },
  label: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 6
  },
  input: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  saveButton: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center'
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: '700'
  }
});

export default EditProfileScreen;
