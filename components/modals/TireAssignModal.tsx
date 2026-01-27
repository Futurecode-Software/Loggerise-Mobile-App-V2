import React, { useState, forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import CustomBottomSheet from './CustomBottomSheet';
import { SelectInput } from '@/components/ui/select-input';
import { DateInput } from '@/components/ui/date-input';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';

export interface TireAssignModalRef {
  present: () => void;
  dismiss: () => void;
}

interface TireAssignModalProps {
  vehicles: Array<{ id: number; plate: string }>;
  onAssign: (data: { vehicle_id: number; position: string; assigned_at: string }) => Promise<void>;
  onSearchVehicles?: (query: string) => Promise<void>;
}

// Tire position options
const TIRE_POSITION_OPTIONS = [
  { label: 'Sol Ön', value: 'left_front' },
  { label: 'Sağ Ön', value: 'right_front' },
  { label: 'Sol Arka Dış', value: 'left_rear_outer' },
  { label: 'Sol Arka İç', value: 'left_rear_inner' },
  { label: 'Sağ Arka Dış', value: 'right_rear_outer' },
  { label: 'Sağ Arka İç', value: 'right_rear_inner' },
  { label: 'Yedek', value: 'spare' },
];

const TireAssignModal = forwardRef<TireAssignModalRef, TireAssignModalProps>(
  ({ vehicles, onAssign, onSearchVehicles }, ref) => {
    const colors = Colors.light;
    const bottomSheetRef = useRef<BottomSheetModal>(null);

    const [vehicleId, setVehicleId] = useState<string>('');
    const [position, setPosition] = useState<string>('');
    const [assignedAt, setAssignedAt] = useState<string>(
      new Date().toISOString().split('T')[0]
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Expose present/dismiss methods to parent
    useImperativeHandle(ref, () => ({
      present: () => {
        bottomSheetRef.current?.present();
      },
      dismiss: () => {
        bottomSheetRef.current?.dismiss();
      },
    }));

    const handleDismiss = () => {
      // Reset state when modal is closed
      setTimeout(() => {
        setVehicleId('');
        setPosition('');
        setAssignedAt(new Date().toISOString().split('T')[0]);
      }, 200);
    };

    const handleSubmit = async () => {
      if (!vehicleId || !position || !assignedAt) {
        return;
      }

      setIsSubmitting(true);
      try {
        await onAssign({
          vehicle_id: parseInt(vehicleId, 10),
          position,
          assigned_at: assignedAt,
        });
        bottomSheetRef.current?.dismiss();
      } catch (error) {
        // Error handling is done by parent
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <CustomBottomSheet ref={bottomSheetRef} snapPoints={['60%']} onDismiss={handleDismiss}>
        <View style={styles.formContainer}>
          <Text style={[styles.title, { color: colors.text }]}>Araca Ata</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Lastiği bir araca atayın
          </Text>

          <SelectInput
            label="Araç *"
            options={vehicles.map((v) => ({ label: v.plate, value: v.id.toString() }))}
            selectedValue={vehicleId}
            onValueChange={setVehicleId}
            placeholder="Araç seçiniz..."
          />

          <SelectInput
            label="Pozisyon *"
            options={TIRE_POSITION_OPTIONS}
            selectedValue={position}
            onValueChange={setPosition}
            placeholder="Pozisyon seçiniz..."
          />

          <DateInput
            label="Atanma Tarihi *"
            value={assignedAt}
            onChangeDate={setAssignedAt}
            required
          />

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting || !vehicleId || !position}
          >
            <LinearGradient
              colors={[Brand.primary, Brand.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitButtonGradient}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Ata</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </CustomBottomSheet>
    );
  }
);

TireAssignModal.displayName = 'TireAssignModal';

const styles = StyleSheet.create({
  formContainer: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: 0,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  title: {
    ...Typography.headingMD,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.bodySM,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  submitButton: {
    width: '100%',
    height: 44,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginTop: Spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TireAssignModal;
