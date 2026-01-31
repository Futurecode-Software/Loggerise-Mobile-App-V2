import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { DashboardSpacing, DashboardFontSizes } from '@/constants/dashboard-theme'

interface ProgressBarProps {
  currentStep: number
  totalSteps: number
  onStepPress?: (step: number) => void
}

export function ProgressBar({ currentStep, totalSteps, onStepPress }: ProgressBarProps) {
  return (
    <View style={styles.progressBar}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View key={index} style={styles.progressStepContainer}>
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync()
              onStepPress?.(index)
            }}
            style={[
              styles.progressStep,
              index < currentStep && styles.progressStepCompleted,
              index === currentStep && styles.progressStepActive
            ]}
          >
            {index < currentStep ? (
              <Ionicons name="checkmark" size={12} color="#fff" />
            ) : (
              <Text style={[
                styles.progressStepText,
                (index === currentStep || index < currentStep) && styles.progressStepTextActive
              ]}>
                {index + 1}
              </Text>
            )}
          </TouchableOpacity>
          {index < totalSteps - 1 && (
            <View style={[
              styles.progressLine,
              index < currentStep && styles.progressLineCompleted
            ]} />
          )}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: DashboardSpacing.lg
  },
  progressStepContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  progressStep: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent'
  },
  progressStepActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: '#fff'
  },
  progressStepCompleted: {
    backgroundColor: '#10b981',
    borderColor: '#10b981'
  },
  progressStepText: {
    fontSize: DashboardFontSizes.sm,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600'
  },
  progressStepTextActive: {
    color: '#fff'
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 4
  },
  progressLineCompleted: {
    backgroundColor: '#10b981'
  }
})
