/**
 * Domestic Form Stepper
 *
 * 3-adımlı wizard ilerleme göstergesi - LoadFormStepper ile aynı pattern
 */

import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Check } from 'lucide-react-native'
import { Brand, Spacing } from '@/constants/theme'

interface DomesticFormStepperProps {
  currentStep: number
  totalSteps?: number
  onStepPress?: (step: number) => void
  completedSteps?: number[]
}

const STEP_LABELS = [
  'Genel',
  'Adresler',
  'Kalemler',
]

export function DomesticFormStepper({
  currentStep,
  totalSteps = 3,
  onStepPress,
  completedSteps = [],
}: DomesticFormStepperProps) {
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
            <Check size={16} color="#FFFFFF" strokeWidth={3} />
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
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  stepTouchable: {
    flex: 1,
  },
  stepContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  stepCircleActive: {
    backgroundColor: Brand.primary,
    borderColor: Brand.primary,
  },
  stepCircleCompleted: {
    backgroundColor: Brand.primaryLight,
    borderColor: Brand.primaryLight,
  },
  stepCirclePast: {
    backgroundColor: '#E5E7EB',
    borderColor: '#9CA3AF',
  },
  stepNumber: {
    fontSize: 14,
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
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: Spacing.xs / 2,
  },
  stepLabelActive: {
    color: Brand.primary,
    fontWeight: '600',
  },
  stepLabelCompleted: {
    color: '#6B7280',
  },
  stepConnector: {
    position: 'absolute',
    top: 16,
    left: '60%',
    right: '-60%',
    height: 2,
    backgroundColor: '#E5E7EB',
    zIndex: -1,
  },
  stepConnectorCompleted: {
    backgroundColor: Brand.primaryLight,
  },
})
