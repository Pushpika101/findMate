import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { itemsAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import useThemedStyles from '../../hooks/useThemedStyles';
import { ITEM_CATEGORIES, ITEM_COLORS } from '../../utils/constants';

const EditItemScreen = ({ route, navigation }) => {
  const { itemId, item: initialItem } = route.params || {};

  const [formData, setFormData] = useState({
    type: 'lost',
    item_name: '',
    category: '',
    color: '',
    brand: '',
    location: '',
    date: '',
    time: '',
    description: ''
  });

  const [photos, setPhotos] = useState({ photo1: null, photo2: null });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { colors } = useTheme();
  const styles = useThemedStyles((c) => ({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 50,
      paddingBottom: 16,
      paddingHorizontal: 20,
      backgroundColor: c.background,
      borderBottomWidth: 1,
      borderBottomColor: c.background
    },
    backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    backButtonText: { fontSize: 28, color: c.textInverse },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: c.textInverse },
    placeholder: { width: 40 },
    scrollView: { flex: 1 },
    scrollContent: { padding: 20 },
    typeSelector: { flexDirection: 'row', marginBottom: 24, gap: 12 },
    typeButton: { flex: 1, paddingVertical: 16, borderRadius: 12, borderWidth: 2, borderColor: c.border, alignItems: 'center' },
    typeButtonActive: { borderColor: 'transparent' },
    typeButtonText: { fontSize: 16, fontWeight: '600', color: c.textSecondary },
    typeButtonTextActive: { color: c.white },
    inputContainer: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: c.textInverse, marginBottom: 8 },
    input: { height: 50, borderWidth: 1, borderColor: c.border, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, backgroundColor: c.white },
    inputError: { borderColor: c.error },
    errorText: { color: c.error, fontSize: 12, marginTop: 4 },
    textArea: { height: 100, paddingTop: 12, textAlignVertical: 'top' },
    locationChip: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: c.black, borderRadius: 16, marginRight: 8 },
    locationChipText: { fontSize: 12, color: c.primary, fontWeight: '600' },
    chipSelected: { backgroundColor: c.primary },
    chipSelectedText: { color: c.white, fontWeight: '700' },
    photoContainer: { flexDirection: 'row', gap: 12 },
    photoBox: { flex: 1, aspectRatio: 1, borderRadius: 12, overflow: 'hidden' },
    photoPlaceholder: { flex: 1, backgroundColor: c.gray100, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: c.border, borderStyle: 'dashed', borderRadius: 12 },
    photoPlaceholderIcon: { fontSize: 32, marginBottom: 8 },
    photoPlaceholderText: { fontSize: 12, color: c.textSecondary, fontWeight: '600' },
    photoPreview: { flex: 1, position: 'relative' },
    photoImage: { width: '100%', height: '100%' },
    removePhotoButton: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: c.error, justifyContent: 'center', alignItems: 'center' },
    removePhotoText: { color: c.white, fontSize: 16, fontWeight: 'bold' },
    submitButton: { height: 54, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 8, backgroundColor: c.primary },
    submitButtonDisabled: { opacity: 0.6 },
    submitButtonText: { color: c.white, fontSize: 16, fontWeight: 'bold' },
    bottomPadding: { height: 40 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' }
  }));

  useEffect(() => {
    if (initialItem) {
      populateFromItem(initialItem);
    } else if (itemId) {
      fetchItem();
    }
  }, [initialItem, itemId]);

  const fetchItem = async () => {
    try {
      setLoading(true);
      const res = await itemsAPI.getById(itemId);
      if (res && res.success) {
        populateFromItem(res.data.item);
      } else {
        Alert.alert('Error', 'Failed to load item');
        navigation.goBack();
      }
    } catch (err) {
      Alert.alert('Error', err || 'Failed to load item');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const populateFromItem = (it) => {
    setFormData({
      type: it.type || 'lost',
      item_name: it.item_name || '',
      category: it.category || '',
      color: it.color || '',
      brand: it.brand || '',
      location: it.location || '',
      date: it.date ? it.date.split('T')[0] : '',
      time: it.time || '',
      description: it.description || ''
    });

    setPhotos({
      photo1: it.photo1_url ? { uri: it.photo1_url } : null,
      photo2: it.photo2_url ? { uri: it.photo2_url } : null
    });
  };

  const requestPermission = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to upload photos!');
        return false;
      }
    }
    return true;
  };

  const pickImage = async (photoKey) => {
    const ok = await requestPermission();
    if (!ok) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotos(prev => ({ ...prev, [photoKey]: result.assets[0] }));
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async (photoKey) => {
    const ok = await requestPermission();
    if (!ok) return;

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
        setPhotos(prev => ({ ...prev, [photoKey]: result.assets[0] }));
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const showImageOptions = (photoKey) => {
    Alert.alert(
      'Update Photo',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: () => takePhoto(photoKey) },
        { text: 'Choose from Gallery', onPress: () => pickImage(photoKey) },
        { text: 'Remove Photo', onPress: () => setPhotos(prev => ({ ...prev, [photoKey]: null })), style: 'destructive' },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.item_name.trim()) newErrors.item_name = 'Item name is required';
    if (!formData.category) newErrors.category = 'Please select a category';
    if (!formData.color) newErrors.color = 'Please select a color';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.date) newErrors.date = 'Date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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

      const res = await itemsAPI.update(itemId || initialItem?.id, data);
      if (res && res.success) {
        Alert.alert('Success', 'Item updated successfully', [
          { text: 'OK', onPress: () => navigation.navigate('ItemDetail', { itemId: itemId || initialItem?.id }) }
        ]);
      } else {
        Alert.alert('Error', res?.message || 'Failed to update item');
      }
    } catch (err) {
      Alert.alert('Error', err || 'Failed to update item');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !initialItem) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Item</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Type Selector */}
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[styles.typeButton, formData.type === 'lost' && styles.typeButtonActive, { backgroundColor: formData.type === 'lost' ? colors.lost : colors.white }]}
            onPress={() => handleInputChange('type', 'lost')}
          >
            <Text style={[styles.typeButtonText, formData.type === 'lost' && styles.typeButtonTextActive]}>Lost Item</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeButton, formData.type === 'found' && styles.typeButtonActive, { backgroundColor: formData.type === 'found' ? colors.found : colors.white }]}
            onPress={() => handleInputChange('type', 'found')}
          >
            <Text style={[styles.typeButtonText, formData.type === 'found' && styles.typeButtonTextActive]}>Found Item</Text>
          </TouchableOpacity>
        </View>

        {/* Item Name */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Item Name *</Text>
          <TextInput style={[styles.input, errors.item_name && styles.inputError]} value={formData.item_name} onChangeText={(t) => handleInputChange('item_name', t)} />
          {errors.item_name && <Text style={styles.errorText}>{errors.item_name}</Text>}
        </View>

        {/* Category */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Category *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {ITEM_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[styles.locationChip, formData.category === cat.value && styles.chipSelected]}
                onPress={() => { console.log('Select category', cat.value); handleInputChange('category', cat.value); }}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessible
              >
                <Text style={[styles.locationChipText, formData.category === cat.value && styles.chipSelectedText]}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
        </View>

        {/* Color */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Color *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {ITEM_COLORS.map((c) => (
              <TouchableOpacity
                key={c.value}
                style={[styles.locationChip, formData.color === c.value && styles.chipSelected]}
                onPress={() => { console.log('Select color', c.value); handleInputChange('color', c.value); }}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessible
              >
                <Text style={[styles.locationChipText, formData.color === c.value && styles.chipSelectedText]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {errors.color && <Text style={styles.errorText}>{errors.color}</Text>}
        </View>

        {/* Brand */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Brand (Optional)</Text>
          <TextInput
            style={styles.input}
            value={formData.brand}
            onChangeText={(t) => handleInputChange('brand', t)}
            placeholder="e.g., Nike, Apple, Casio"
            editable={true}
            returnKeyType="done"
            allowFontScaling
          />
        </View>

        {/* Location */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Location *</Text>
          <TextInput style={[styles.input, errors.location && styles.inputError]} value={formData.location} onChangeText={(t) => handleInputChange('location', t)} />
          {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
        </View>

        {/* Date */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Date *</Text>
          <TextInput style={[styles.input, errors.date && styles.inputError]} value={formData.date} onChangeText={(t) => handleInputChange('date', t)} />
          {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
        </View>

        {/* Time */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Time (Optional)</Text>
          <TextInput style={styles.input} value={formData.time} onChangeText={(t) => handleInputChange('time', t)} />
        </View>

        {/* Description */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput style={[styles.input, styles.textArea]} value={formData.description} onChangeText={(t) => handleInputChange('description', t)} multiline numberOfLines={4} textAlignVertical="top" />
        </View>

        {/* Photos */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Photos (Optional, max 2)</Text>
          <View style={styles.photoContainer}>
            <TouchableOpacity style={styles.photoBox} onPress={() => showImageOptions('photo1')}>
              {photos.photo1 ? (
                <View style={styles.photoPreview}>
                  <Image source={{ uri: photos.photo1.uri }} style={styles.photoImage} />
                  <TouchableOpacity style={styles.removePhotoButton} onPress={() => setPhotos(prev => ({ ...prev, photo1: null }))}>
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

            <TouchableOpacity style={styles.photoBox} onPress={() => showImageOptions('photo2')}>
              {photos.photo2 ? (
                <View style={styles.photoPreview}>
                  <Image source={{ uri: photos.photo2.uri }} style={styles.photoImage} />
                  <TouchableOpacity style={styles.removePhotoButton} onPress={() => setPhotos(prev => ({ ...prev, photo2: null }))}>
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

        <TouchableOpacity style={[styles.submitButton, loading && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.submitButtonText}>Save Changes</Text>}
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

// styles are created with useThemedStyles inside the component

export default EditItemScreen;
