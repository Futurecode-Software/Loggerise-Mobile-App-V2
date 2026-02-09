import React, { useState, useCallback, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
} from 'react-native'
import {
  DashboardColors,
  DashboardFontSizes,
  DashboardBorderRadius,
  DashboardSpacing,
} from '@/constants/dashboard-theme'

interface CurrencyInputProps {
  label?: string
  error?: string
  containerStyle?: ViewStyle
  inputStyle?: ViewStyle
  style?: ViewStyle
  required?: boolean
  value: number | null
  onChangeValue: (value: number | null) => void
  precision?: number
  placeholder?: string
  editable?: boolean
  suffix?: string
}

/**
 * Sayiyi TR formatinda gosterir: 1.234,56
 * Binlik ayirici: nokta, ondalik ayirici: virgul
 */
function formatTR(num: number, precision: number): string {
  const fixed = Math.abs(num).toFixed(precision)
  const [intPart, decPart] = fixed.split('.')
  const withDots = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  if (precision === 0) return num < 0 ? `-${withDots}` : withDots
  const result = `${withDots},${decPart}`
  return num < 0 ? `-${result}` : result
}

/**
 * Kullanicinin girdigi TR formatli metni sayiya cevirir
 * "1.234,56" -> 1234.56, "500" -> 500, "12,5" -> 12.5
 */
function parseTR(text: string): number | null {
  if (!text || text.trim() === '') return null
  // Binlik noktalari kaldir, virgulu noktaya cevir
  const cleaned = text.replace(/\./g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  if (isNaN(num)) return null
  return num
}

export function CurrencyInput({
  label,
  error,
  containerStyle,
  inputStyle,
  style,
  required,
  value,
  onChangeValue,
  precision = 2,
  placeholder = '0',
  editable = true,
  suffix,
}: CurrencyInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  // Focus'tayken kullanicinin yazdigi ham metin
  const [displayText, setDisplayText] = useState('')

  // Dis degerden display text'i guncelle (sadece focus degilken)
  useEffect(() => {
    if (!isFocused) {
      if (value === null || value === undefined || value === 0) {
        setDisplayText('')
      } else {
        setDisplayText(formatTR(value, precision))
      }
    }
  }, [value, precision, isFocused])

  const getBorderColor = () => {
    if (error) return DashboardColors.danger
    if (isFocused) return DashboardColors.primary
    return DashboardColors.borderLight
  }

  const handleFocus = useCallback(() => {
    setIsFocused(true)
    // Focus'a girince formatsiz ham sayiyi goster (virgul ondalik ayirici)
    if (value !== null && value !== undefined && value !== 0) {
      // Sondaki gereksiz sifirlari temizle: 500.00 -> "500", 12.50 -> "12,5"
      const str = value.toString()
      if (str.includes('.')) {
        const trimmed = str.replace(/\.?0+$/, '')
        setDisplayText(trimmed.replace('.', ','))
      } else {
        setDisplayText(str)
      }
    } else {
      setDisplayText('')
    }
  }, [value])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
    const parsed = parseTR(displayText)
    if (parsed !== null) {
      onChangeValue(parsed)
      setDisplayText(formatTR(parsed, precision))
    } else {
      onChangeValue(null)
      setDisplayText('')
    }
  }, [displayText, precision, onChangeValue])

  const handleChangeText = useCallback((text: string) => {
    // Sadece rakamlara, virgule ve noktaya izin ver
    const filtered = text.replace(/[^0-9.,]/g, '')
    setDisplayText(filtered)

    // Her tuslama'da parent'a da bildir (hesaplamalar icin)
    const parsed = parseTR(filtered)
    onChangeValue(parsed)
  }, [onChangeValue])

  const shownText = displayText + (suffix && displayText ? ` ${suffix}` : '')

  return (
    <View style={[styles.container, containerStyle, style]}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          { borderColor: getBorderColor() },
          isFocused && styles.focused,
          error && styles.errorBorder,
          !editable && styles.disabled,
          inputStyle,
        ]}
      >
        <TextInput
          value={isFocused ? displayText : (suffix && displayText ? shownText : displayText)}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={DashboardColors.textMuted}
          keyboardType="decimal-pad"
          editable={editable}
          style={styles.input}
        />
      </View>
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: DashboardBorderRadius.lg,
    minHeight: 48,
    backgroundColor: DashboardColors.surface,
  },
  focused: {
    borderWidth: 2,
  },
  errorBorder: {
    borderWidth: 1,
  },
  disabled: {
    opacity: 0.5,
  },
  input: {
    flex: 1,
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textPrimary,
    paddingHorizontal: DashboardSpacing.lg,
    paddingVertical: DashboardSpacing.md,
  },
  errorText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.danger,
    marginTop: DashboardSpacing.xs,
  },
})
