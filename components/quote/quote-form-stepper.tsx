/**
 * Quote Form Stepper
 *
 * 5-step progress indicator for quote creation
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import { Brand, Colors, Typography, Spacing } from '@/constants/theme';

interface QuoteFormStepperProps {
  currentStep: number; // 1-5
  totalSteps?: number; // default: 5
  onStepPress?: (step: number) => void; // Tıklanabilir stepler (validasyon başarılıysa)
  completedSteps?: number[]; // Tamamlanmış step'ler (yeşil tick)
}

const STEP_LABELS = [
  'Temel Bilgiler',
  'Yük Kalemleri',
  'Adresler',
  'Fiyatlandırma',
  'Önizleme',
];

export function QuoteFormStepper({
  currentStep,
  totalSteps = 5,
  onStepPress,
  completedSteps = [],
}: QuoteFormStepperProps) {
  const colors = Colors.light;

  const renderStep = (stepNumber: number) => {
    const isActive = stepNumber === currentStep;
    const isCompleted = completedSteps.includes(stepNumber);
    const isPast = stepNumber < currentStep;
    const isClickable = onStepPress && (isCompleted || isPast);

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
    );

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
      );
    }

    return <View key={stepNumber} style={styles.stepTouchable}>{stepContent}</View>;
  };

  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map(renderStep)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    backgroundColor: '#FFFFFF',
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
    fontSize: 10,
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
});
