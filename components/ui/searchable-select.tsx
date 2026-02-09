/**
 * SearchableSelect Component
 *
 * Bottom sheet searchable select following dashboard-theme standards
 * Uses BottomSheetModal with async search functionality
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import {
  BottomSheetModal,
  BottomSheetFlatList,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetTextInput,
  useBottomSheetSpringConfigs,
} from '@gorhom/bottom-sheet'
import { Search, X, ChevronDown, Check } from 'lucide-react-native'
import {
  DashboardColors,
  DashboardFontSizes,
  DashboardSpacing,
  DashboardBorderRadius,
} from '@/constants/dashboard-theme'

export interface SearchableSelectOption {
  label: string
  value: string | number
  subtitle?: string
}

export interface SearchableSelectProps {
  label?: string
  placeholder?: string
  value?: string | number | null
  /** Pass the currently selected option to display it immediately without waiting for options to load */
  selectedOption?: SearchableSelectOption | null
  onValueChange: (value: string | number | null) => void
  /** Called when an option is selected, provides the full option object */
  onSelect?: (option: SearchableSelectOption | null) => void
  /** Static options array - alternative to loadOptions */
  options?: SearchableSelectOption[]
  /** Async function to load options - alternative to options array */
  loadOptions?: (searchQuery: string) => Promise<SearchableSelectOption[]>
  error?: string
  required?: boolean
  disabled?: boolean
  loading?: boolean
  renderOption?: (option: SearchableSelectOption) => React.ReactNode
  /** Custom display value that overrides the selected option's label */
  displayValue?: string
  /** Placeholder for the search input (defaults to "Ara...") */
  searchPlaceholder?: string
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
  displayValue,
  searchPlaceholder = 'Ara...',
}: SearchableSelectProps) {
  const bottomSheetRef = useRef<BottomSheetModal>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [options, setOptions] = useState<SearchableSelectOption[]>(optionsProp || [])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedOption, setSelectedOption] = useState<SearchableSelectOption | null>(
    selectedOptionProp || null
  )

  // Use external loading state if provided
  const loading = loadingProp ?? isLoading

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isModalOpenRef = useRef(false)

  // Fixed snap point at 90% of screen height
  const snapPoints = useMemo(() => ['90%'], [])

  // iOS-like spring animation config
  const animationConfigs = useBottomSheetSpringConfigs({
    damping: 80,
    overshootClamping: true,
    stiffness: 500,
  })

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
  )

  // Sync with external selectedOption prop
  useEffect(() => {
    if (selectedOptionProp !== undefined) {
      setSelectedOption(selectedOptionProp)
    }
  }, [selectedOptionProp])

  // Sync selectedOption with external value prop
  useEffect(() => {
    // If value is cleared externally, clear selection
    if (!value && !selectedOptionProp) {
      if (selectedOption) {
        setSelectedOption(null)
      }
      return
    }
    // If selectedOptionProp is provided, it takes priority (handled by other effect)
    if (selectedOptionProp !== undefined) return
    // Try to find value in available options
    if (value && options.length > 0) {
      const selected = options.find((opt) => opt.value === value)
      if (selected && selectedOption?.value !== value) {
        setSelectedOption(selected)
      }
    }
  }, [value, options, selectedOptionProp])

  // Debounced search - sadece modal açıkken çalışır
  useEffect(() => {
    if (!isModalOpenRef.current) return

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (isModalOpenRef.current) {
        fetchOptions(searchQuery)
      }
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery])

  // If static options are provided, use them directly
  useEffect(() => {
    if (optionsProp) {
      setOptions(optionsProp)
      // Update selected option if value matches
      if (value) {
        const selected = optionsProp.find((opt) => opt.value === value)
        if (selected) {
          setSelectedOption(selected)
        }
      }
    }
  }, [optionsProp, value])

  // Fetch options from API
  const fetchOptions = useCallback(
    async (query: string) => {
      // If static options provided, use client-side filtering
      if (optionsProp) {
        const filtered = query
          ? optionsProp.filter((opt) =>
              opt.label.toLowerCase().includes(query.toLowerCase())
            )
          : optionsProp
        setOptions(filtered)
        return
      }

      // Otherwise use loadOptions
      if (!loadOptions) return

      setIsLoading(true)
      try {
        const results = await loadOptions(query)
        setOptions(results)

        // Update selected option if value matches
        if (value) {
          const selected = results.find((opt) => opt.value === value)
          if (selected) {
            setSelectedOption(selected)
          }
        }
      } catch (error) {
        if (__DEV__) console.error('Error loading options:', error)
        setOptions([])
      } finally {
        setIsLoading(false)
      }
    },
    [loadOptions, value, optionsProp]
  )

  // Handle modal open
  const handleOpen = useCallback(() => {
    if (disabled) return
    isModalOpenRef.current = true
    setSearchQuery('')
    fetchOptions('')
    bottomSheetRef.current?.present()
  }, [disabled, fetchOptions])

  // Handle modal dismiss - keep selected option intact
  const handleDismiss = useCallback(() => {
    isModalOpenRef.current = false
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
      searchTimeoutRef.current = null
    }
    setTimeout(() => {
      setSearchQuery('')
    }, 200)
  }, [])

  // Handle option selection
  const handleSelect = useCallback(
    (option: SearchableSelectOption) => {
      setSelectedOption(option)
      onValueChange(option.value)
      onSelect?.(option)
      bottomSheetRef.current?.dismiss()
    },
    [onValueChange, onSelect]
  )

  // Handle clear
  const handleClear = useCallback(
    (e: any) => {
      e.stopPropagation()
      setSelectedOption(null)
      onValueChange(null)
      onSelect?.(null)
    },
    [onValueChange, onSelect]
  )

  // Render option item
  const renderOptionItem = useCallback(
    ({ item }: { item: SearchableSelectOption }) => {
      const isSelected = item.value === value

      if (renderOption) {
        return (
          <TouchableOpacity
            style={[
              styles.optionItem,
              isSelected && { backgroundColor: DashboardColors.primaryGlow },
            ]}
            onPress={() => handleSelect(item)}
            activeOpacity={0.7}
          >
            {renderOption(item)}
            {isSelected && (
              <Check size={20} color={DashboardColors.primary} style={styles.checkIcon} />
            )}
          </TouchableOpacity>
        )
      }

      return (
        <TouchableOpacity
          style={[
            styles.optionItem,
            isSelected && { backgroundColor: DashboardColors.primaryGlow },
          ]}
          onPress={() => handleSelect(item)}
          activeOpacity={0.7}
        >
          <View style={styles.optionContent}>
            <Text
              style={[
                styles.optionLabel,
                isSelected && { fontWeight: '600' },
              ]}
            >
              {item.label}
            </Text>
            {item.subtitle && (
              <Text style={styles.optionSubtitle}>
                {item.subtitle}
              </Text>
            )}
          </View>
          {isSelected && <Check size={20} color={DashboardColors.primary} />}
        </TouchableOpacity>
      )
    },
    [value, handleSelect, renderOption]
  )

  // Render empty state
  const renderEmpty = useCallback(() => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={DashboardColors.primary} />
          <Text style={styles.emptyText}>
            Aranıyor...
          </Text>
        </View>
      )
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>
          {searchQuery ? 'Sonuç bulunamadı' : 'Seçenek bulunamadı'}
        </Text>
        {searchQuery && (
          <Text style={styles.emptyText}>
            &quot;{searchQuery}&quot; için sonuç yok
          </Text>
        )}
      </View>
    )
  }, [isLoading, searchQuery])

  // Render header with search
  const renderHeader = useCallback(() => {
    return (
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{label || 'Seçim Yap'}</Text>
          {options.length > 0 && (
            <Text style={styles.subtitle}>
              {options.length} seçenek
            </Text>
          )}
        </View>
      </View>
    )
  }, [label, options.length])

  // Render search input
  const renderSearchInput = useCallback(() => {
    return (
      <View style={styles.searchContainer}>
        <Search size={20} color={DashboardColors.textMuted} />
        <BottomSheetTextInput
          style={styles.searchInput}
          placeholder={searchPlaceholder}
          placeholderTextColor={DashboardColors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={18} color={DashboardColors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    )
  }, [searchQuery])

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      <TouchableOpacity
        style={[
          styles.selectButton,
          error && styles.selectButtonError,
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
                <Text style={styles.selectedLabel}>
                  {displayValue ?? selectedOption.label}
                </Text>
                {selectedOption.subtitle && (
                  <Text style={styles.selectedSubtitle}>
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
                  <X size={18} color={DashboardColors.textMuted} />
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              <Text style={styles.placeholder}>
                {placeholder}
              </Text>
              <ChevronDown size={20} color={DashboardColors.textMuted} />
            </>
          )}
        </View>
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

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
          keyExtractor={(item: SearchableSelectOption) => String(item.value)}
          renderItem={renderOptionItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      </BottomSheetModal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: DashboardSpacing.md,
  },
  label: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: DashboardColors.textSecondary,
    marginBottom: DashboardSpacing.xs,
  },
  required: {
    color: DashboardColors.danger,
  },
  selectButton: {
    borderWidth: 1,
    borderRadius: DashboardBorderRadius.lg,
    borderColor: DashboardColors.borderLight,
    backgroundColor: DashboardColors.surface,
    paddingHorizontal: DashboardSpacing.lg,
    minHeight: 48,
    justifyContent: 'center',
  },
  selectButtonError: {
    borderColor: DashboardColors.danger,
  },
  selectContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedContent: {
    flex: 1,
    marginRight: DashboardSpacing.sm,
  },
  selectedLabel: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textPrimary,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  selectedSubtitle: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textMuted,
    marginTop: DashboardSpacing.xs,
  },
  placeholder: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textMuted,
    flex: 1,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  clearButton: {
    padding: DashboardSpacing.xs,
    marginRight: DashboardSpacing.xs,
  },
  errorText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.danger,
    marginTop: DashboardSpacing.xs,
  },
  // Bottom Sheet Styles
  background: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: DashboardBorderRadius['2xl'],
    borderTopRightRadius: DashboardBorderRadius['2xl'],
  },
  handleIndicator: {
    backgroundColor: '#9CA3AF',
    width: 48,
    height: 5,
    borderRadius: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DashboardSpacing['2xl'],
    paddingTop: DashboardSpacing.lg,
    paddingBottom: DashboardSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight,
  },
  title: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
  },
  subtitle: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textSecondary,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.sm,
    marginHorizontal: DashboardSpacing.lg,
    marginVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight,
    backgroundColor: DashboardColors.surface,
  },
  searchInput: {
    flex: 1,
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textPrimary,
    paddingVertical: DashboardSpacing.xs,
  },
  listContent: {
    paddingBottom: DashboardSpacing['2xl'],
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DashboardSpacing.lg,
    paddingVertical: DashboardSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight,
  },
  optionContent: {
    flex: 1,
    marginRight: DashboardSpacing.sm,
  },
  optionLabel: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textPrimary,
  },
  optionSubtitle: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textMuted,
    marginTop: DashboardSpacing.xs,
  },
  checkIcon: {
    marginLeft: DashboardSpacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: DashboardSpacing['2xl'],
    gap: DashboardSpacing.md,
    marginTop: DashboardSpacing['2xl'],
  },
  emptyTitle: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
  },
  emptyText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    textAlign: 'center',
  },
})
