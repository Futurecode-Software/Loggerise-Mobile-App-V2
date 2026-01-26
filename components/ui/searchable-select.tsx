/**
 * SearchableSelect Component
 *
 * Async searchable select component similar to web AsyncSelect.
 * Supports searching with debounced API calls.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar as RNStatusBar,
  Dimensions,
} from 'react-native';
import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import { Search, X, ChevronDown, Check, ChevronLeft } from 'lucide-react-native';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';

// iOS status bar yüksekliği hesaplama
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const getStatusBarHeight = (): number => {
  if (Platform.OS === 'android') {
    return Constants.statusBarHeight || 24;
  }
  // iOS için - notch'lu cihazlar için daha yüksek değer
  // iPhone X ve sonrası: ~44-50px, eski iPhone: ~20px
  if (SCREEN_HEIGHT >= 812) {
    return 47; // iPhone X, 11, 12, 13, 14, 15 serisi (notch'lu)
  }
  return 20; // Eski iPhone modelleri
};

export interface SearchableSelectOption {
  label: string;
  value: string | number;
  subtitle?: string;
}

export interface SearchableSelectProps {
  label?: string;
  placeholder?: string;
  value?: string | number;
  /** Pass the currently selected option to display it immediately without waiting for options to load */
  selectedOption?: SearchableSelectOption | null;
  onValueChange: (value: string | number) => void;
  /** Called when an option is selected, provides the full option object */
  onSelect?: (option: SearchableSelectOption | null) => void;
  loadOptions: (searchQuery: string) => Promise<SearchableSelectOption[]>;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  renderOption?: (option: SearchableSelectOption) => React.ReactNode;
}

export function SearchableSelect({
  label,
  placeholder = 'Seçiniz...',
  value,
  selectedOption: selectedOptionProp,
  onValueChange,
  onSelect,
  loadOptions,
  error,
  required,
  disabled,
  renderOption,
}: SearchableSelectProps) {
  const colors = Colors.light;

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [options, setOptions] = useState<SearchableSelectOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // Initialize with selectedOptionProp if provided
  const [selectedOption, setSelectedOption] = useState<SearchableSelectOption | null>(
    selectedOptionProp || null
  );

  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Load initial options when modal opens
  useEffect(() => {
    if (isOpen && options.length === 0) {
      fetchOptions('');
    }
  }, [isOpen]);

  // Sync with external selectedOption prop (primary source of truth)
  useEffect(() => {
    if (selectedOptionProp !== undefined) {
      setSelectedOption(selectedOptionProp);
    }
  }, [selectedOptionProp]);

  // Sync selectedOption with external value prop (fallback when options are loaded)
  useEffect(() => {
    // Only try to find from options if no selectedOptionProp was provided
    if (selectedOptionProp === undefined && value && options.length > 0) {
      const selected = options.find((opt) => opt.value === value);
      if (selected && selectedOption?.value !== value) {
        setSelectedOption(selected);
      }
    } else if (!value && !selectedOptionProp && selectedOption) {
      setSelectedOption(null);
    }
  }, [value, options, selectedOptionProp]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchOptions(searchQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, isOpen]);

  // Fetch options from API
  const fetchOptions = useCallback(async (query: string) => {
    setIsLoading(true);
    try {
      const results = await loadOptions(query);
      setOptions(results);

      // Update selected option if value matches
      if (value) {
        const selected = results.find((opt) => opt.value === value);
        if (selected) {
          setSelectedOption(selected);
        }
      }
    } catch (error) {
      console.error('Error loading options:', error);
      setOptions([]);
    } finally {
      setIsLoading(false);
    }
  }, [loadOptions, value]);

  // Handle option selection
  const handleSelect = useCallback(
    (option: SearchableSelectOption) => {
      setSelectedOption(option);
      onValueChange(option.value);
      onSelect?.(option);
      setIsOpen(false);
      setSearchQuery('');
    },
    [onValueChange, onSelect]
  );

  // Handle clear
  const handleClear = useCallback(() => {
    setSelectedOption(null);
    onValueChange('');
    onSelect?.(null);
  }, [onValueChange, onSelect]);

  // Render option item
  const renderOptionItem = useCallback(
    ({ item }: { item: SearchableSelectOption }) => {
      const isSelected = item.value === value;

      if (renderOption) {
        return (
          <TouchableOpacity
            style={[
              styles.optionItem,
              { borderBottomColor: colors.border },
              isSelected && { backgroundColor: colors.surface },
            ]}
            onPress={() => handleSelect(item)}
          >
            {renderOption(item)}
            {isSelected && (
              <Check size={20} color={Brand.primary} style={styles.checkIcon} />
            )}
          </TouchableOpacity>
        );
      }

      return (
        <TouchableOpacity
          style={[
            styles.optionItem,
            { borderBottomColor: colors.border },
            isSelected && { backgroundColor: colors.surface },
          ]}
          onPress={() => handleSelect(item)}
        >
          <View style={styles.optionContent}>
            <Text
              style={[
                styles.optionLabel,
                { color: colors.text },
                isSelected && { fontWeight: '600' },
              ]}
            >
              {item.label}
            </Text>
            {item.subtitle && (
              <Text style={[styles.optionSubtitle, { color: colors.textMuted }]}>
                {item.subtitle}
              </Text>
            )}
          </View>
          {isSelected && <Check size={20} color={Brand.primary} />}
        </TouchableOpacity>
      );
    },
    [value, colors, handleSelect, renderOption]
  );

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>
          {label}
          {required && <Text style={{ color: colors.danger }}> *</Text>}
        </Text>
      )}

      <TouchableOpacity
        style={[
          styles.selectButton,
          {
            backgroundColor: colors.card,
            borderColor: error ? colors.danger : colors.border,
          },
          disabled && { opacity: 0.5 },
        ]}
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
      >
        <View style={styles.selectContent}>
          {selectedOption ? (
            <>
              <View style={styles.selectedContent}>
                <Text style={[styles.selectedLabel, { color: colors.text }]}>
                  {selectedOption.label}
                </Text>
                {selectedOption.subtitle && (
                  <Text style={[styles.selectedSubtitle, { color: colors.textMuted }]}>
                    {selectedOption.subtitle}
                  </Text>
                )}
              </View>
              {!disabled && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  style={styles.clearButton}
                >
                  <X size={18} color={colors.icon} />
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              <Text style={[styles.placeholder, { color: colors.textMuted }]}>
                {placeholder}
              </Text>
              <ChevronDown size={20} color={colors.icon} />
            </>
          )}
        </View>
      </TouchableOpacity>

      {error && <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>}

      <Modal
        visible={isOpen}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        {/* StatusBar - Yeşil arka plan, beyaz içerik */}
        <StatusBar style="light" backgroundColor={Brand.primary} />
        {Platform.OS === 'android' && (
          <RNStatusBar
            barStyle="light-content"
            backgroundColor={Brand.primary}
            translucent={false}
          />
        )}

        <View style={styles.modalWrapper}>
          {/* Yeşil Header - Status bar dahil */}
          <View
            style={[
              styles.greenHeader,
              { paddingTop: getStatusBarHeight() },
            ]}
          >
            <View style={styles.greenHeaderContent}>
              <TouchableOpacity
                onPress={() => setIsOpen(false)}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <ChevronLeft size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.greenHeaderTitle} numberOfLines={1}>
                {label || 'Seçim Yap'}
              </Text>
              <View style={styles.headerRightPlaceholder} />
            </View>
          </View>

          {/* İçerik alanı */}
          <KeyboardAvoidingView
            style={[styles.modalContent, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {/* Search Input */}
            <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
              <Search size={20} color={colors.icon} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Ara..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={18} color={colors.icon} />
                </TouchableOpacity>
              )}
            </View>

            {/* Options List */}
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Brand.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Aranıyor...
                </Text>
              </View>
            ) : options.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {searchQuery ? 'Sonuç bulunamadı' : 'Seçenek bulunamadı'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={options}
                keyExtractor={(item) => String(item.value)}
                renderItem={renderOptionItem}
                style={styles.optionsList}
                contentContainerStyle={styles.optionsListContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              />
            )}
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.bodySM,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  selectButton: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 48,
  },
  selectContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  selectedLabel: {
    ...Typography.bodyMD,
  },
  selectedSubtitle: {
    ...Typography.bodySM,
    marginTop: Spacing.xs,
  },
  placeholder: {
    ...Typography.bodyMD,
    flex: 1,
  },
  clearButton: {
    padding: Spacing.xs,
    marginRight: Spacing.xs,
  },
  errorText: {
    ...Typography.bodyXS,
    marginTop: Spacing.xs,
  },
  modalWrapper: {
    flex: 1,
    backgroundColor: Brand.primary,
  },
  greenHeader: {
    backgroundColor: Brand.primary,
    width: '100%',
  },
  greenHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    minHeight: 56,
    backgroundColor: Brand.primary,
  },
  backButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  greenHeaderTitle: {
    ...Typography.headingMD,
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Spacing.md,
  },
  headerRightPlaceholder: {
    width: 40, // Back button ile dengelemek için
  },
  modalContent: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    margin: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  searchInput: {
    flex: 1,
    ...Typography.bodyMD,
    paddingVertical: Spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['4xl'],
  },
  loadingText: {
    ...Typography.bodyMD,
    marginTop: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['4xl'],
  },
  emptyText: {
    ...Typography.bodyMD,
  },
  optionsList: {
    flex: 1,
  },
  optionsListContent: {
    paddingBottom: Spacing.lg,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  optionContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  optionLabel: {
    ...Typography.bodyMD,
  },
  optionSubtitle: {
    ...Typography.bodySM,
    marginTop: Spacing.xs,
  },
  checkIcon: {
    marginLeft: Spacing.sm,
  },
});
