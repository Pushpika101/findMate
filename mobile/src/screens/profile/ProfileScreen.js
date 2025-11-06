import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { usersAPI } from '../../services/api';
import COLORS from '../../utils/colors';
import { API_URL } from '../../utils/constants';

const ProfileScreen = ({ navigation }) => {
  const { user, logout, setUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileData, setProfileData] = useState(null);

  // Initialize from auth user if available to avoid empty UI before fetch
  useEffect(() => {
    if (user) {
      setProfileData(user);
    }
  }, [user]);

  useEffect(() => {
    fetchProfileData();

    // Re-fetch when screen is focused so edits (from EditProfile) show immediately
    const unsubscribe = navigation.addListener('focus', () => {
      fetchProfileData();
    });

    return unsubscribe;
  }, [navigation]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      // Fetch user profile
      const profileResponse = await usersAPI.getProfile();
      if (profileResponse.success) {
        // Merge returned profile with any existing profile/user data so
        // we don't accidentally drop fields that may be present in the
        // auth context (e.g. student_id) — this helps keep ID visible
        // after edits that only return a subset of fields.
        setProfileData(prev => {
          const returned = profileResponse.data.user || {};
          const emailToUse = returned.email || prev?.email;
          const derived = deriveStudentIdFromEmail(emailToUse);
          return {
            ...(prev || {}),
            ...returned,
            student_id: returned.student_id ?? prev?.student_id ?? derived
          };
        });
        // Debug full profile object to inspect student_id value
        //console.log('[ProfileScreen] profileResponse.data.user =', profileResponse.data.user);
        // Debug: log returned and normalized profile photo URL
        try {
          const raw = profileResponse.data.user.profile_photo;
          const normalized = normalizeImageUrl(raw);
          //console.log('[ProfileScreen] fetched profile_photo raw:', raw, 'normalized:', normalized);
        } catch (e) {
          //console.log('[ProfileScreen] fetchProfileData - no profile photo or normalization failed', e);
        }
      }

      // no-op: statistics removed from profile screen
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const normalizeImageUrl = (uri) => {
    if (!uri) return null;
    try {
      const parsed = new URL(uri);
      const host = parsed.hostname;
      if (host === 'localhost' || host === '127.0.0.1') {
        // Replace origin with API base origin
        const apiOrigin = API_URL.replace(/\/api\/?$/, '');
        return apiOrigin + parsed.pathname + parsed.search + parsed.hash;
      }
      return uri;
    } catch (err) {
      // uri might be a relative path like /uploads/xxx
      const apiOrigin = API_URL.replace(/\/api\/?$/, '');
      if (uri.startsWith('/')) return apiOrigin + uri;
      return uri;
    }
  };

  const deriveStudentIdFromEmail = (email) => {
    if (!email) return null;
    // pattern: eYYNNN@... => E/YY/NNN (example: e21442 -> E/21/442)
    const m = String(email).toLowerCase().match(/^e(\d{5})/);
    if (m) {
      const digits = m[1];
      const yy = digits.slice(0, 2);
      const nnn = digits.slice(2);
      return `E/${yy}/${nnn}`;
    }
    return null;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfileData();
    setRefreshing(false);
  };

  const handleChangeProfilePhoto = async () => {
    Alert.alert(
      'Change Profile Photo',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: () => pickImage(true)
        },
        {
          text: 'Choose from Gallery',
          onPress: () => pickImage(false)
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const pickImage = async (useCamera) => {
    try {
      const { status } = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera/Gallery permission is required');
        return;
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8
          });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadProfilePhoto(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadProfilePhoto = async (photo) => {
    try {
      const response = await usersAPI.updateProfilePhoto(photo);
      if (response.success) {
        setProfileData(response.data.user);
        // Update auth context user
        if (setUser) setUser(response.data.user);
        Alert.alert('Success', 'Profile photo updated!');
      }
    } catch (error) {
      Alert.alert('Error', error || 'Failed to update profile photo');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          }
        }
      ]
    );
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile', { profile: profileData });
  };

  const handleMyItems = () => {
    navigation.navigate('MyItems');
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Profile Info Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {profileData?.profile_photo ? (
              <Image
                  // Prefer the profileData photo but fall back to the auth user
                  // (some updates write back to auth user but not to the fetched
                  // profile immediately). This prevents the avatar becoming empty
                  // after an upload.
                  source={{ uri: normalizeImageUrl(profileData?.profile_photo || user?.profile_photo) }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                    {(profileData?.name || user?.name || '?')?.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

            {(() => {
              const displayStudentId = profileData?.student_id ?? user?.student_id ?? deriveStudentIdFromEmail(profileData?.email || user?.email) ?? '—';
              return (
                <>
                  <Text style={styles.userName}>{profileData?.name || user?.name}</Text>
                  <Text style={styles.userEmail}>{profileData?.email || user?.email}</Text>
                  <Text style={styles.userStudentId}>ID: {displayStudentId}</Text>
                </>
              );
            })()}

          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedIcon}>
              {(profileData?.is_verified ?? user?.is_verified) ? '✓' : '⏳'}
            </Text>
            <Text style={styles.verifiedText}>
              {(profileData?.is_verified ?? user?.is_verified) ? 'Verified' : 'Pending Verification'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditProfile}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        

        {/* Quick Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={handleMyItems}
          >
            <View style={styles.actionIconContainer}>
              <Text style={styles.actionIcon}>📦</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>My Items</Text>
              <Text style={styles.actionSubtitle}>
                View and manage your posted items
              </Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => navigation.navigate('Chats')}
          >
            <View style={styles.actionIconContainer}>
              <Text style={styles.actionIcon}>💬</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Messages</Text>
              <Text style={styles.actionSubtitle}>
                View your conversations
              </Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => navigation.navigate('Notifications')}
          >
            <View style={styles.actionIconContainer}>
              <Text style={styles.actionIcon}>🔔</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Notifications</Text>
              <Text style={styles.actionSubtitle}>
                View your notifications
              </Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Settings */}
        <View style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>Settings</Text>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={handleChangePassword}
          >
            <View style={styles.actionIconContainer}>
              <Text style={styles.actionIcon}>🔒</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Change Password</Text>
              <Text style={styles.actionSubtitle}>
                Update your password
              </Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => navigation.navigate('About')}
          >
            <View style={styles.actionIconContainer}>
              <Text style={styles.actionIcon}>ℹ️</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>About</Text>
              <Text style={styles.actionSubtitle}>
                App information
              </Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* App Info */}
        <Text style={styles.appInfo}>
          findMate v1.0.0{'\n'}
          University of Peradeniya
        </Text>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white + '20',
    justifyContent: 'center',
    alignItems: 'center'
  },
  settingsIcon: {
    fontSize: 20
  },
  scrollView: {
    flex: 1
  },
  profileCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.gray200
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: COLORS.white
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cameraIconText: {
    fontSize: 16
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4
  },
  userStudentId: {
    fontSize: 13,
    color: COLORS.textTertiary,
    marginBottom: 12
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.success + '20',
    borderRadius: 12,
    marginBottom: 16,
    gap: 6
  },
  verifiedIcon: {
    fontSize: 14
  },
  verifiedText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.success
  },
  editButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 20
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white
  },
  statsCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 16
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  statItem: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: COLORS.gray50,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center'
  },
  actionsCard: {
    backgroundColor: COLORS.kk2,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  settingsCard: {
    backgroundColor: COLORS.kk2,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  actionIcon: {
    fontSize: 20
  },
  actionContent: {
    flex: 1
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2
  },
  actionSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary
  },
  actionArrow: {
    fontSize: 24,
    color: COLORS.textSecondary,
    marginLeft: 8
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.lost,
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8
  },
  logoutIcon: {
    fontSize: 20
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white
  },
  appInfo: {
    fontSize: 12,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18
  },
  bottomPadding: {
    height: 120
  }
});

export default ProfileScreen;