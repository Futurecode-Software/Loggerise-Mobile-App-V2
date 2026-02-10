/**
 * AddressSelect Component
 *
 * Firma seçildikten sonra o firmanın adreslerini gösteren select component.
 * Web'deki LoadAddressSelect ile aynı mantıkta çalışır.
 * BottomSheetModal kullanır (CLAUDE.md standardı).
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
  useBottomSheetSpringConfigs,
} from '@gorhom/bottom-sheet'
import { MapPin, X, ChevronDown, Check } from 'lucide-react-native'
import {
  DashboardColors,
  DashboardFontSizes,
  DashboardSpacing,
  DashboardBorderRadius,
} from '@/constants/dashboard-theme'
import api from '@/services/api'

export interface AddressOption {
  value: number
  label: string
  title?: string
  address?: string
}

interface AddressSelectProps {
  label?: string
  placeholder?: string
  contactId?: number | null
  value?: number | null
  selectedOption?: AddressOption | null
  onValueChange: (value: number | null) => void
  onSelect?: (option: AddressOption | null) => void
  addressType?: 'pickup' | 'delivery'
  error?: string
  disabled?: boolean
}

export function AddressSelect({
  label,
  placeholder = 'Adres seçiniz...',
  contactId,
  value,
  selectedOption: selectedOptionProp,
  onValueChange,
  onSelect,
  addressType,
  error,
  disabled = false,
}: AddressSelectProps) {
  const bottomSheetRef = useRef<BottomSheetModal>(null)

  const [options, setOptions] = useState<AddressOption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedOption, setSelectedOption] = useState<AddressOption | null>(
    selectedOptionProp || null
  )

  const snapPoints = useMemo(() => ['90%'], [])

  const animationConfigs = useBottomSheetSpringConfigs({
    damping: 80,
    overshootClamping: true,
    stiffness: 500,
  })

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

  // Load addresses when contactId changes
  const loadAddresses = useCallback(async () => {
    if (!contactId) {
      setOptions([])
      setSelectedOption(null)
      return
    }

    setIsLoading(true)
    try {
      const response = await api.get(`/contacts/${contactId}/addresses`, {
        params: addressType ? { address_type: addressType } : {},
      })

      const addresses = response.data.data || []
      const mappedAddresses: AddressOption[] = addresses.map((addr: any) => ({
        value: addr.id,
        label: addr.title || addr.address,
        title: addr.title,
        address: addr.address,
      }))

      setOptions(mappedAddresses)

      // If there's a value prop, try to find and set the selected option
      if (value) {
        const selected = mappedAddresses.find((opt) => opt.value === value)
        if (selected) {
          setSelectedOption(selected)
        }
      }
    } catch (err) {
      if (__DEV__) console.error('Error loading addresses:', err)
      setOptions([])
    } finally {
      setIsLoading(false)
    }
  }, [contactId, addressType, value])

  useEffect(() => {
    if (contactId) {
      loadAddresses()
    } else {
      setOptions([])
      setSelectedOption(null)
    }
  }, [contactId])

  // Handle modal open
  const handleOpen = useCallback(() => {
    if (disabled || !contactId) return
    bottomSheetRef.current?.present()
  }, [disabled, contactId])

  // Handle modal dismiss
  const handleDismiss = useCallback(() => {
    // no-op
  }, [])

  // Handle option selection
  const handleSelect = useCallback(
    (option: AddressOption) => {
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

  const isDisabled = disabled || !contactId

  // Render option item
  const renderOptionItem = useCallback(
    ({ item }: { item: AddressOption }) => {
      const isSelected = selectedOption?.value === item.value

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
            <MapPin size={16} color={DashboardColors.textMuted} style={styles.optionIcon} />
            <View style={styles.optionTextContainer}>
              <Text
                style={[
                  styles.optionTitle,
                  isSelected && { fontWeight: '600' },
                ]}
                numberOfLines={1}
              >
                {item.title || item.label}
              </Text>
              {item.address && (
                <Text style={styles.optionAddress} numberOfLines={2}>
                  {item.address}
                </Text>
              )}
            </View>
          </View>
          {isSelected && <Check size={20} color={DashboardColors.primary} />}
        </TouchableOpacity>
      )
    },
    [selectedOption, handleSelect]
  )

  // Render empty state
  const renderEmpty = useCallback(() => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={DashboardColors.primary} />
          <Text style={styles.emptyText}>Adresler yükleniyor...</Text>
        </View>
      )
    }

    return (
      <View style={styles.emptyContainer}>
        <MapPin size={48} color={DashboardColors.borderLight} />
        <Text style={styles.emptyTitle}>Adres bulunamadı</Text>
        <Text style={styles.emptyText}>
          Bu firmaya ait adres bulunamadı
        </Text>
      </View>
    )
  }, [isLoading])

  // Render header
  const renderHeader = useCallback(() => {
    return (
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Adres Seçin</Text>
          <Text style={styles.subtitle}>
            {options.length > 0
              ? `${options.length} adres bulundu`
              : 'Firmanın kayıtlı adreslerinden birini seçin'}
          </Text>
        </View>
      </View>
    )
  }, [options.length])

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}

      {/* Select Button */}
      <TouchableOpacity
        style={[
          styles.selectButton,
          error && styles.selectButtonError,
          isDisabled && { opacity: 0.5 },
        ]}
        onPress={handleOpen}
        disabled={isDisabled}
        activeOpacity={0.7}
      >
        <View style={styles.selectContent}>
          {selectedOption ? (
            <>
              <MapPin size={16} color={DashboardColors.primary} />
              <View style={styles.selectedTextContainer}>
                <Text style={styles.selectedText} numberOfLines={1}>
                  {selectedOption.title || selectedOption.label}
                </Text>
              </View>
              {!isDisabled && (
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
                {!contactId ? 'Önce firma seçiniz' : placeholder}
              </Text>
              <ChevronDown size={20} color={DashboardColors.textMuted} />
            </>
          )}
        </View>
      </TouchableOpacity>

      {/* Error message */}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Address Selection BottomSheetModal */}
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
      >
        {renderHeader()}
        <BottomSheetFlatList
          data={options}
          keyExtractor={(item: AddressOption) => item.value.toString()}
          renderItem={renderOptionItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      </BottomSheetModal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: DashboardSpacing.xs,
  },
  label: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: DashboardColors.textSecondary,
    marginBottom: DashboardSpacing.xs,
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
    gap: DashboardSpacing.sm,
  },
  selectedTextContainer: {
    flex: 1,
  },
  selectedText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '500',
    color: DashboardColors.textPrimary,
  },
  placeholder: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textMuted,
    flex: 1,
  },
  clearButton: {
    padding: DashboardSpacing.xs,
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
  listContent: {
    paddingBottom: DashboardSpacing['2xl'],
  },

  // Option styles
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: DashboardSpacing.sm,
    marginRight: DashboardSpacing.sm,
  },
  optionIcon: {
    marginTop: 2,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '500',
    color: DashboardColors.textPrimary,
  },
  optionAddress: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textMuted,
    marginTop: DashboardSpacing.xs,
  },

  // Empty state
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
