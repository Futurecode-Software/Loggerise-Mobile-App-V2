/**
 * Toggle Component
 *
 * Reusable toggle switch for boolean values.
 * Used across all CRUD forms for active/inactive states.
 */

import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius
} from '@/constants/dashboard-theme'

interface ToggleProps {
  label: string
  description?: string
  value: boolean
  onValueChange: (value: boolean) => void
  disabled?: boolean
}

export function Toggle({
  label,
  description,
  value,
  onValueChange,
  disabled = false
}: ToggleProps) {
  return (
    <TouchableOpacity
      style={[styles.toggleRow, disabled && styles.toggleRowDisabled]}
      onPress={() => !disabled && onValueChange(!value)}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <View style={styles.toggleContent}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {description && (
          <Text style={styles.toggleDescription}>{description}</Text>
        )}
      </View>
      <View style={[
        styles.toggleSwitch,
        value && styles.toggleSwitchActive,
        disabled && styles.toggleSwitchDisabled
      ]}>
        <View style={[
          styles.toggleKnob,
          value && styles.toggleKnobActive
        ]} />
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: DashboardSpacing.md,
    paddingHorizontal: DashboardSpacing.lg,
    backgroundColor: DashboardColors.background,
    borderRadius: DashboardBorderRadius.lg
  },
  toggleRowDisabled: {
    opacity: 0.5
  },
  toggleContent: {
    flex: 1,
    marginRight: DashboardSpacing.md
  },
  toggleLabel: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '500',
    color: DashboardColors.textPrimary
  },
  toggleDescription: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    marginTop: 2
  },
  toggleSwitch: {
    width: 52,
    height: 32,
    borderRadius: 16,
    backgroundColor: DashboardColors.borderLight,
    padding: 2,
    justifyContent: 'center'
  },
  toggleSwitchActive: {
    backgroundColor: DashboardColors.primary
  },
  toggleSwitchDisabled: {
    opacity: 0.5
  },
  toggleKnob: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff'
  },
  toggleKnobActive: {
    alignSelf: 'flex-end'
  }
})
