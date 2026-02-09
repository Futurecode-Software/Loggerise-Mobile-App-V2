import React, { useState } from 'react'
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextInputProps,
} from 'react-native'
import { Eye, EyeOff } from 'lucide-react-native'
import {
  DashboardColors,
  DashboardFontSizes,
  DashboardBorderRadius,
  DashboardSpacing,
} from '@/constants/dashboard-theme'

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  containerStyle?: ViewStyle
  inputStyle?: ViewStyle
  style?: ViewStyle
  isPassword?: boolean
  required?: boolean
  type?: string
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  style,
  isPassword = false,
  type,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const getBorderColor = () => {
    if (error) return DashboardColors.danger
    if (isFocused) return DashboardColors.primary
    return DashboardColors.borderLight
  }

  return (
    <View style={[styles.container, containerStyle, style]}>
      {label && (
        <Text style={styles.label}>
          {label}
          {props.required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            borderColor: getBorderColor(),
          },
          isFocused && styles.focused,
          error && styles.error,
          inputStyle,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          {...props}
          secureTextEntry={isPassword && !showPassword}
          style={[
            styles.input,
            leftIcon ? styles.inputWithLeftIcon : undefined,
            (rightIcon || isPassword) ? styles.inputWithRightIcon : undefined,
          ]}
          placeholderTextColor={DashboardColors.textMuted}
          onFocus={(e) => {
            setIsFocused(true)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setIsFocused(false)
            props.onBlur?.(e)
          }}
        />
        {isPassword && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff size={20} color={DashboardColors.textMuted} />
            ) : (
              <Eye size={20} color={DashboardColors.textMuted} />
            )}
          </TouchableOpacity>
        )}
        {rightIcon && !isPassword && (
          <View style={styles.rightIcon}>{rightIcon}</View>
        )}
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
  error: {
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textPrimary,
    paddingHorizontal: DashboardSpacing.lg,
    paddingVertical: DashboardSpacing.md,
  },
  inputWithLeftIcon: {
    paddingLeft: DashboardSpacing.xs,
  },
  inputWithRightIcon: {
    paddingRight: DashboardSpacing.xs,
  },
  leftIcon: {
    paddingLeft: DashboardSpacing.lg,
    paddingTop: DashboardSpacing.md,
  },
  rightIcon: {
    paddingRight: DashboardSpacing.lg,
    paddingTop: DashboardSpacing.md,
  },
  errorText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.danger,
    marginTop: DashboardSpacing.xs,
  },
})
