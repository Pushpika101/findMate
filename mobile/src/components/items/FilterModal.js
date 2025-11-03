import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import COLORS from '../../utils/colors';
import { ITEM_CATEGORIES, ITEM_COLORS, SORT_OPTIONS } from '../../utils/constants';

const FilterModal = ({ visible, onClose, onApply, currentFilters }) => {
  const [filters, setFilters] = useState({
    category: currentFilters?.category || '',
    color: currentFilters?.color || '',
    location: currentFilters?.location || '',
    date_from: currentFilters?.date_from || '',
    date_to: currentFilters?.date_to || '',
    sort: currentFilters?.sort || 'recent'
  });

  const handleApply = () => {
    // Remove empty filters
    const cleanedFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== '')
    );
    onApply(cleanedFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters = {
      category: '',
      color: '',
      location: '',
      date_from: '',
      date_to: '',
      sort: 'recent'
    };
    setFilters(resetFilters);
    onApply({});
    onClose();
  };

  const updateFilter = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filters & Sort</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Category Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Category</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={filters.category}
                  onValueChange={(value) => updateFilter('category', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="All Categories" value="" />
                  {ITEM_CATEGORIES.map((cat) => (
                    <Picker.Item key={cat.value} label={cat.label} value={cat.value} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Color Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Color</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={filters.color}
                  onValueChange={(value) => updateFilter('color', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="All Colors" value="" />
                  {ITEM_COLORS.map((color) => (
                    <Picker.Item key={color.value} label={color.label} value={color.value} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Location Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Location</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter location..."
                value={filters.location}
                onChangeText={(text) => updateFilter('location', text)}
              />
            </View>

            {/* Date Range */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Date Range</Text>
              <View style={styles.dateRow}>
                <View style={styles.dateInput}>
                  <Text style={styles.dateLabel}>From</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    value={filters.date_from}
                    onChangeText={(text) => updateFilter('date_from', text)}
                  />
                </View>
                <View style={styles.dateInput}>
                  <Text style={styles.dateLabel}>To</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    value={filters.date_to}
                    onChangeText={(text) => updateFilter('date_to', text)}
                  />
                </View>
              </View>
            </View>

            {/* Sort Options */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Sort By</Text>
              <View style={styles.sortOptions}>
                {SORT_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.sortOption,
                      filters.sort === option.value && styles.sortOptionActive
                    ]}
                    onPress={() => updateFilter('sort', option.value)}
                  >
                    <Text
                      style={[
                        styles.sortOptionText,
                        filters.sort === option.value && styles.sortOptionTextActive
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Active Filters Summary */}
            {Object.values(filters).some(v => v && v !== 'recent') && (
              <View style={styles.activeFiltersSection}>
                <Text style={styles.activeFiltersTitle}>Active Filters:</Text>
                <View style={styles.activeFiltersList}>
                  {filters.category && (
                    <View style={styles.activeFilterChip}>
                      <Text style={styles.activeFilterText}>
                        Category: {filters.category}
                      </Text>
                    </View>
                  )}
                  {filters.color && (
                    <View style={styles.activeFilterChip}>
                      <Text style={styles.activeFilterText}>
                        Color: {filters.color}
                      </Text>
                    </View>
                  )}
                  {filters.location && (
                    <View style={styles.activeFilterChip}>
                      <Text style={styles.activeFilterText}>
                        Location: {filters.location}
                      </Text>
                    </View>
                  )}
                  {(filters.date_from || filters.date_to) && (
                    <View style={styles.activeFilterChip}>
                      <Text style={styles.activeFilterText}>
                        Date Range
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.resetButton]}
              onPress={handleReset}
            >
              <Text style={styles.resetButtonText}>Reset All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.applyButton]}
              onPress={handleApply}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 20
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeButtonText: {
    fontSize: 20,
    color: COLORS.textSecondary
  },
  scrollView: {
    paddingHorizontal: 20
  },
  filterSection: {
    marginTop: 20
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    overflow: 'hidden'
  },
  picker: {
    height: 50
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    backgroundColor: COLORS.white
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12
  },
  dateInput: {
    flex: 1
  },
  dateLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 8
  },
  sortOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  sortOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white
  },
  sortOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  sortOptionText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500'
  },
  sortOptionTextActive: {
    color: COLORS.white,
    fontWeight: '600'
  },
  activeFiltersSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: COLORS.primaryLight + '20',
    borderRadius: 12
  },
  activeFiltersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 8
  },
  activeFiltersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  activeFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 16
  },
  activeFilterText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '500'
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  resetButton: {
    backgroundColor: COLORS.gray100,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary
  },
  applyButton: {
    backgroundColor: COLORS.primary
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white
  }
});

export default FilterModal;