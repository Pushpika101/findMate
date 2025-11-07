import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
  Linking,
  Dimensions,
  Modal
} from 'react-native';
import { itemsAPI, chatAPI } from '../../services/api';
import { API_URL } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import useThemedStyles from '../../hooks/useThemedStyles';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

const ItemDetailScreen = ({ route, navigation }) => {
  const { itemId } = route.params;
  const { colors } = useTheme();

  const styles = useThemedStyles((colors) => ({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContainer: { padding: 20 },
    imageWrapper: { width: '100%', height: 300, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.gray100, justifyContent: 'center', alignItems: 'center' },
    image: { width: '100%', height: '100%' },
    title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginTop: 12 },
    subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 6 },
    tag: { marginTop: 8, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    tagText: { fontSize: 12, fontWeight: '700', color: colors.black },
    section: { marginTop: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
    sectionText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
    footer: { marginTop: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    contactButton: { backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
    contactButtonText: { color: colors.white, fontWeight: '700' }
  }));
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageUrls, setImageUrls] = useState([]);

  // Modal state for full-screen image viewer (hooks must be declared unconditionally)
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);

  useEffect(() => {
    fetchItemDetails();
  }, [itemId]);

  const fetchItemDetails = async () => {
    try {
      setLoading(true);
      const response = await itemsAPI.getById(itemId);
      if (response.success) {
        const fetchedItem = response.data.item;
        setItem(fetchedItem);
        const raw = [fetchedItem.photo1_url, fetchedItem.photo2_url].filter(Boolean);
        const imgs = raw.map((uri) => normalizeImageUrl(uri)).filter(Boolean);
        setImageUrls(imgs);
        // Debug: log normalized image URLs so we can inspect what RN receives
        console.log('ItemDetailScreen: normalized imageUrls ->', imgs);
      }
    } catch (error) {
      Alert.alert('Error', error || 'Failed to fetch item details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const normalizeImageUrl = (uri) => {
    if (!uri) return null;
    const trimmed = String(uri).trim();

    // If already absolute with protocol, return as-is
    if (/^https?:\/\//i.test(trimmed)) return trimmed;

    // Protocol-relative URL (//example.com/path) -> assume https
    if (/^\/\//.test(trimmed)) return `https:${trimmed}`;

    // If it starts with a slash it's a root-relative path on the API host
    const apiOrigin = API_URL.replace(/\/api\/?$/, '');
    if (trimmed.startsWith('/')) return apiOrigin + trimmed;

    // If contains localhost or 127.0.0.1, prefix with API origin
    if (/localhost|127\.0\.0\.1/.test(trimmed)) {
      return apiOrigin + (trimmed.startsWith('/') ? trimmed : `/${trimmed}`);
    }

    // Otherwise treat as a relative path and prefix with API origin
    return apiOrigin + (trimmed.startsWith('/') ? trimmed : `/${trimmed}`);
  };

  const handleClaimItem = async () => {
    Alert.alert(
      item.type === 'lost' ? 'Found This Item?' : 'Is This Yours?',
      item.type === 'lost' 
        ? 'Let the owner know you found their item!'
        : 'Claim this item if it belongs to you.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Contact Owner',
          onPress: async () => {
            try {
              const response = await itemsAPI.claim(itemId);
              if (response.success) {
                Alert.alert(
                  'Success!',
                  'The owner has been notified. You can now chat with them.',
                  [
                    {
                      text: 'Go to Chat',
                      onPress: () => navigation.navigate('ChatScreen', { 
                        chatId: response.data.chatId 
                      })
                    }
                  ]
                );
              }
            } catch (error) {
              Alert.alert('Error', error || 'Failed to claim item');
            }
          }
        }
      ]
    );
  };

  const handleChatWithOwner = async () => {
    try {
      const response = await chatAPI.create({
        itemId: item.id,
        recipientId: item.user_id
      });
      
      if (response.success) {
        navigation.navigate('ChatScreen', { chatId: response.data.chatId });
      }
    } catch (error) {
      Alert.alert('Error', error || 'Failed to start chat');
    }
  };

  const handleMarkAsResolved = () => {
    Alert.alert(
      'Mark as Resolved?',
      'This will mark the item as found/returned. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark as Resolved',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await itemsAPI.resolve(itemId);
              if (response.success) {
                Alert.alert('Success', 'Item marked as resolved!', [
                  { text: 'OK', onPress: () => navigation.goBack() }
                ]);
              }
            } catch (error) {
              Alert.alert('Error', error || 'Failed to resolve item');
            }
          }
        }
      ]
    );
  };

  const handleDeleteItem = () => {
    Alert.alert(
      'Delete Item?',
      'Are you sure you want to delete this item? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await itemsAPI.delete(itemId);
              if (response.success) {
                Alert.alert('Deleted', 'Item deleted successfully', [
                  { text: 'OK', onPress: () => navigation.goBack() }
                ]);
              }
            } catch (error) {
              Alert.alert('Error', error || 'Failed to delete item');
            }
          }
        }
      ]
    );
  };

  const handleShareItem = async () => {
    try {
      const response = await itemsAPI.getShareLink(itemId);
      if (response.success) {
        await Share.share({
          message: `Check out this ${item.type} item: ${item.item_name}\n${response.data.shareLink}`,
          title: `${item.type === 'lost' ? 'Lost' : 'Found'}: ${item.item_name}`
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleEditItem = () => {
    navigation.navigate('EditItem', { itemId: item.id, item });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading item details...</Text>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Item not found</Text>
      </View>
    );
  }

  const isOwner = user && user.id === item.user_id;
  const images = item ? [item.photo1_url, item.photo2_url].filter(Boolean) : [];

  

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Text style={styles.headerButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Item Details</Text>
          {/* header share removed as requested */}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Images */}
          {imageUrls.length > 0 ? (
          <View style={styles.imageContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / width);
                setActiveImageIndex(index);
              }}
              scrollEventThrottle={16}
            >
              {imageUrls.map((imageUrl, index) => (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.9}
                  onPress={() => {
                    setModalIndex(index);
                    setIsModalVisible(true);
                  }}
                >
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.itemImage}
                    resizeMode="cover"
                        onError={(e) => {
                          console.warn('ItemDetailScreen: image load error', { uri: imageUrl, error: e.nativeEvent });
                          // Replace failed image with a safe placeholder
                          const fallback = 'https://via.placeholder.com/800?text=No+Image+Available';
                          setImageUrls((prev) => {
                            const next = [...prev];
                            next[index] = fallback;
                            return next;
                          });
                        }}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
            {imageUrls.length > 1 && (
              <View style={styles.imageIndicatorContainer}>
                {imageUrls.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.imageIndicator,
                      activeImageIndex === index && styles.imageIndicatorActive
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.noImageContainer}>
            <Text style={styles.noImageIcon}>📷</Text>
            <Text style={styles.noImageText}>No images available</Text>
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          {/* Type Badge */}
          <View style={[
            styles.typeBadge,
            { backgroundColor: item.type === 'lost' ? colors.lost : colors.found }
          ]}>
            <Text style={styles.typeBadgeText}>
              {item.type === 'lost' ? 'LOST ITEM' : 'FOUND ITEM'}
            </Text>
          </View>

          {/* Item Name */}
          <Text style={styles.itemName}>{item.item_name}</Text>

          {/* Status */}
          {item.status === 'resolved' && (
            <View style={styles.resolvedBadge}>
              <Text style={styles.resolvedText}>✓ Resolved</Text>
            </View>
          )}

          {/* Details Grid */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailCard}>
              <Text style={styles.detailIcon}>🏷️</Text>
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailValue}>{item.category}</Text>
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.detailIcon}>🎨</Text>
              <Text style={styles.detailLabel}>Color</Text>
              <Text style={styles.detailValue}>{item.color}</Text>
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.detailIcon}>📍</Text>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>{item.location}</Text>
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.detailIcon}>📅</Text>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>
                {new Date(item.date).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {/* Brand */}
          {item.brand && (
            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>Brand</Text>
              <Text style={styles.infoValue}>{item.brand}</Text>
            </View>
          )}

          {/* Time */}
          {item.time && (
            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>Time</Text>
              <Text style={styles.infoValue}>{item.time}</Text>
            </View>
          )}

          {/* Description */}
          {item.description && (
            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>Description</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          )}

          {/* Posted By */}
          <View style={styles.userSection}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.user_name?.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={styles.userName}>{item.user_name}</Text>
                <Text style={styles.userLabel}>
                  {isOwner ? 'You posted this' : 'Posted by'}
                </Text>
              </View>
            </View>
            <Text style={styles.postedDate}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>

          {/* Action Buttons */}
          {item.status === 'active' && (
            <View style={styles.actionButtons}>
              {isOwner ? (
                // Owner Actions (styled with thin border and light background)
                <>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton, { flex: 1 }]}
                    onPress={handleEditItem}
                  >
                    <Text style={[styles.actionButtonText, { color: colors.info }]}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.resolveButton, { flex: 1 }]}
                    onPress={handleShareItem}
                  >
                    <Text style={[styles.actionButtonText, { color: colors.secondaryDark }]}>Share</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton, { flex: 1 }]}
                    onPress={handleDeleteItem}
                  >
                    <Text style={[styles.actionButtonText, { color: colors.error }]}>Delete</Text>
                  </TouchableOpacity>
                </>
              ) : (
                // Non-Owner Actions (styled)
                <>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.claimButton, { flex: 1 }]}
                    onPress={handleClaimItem}
                  >
                    <Text style={[styles.actionButtonText, { color: colors.found }]}> 
                      {item.type === 'lost' ? 'I Found This' : 'This is Mine'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.chatButton, { flex: 1 }]}
                    onPress={handleChatWithOwner}
                  >
                    <Text style={[styles.actionButtonText, { color: colors.primary }]}>Chat</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.resolveButton, { flex: 1 }]}
                    onPress={handleShareItem}
                  >
                    <Text style={[styles.actionButtonText, { color: colors.warning }]}>Share</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Full-screen image modal */}
      <Modal
        visible={isModalVisible}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          {/* Top-right close for quick exit (visible even if image fails) */}
          <TouchableOpacity
            onPress={() => setIsModalVisible(false)}
            style={styles.modalTopClose}
            accessibilityLabel="Close image viewer"
          >
            <Text style={styles.modalTopCloseText}>✕</Text>
          </TouchableOpacity>

          {imageUrls[modalIndex] ? (
            <Image
              source={{ uri: imageUrls[modalIndex] }}
              style={styles.modalImage}
              resizeMode="contain"
              onError={(e) => console.warn('ItemDetailScreen: modal image failed', { uri: imageUrls[modalIndex], error: e.nativeEvent })}
            />
          ) : (
            <View style={styles.noImageContainer}>
              <Text style={styles.noImageText}>Image not available</Text>
            </View>
          )}

          {/* Navigation / Close Controls (bottom) */}
          <View style={styles.modalControls}>
            <TouchableOpacity
              style={styles.modalNavButton}
              onPress={() => setModalIndex((i) => (i - 1 + imageUrls.length) % imageUrls.length)}
              disabled={imageUrls.length <= 1}
            >
              <Text style={styles.modalNavText}>◀</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalNavButton}
              onPress={() => setModalIndex((i) => (i + 1) % imageUrls.length)}
              disabled={imageUrls.length <= 1}
            >
              <Text style={styles.modalNavText}>▶</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};


// Styles moved to useThemedStyles above; module-level COLORS-based StyleSheet removed.

export default ItemDetailScreen;