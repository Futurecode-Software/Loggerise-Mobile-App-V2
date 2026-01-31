/**
 * SearchableSelect Bileşeni
 *
 * API'den async veri çekme ve static options destekli
 * BottomSheetModal tabanlı aranabilir select
 */

import React, { useState, useCallback, useMemo, useRef, useEffect, useDeferredValue } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native'
import {
  BottomSheetModal,
  BottomSheetFlatList,
  BottomSheetBackdrop,
  BottomSheetTextInput,
  BottomSheetBackdropProps
} from '@gorhom/bottom-sheet'
import { Ionicons } from '@expo/vector-icons'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius
} from '@/constants/dashboard-theme'

export interface SelectOption<T = any> {
  value: string | number
  label: string
  subtitle?: string
  data?: T
}

interface SearchableSelectProps<T = any> {
  // Görünüm
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string

  // Değer
  value?: string | number | null
  selectedOption?: SelectOption<T> | null
  displayValue?: string

  // Olaylar
  onSelect?: (option: SelectOption<T>) => void
  onClear?: () => void

  // Veri kaynağı (async veya static)
  loadOptions?: (search: string) => Promise<SelectOption<T>[]>
  options?: SelectOption<T>[]

  // Modal ayarları
  modalTitle?: string
  searchPlaceholder?: string
  emptyMessage?: string

  // Render fonksiyonları
  renderOption?: (option: SelectOption<T>) => React.ReactNode
}

export function SearchableSelect<T = any>({
  label,
  placeholder = 'Seciniz',
  required = false,
  disabled = false,
  error,
  value,
  selectedOption,
  displayValue,
  onSelect,
  onClear,
  loadOptions,
  options: staticOptions = [],
  modalTitle = 'Seciniz',
  searchPlaceholder = 'Ara...',
  emptyMessage = 'Sonuc bulunamadi',
  renderOption
}: SearchableSelectProps<T>) {
  const bottomSheetRef = useRef<BottomSheetModal>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [asyncOptions, setAsyncOptions] = useState<SelectOption<T>[]>([])

  // Modern React debounce pattern with useDeferredValue
  const deferredSearch = useDeferredValue(searchQuery)
  const isSearching = searchQuery !== deferredSearch

  // Snap points - tek snap point ile sabit boyut
  const snapPoints = useMemo(() => ['85%'], [])

  // Async arama - useDeferredValue ile optimize edildi
  useEffect(() => {
    if (!loadOptions) return

    const fetchOptions = async () => {
      setIsLoading(true)
      try {
        const results = await loadOptions(deferredSearch)
        setAsyncOptions(results)
      } catch (err) {
        console.error('SearchableSelect: Error loading options', err)
        setAsyncOptions([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchOptions()
  }, [deferredSearch, loadOptions])

  // Filtrelenmiş seçenekler - deferred search kullanılıyor
  const filteredOptions = useMemo(() => {
    if (loadOptions) {
      return asyncOptions
    }

    if (!deferredSearch.trim()) return staticOptions

    const query = deferredSearch.toLowerCase()
    return staticOptions.filter(
      (option) =>
        option.label.toLowerCase().includes(query) ||
        (option.subtitle && option.subtitle.toLowerCase().includes(query))
    )
  }, [loadOptions, asyncOptions, staticOptions, deferredSearch])

  // Backdrop
  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.7}
        pressBehavior="close"
      />
    ),
    []
  )

  // Modal aç
  const handleOpen = useCallback(() => {
    if (disabled) return
    setSearchQuery('')

    // Async mode için modal açıldığında ilk veriyi yükle
    if (loadOptions && asyncOptions.length === 0) {
      setIsLoading(true)
      loadOptions('').then((results) => {
        setAsyncOptions(results)
        setIsLoading(false)
      }).catch((err) => {
        console.error('SearchableSelect: Error loading initial options', err)
        setAsyncOptions([])
        setIsLoading(false)
      })
    }

    bottomSheetRef.current?.present()
  }, [disabled, loadOptions, asyncOptions.length])

  // Seçim
  const handleSelect = useCallback(
    (option: SelectOption<T>) => {
      onSelect?.(option)
      bottomSheetRef.current?.dismiss()
    },
    [onSelect]
  )

  // Temizle
  const handleClear = useCallback(() => {
    onClear?.()
  }, [onClear])

  // Dismiss
  const handleDismiss = useCallback(() => {
    setSearchQuery('')
  }, [])

  // Görüntülenen değer
  const displayText = useMemo(() => {
    if (displayValue) return displayValue
    if (selectedOption) return selectedOption.label
    return ''
  }, [displayValue, selectedOption])

  // Seçili değer
  const selectedValue = useMemo(() => {
    if (selectedOption) return selectedOption.value
    return value
  }, [selectedOption, value])

  // Option render
  const renderItem = useCallback(
    ({ item }: { item: SelectOption<T> }) => {
      const isSelected = item.value === selectedValue

      return (
        <TouchableOpacity
          style={[
            styles.optionItem,
            isSelected && styles.optionItemSelected
          ]}
          onPress={() => handleSelect(item)}
          activeOpacity={0.7}
        >
          <View style={styles.optionContent}>
            {renderOption ? (
              renderOption(item)
            ) : (
              <View style={styles.optionTextContainer}>
                <Text
                  style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
                {item.subtitle && (
                  <Text style={styles.optionSubtitle} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                )}
              </View>
            )}
            {isSelected && (
              <Ionicons name="checkmark-circle" size={20} color={DashboardColors.primary} />
            )}
          </View>
        </TouchableOpacity>
      )
    },
    [selectedValue, handleSelect, renderOption]
  )

  // Empty render
  const renderEmpty = useCallback(() => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={DashboardColors.primary} />
          <Text style={styles.emptyText}>Yükleniyor...</Text>
        </View>
      )
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search" size={40} color={DashboardColors.textMuted} />
        <Text style={styles.emptyTitle}>{emptyMessage}</Text>
        {searchQuery.trim() && (
          <Text style={styles.emptySubtext}>
            &ldquo;{searchQuery}&rdquo; için sonuç bulunamadı
          </Text>
        )}
      </View>
    )
  }, [isLoading, searchQuery, emptyMessage])

  // Header render
  const renderHeader = useCallback(
    () => (
      <View style={styles.headerContainer}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <View style={styles.modalHeaderLeft}>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <View style={styles.resultBadge}>
              {(isLoading || isSearching) ? (
                <ActivityIndicator size="small" color={DashboardColors.primary} />
              ) : (
                <Ionicons name="list" size={14} color={DashboardColors.primary} />
              )}
              <Text style={styles.modalSubtitle}>
                {isLoading ? 'Yükleniyor...' : isSearching ? 'Aranıyor...' : `${filteredOptions.length} sonuç`}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => bottomSheetRef.current?.dismiss()}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={28} color={DashboardColors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={DashboardColors.primary} />
          <BottomSheetTextInput
            style={styles.searchInput}
            placeholder={searchPlaceholder}
            placeholderTextColor={DashboardColors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus={true}
            returnKeyType="search"
          />
          {isSearching && (
            <View style={styles.typingIndicator}>
              <ActivityIndicator size="small" color={DashboardColors.primary} />
            </View>
          )}
          {searchQuery.length > 0 && !isSearching && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={20} color={DashboardColors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    ),
    [modalTitle, filteredOptions.length, searchQuery, searchPlaceholder, isLoading, isSearching]
  )

  return (
    <>
      {/* Field */}
      <View style={styles.fieldContainer}>
        {label && (
          <Text style={styles.label}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        )}

        <TouchableOpacity
          style={[
            styles.selectButton,
            disabled && styles.selectButtonDisabled,
            error && styles.selectButtonError
          ]}
          onPress={handleOpen}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.selectButtonText,
              !displayText && styles.selectButtonPlaceholder
            ]}
            numberOfLines={1}
          >
            {displayText || placeholder}
          </Text>

          <View style={styles.selectButtonIcons}>
            {displayText && onClear && (
              <TouchableOpacity
                onPress={handleClear}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={18} color={DashboardColors.textMuted} />
              </TouchableOpacity>
            )}
            <Ionicons
              name="chevron-down"
              size={20}
              color={DashboardColors.textMuted}
            />
          </View>
        </TouchableOpacity>

        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>

      {/* Modal */}
      <BottomSheetModal
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        enableDynamicSizing={false}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.modalBackground}
        handleIndicatorStyle={styles.handleIndicator}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        onDismiss={handleDismiss}
        style={styles.modalContainer}
      >
        <View style={[styles.listWrapper, isSearching && styles.listWrapperStale]}>
          <BottomSheetFlatList
            data={filteredOptions}
            renderItem={renderItem}
            keyExtractor={(item: SelectOption<T>) => String(item.value)}
            ListHeaderComponent={renderHeader}
            stickyHeaderIndices={[0]}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmpty}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      </BottomSheetModal>
    </>
  )
}

const styles = StyleSheet.create({
  // Field
  fieldContainer: {
    gap: DashboardSpacing.xs
  },
  label: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: DashboardColors.text,
    marginBottom: DashboardSpacing.xs
  },
  required: {
    color: DashboardColors.danger
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: DashboardColors.background,
    borderRadius: DashboardBorderRadius.lg,
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.md,
    borderWidth: 1,
    borderColor: DashboardColors.border,
    minHeight: 48
  },
  selectButtonDisabled: {
    opacity: 0.5,
    backgroundColor: DashboardColors.borderLight
  },
  selectButtonError: {
    borderColor: DashboardColors.danger
  },
  selectButtonText: {
    flex: 1,
    fontSize: DashboardFontSizes.md,
    color: DashboardColors.text
  },
  selectButtonPlaceholder: {
    color: DashboardColors.textMuted
  },
  selectButtonIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm
  },
  clearButton: {
    padding: DashboardSpacing.xs,
    marginRight: DashboardSpacing.xs
  },
  errorText: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.danger,
    marginTop: DashboardSpacing.xs,
    fontWeight: '500'
  },

  // Modal
  modalContainer: {
    zIndex: 9999,
    elevation: 24
  },
  modalBackground: {
    backgroundColor: DashboardColors.surface,
    borderTopLeftRadius: DashboardBorderRadius['2xl'],
    borderTopRightRadius: DashboardBorderRadius['2xl'],
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 24
  },
  handleIndicator: {
    backgroundColor: DashboardColors.border,
    width: 40,
    height: 4,
    borderRadius: 2,
    opacity: 0.8
  },
  headerContainer: {
    backgroundColor: DashboardColors.surface,
    paddingBottom: DashboardSpacing.sm
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: DashboardSpacing.md,
    paddingBottom: DashboardSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.border,
    backgroundColor: DashboardColors.surface
  },
  modalHeaderLeft: {
    flex: 1
  },
  modalTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.xs
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.xs,
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: DashboardSpacing.xs - 2,
    borderRadius: DashboardBorderRadius.md,
    backgroundColor: `${DashboardColors.primary}10`,
    alignSelf: 'flex-start'
  },
  modalSubtitle: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.primary,
    fontWeight: '500'
  },
  closeButton: {
    padding: DashboardSpacing.xs
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    paddingHorizontal: DashboardSpacing.md + 2,
    paddingVertical: DashboardSpacing.md,
    marginHorizontal: DashboardSpacing.lg,
    marginTop: DashboardSpacing.md,
    marginBottom: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
    borderWidth: 2,
    borderColor: DashboardColors.primary,
    backgroundColor: DashboardColors.surface,
    shadowColor: DashboardColors.primary,
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  searchInput: {
    flex: 1,
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textPrimary,
    paddingVertical: DashboardSpacing.xs + 2,
    fontWeight: '500'
  },
  typingIndicator: {
    marginRight: DashboardSpacing.xs
  },

  // List
  listWrapper: {
    flex: 1,
    opacity: 1,
    transition: 'opacity 0.2s ease'
  },
  listWrapperStale: {
    opacity: 0.6
  },
  listContent: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: DashboardSpacing.xs,
    paddingBottom: DashboardSpacing['3xl']
  },
  optionItem: {
    marginBottom: DashboardSpacing.xs,
    borderRadius: DashboardBorderRadius.md,
    backgroundColor: DashboardColors.background
  },
  optionItemSelected: {
    backgroundColor: `${DashboardColors.primary}10`
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: DashboardSpacing.md
  },
  optionTextContainer: {
    flex: 1,
    marginRight: DashboardSpacing.md
  },
  optionLabel: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '500',
    color: DashboardColors.textPrimary,
    marginBottom: 2
  },
  optionLabelSelected: {
    color: DashboardColors.primary
  },
  optionSubtitle: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textMuted
  },

  // Empty
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DashboardSpacing['4xl'],
    paddingHorizontal: DashboardSpacing.lg
  },
  emptyTitle: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '500',
    color: DashboardColors.textPrimary,
    marginTop: DashboardSpacing.md,
    textAlign: 'center'
  },
  emptyText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textMuted,
    marginTop: DashboardSpacing.md,
    textAlign: 'center'
  },
  emptySubtext: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textMuted,
    marginTop: DashboardSpacing.xs,
    textAlign: 'center'
  }
})

export default SearchableSelect
