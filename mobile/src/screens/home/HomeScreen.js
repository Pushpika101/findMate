import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { itemsAPI } from '../../services/api';
import COLORS from '../../utils/colors';

const HomeScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('lost'); // 'lost' or 'found'
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchItems();
  }, [activeTab]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await itemsAPI.getAll({ type: activeTab });
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
    await fetchItems();
    setRefreshing(false);
  }, [activeTab]);

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>
        {activeTab === 'lost' ? '🔍' : '✨'}
      </Text>
      <Text style={styles.emptyTitle}>
        No {activeTab} items yet
      </Text>
      <Text style={styles.emptyText}>
        {activeTab === 'lost' 
          ? 'Be the first to report a lost item'
          : 'Be the first to report a found item'
        }
      </Text>
    </View>
  );

  const renderItemCard = ({ item }) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
    >
      <View style={styles.itemHeader}>
        <View style={[
          styles.typeBadge,
          { backgroundColor: item.type === 'lost' ? COLORS.lost : COLORS.found }
        ]}>
          <Text style={styles.typeBadgeText}>
            {item.type === 'lost' ? 'LOST' : 'FOUND'}
          </Text>
        </View>
        <Text style={styles.itemDate}>
          {new Date(item.date).toLocaleDateString()}
        </Text>
      </View>

      <Text style={styles.itemName}>{item.item_name}</Text>
      
      <View style={styles.itemDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>📍</Text>
          <Text style={styles.detailText}>{item.location}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>🏷️</Text>
          <Text style={styles.detailText}>{item.category}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>🎨</Text>
          <Text style={styles.detailText}>{item.color}</Text>
        </View>
      </View>

      {item.description && (
        <Text style={styles.itemDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={styles.itemFooter}>
        <Text style={styles.postedBy}>Posted by {item.user_name}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>findMate</Text>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'lost' && styles.tabActive
          ]}
          onPress={() => setActiveTab('lost')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'lost' && styles.tabTextActive
          ]}>
            Lost Items
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'found' && styles.tabActive
          ]}
          onPress={() => setActiveTab('found')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'found' && styles.tabTextActive
          ]}>
            Found Items
          </Text>
        </TouchableOpacity>
      </View>

      {/* Items List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading items...</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItemCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  header: {
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
    color: COLORS.white,
    marginBottom: 4
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 12,
    padding: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative'
  },
  tabActive: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary
  },
  tabTextActive: {
    color: COLORS.primary
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    width: '80%',
    backgroundColor: COLORS.primary,
    borderRadius: 2
  },
  listContent: {
    padding: 20,
    paddingTop: 16,
    // Extra bottom padding so list items aren't hidden behind bottom tabs
    paddingBottom: 120
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary
  },
  itemCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6
  },
  typeBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5
  },
  itemDate: {
    fontSize: 13,
    color: COLORS.textSecondary
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12
  },
  itemDetails: {
    marginBottom: 12
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  detailIcon: {
    fontSize: 14,
    marginRight: 8
  },
  detailText: {
    fontSize: 14,
    color: COLORS.textSecondary
  },
  itemDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 12
  },
  itemFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  postedBy: {
    fontSize: 12,
    color: COLORS.textTertiary
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    // Ensure empty state content is visible above the bottom tabs
    paddingBottom: 120
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center'
  }
});

export default HomeScreen;