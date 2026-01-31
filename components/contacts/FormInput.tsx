import { View, Text, TextInput, StyleSheet, type TextInputProps } from 'react-native'
import { DashboardColors, DashboardSpacing, DashboardFontSizes, DashboardBorderRadius } from '@/constants/dashboard-theme'

interface FormInputProps extends TextInputProps {
  label: string
  error?: string
  required?: boolean
}

export function FormInput({ label, error, required, ...props }: FormInputProps) {
  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        {required && <Text style={styles.required}>*</Text>}
      </View>
      <TextInput
        style={[
          styles.input,
          error && styles.inputError
        ]}
        placeholderTextColor={DashboardColors.textMuted}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: DashboardSpacing.xs
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  label: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: DashboardColors.text
  },
  required: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.danger
  },
  input: {
    backgroundColor: DashboardColors.background,
    borderWidth: 1,
    borderColor: DashboardColors.border,
    borderRadius: DashboardBorderRadius.lg,
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.md,
    fontSize: DashboardFontSizes.md,
    color: DashboardColors.text,
    minHeight: 48
  },
  inputError: {
    borderColor: DashboardColors.danger
  },
  errorText: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.danger,
    marginTop: 4
  }
})
