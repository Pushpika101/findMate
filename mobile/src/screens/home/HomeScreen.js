import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { itemsAPI } from '../../services/api';
import COLORS from '../../utils/colors';
import SearchBar from '../../components/common/SearchBar';
import FilterModal from '../../components/items/FilterModal';

const HomeScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('lost');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchBarLayout, setSearchBarLayout] = useState({ y: 0, height: 0 });
  const searchBarRef = useRef(null);

  useEffect(() => {
    fetchItems();
  }, [activeTab, searchQuery, filters]);

  // listen to keyboard to detect when search is focused
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setIsSearchFocused(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setIsSearchFocused(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const params = {
        type: activeTab,
        search: searchQuery,
        ...filters
      };
      const response = await itemsAPI.getAll(params);
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
  }, [activeTab, searchQuery, filters]);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  const getActiveFilterCount = () => {
    return Object.keys(filters).filter(key => filters[key] && filters[key] !== 'recent').length;
  };

  const renderEmptyState = () => {
    const hasFilters = Object.keys(filters).length > 0 || searchQuery;
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>
          {hasFilters ? '🔍' : (activeTab === 'lost' ? '🔍' : '✨')}
        </Text>
        <Text style={styles.emptyTitle}>
          {hasFilters ? 'No items found' : `No ${activeTab} items yet`}
        </Text>
        <Text style={styles.emptyText}>
          {hasFilters 
            ? 'Try adjusting your search or filters'
            : activeTab === 'lost' 
              ? 'Be the first to report a lost item'
              : 'Be the first to report a found item'
          }
        </Text>
        {hasFilters && (
          <TouchableOpacity
            style={styles.clearFiltersButton}
            onPress={() => {
              setSearchQuery('');
              setFilters({});
            }}
          >
            <Text style={styles.clearFiltersText}>Clear All Filters</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

      
  const renderItemCard = ({ item }) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <View style={styles.itemHeader}>
        <View style={[
          styles.typeBadge,
          { backgroundColor: item.type === 'lost' ? COLORS.lost : COLORS.found }
        ]}>
          <Text style={styles.typeBadgeText}>
            {item.type === 'lost' ? 'LOST' : 'FOUND'}
          </Text>
        </View>
          </View>

          {/* absolute date in top-right of card */}
          <Text style={styles.itemDateAbsolute}>
            {new Date(item.date).toLocaleDateString()}
          </Text>

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
        </View>

        {/* Thumbnail */}
        <View style={styles.thumbnailContainer}>
          { (item.photo1_url || item.photo2_url) ? (
            <Image
              source={{ uri: item.photo1_url || item.photo2_url }}
              style={styles.thumbnailImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.thumbnailImage, styles.thumbnailPlaceholder]}>
              <Text style={{ color: COLORS.textSecondary }}>No Image</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const activeFilterCount = getActiveFilterCount();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>findMate</Text>
      </View>

      {/* Search Bar will be rendered below the Lost/Found toggles */}

      {/* Active Filters Indicator */}
      {activeFilterCount > 0 && (
        <View style={styles.activeFiltersIndicator}>
          <Text style={styles.activeFiltersText}>
            {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
          </Text>
          <TouchableOpacity
            onPress={() => setShowFilterModal(true)}
            style={styles.viewFiltersButton}
          >
            <Text style={styles.viewFiltersText}>View</Text>
          </TouchableOpacity>
        </View>
      )}
        
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
          {activeTab === 'lost' && <View style={styles.tabIndicator} />}
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
          {activeTab === 'found' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View
        ref={searchBarRef}
        onLayout={(e) => setSearchBarLayout(e.nativeEvent.layout)}
        style={styles.searchBarWrapper}
      >
        <SearchBar
          onSearch={handleSearch}
          onFilterPress={() => setShowFilterModal(true)}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
        />
      </View>

      {/* Dim overlay when search is focused - tapping it will dismiss keyboard */}
      {isSearchFocused && (
        <TouchableWithoutFeedback onPress={() => { setIsSearchFocused(false); Keyboard.dismiss(); }}>
          <View style={[styles.blurOverlay, { top: searchBarLayout.y + searchBarLayout.height }]} />
        </TouchableWithoutFeedback>
      )}

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
          ListFooterComponent={<View style={{ height: 100 }} />}
          keyboardShouldPersistTaps="handled"
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

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={handleApplyFilters}
        currentFilters={filters}
      />
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
  activeFiltersIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: COLORS.primaryLight + '20',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  activeFiltersText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600'
  },
  viewFiltersButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 12
  },
  viewFiltersText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '600'
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginTop: -16,
    borderRadius: 12,
    padding: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
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
    backgroundColor: COLORS.kk,
    borderRadius: 8
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary
  },
  tabTextActive: {
    color: COLORS.primaryDark
  },
  
  listContent: {
    padding: 20,
    paddingTop: 16
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
    backgroundColor: COLORS.kk2,
    borderRadius: 16,
    padding: 16,
    position: 'relative',
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3
  },
  thumbnailContainer: {
    width: 125,
    height: 125,
    marginLeft: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center'
  },
  thumbnailImage: {
    width: '100%',
    height: '100%'
  },
  thumbnailPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 12
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6
  },
  typeBadgeText: {
    color: COLORS.black,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5
  },
  itemDate: {
    fontSize: 13,
    color: COLORS.textSecondary
  },
  itemDateAbsolute: {
    position: 'absolute',
    top: 12,
    right: 0,
    fontSize: 13,
    color: COLORS.textSecondary
  },
  searchBarWrapper: {
    zIndex: 20,
    elevation: 20,
    backgroundColor: 'transparent'
  },
  blurOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.12)',
    zIndex: 10,
    elevation: 10
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
    borderTopColor: COLORS.gray400
  },
  postedBy: {
    fontSize: 12,
    color: COLORS.textTertiary
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60
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
    textAlign: 'center',
    paddingHorizontal: 40
  },
  clearFiltersButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 20
  },
  clearFiltersText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600'
  }
});

export default HomeScreen;