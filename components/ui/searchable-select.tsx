/**
 * SearchableSelect Component
 *
 * Bottom sheet searchable select following DESIGN_STANDARDS.md
 * Uses BottomSheetModal with async search functionality
 */

import React, { useState, useCallback, useEffect, useRef, useMemo, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  BottomSheetModal,
  BottomSheetFlatList,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetTextInput,
  useBottomSheetSpringConfigs,
} from '@gorhom/bottom-sheet';
import { Search, X, ChevronDown, Check } from 'lucide-react-native';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';

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
  /** Static options array - alternative to loadOptions */
  options?: SearchableSelectOption[];
  /** Async function to load options - alternative to options array */
  loadOptions?: (searchQuery: string) => Promise<SearchableSelectOption[]>;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  renderOption?: (option: SearchableSelectOption) => React.ReactNode;
}

export function SearchableSelect({
  label,
  placeholder = 'Seçiniz...',
  value,
  selectedOption: selectedOptionProp,
  onValueChange,
  onSelect,
  options: optionsProp,
  loadOptions,
  error,
  required,
  disabled,
  loading: loadingProp,
  renderOption,
}: SearchableSelectProps) {
  const colors = Colors.light;
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [options, setOptions] = useState<SearchableSelectOption[]>(optionsProp || []);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<SearchableSelectOption | null>(
    selectedOptionProp || null
  );

  // Use external loading state if provided
  const loading = loadingProp ?? isLoading;

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Fixed snap point at 90% of screen height
  // Single snap point = modal opens directly at this height
  const snapPoints = useMemo(() => ['90%'], []);

  // iOS-like spring animation config
  const animationConfigs = useBottomSheetSpringConfigs({
    damping: 80,
    overshootClamping: true,
    restDisplacementThreshold: 0.1,
    restSpeedThreshold: 0.1,
    stiffness: 500,
  });

  // Custom backdrop with dimmed background
  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  // Sync with external selectedOption prop
  useEffect(() => {
    if (selectedOptionProp !== undefined) {
      setSelectedOption(selectedOptionProp);
    }
  }, [selectedOptionProp]);

  // Sync selectedOption with external value prop
  useEffect(() => {
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
  }, [searchQuery]);

  // If static options are provided, use them directly
  useEffect(() => {
    if (optionsProp) {
      setOptions(optionsProp);
      // Update selected option if value matches
      if (value) {
        const selected = optionsProp.find((opt) => opt.value === value);
        if (selected) {
          setSelectedOption(selected);
        }
      }
    }
  }, [optionsProp, value]);

  // Fetch options from API
  const fetchOptions = useCallback(
    async (query: string) => {
      // If static options provided, use client-side filtering
      if (optionsProp) {
        const filtered = query
          ? optionsProp.filter((opt) =>
              opt.label.toLowerCase().includes(query.toLowerCase())
            )
          : optionsProp;
        setOptions(filtered);
        return;
      }

      // Otherwise use loadOptions
      if (!loadOptions) return;

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
    },
    [loadOptions, value, optionsProp]
  );

  // Handle modal open
  const handleOpen = useCallback(() => {
    if (disabled) return;
    setSearchQuery('');
    fetchOptions(''); // Load initial options
    bottomSheetRef.current?.present();
  }, [disabled, fetchOptions]);

  // Handle modal dismiss
  const handleDismiss = useCallback(() => {
    setTimeout(() => {
      setSearchQuery('');
      setOptions([]);
    }, 200);
  }, []);

  // Handle option selection
  const handleSelect = useCallback(
    (option: SearchableSelectOption) => {
      setSelectedOption(option);
      onValueChange(option.value);
      onSelect?.(option);
      bottomSheetRef.current?.dismiss();
    },
    [onValueChange, onSelect]
  );

  // Handle clear
  const handleClear = useCallback(
    (e: any) => {
      e.stopPropagation();
      setSelectedOption(null);
      onValueChange('');
      onSelect?.(null);
    },
    [onValueChange, onSelect]
  );

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
              isSelected && { backgroundColor: Brand.primary + '08' },
            ]}
            onPress={() => handleSelect(item)}
            activeOpacity={0.7}
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
            isSelected && { backgroundColor: Brand.primary + '08' },
          ]}
          onPress={() => handleSelect(item)}
          activeOpacity={0.7}
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

  // Render empty state
  const renderEmpty = useCallback(() => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Aranıyor...
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          {searchQuery ? 'Sonuç bulunamadı' : 'Seçenek bulunamadı'}
        </Text>
        {searchQuery && (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            "{searchQuery}" için sonuç yok
          </Text>
        )}
      </View>
    );
  }, [isLoading, searchQuery, colors]);

  // Render header with search
  const renderHeader = useCallback(() => {
    return (
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>{label || 'Seçim Yap'}</Text>
          {options.length > 0 && (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {options.length} seçenek
            </Text>
          )}
        </View>
      </View>
    );
  }, [label, options.length, colors]);

  // Render search input
  const renderSearchInput = useCallback(() => {
    return (
      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Search size={20} color={colors.icon} />
        <BottomSheetTextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Ara..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={18} color={colors.icon} />
          </TouchableOpacity>
        )}
      </View>
    );
  }, [searchQuery, colors]);

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
        onPress={handleOpen}
        disabled={disabled}
        activeOpacity={0.7}
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
                  onPress={handleClear}
                  style={styles.clearButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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

      <BottomSheetModal
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        enableContentPanningGesture={false}
        enableDynamicSizing={false}
        animateOnMount={true}
        animationConfigs={animationConfigs}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.background}
        handleIndicatorStyle={styles.handleIndicator}
        onDismiss={handleDismiss}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
      >
        {renderHeader()}
        {renderSearchInput()}
        <BottomSheetFlatList
          data={options}
          keyExtractor={(item) => String(item.value)}
          renderItem={renderOptionItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      </BottomSheetModal>
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
  // Bottom Sheet Styles
  background: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  handleIndicator: {
    backgroundColor: '#9CA3AF',
    width: 48,
    height: 5,
    borderRadius: 3,
  },
  shadow: {
    ...Shadows.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  title: {
    ...Typography.headingMD,
  },
  subtitle: {
    ...Typography.bodyXS,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    ...Typography.bodyMD,
    paddingVertical: Spacing.xs,
  },
  listContent: {
    paddingBottom: Spacing['2xl'],
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
  emptyContainer: {
    alignItems: 'center',
    padding: Spacing['2xl'],
    gap: Spacing.md,
    marginTop: Spacing['2xl'],
  },
  emptyTitle: {
    ...Typography.headingSM,
  },
  emptyText: {
    ...Typography.bodyMD,
    textAlign: 'center',
  },
});
