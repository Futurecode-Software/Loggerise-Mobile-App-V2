/**
 * LoadFormProgress - Form İlerleme Göstergesi
 *
 * 6 adımlı wizard için kompakt ilerleme göstergesi
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Check } from 'lucide-react-native';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';

interface Step {
  id: number;
  title: string;
  description: string;
}

interface LoadFormProgressProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (stepId: number) => void;
}

export default function LoadFormProgress({ steps, currentStep, onStepClick }: LoadFormProgressProps) {
  const colors = Colors.light;

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;

          return (
            <React.Fragment key={step.id}>
              <TouchableOpacity
                style={styles.stepContainer}
                onPress={() => onStepClick(step.id)}
                activeOpacity={0.7}
              >
                {/* Step Number/Checkmark */}
                <View
                  style={[
                    styles.stepCircle,
                    {
                      backgroundColor: isCompleted || isActive ? Brand.primary : colors.surface,
                      borderColor: isCompleted || isActive ? Brand.primary : colors.border,
                    },
                  ]}
                >
                  {isCompleted ? (
                    <Check size={14} color="#FFFFFF" strokeWidth={3} />
                  ) : (
                    <Text
                      style={[
                        styles.stepNumber,
                        { color: isActive ? '#FFFFFF' : colors.textSecondary },
                      ]}
                    >
                      {step.id}
                    </Text>
                  )}
                </View>

                {/* Step Title */}
                <Text
                  style={[
                    styles.stepTitle,
                    {
                      color: isActive ? Brand.primary : isCompleted ? colors.text : colors.textMuted,
                      fontWeight: isActive ? '600' : '400',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {step.title}
                </Text>
              </TouchableOpacity>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <View
                  style={[
                    styles.connector,
                    {
                      backgroundColor: isCompleted ? Brand.primary : colors.border,
                    },
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderBottomWidth: 1,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  stepContainer: {
    alignItems: 'center',
    minWidth: 56,
    paddingHorizontal: 4,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '600',
  },
  stepTitle: {
    fontSize: 10,
    textAlign: 'center',
  },
  connector: {
    width: 16,
    height: 2,
    marginTop: -12,
  },
});
