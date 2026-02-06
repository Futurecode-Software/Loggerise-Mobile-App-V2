/**
 * LoadFormNavigation - Sabit Alt Navigasyon Butonları
 *
 * 6 adımlı wizard için İleri/Geri/Kaydet butonları - ekranın altında sabit
 */

import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius
} from '@/constants/dashboard-theme'

interface LoadFormNavigationProps {
  currentStep: number
  totalSteps: number
  onPrevious: () => void
  onNext: () => void
  onSubmit: () => void
  isSubmitting: boolean
  submitButtonText?: string
  bottomInset?: number
}

export default function LoadFormNavigation({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onSubmit,
  isSubmitting,
  submitButtonText = 'Kaydet',
  bottomInset = 0,
}: LoadFormNavigationProps) {
  const isFirstStep = currentStep === 1
  const isLastStep = currentStep === totalSteps

  return (
    <View style={[styles.container, { paddingBottom: Math.max(bottomInset, DashboardSpacing.md) }]}>
      {/* Previous Button */}
      {!isFirstStep && (
        <TouchableOpacity
          style={styles.previousButton}
          onPress={onPrevious}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color={DashboardColors.text} />
          <Text style={styles.previousButtonText}>Geri</Text>
        </TouchableOpacity>
      )}

      {/* Next/Submit Button */}
      <TouchableOpacity
        style={[
          styles.nextButton,
          isFirstStep && styles.fullWidthButton,
          isSubmitting && styles.nextButtonDisabled,
        ]}
        onPress={isLastStep ? onSubmit : onNext}
        disabled={isSubmitting}
        activeOpacity={0.7}
      >
        {isSubmitting ? (
          <>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.nextButtonText}>Kaydediliyor...</Text>
          </>
        ) : (
          <>
            <Text style={styles.nextButtonText}>
              {isLastStep ? submitButtonText : 'İleri'}
            </Text>
            {isLastStep ? (
              <Ionicons name="save-outline" size={20} color="#FFFFFF" />
            ) : (
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
            )}
          </>
        )}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: DashboardSpacing.md,
    gap: DashboardSpacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  previousButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DashboardSpacing.xs,
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: 'transparent',
  },
  previousButtonText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.text,
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DashboardSpacing.xs,
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
    backgroundColor: DashboardColors.primary,
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  fullWidthButton: {
    flex: 1,
  },
  nextButtonText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: '#FFFFFF',
  },
})
