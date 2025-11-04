import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated
} from 'react-native';
import COLORS from '../../utils/colors';

const SearchBar = ({ onSearch, onFilterPress, onFocus, onBlur, placeholder = 'Search items...' }) => {
  const [searchText, setSearchText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const animatedWidth = useState(new Animated.Value(0))[0];

  useEffect(() => {
    Animated.spring(animatedWidth, {
      toValue: isFocused ? 1 : 0,
      useNativeDriver: false,
      friction: 8
    }).start();
  }, [isFocused]);

  const handleSearch = (text) => {
    setSearchText(text);
    // Debounce search
    const timer = setTimeout(() => {
      onSearch(text);
    }, 500);
    return () => clearTimeout(timer);
  };

  const handleClear = () => {
    setSearchText('');
    onSearch('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textSecondary}
          value={searchText}
          onChangeText={handleSearch}
          onFocus={() => {
            setIsFocused(true);
            if (onFocus) onFocus();
          }}
          onBlur={() => {
            setIsFocused(false);
            if (onBlur) onBlur();
          }}
          returnKeyType="search"
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <TouchableOpacity
        style={styles.filterButton}
        onPress={onFilterPress}
      >
            <Text style={styles.filterIcon}>Filter</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    paddingVertical: 0
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.gray200,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8
  },
  clearIcon: {
    fontSize: 12,
    color: COLORS.textSecondary
  },
  filterButton: {
    width: 68,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center'
  },
  filterIcon: {
    fontSize: 20,
    color: COLORS.primary
  }
});

export default SearchBar;