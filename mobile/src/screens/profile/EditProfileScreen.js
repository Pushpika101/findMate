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
  ScrollView,
  Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { usersAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import COLORS from '../../utils/colors';
import { API_URL } from '../../utils/constants';

const EditProfileScreen = ({ navigation, route }) => {
  const { profile } = route.params || {};
  const { setUser, user: authUser } = useAuth();

  // Support loading via route param or fall back to auth user
  const initialProfile = profile || authUser || {};

  const [name, setName] = useState(initialProfile?.name || '');
  const [email] = useState(initialProfile?.email || '');
  const [studentId] = useState(initialProfile?.student_id || '');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoUri, setPhotoUri] = useState(profile?.profile_photo || null);
  const _API_URL = API_URL;

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
          if (setUser) setUser(response.data.user);
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
        <Text style={styles.title}>Edit Profile</Text>

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
          <Text style={styles.readOnlyText}>{studentId || '—'}</Text>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading || uploading}>
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
  ,
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  avatarContainer: {
    position: 'relative'
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.gray200
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.white
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cameraIconText: {
    fontSize: 12
  },
  readOnlyField: {
    marginBottom: 12
  },
  readOnlyText: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.textPrimary
  }
});

export default EditProfileScreen;
