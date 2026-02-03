/**
 * SelectInput Component
 *
 * BottomSheet modal kullanan select component - SearchableSelectModal tabanlı
 * Yeni faturadaki cari seçimi gibi çalışır
 */

import React, { useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  SearchableSelectModal,
  SearchableSelectModalRef,
  SelectOption
} from '@/components/modals'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius
} from '@/constants/dashboard-theme'

interface Option {
  label: string
  value: string | number
}

interface SelectInputProps {
  label?: string
  options: Option[]
  selectedValue?: string | number | null
  /** Alias for selectedValue - for consistent API */
  value?: string | number | null
  onValueChange: (value: string | number | null) => void
  error?: string
  placeholder?: string
  searchable?: boolean
  disabled?: boolean
  required?: boolean
}

export function SelectInput({
  label,
  options,
  selectedValue,
  value: valueProp,
  onValueChange,
  error,
  placeholder = 'Seçiniz...',
  disabled = false
}: SelectInputProps) {
  const modalRef = useRef<SearchableSelectModalRef>(null)

  // Support both selectedValue and value props
  const currentValue = selectedValue ?? valueProp ?? null

  // Find selected item
  const selectedItem = options.find(opt => opt.value === currentValue)

  // Convert options to SelectOption format
  const selectOptions: SelectOption[] = options.map(opt => ({
    value: opt.value,
    label: opt.label
  }))

  const handleSelect = (option: SelectOption) => {
    onValueChange(option.value)
  }

  const handlePress = () => {
    if (!disabled) {
      modalRef.current?.present()
    }
  }

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
          {/* {required && <Text style={styles.required}> *</Text>} */}
        </Text>
      )}

      <TouchableOpacity
        style={[
          styles.selectButton,
          error && styles.selectButtonError,
          disabled && styles.selectButtonDisabled
        ]}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.selectText,
            !selectedItem && styles.selectTextPlaceholder
          ]}
        >
          {selectedItem ? selectedItem.label : placeholder}
        </Text>
        <Ionicons
          name="chevron-down"
          size={20}
          color={disabled ? DashboardColors.textMuted : DashboardColors.textSecondary}
        />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <SearchableSelectModal
        ref={modalRef}
        title={label || 'Seçiniz'}
        options={selectOptions}
        selectedValue={currentValue}
        onSelect={handleSelect}
        searchPlaceholder="Ara..."
        emptyMessage="Sonuç bulunamadı"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: DashboardSpacing.md
  },
  label: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: DashboardColors.textSecondary,
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
    borderWidth: 1,
    borderColor: DashboardColors.borderLight,
    borderRadius: DashboardBorderRadius.lg,
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.md,
    minHeight: 48
  },
  selectButtonError: {
    borderColor: DashboardColors.danger
  },
  selectButtonDisabled: {
    opacity: 0.6,
    backgroundColor: DashboardColors.surface
  },
  selectText: {
    flex: 1,
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textPrimary
  },
  selectTextPlaceholder: {
    color: DashboardColors.textMuted
  },
  errorText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.danger,
    marginTop: DashboardSpacing.xs
  }
})
