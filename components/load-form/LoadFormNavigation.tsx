import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ChevronLeft, ChevronRight, Save } from 'lucide-react-native';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';

interface LoadFormNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export default function LoadFormNavigation({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onSubmit,
  isSubmitting,
}: LoadFormNavigationProps) {
  const colors = Colors.light;
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
      {/* Previous Button */}
      {!isFirstStep && (
        <TouchableOpacity
          style={[styles.button, styles.previousButton, { borderColor: colors.border }]}
          onPress={onPrevious}
          activeOpacity={0.7}
        >
          <ChevronLeft size={20} color={colors.text} />
          <Text style={[styles.buttonText, { color: colors.text }]}>Geri</Text>
        </TouchableOpacity>
      )}

      {/* Next/Submit Button */}
      <TouchableOpacity
        style={[
          styles.button,
          styles.nextButton,
          { backgroundColor: Brand.primary },
          isFirstStep && styles.fullWidthButton,
        ]}
        onPress={isLastStep ? onSubmit : onNext}
        disabled={isSubmitting}
        activeOpacity={0.7}
      >
        {isSubmitting ? (
          <>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={[styles.buttonText, styles.buttonTextWhite]}>Kaydediliyor...</Text>
          </>
        ) : (
          <>
            <Text style={[styles.buttonText, styles.buttonTextWhite]}>
              {isLastStep ? 'Kaydet' : 'İleri'}
            </Text>
            {isLastStep ? (
              <Save size={20} color="#FFFFFF" />
            ) : (
              <ChevronRight size={20} color="#FFFFFF" />
            )}
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  fullWidthButton: {
    flex: 1,
  },
  previousButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  nextButton: {
    // backgroundColor set in component
  },
  buttonText: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  buttonTextWhite: {
    color: '#FFFFFF',
  },
});
