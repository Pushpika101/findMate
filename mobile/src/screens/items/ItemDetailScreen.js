import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
  Linking,
  Dimensions
} from 'react-native';
import { itemsAPI, chatAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import COLORS from '../../utils/colors';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

const ItemDetailScreen = ({ route, navigation }) => {
  const { itemId } = route.params;
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageUrls, setImageUrls] = useState([]);

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
        const imgs = [fetchedItem.photo1_url, fetchedItem.photo2_url].filter(Boolean);
        setImageUrls(imgs);
      }
    } catch (error) {
      Alert.alert('Error', error || 'Failed to fetch item details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
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
        <ActivityIndicator size="large" color={COLORS.primary} />
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
  const images = [item.photo1_url, item.photo2_url].filter(Boolean);

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
        <TouchableOpacity
          onPress={handleShareItem}
          style={styles.headerButton}
        >
          <Text style={styles.headerButtonIcon}>🔗</Text>
        </TouchableOpacity>
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
                <Image
                  key={index}
                  source={{ uri: imageUrl }}
                  style={styles.itemImage}
                  resizeMode="cover"
                  onError={() => {
                    // Replace failed image with a safe placeholder
                    const fallback = 'https://via.placeholder.com/800?text=No+Image+Available';
                    setImageUrls((prev) => {
                      const next = [...prev];
                      next[index] = fallback;
                      return next;
                    });
                  }}
                />
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
            { backgroundColor: item.type === 'lost' ? COLORS.lost : COLORS.found }
          ]}>
            <Text style={styles.typeBadgeText}>
              {item.type === 'lost' ? '🔍 LOST ITEM' : '✨ FOUND ITEM'}
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
                // Owner Actions
                <>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={handleEditItem}
                  >
                    <Text style={styles.actionButtonIcon}>✏️</Text>
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.resolveButton]}
                    onPress={handleMarkAsResolved}
                  >
                    <Text style={styles.actionButtonIcon}>✓</Text>
                    <Text style={styles.actionButtonText}>Mark Resolved</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={handleDeleteItem}
                  >
                    <Text style={styles.actionButtonIcon}>🗑️</Text>
                    <Text style={styles.actionButtonText}>Delete</Text>
                  </TouchableOpacity>
                </>
              ) : (
                // Non-Owner Actions
                <>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.claimButton, { flex: 1 }]}
                    onPress={handleClaimItem}
                  >
                    <Text style={styles.actionButtonIcon}>
                      {item.type === 'lost' ? '✓' : '🙋'}
                    </Text>
                    <Text style={styles.actionButtonText}>
                      {item.type === 'lost' ? 'I Found This' : 'This is Mine'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.chatButton, { flex: 1 }]}
                    onPress={handleChatWithOwner}
                  >
                    <Text style={styles.actionButtonIcon}>💬</Text>
                    <Text style={styles.actionButtonText}>Chat</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>
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
  errorText: {
    fontSize: 16,
    color: COLORS.error
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerButtonText: {
    fontSize: 28,
    color: COLORS.primary
  },
  headerButtonIcon: {
    fontSize: 20
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary
  },
  scrollView: {
    flex: 1
  },
  imageContainer: {
    position: 'relative'
  },
  itemImage: {
    width: width,
    height: 300
  },
  noImageContainer: {
    width: width,
    height: 300,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center'
  },
  noImageIcon: {
    fontSize: 64,
    marginBottom: 8
  },
  noImageText: {
    fontSize: 16,
    color: COLORS.textSecondary
  },
  imageIndicatorContainer: {
    position: 'absolute',
    bottom: 16,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8
  },
  imageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.white,
    opacity: 0.5
  },
  imageIndicatorActive: {
    opacity: 1,
    width: 24
  },
  content: {
    padding: 20
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16
  },
  typeBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5
  },
  itemName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 16
  },
  resolvedBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 16
  },
  resolvedText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600'
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24
  },
  detailCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center'
  },
  detailIcon: {
    fontSize: 24,
    marginBottom: 8
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center'
  },
  infoSection: {
    marginBottom: 20
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.textPrimary
  },
  description: {
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 24
  },
  userSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary
  },
  userLabel: {
    fontSize: 12,
    color: COLORS.textSecondary
  },
  postedDate: {
    fontSize: 12,
    color: COLORS.textSecondary
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8
  },
  actionButtonIcon: {
    fontSize: 18
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white
  },
  claimButton: {
    backgroundColor: COLORS.success
  },
  chatButton: {
    backgroundColor: COLORS.primary
  },
  editButton: {
    backgroundColor: COLORS.info,
    flex: 1
  },
  resolveButton: {
    backgroundColor: COLORS.success,
    flex: 1
  },
  deleteButton: {
    backgroundColor: COLORS.error,
    flex: 1
  }
});

export default ItemDetailScreen;