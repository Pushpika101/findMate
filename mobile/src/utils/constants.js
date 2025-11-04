import Constants from 'expo-constants';

// API Configuration
export const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5001/api';
export const SOCKET_URL = Constants.expoConfig?.extra?.socketUrl || 'http://localhost:5001';

// Item Categories
export const ITEM_CATEGORIES = [
  { label: 'Bag', value: 'Bag' },
  { label: 'Calculator', value: 'Calculator' },
  { label: 'Helmet', value: 'Helmet' },
  { label: 'Phone', value: 'Phone' },
  { label: 'Laptop', value: 'Laptop' },
  { label: 'Keys', value: 'Keys' },
  { label: 'Wallet', value: 'Wallet' },
  { label: 'Books', value: 'Books' },
  { label: 'Clothing', value: 'Clothing' },
  { label: 'Accessories', value: 'Accessories' },
  { label: 'Electronics', value: 'Electronics' },
  { label: 'Documents', value: 'Documents' },
  { label: 'Sports Equipment', value: 'Sports Equipment' },
  { label: 'Other', value: 'Other' }
];

// Item Colors
export const ITEM_COLORS = [
  { label: 'Black', value: 'Black' },
  { label: 'Blue', value: 'Blue' },
  { label: 'Red', value: 'Red' },
  { label: 'Green', value: 'Green' },
  { label: 'Yellow', value: 'Yellow' },
  { label: 'White', value: 'White' },
  { label: 'Brown', value: 'Brown' },
  { label: 'Gray', value: 'Gray' },
  { label: 'Pink', value: 'Pink' },
  { label: 'Purple', value: 'Purple' },
  { label: 'Orange', value: 'Orange' },
  { label: 'Multi-color', value: 'Multi-color' }
];

// Common Campus Locations
export const COMMON_LOCATIONS = [
  'Main Library',
  'Engineering Faculty',
  'Science Faculty',
  'Arts Faculty',
  'Agriculture Faculty',
  'Medical Faculty',
  'Dental Faculty',
  'Veterinary Faculty',
  'Main Canteen',
  'Engineering Canteen',
  'Lecture Hall Complex',
  'Administration Building',
  'Sports Complex',
  'Hostel Area',
  'Bus Stand',
  'Other'
];

// Sort Options
export const SORT_OPTIONS = [
  { label: 'Most Recent', value: 'recent' },
  { label: 'Date (Oldest)', value: 'date_asc' },
  { label: 'Date (Newest)', value: 'date_desc' }
];

// Date Filter Options
export const DATE_FILTERS = [
  { label: 'All Time', value: null },
  { label: 'Today', value: 'today' },
  { label: 'Last 3 Days', value: '3days' },
  { label: 'Last Week', value: 'week' },
  { label: 'Last Month', value: 'month' },
  { label: 'Custom Range', value: 'custom' }
];

// Notification Types
export const NOTIFICATION_TYPES = {
  NEW_ITEM: 'new_item',
  MATCH_FOUND: 'match_found',
  ITEM_CLAIMED: 'item_claimed',
  NEW_MESSAGE: 'new_message'
};

// Item Status
export const ITEM_STATUS = {
  ACTIVE: 'active',
  RESOLVED: 'resolved'
};

// Item Types
export const ITEM_TYPES = {
  LOST: 'lost',
  FOUND: 'found'
};

// Storage Keys
export const STORAGE_KEYS = {
  TOKEN: '@lost_found_token',
  USER: '@lost_found_user',
  THEME: '@lost_found_theme'
};

// Image Config
export const IMAGE_CONFIG = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_IMAGES: 2,
  QUALITY: 0.8,
  ASPECT: [4, 3]
};

// Pagination
export const ITEMS_PER_PAGE = 20;

// Email Domain
export const ALLOWED_EMAIL_DOMAIN = '@eng.pdn.ac.lk';

export default {
  API_URL,
  SOCKET_URL,
  ITEM_CATEGORIES,
  ITEM_COLORS,
  COMMON_LOCATIONS,
  SORT_OPTIONS,
  DATE_FILTERS,
  NOTIFICATION_TYPES,
  ITEM_STATUS,
  ITEM_TYPES,
  STORAGE_KEYS,
  IMAGE_CONFIG,
  ITEMS_PER_PAGE,
  ALLOWED_EMAIL_DOMAIN
};