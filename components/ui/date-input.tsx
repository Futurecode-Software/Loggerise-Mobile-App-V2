import React, { useState, useRef, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetView,
} from '@gorhom/bottom-sheet'
import { Calendar } from 'lucide-react-native'
import {
  DashboardColors,
  DashboardFontSizes,
  DashboardBorderRadius,
  DashboardSpacing,
} from '@/constants/dashboard-theme'

interface DateInputProps {
  label?: string
  value: string // YYYY-MM-DD format
  onChangeDate?: (date: string) => void
  onChangeText?: (date: string) => void // Backward compatibility
  error?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  minimumDate?: string // YYYY-MM-DD format
  maximumDate?: string // YYYY-MM-DD format
}

export function DateInput({
  label,
  value,
  onChangeDate,
  onChangeText,
  error,
  placeholder = 'Tarih seçiniz',
  disabled = false,
  required = false,
  minimumDate,
  maximumDate,
}: DateInputProps) {
  const bottomSheetRef = useRef<BottomSheetModal>(null)
  const [tempDate, setTempDate] = useState<Date>(
    value ? new Date(value) : new Date()
  )
  // Android için ayrı show state
  const [showAndroid, setShowAndroid] = useState(false)

  const snapPoints = useMemo(() => ['42%'], [])

  // Tarihi callback ile gönder
  const emitDate = (date: Date) => {
    const formattedDate = date.toISOString().split('T')[0]
    if (onChangeDate) {
      onChangeDate(formattedDate)
    } else if (onChangeText) {
      onChangeText(formattedDate)
    }
  }

  // Backdrop
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

  // iOS: spinner değiştiğinde sadece tempDate güncelle
  const onIOSChange = (_event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setTempDate(selectedDate)
    }
  }

  // Android: native dialog onChange
  const onAndroidChange = (_event: any, selectedDate?: Date) => {
    setShowAndroid(false)
    if (_event.type === 'dismissed') return
    if (selectedDate) {
      setTempDate(selectedDate)
      emitDate(selectedDate)
    }
  }

  // iOS: Tamam
  const handleConfirm = () => {
    emitDate(tempDate)
    bottomSheetRef.current?.dismiss()
  }

  // iOS: İptal
  const handleCancel = () => {
    setTempDate(value ? new Date(value) : new Date())
    bottomSheetRef.current?.dismiss()
  }

  // Picker'ı aç
  const showDatepicker = () => {
    if (disabled) return

    // tempDate'i senkronize et
    const initialDate = value ? new Date(value) : new Date()
    setTempDate(initialDate)

    if (Platform.OS === 'ios') {
      bottomSheetRef.current?.present()
    } else {
      setShowAndroid(true)
    }
  }

  // Format display value
  const displayValue = value ? formatDateForDisplay(value) : ''

  // Parse min/max dates
  const minDate = minimumDate ? new Date(minimumDate) : new Date(1900, 0, 1)
  const maxDate = maximumDate ? new Date(maximumDate) : new Date(2100, 11, 31)

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
          styles.inputContainer,
          error && styles.inputContainerError,
          disabled && styles.disabled,
        ]}
        onPress={showDatepicker}
        disabled={disabled}
      >
        <Text
          style={[
            styles.inputText,
            !displayValue && styles.inputTextPlaceholder,
          ]}
        >
          {displayValue || placeholder}
        </Text>
        <Calendar
          size={20}
          color={disabled ? DashboardColors.textMuted : DashboardColors.primary}
        />
      </TouchableOpacity>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {/* iOS: BottomSheetModal */}
      {Platform.OS === 'ios' && (
        <BottomSheetModal
          ref={bottomSheetRef}
          snapPoints={snapPoints}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={styles.sheetBackground}
          handleIndicatorStyle={styles.handleIndicator}
        >
          <BottomSheetView style={styles.sheetContent}>
            <View style={styles.toolbar}>
              <TouchableOpacity onPress={handleCancel} style={styles.toolbarButton}>
                <Text style={styles.toolbarCancel}>İptal</Text>
              </TouchableOpacity>
              <Text style={styles.toolbarTitle}>
                {label || 'Tarih Seçiniz'}
              </Text>
              <TouchableOpacity onPress={handleConfirm} style={styles.toolbarButton}>
                <Text style={styles.toolbarDone}>Tamam</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              onChange={onIOSChange}
              maximumDate={maxDate}
              minimumDate={minDate}
              themeVariant="light"
              locale="tr"
              style={styles.iosPicker}
            />
          </BottomSheetView>
        </BottomSheetModal>
      )}

      {/* Android: native dialog */}
      {showAndroid && Platform.OS === 'android' && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          onChange={onAndroidChange}
          maximumDate={maxDate}
          minimumDate={minDate}
          locale="tr"
        />
      )}
    </View>
  )
}

// Format date for display (DD/MM/YYYY - Turkish format)
function formatDateForDisplay(dateString: string): string {
  if (!dateString) return ''

  try {
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()

    return `${day}/${month}/${year}`
  } catch {
    return dateString
  }
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    borderWidth: 1,
    borderRadius: DashboardBorderRadius.lg,
    borderColor: DashboardColors.borderLight,
    backgroundColor: DashboardColors.surface,
    paddingHorizontal: DashboardSpacing.lg,
  },
  inputContainerError: {
    borderColor: DashboardColors.danger,
  },
  inputText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textPrimary,
    flex: 1,
  },
  inputTextPlaceholder: {
    color: DashboardColors.textMuted,
  },
  errorText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.danger,
    marginTop: DashboardSpacing.xs,
  },
  disabled: {
    opacity: 0.5,
  },
  // BottomSheet styles
  sheetBackground: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: DashboardBorderRadius['2xl'],
    borderTopRightRadius: DashboardBorderRadius['2xl'],
  },
  handleIndicator: {
    backgroundColor: '#D1D5DB',
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  sheetContent: {
    flex: 1,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: DashboardSpacing.lg,
    paddingVertical: DashboardSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight,
  },
  toolbarButton: {
    paddingVertical: DashboardSpacing.xs,
    paddingHorizontal: DashboardSpacing.sm,
  },
  toolbarTitle: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
  },
  toolbarCancel: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textMuted,
    fontWeight: '500',
  },
  toolbarDone: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.primary,
    fontWeight: '600',
  },
  iosPicker: {
    height: 250,
    minHeight: 250,
    maxHeight: 250,
  },
})
