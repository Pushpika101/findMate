import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
  Dimensions,
  Modal
} from 'react-native';
import { itemsAPI, chatAPI } from '../../services/api';
import { API_URL } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import useThemedStyles from '../../hooks/useThemedStyles';
// Note: MaterialIcons removed as it was unused in this screen

const { width } = Dimensions.get('window');
// Horizontal padding used by the screen's content container (matches styles.scrollContainer padding)
const HORIZONTAL_PADDING = 20;
const imageWidth = width - HORIZONTAL_PADDING * 2;

const ItemDetailScreen = ({ route, navigation }) => {
  const { itemId } = route.params;
  const { colors } = useTheme();

  const styles = useThemedStyles((colors) => ({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 20, backgroundColor: colors.background },
    headerButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerButtonText: { fontSize: 28, color: colors.primary },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  scrollView: { flex: 1 },
  // content container for ScrollView: provides left/right padding and extra bottom space
  scrollContainer: { padding: HORIZONTAL_PADDING, paddingBottom: 40 },
  // imageContainer is used for the visible viewport area for the images
  imageContainer: { width: imageWidth, height: 300, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.gray100, justifyContent: 'center', alignItems: 'center' },
  itemImage: { width: '100%', height: '100%' },
    imageIndicatorContainer: { position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center' },
    imageIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gray300, marginHorizontal: 4, opacity: 0.6 },
    imageIndicatorActive: { backgroundColor: colors.white, opacity: 1 },
    noImageContainer: { width: '100%', height: 300, borderRadius: 12, backgroundColor: colors.gray100, justifyContent: 'center', alignItems: 'center' },
    noImageIcon: { fontSize: 48 },
    noImageText: { fontSize: 14, color: colors.textSecondary, marginTop: 8 },
    content: { marginTop: 16 },
    typeBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    typeBadgeText: { fontSize: 12, fontWeight: '700', color: colors.black },
    itemName: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginTop: 12 },
    resolvedBadge: { marginTop: 8, backgroundColor: colors.success, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
    resolvedText: { color: colors.white, fontWeight: '700' },
    detailsGrid: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    detailCard: { width: '48%', backgroundColor: colors.kk2, padding: 12, borderRadius: 8, marginBottom: 8 },
    detailIcon: { fontSize: 18, marginBottom: 6 },
    detailLabel: { fontSize: 12, color: colors.textSecondary },
    detailValue: { fontSize: 14, color: colors.textPrimary, fontWeight: '600' },
    infoSection: { marginTop: 12 },
    infoLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
    infoValue: { fontSize: 15, color: colors.textPrimary },
    description: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
    userSection: { marginTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    userInfo: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarText: { color: colors.white, fontWeight: '700' },
    userName: { fontSize: 15, color: colors.textPrimary, fontWeight: '700' },
    userLabel: { fontSize: 12, color: colors.textSecondary },
    postedDate: { fontSize: 12, color: colors.textTertiary },
    actionButtons: { marginTop: 16, flexDirection: 'row', gap: 8 },
  actionButton: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionButtonText: { fontWeight: '700', fontSize: 14, color: colors.white },
    editButton: { backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.border },
    resolveButton: { backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.border },
    deleteButton: { backgroundColor: colors.error, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    claimButton: { backgroundColor: colors.lost },
    chatButton: { backgroundColor: colors.primary },
    submitButtonText: { color: colors.white, fontWeight: '700' },
    modalContainer: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  modalTopClose: { position: 'absolute', top: 32, right: 20, zIndex: 20, backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 20 },
  modalTopCloseText: { fontSize: 18, color: colors.white, fontWeight: '700' },
  modalSideNav: { position: 'absolute', top: '50%', marginTop: -28, zIndex: 20, padding: 8, borderRadius: 28, backgroundColor: 'rgba(0,0,0,0.35)' },
  modalSideNavRight: { position: 'absolute', right: 12 },
  modalSideNavLeft: { position: 'absolute', left: 12 },
  modalSideNavText: { fontSize: 28, color: colors.white, fontWeight: '700' },
    modalImage: { width: '100%', height: '80%' },
    modalControls: { position: 'absolute', bottom: 32, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24 },
    modalNavButton: { padding: 12 },
    modalNavText: { fontSize: 18, color: colors.white },
    modalCloseButton: { paddingHorizontal: 106, paddingVertical: 15, backgroundColor: colors.lost, borderRadius: 8 },
    modalCloseText: { color: colors.white, fontWeight: '700' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, color: colors.textSecondary }
  }));
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageUrls, setImageUrls] = useState([]);

  // Modal state for full-screen image viewer (hooks must be declared unconditionally)
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);

  // Normalize image URL helper
  const normalizeImageUrl = useCallback((uri) => {
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
  }, []);

  const fetchItemDetails = useCallback(async () => {
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
        // console.log('ItemDetailScreen: normalized imageUrls ->', imgs);
      }
    } catch (error) {
      Alert.alert('Error', error || 'Failed to fetch item details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [itemId, normalizeImageUrl, navigation]);

  useEffect(() => {
    fetchItemDetails();
  }, [fetchItemDetails]);

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

  // (removed unused handleMarkAsResolved) - keep code minimal for this screen

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
  // imageUrls holds normalized URLs used for display

  

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
        <View style={{ width: 40 }} />
      </View>

  <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Images */}
        {imageUrls.length > 0 ? (
          <View style={{ alignItems: 'center' }}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / imageWidth);
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
                  style={[styles.imageContainer, { marginRight: index === imageUrls.length - 1 ? 0 : 12 }]}
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
              <View style={[styles.imageIndicatorContainer, { width: imageWidth, alignSelf: 'center' }]}> 
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
          <View style={[styles.noImageContainer, { width: imageWidth, alignSelf: 'center' }] }>
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
                      <Text style={[styles.actionButtonText, { color: colors.textPrimary }]}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.resolveButton, { flex: 1 }]}
                    onPress={handleShareItem}
                  >
                      <Text style={[styles.actionButtonText, { color: colors.textPrimary }]}>Share</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton, { flex: 1 }]}
                    onPress={handleDeleteItem}
                  >
                      <Text style={[styles.actionButtonText, { color: colors.white }]}>Delete</Text>
                  </TouchableOpacity>
                </>
              ) : (
                // Non-Owner Actions (styled)
                <>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.claimButton, { flex: 1 }]}
                    onPress={handleClaimItem}
                  >
                    <Text style={[styles.actionButtonText, { color: colors.white }]}> 
                      {item.type === 'lost' ? 'I Found This' : 'This is Mine'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.chatButton, { flex: 1 }]}
                    onPress={handleChatWithOwner}
                  >
                    <Text style={[styles.actionButtonText, { color: colors.white }]}>Chat</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.resolveButton, { flex: 1 }]}
                    onPress={handleShareItem}
                  >
                    <Text style={[styles.actionButtonText, { color: colors.textPrimary }]}>Share</Text>
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

          {imageUrls.length > 1 && (
            <>
              <TouchableOpacity
                style={[styles.modalSideNav, styles.modalSideNavLeft]}
                onPress={() => setModalIndex((i) => (i - 1 + imageUrls.length) % imageUrls.length)}
                accessibilityLabel="Previous image"
              >
                <Text style={styles.modalSideNavText}>◀</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSideNav, styles.modalSideNavRight]}
                onPress={() => setModalIndex((i) => (i + 1) % imageUrls.length)}
                accessibilityLabel="Next image"
              >
                <Text style={styles.modalSideNavText}>▶</Text>
              </TouchableOpacity>
            </>
          )}

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