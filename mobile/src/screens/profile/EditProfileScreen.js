import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { usersAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import useThemedStyles from '../../hooks/useThemedStyles';
import { API_URL } from '../../utils/constants';

const EditProfileScreen = ({ navigation, route }) => {
  const { profile } = route.params || {};
  const { setUser, user: authUser } = useAuth();

  // Support loading via route param or fall back to auth user
  const initialProfile = profile || authUser || {};

  const [name, setName] = useState(initialProfile?.name || '');
  const [email] = useState(initialProfile?.email || '');
  // derive studentId from route param or auth context so it stays up-to-date
  const studentId = profile?.student_id || authUser?.student_id || '';
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoUri, setPhotoUri] = useState(profile?.profile_photo || null);
  const _API_URL = API_URL;

  const { colors } = useTheme();
  const styles = useThemedStyles((c) => ({
    container: { padding: 20, backgroundColor: c.background, flexGrow: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 60,
      paddingBottom: 20,
      paddingHorizontal: 20,
      backgroundColor: c.primary,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      overflow: 'visible',
      marginBottom: 8,
      marginHorizontal: -20,
      marginTop: -33
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: c.white },
    backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    backButtonText: { fontSize: 28, color: c.white },
    placeholder: { width: 40 },
    field: { marginBottom: 16 },
    label: { fontSize: 13, color: c.textSecondary, marginBottom: 6 },
    input: { backgroundColor: c.white, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: c.border },
    saveButton: { marginTop: 12, backgroundColor: c.primary, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
    saveButtonText: { color: c.white, fontWeight: '700' },
    photoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    avatarContainer: { position: 'relative' },
    avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: c.gray200 },
    avatarPlaceholder: { width: 96, height: 96, borderRadius: 48, backgroundColor: c.primary, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 36, fontWeight: '700', color: c.white },
    cameraIcon: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: c.white, borderWidth: 1, borderColor: c.primary, justifyContent: 'center', alignItems: 'center' },
    cameraIconText: { fontSize: 12 },
    readOnlyField: { marginBottom: 12 },
    readOnlyText: { backgroundColor: c.white, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: c.border, color: c.textPrimary }
  }));

  const deriveStudentIdFromEmail = (email) => {
    if (!email) return null;
    const m = String(email).toLowerCase().match(/^e(\d{5})/);
    if (m) {
      const digits = m[1];
      const yy = digits.slice(0, 2);
      const nnn = digits.slice(2);
      return `E/${yy}/${nnn}`;
    }
    return null;
  };

  const displayStudentId = profile?.student_id || authUser?.student_id || deriveStudentIdFromEmail(profile?.email || authUser?.email) || '';

  const validate = () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Name is required');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        name: name.trim()
      };

      const response = await usersAPI.updateProfile(payload);
      if (response && response.success) {
        // Debug: log returned user object to ensure backend returns student_id
        try {
          console.log('[EditProfileScreen] updateProfile response.user ->', response.data?.user);
        } catch (e) {}
        // Update auth context and go back
        if (setUser && response.data?.user) setUser(prev => {
          const returned = response.data.user || {};
          const emailToUse = returned.email || prev?.email;
          const derived = deriveStudentIdFromEmail(emailToUse);
          // Preserve existing student_id if backend returned null/undefined, otherwise use derived
          return {
            ...(prev || {}),
            ...returned,
            student_id: returned.student_id ?? prev?.student_id ?? derived
          };
        });
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

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access gallery is required');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        await uploadProfilePhoto(asset);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadProfilePhoto = async (photo) => {
    setUploading(true);
    try {
      const response = await usersAPI.updateProfilePhoto(photo);
      if (response && response.success) {
        if (response.data?.user) {
          if (setUser) setUser(prev => ({ ...(prev || {}), ...(response.data.user || {}) }));
            if (setUser) setUser(prev => {
              const returned = response.data.user || {};
              const emailToUse = returned.email || prev?.email;
              const derived = deriveStudentIdFromEmail(emailToUse);
              // Preserve existing student_id if backend returned null/undefined, otherwise use derived
              return {
                ...(prev || {}),
                ...returned,
                student_id: returned.student_id ?? prev?.student_id ?? derived
              };
            });
          // Normalize localhost/relative URLs to API origin so device can load
          let uri = response.data.user.profile_photo || null;
          try {
            const parsed = new URL(uri);
            if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
              const apiOrigin = _API_URL.replace(/\/api\/?$/, '');
              uri = apiOrigin + parsed.pathname + parsed.search + parsed.hash;
            }
          } catch (e) {
            if (uri && uri.startsWith('/')) {
              const apiOrigin = _API_URL.replace(/\/api\/?$/, '');
              uri = apiOrigin + uri;
            }
          }
          setPhotoUri(uri);
          // Debug: log returned and normalized profile photo URL
          try {
            console.log('[EditProfileScreen] upload response profile_photo raw:', response.data.user.profile_photo, 'normalized:', uri);
          } catch (e) {
            console.log('[EditProfileScreen] uploadProfilePhoto - logging failed', e);
          }
        }
        Alert.alert('Success', 'Profile photo updated');
      } else {
        Alert.alert('Error', response?.error || 'Failed to upload photo');
      }
    } catch (err) {
      Alert.alert('Error', err?.toString() || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.photoRow}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarContainer} disabled={uploading}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{name?.charAt(0)?.toUpperCase() || '?'}</Text>
              </View>
            )}
            <View style={styles.cameraIcon}>
              <Text style={styles.cameraIconText}>📷</Text>
            </View>
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.label}>Name</Text>
            <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Full name" />
          </View>
        </View>

        <View style={styles.readOnlyField}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.readOnlyText}>{email || '—'}</Text>
        </View>

        <View style={styles.readOnlyField}>
          <Text style={styles.label}>Student ID</Text>
          <Text style={styles.readOnlyText}>{displayStudentId || '—'}</Text>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading || uploading}>
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// styles are created via useThemedStyles inside the component

export default EditProfileScreen;
