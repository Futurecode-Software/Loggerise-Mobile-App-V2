/**
 * Load Form Stepper
 *
 * 6-adımlı wizard ilerleme göstergesi - QuoteFormStepper ile aynı pattern
 */

import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { DashboardColors, DashboardSpacing } from '@/constants/dashboard-theme'

interface LoadFormStepperProps {
  currentStep: number
  totalSteps?: number
  onStepPress?: (step: number) => void
  completedSteps?: number[]
}

const STEP_LABELS = [
  'Temel Bilgiler',
  'Yük Kalemleri',
  'Adresler',
  'Fiyatlandırma',
  'Beyanname',
  'Gümrük',
]

export function LoadFormStepper({
  currentStep,
  totalSteps = 6,
  onStepPress,
  completedSteps = [],
}: LoadFormStepperProps) {
  const renderStep = (stepNumber: number) => {
    const isActive = stepNumber === currentStep
    const isCompleted = completedSteps.includes(stepNumber)
    const isPast = stepNumber < currentStep
    const isClickable = onStepPress && (isCompleted || isPast)

    const stepContent = (
      <View style={styles.stepContainer}>
        {/* Step Circle */}
        <View
          style={[
            styles.stepCircle,
            isActive && styles.stepCircleActive,
            isCompleted && styles.stepCircleCompleted,
            isPast && !isCompleted && styles.stepCirclePast,
          ]}
        >
          {isCompleted ? (
            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
          ) : (
            <Text
              style={[
                styles.stepNumber,
                isActive && styles.stepNumberActive,
                isPast && styles.stepNumberPast,
              ]}
            >
              {stepNumber}
            </Text>
          )}
        </View>

        {/* Step Label */}
        <Text
          style={[
            styles.stepLabel,
            isActive && styles.stepLabelActive,
            (isCompleted || isPast) && styles.stepLabelCompleted,
          ]}
          numberOfLines={2}
        >
          {STEP_LABELS[stepNumber - 1]}
        </Text>

        {/* Connector Line */}
        {stepNumber < totalSteps && (
          <View
            style={[
              styles.stepConnector,
              (isCompleted || isPast) && styles.stepConnectorCompleted,
            ]}
          />
        )}
      </View>
    )

    if (isClickable) {
      return (
        <TouchableOpacity
          key={stepNumber}
          onPress={() => onStepPress?.(stepNumber)}
          activeOpacity={0.7}
          style={styles.stepTouchable}
        >
          {stepContent}
        </TouchableOpacity>
      )
    }

    return <View key={stepNumber} style={styles.stepTouchable}>{stepContent}</View>
  }

  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map(renderStep)}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 0,
    paddingBottom: DashboardSpacing.md,
    paddingHorizontal: DashboardSpacing.xs,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.border,
  },
  stepTouchable: {
    flex: 1,
  },
  stepContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.xs,
  },
  stepCircleActive: {
    backgroundColor: DashboardColors.primary,
    borderColor: DashboardColors.primary,
  },
  stepCircleCompleted: {
    backgroundColor: DashboardColors.primaryLight,
    borderColor: DashboardColors.primaryLight,
  },
  stepCirclePast: {
    backgroundColor: '#E5E7EB',
    borderColor: '#9CA3AF',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepNumberPast: {
    color: '#6B7280',
  },
  stepLabel: {
    fontSize: 9,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: DashboardSpacing.xs / 2,
  },
  stepLabelActive: {
    color: DashboardColors.primary,
    fontWeight: '600',
  },
  stepLabelCompleted: {
    color: '#6B7280',
  },
  stepConnector: {
    position: 'absolute',
    top: 14,
    left: '55%',
    right: '-55%',
    height: 2,
    backgroundColor: '#E5E7EB',
    zIndex: -1,
  },
  stepConnectorCompleted: {
    backgroundColor: DashboardColors.primaryLight,
  },
})
