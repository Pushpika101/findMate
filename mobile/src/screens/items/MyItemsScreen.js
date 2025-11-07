import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { itemsAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import useThemedStyles from '../../hooks/useThemedStyles';

const MyItemsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useThemedStyles((c) => ({
    container: {
      flex: 1,
      backgroundColor: c.background
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 50,
      paddingBottom: 16,
      paddingHorizontal: 20,
      backgroundColor: c.white,
      borderBottomWidth: 1,
      borderBottomColor: c.border
    },
    backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    backButtonText: { fontSize: 28, color: c.primary },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: c.textPrimary },
    placeholder: { width: 40 },
    filterContainer: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16, gap: 8, backgroundColor: c.white, borderBottomWidth: 1, borderBottomColor: c.border },
    filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: c.gray100 },
    filterTabActive: { backgroundColor: c.primary },
    filterTabText: { fontSize: 14, fontWeight: '600', color: c.textSecondary },
    filterTabTextActive: { color: c.white },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 20 },
    emptyListContent: { flex: 1 },
    itemCard: { backgroundColor: c.kk2, borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: c.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
    itemHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
    typeBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6 },
    typeBadgeText: { color: c.white, fontSize: 11, fontWeight: 'bold' },
    resolvedBadge: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: c.success, borderRadius: 6 },
    resolvedText: { color: c.white, fontSize: 11, fontWeight: '600' },
    itemName: { fontSize: 18, fontWeight: 'bold', color: c.textPrimary, marginBottom: 8 },
    itemDetails: { marginBottom: 12 },
    detailText: { fontSize: 14, color: c.textSecondary, marginBottom: 4 },
    itemActions: { flexDirection: 'row', gap: 12 },
    actionButton: { flex: 1, paddingVertical: 10, backgroundColor: c.primary, borderRadius: 8, alignItems: 'center' },
    deleteActionButton: { backgroundColor: c.error },
    actionButtonText: { fontSize: 14, fontWeight: '600', color: c.white },
    deleteActionText: { color: c.white },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: c.textPrimary, marginBottom: 6 },
    emptyText: { fontSize: 14, color: c.textSecondary, textAlign: 'center' }
  }));
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'lost', 'found', 'resolved'

  useEffect(() => {
    fetchMyItems();
  }, [filter]);

  const fetchMyItems = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { 
        type: filter !== 'resolved' ? filter : undefined,
        status: filter === 'resolved' ? 'resolved' : 'active'
      } : {};
      
      const response = await itemsAPI.getMyItems(params);
      if (response.success) {
        setItems(response.data.items);
      }
    } catch (error) {
      Alert.alert('Error', error || 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMyItems();
    setRefreshing(false);
  }, [filter]);

  const handleDeleteItem = (itemId) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await itemsAPI.delete(itemId);
              setItems(items.filter(item => item.id !== itemId));
              Alert.alert('Success', 'Item deleted successfully');
            } catch (error) {
              Alert.alert('Error', error || 'Failed to delete item');
            }
          }
        }
      ]
    );
  };

  const renderItemCard = ({ item }) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
    >
      <View style={styles.itemHeader}>
        <View style={[
          styles.typeBadge,
          { backgroundColor: item.type === 'lost' ? colors.lost : colors.found }
        ]}>
          <Text style={styles.typeBadgeText}>
            {item.type === 'lost' ? 'LOST' : 'FOUND'}
          </Text>
        </View>
        {item.status === 'resolved' && (
          <View style={styles.resolvedBadge}>
            <Text style={styles.resolvedText}>✓ Resolved</Text>
          </View>
        )}
      </View>

      <Text style={styles.itemName}>{item.item_name}</Text>
      
      <View style={styles.itemDetails}>
        <Text style={styles.detailText}>📍 {item.location}</Text>
        <Text style={styles.detailText}>📅 {new Date(item.date).toLocaleDateString()}</Text>
      </View>

      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('EditItem', { itemId: item.id, item })}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteActionButton]}
          onPress={() => handleDeleteItem(item.id)}
        >
          <Text style={[styles.actionButtonText, styles.deleteActionText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📦</Text>
      <Text style={styles.emptyTitle}>No items found</Text>
      <Text style={styles.emptyText}>
        {filter === 'all' 
          ? 'You haven\'t posted any items yet'
          : `You have no ${filter} items`}
      </Text>
    </View>
  );

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
        <Text style={styles.headerTitle}>My Items</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {['all', 'lost', 'found', 'resolved'].map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterTab,
              filter === type && styles.filterTabActive
            ]}
            onPress={() => setFilter(type)}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === type && styles.filterTabTextActive
              ]}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Items List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : ( 
        <FlatList
          data={items}
          renderItem={renderItemCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={items.length === 0 ? styles.emptyListContent : styles.listContent}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

// styles are created via useThemedStyles inside the component

export default MyItemsScreen;