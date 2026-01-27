import React, { useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import CustomBottomSheet from './CustomBottomSheet';
import { Input } from '@/components/ui';
import { DateInput } from '@/components/ui/date-input';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';

export interface TireMaintenanceModalRef {
  present: () => void;
  dismiss: () => void;
}

interface TireMaintenanceModalProps {
  onAddMaintenance: (data: {
    maintenance_date: string;
    description: string;
    cost?: string;
  }) => Promise<void>;
}

const TireMaintenanceModal = forwardRef<TireMaintenanceModalRef, TireMaintenanceModalProps>(
  ({ onAddMaintenance }, ref) => {
    const colors = Colors.light;
    const bottomSheetRef = useRef<BottomSheetModal>(null);

    const [maintenanceDate, setMaintenanceDate] = useState<string>(
      new Date().toISOString().split('T')[0]
    );
    const [description, setDescription] = useState<string>('');
    const [cost, setCost] = useState<string>('');
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
        setMaintenanceDate(new Date().toISOString().split('T')[0]);
        setDescription('');
        setCost('');
      }, 200);
    };

    const handleSubmit = async () => {
      if (!maintenanceDate || !description) {
        return;
      }

      setIsSubmitting(true);
      try {
        await onAddMaintenance({
          maintenance_date: maintenanceDate,
          description,
          cost: cost || undefined,
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
          <Text style={[styles.title, { color: colors.text }]}>Bakım Kaydı Ekle</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Lastik bakım bilgilerini girin
          </Text>

          <DateInput
            label="Bakım Tarihi *"
            value={maintenanceDate}
            onChangeDate={setMaintenanceDate}
            required
          />

          <Input
            label="Açıklama *"
            placeholder="Bakım açıklaması"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            maxLength={500}
          />

          <Input
            label="Maliyet (TL)"
            placeholder="Opsiyonel"
            value={cost}
            onChangeText={setCost}
            keyboardType="decimal-pad"
          />

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting || !maintenanceDate || !description}
          >
            <LinearGradient
              colors={['#f59e0b', '#f59e0b']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitButtonGradient}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Kaydet</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </CustomBottomSheet>
    );
  }
);

TireMaintenanceModal.displayName = 'TireMaintenanceModal';

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

export default TireMaintenanceModal;
