import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { /* Modal, Pressable, ScrollView as RNScrollView */ } from 'react-native';
import { itemsAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import useThemedStyles from '../../hooks/useThemedStyles';
import { ITEM_CATEGORIES, ITEM_COLORS, COMMON_LOCATIONS } from '../../utils/constants';

const AddItemScreen = ({ navigation }) => {
  const initialForm = {
    type: 'lost', // 'lost' or 'found'
    item_name: '',
    category: '',
    color: '',
    brand: '',
    location: '',
    date: new Date().toISOString().split('T')[0], // Today's date
    time: new Date().toTimeString().split(' ')[0].substring(0, 5), // Current time
    description: ''
  };

  const [formData, setFormData] = useState(initialForm);

  const [photos, setPhotos] = useState({
    photo1: null,
    photo2: null
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  // showing categories/colors as inline chips instead of dropdown modals
  
  const { colors } = useTheme();

  const styles = useThemedStyles((colors) => ({
    container: { flex: 1, backgroundColor: colors.kk2 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 20, backgroundColor: colors.kk2, borderBottomWidth: 1, borderBottomColor: colors.background },
    backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    backButtonText: { fontSize: 28, color: colors.primary },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
    placeholder: { width: 40 },
    scrollView: { flex: 1 },
    scrollContent: { padding: 20 },
    typeSelector: { flexDirection: 'row', marginBottom: 24, gap: 12 },
    typeButton: { flex: 1, paddingVertical: 16, borderRadius: 12, borderWidth: 2, borderColor: colors.border, alignItems: 'center' },
    typeButtonActive: { borderColor: 'transparent' },
    typeButtonText: { fontSize: 16, fontWeight: '600', color: colors.textSecondary },
    typeButtonTextActive: { color: colors.white },
    inputContainer: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 },
    input: { height: 50, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, backgroundColor: colors.white, color: colors.textPrimary },
    inputError: { borderColor: colors.error },
    errorText: { color: colors.error, fontSize: 12, marginTop: 4 },
    pickerContainer: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.white, overflow: 'hidden' },
    picker: { height: 50 },
    textArea: { height: 100, paddingTop: 12, textAlignVertical: 'top' },
    locationSuggestions: { marginTop: 8 },
    locationChip: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.black, borderRadius: 16, marginRight: 8 },
    locationChipText: { fontSize: 12, color: colors.primary, fontWeight: '600' },
    photoContainer: { flexDirection: 'row', gap: 12 },
    photoBox: { flex: 1, aspectRatio: 1, borderRadius: 12, overflow: 'hidden' },
    photoPlaceholder: { flex: 1, backgroundColor: colors.gray100, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed', borderRadius: 12 },
    photoPlaceholderIcon: { fontSize: 32, marginBottom: 8 },
    photoPlaceholderText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
    photoPreview: { flex: 1, position: 'relative' },
    photoImage: { width: '100%', height: '100%' },
    removePhotoButton: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.error, justifyContent: 'center', alignItems: 'center' },
    removePhotoText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
    submitButton: { height: 54, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
    submitButtonDisabled: { opacity: 0.6 },
    submitButtonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
    bottomPadding: { height: 40 },
    dropdown: { height: 50, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.white, justifyContent: 'center', paddingHorizontal: 12 },
    dropdownPlaceholder: { color: colors.textSecondary },
    dropdownText: { color: colors.textPrimary },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: colors.white, maxHeight: '50%', borderTopLeftRadius: 12, borderTopRightRadius: 12, padding: 12 },
    modalItem: { paddingVertical: 14, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
    modalItemText: { fontSize: 16, color: colors.textPrimary },
    modalClose: { paddingVertical: 12, alignItems: 'center' },
    modalCloseText: { color: colors.primary, fontSize: 16, fontWeight: '600' },
    chipSelected: { backgroundColor: colors.primary },
    chipSelectedText: { color: colors.white, fontWeight: '700' }
  }));
  // Request permission for image picker
  const requestPermission = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to upload photos!');
        return false;
      }
    }
    return true;
  };

  // Pick image from gallery
  const pickImage = async (photoKey) => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotos({ ...photos, [photoKey]: result.assets[0] });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // Take photo with camera
  const takePhoto = async (photoKey) => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required!');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotos({ ...photos, [photoKey]: result.assets[0] });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  // Show image picker options
  const showImageOptions = (photoKey) => {
    Alert.alert(
      'Add Photo',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: () => takePhoto(photoKey) },
        { text: 'Choose from Gallery', onPress: () => pickImage(photoKey) },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  // Remove photo
  const removePhoto = (photoKey) => {
    setPhotos({ ...photos, [photoKey]: null });
  };

  // Handle input change
  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.item_name.trim()) {
      newErrors.item_name = 'Item name is required';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    if (!formData.color) {
      newErrors.color = 'Please select a color';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit form
  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const data = {
        ...formData,
        photo1: photos.photo1,
        photo2: photos.photo2
      };

      const response = await itemsAPI.create(data);

      if (response.success) {
        // Clear the form and photos so if the user stays on this screen
        // they don't see the previous submission data.
        setFormData(initialForm);
        setPhotos({ photo1: null, photo2: null });
        setErrors({});

        Alert.alert(
          'Success!',
          `Item ${formData.type === 'lost' ? 'lost' : 'found'} report created successfully!${
            response.data.matches > 0 
              ? ` Found ${response.data.matches} potential match(es)!` 
              : ''
          }`,
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Home')
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', error || 'Failed to create item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Item</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Type Selector */}
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              formData.type === 'lost' && styles.typeButtonActive,
              { backgroundColor: formData.type === 'lost' ? colors.lost : colors.white }
            ]}
            onPress={() => handleInputChange('type', 'lost')}
          >
            <Text style={[
              styles.typeButtonText,
              formData.type === 'lost' && styles.typeButtonTextActive
            ]}>
              Lost Item
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeButton,
              formData.type === 'found' && styles.typeButtonActive,
              { backgroundColor: formData.type === 'found' ? colors.found : colors.white }
            ]}
            onPress={() => handleInputChange('type', 'found')}
          >
            <Text style={[
              styles.typeButtonText,
              formData.type === 'found' && styles.typeButtonTextActive
            ]}>
              Found Item
            </Text>
          </TouchableOpacity>
        </View>

        {/* Item Name */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Item Name *</Text>
            <TextInput
            style={[styles.input, errors.item_name && styles.inputError]}
            placeholder="e.g., Blue Backpack, iPhone 13, Calculator"
            placeholderTextColor={colors.gray400}
            value={formData.item_name}
            onChangeText={(text) => handleInputChange('item_name', text)}
          />
          {errors.item_name && (
            <Text style={styles.errorText}>{errors.item_name}</Text>
          )}
        </View>

        {/* Category */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Category *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {ITEM_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[styles.locationChip, formData.category === cat.value && styles.chipSelected]}
                onPress={() => handleInputChange('category', cat.value)}
              >
                <Text style={[styles.locationChipText, formData.category === cat.value && styles.chipSelectedText]}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {errors.category && (
            <Text style={styles.errorText}>{errors.category}</Text>
          )}
        </View>

        {/* Color */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Color *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {ITEM_COLORS.map((c) => (
              <TouchableOpacity
                key={c.value}
                style={[styles.locationChip, formData.color === c.value && styles.chipSelected]}
                onPress={() => handleInputChange('color', c.value)}
              >
                <Text style={[styles.locationChipText, formData.color === c.value && styles.chipSelectedText]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {errors.color && (
            <Text style={styles.errorText}>{errors.color}</Text>
          )}
        </View>

        {/* Brand */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Brand (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Nike, Apple, Casio"
            placeholderTextColor={colors.gray400}
            value={formData.brand}
            onChangeText={(text) => handleInputChange('brand', text)}
          />
        </View>

        {/* Location */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Location *</Text>
          <TextInput
            style={[styles.input, errors.location && styles.inputError]}
            placeholder="e.g., Main Library, Engineering Faculty"
            placeholderTextColor={colors.gray400}
            value={formData.location}
            onChangeText={(text) => handleInputChange('location', text)}
          />
          {errors.location && (
            <Text style={styles.errorText}>{errors.location}</Text>
          )}
          <View style={styles.locationSuggestions}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {['main Library', '24/7', 'common room', 'near AR', 'faculty canteen', 'Akbar canteen'].map((loc) => (
                <TouchableOpacity
                  key={loc}
                  style={styles.locationChip}
                  onPress={() => handleInputChange('location', loc)}
                >
                  <Text style={styles.locationChipText}>{loc}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Date */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Date *</Text>
          <TextInput
            style={[styles.input, errors.date && styles.inputError]}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.gray400}
            value={formData.date}
            onChangeText={(text) => handleInputChange('date', text)}
          />
          {errors.date && (
            <Text style={styles.errorText}>{errors.date}</Text>
          )}
        </View>

        {/* Time */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Time (Optional)</Text>
            <TextInput
            style={styles.input}
            placeholder="HH:MM (e.g., 14:30)"
            placeholderTextColor={colors.gray400}
            value={formData.time}
            onChangeText={(text) => handleInputChange('time', text)}
          />
        </View>

        {/* Description */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add any additional details that might help..."
            placeholderTextColor={colors.gray400}
            value={formData.description}
            onChangeText={(text) => handleInputChange('description', text)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Photos */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Photos (Optional, max 2)</Text>
          <View style={styles.photoContainer}>
            {/* Photo 1 */}
            <TouchableOpacity
              style={styles.photoBox}
              onPress={() => showImageOptions('photo1')}
            >
              {photos.photo1 ? (
                <View style={styles.photoPreview}>
                  <Image source={{ uri: photos.photo1.uri }} style={styles.photoImage} />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => removePhoto('photo1')}
                  >
                    <Text style={styles.removePhotoText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoPlaceholderIcon}>📷</Text>
                  <Text style={styles.photoPlaceholderText}>Add Photo</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Photo 2 */}
            <TouchableOpacity
              style={styles.photoBox}
              onPress={() => showImageOptions('photo2')}
            >
              {photos.photo2 ? (
                <View style={styles.photoPreview}>
                  <Image source={{ uri: photos.photo2.uri }} style={styles.photoImage} />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => removePhoto('photo2')}
                  >
                    <Text style={styles.removePhotoText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoPlaceholderIcon}>📷</Text>
                  <Text style={styles.photoPlaceholderText}>Add Photo</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
            style={[
            styles.submitButton,
            loading && styles.submitButtonDisabled,
            { backgroundColor: formData.type === 'lost' ? colors.lost : colors.found }
          ]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>
              Report {formData.type === 'lost' ? 'Lost' : 'Found'} Item
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};



export default AddItemScreen;