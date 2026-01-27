/**
 * New Driver-Tractor Assignment Screen
 *
 * Create new driver-tractor assignment (sürücü-çekici eşleştirme).
 * Matches backend Mobile API endpoint: POST /api/v1/mobile/filo-yonetimi/surucu-cekici-eslestirme
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Save } from 'lucide-react-native';
import { FullScreenHeader } from '@/components/header/FullScreenHeader';
import { Input, Card } from '@/components/ui';
import { SelectInput } from '@/components/ui/select-input';
import { DateInput } from '@/components/ui/date-input';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import { useToast } from '@/hooks/use-toast';
import {
  createDriverTractorAssignment,
  DriverTractorAssignmentFormData,
} from '@/services/endpoints/fleet';
import { getVehicles, Vehicle } from '@/services/endpoints/vehicles';
import { getEmployees, Employee } from '@/services/endpoints/employees';
import { getErrorMessage, getValidationErrors } from '@/services/api';

export default function NewDriverTractorAssignmentScreen() {
  const colors = Colors.light;
  const { success, error: showError } = useToast();

  // Form state
  const [formData, setFormData] = useState<Partial<DriverTractorAssignmentFormData>>({
    assigned_at: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Search state
  const [drivers, setDrivers] = useState<Employee[]>([]);
  const [tractors, setTractors] = useState<Vehicle[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [loadingTractors, setLoadingTractors] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle input change
  const handleInputChange = useCallback((field: keyof DriverTractorAssignmentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // Search drivers
  const searchDrivers = useCallback(async (query: string) => {
    if (loadingDrivers) return drivers.map(d => ({
      label: `${d.first_name} ${d.last_name}`,
      value: d.id.toString()
    }));

    setLoadingDrivers(true);
    try {
      const response = await getEmployees({
        search: query,
        position: 'driver',
        per_page: 20,
      });
      setDrivers(response.employees);
      return response.employees.map(d => ({
        label: `${d.first_name} ${d.last_name}`,
        value: d.id.toString()
      }));
    } catch (error) {
      console.error('Failed to search drivers:', error);
      return [];
    } finally {
      setLoadingDrivers(false);
    }
  }, [loadingDrivers, drivers]);

  // Search tractors
  const searchTractors = useCallback(async (query: string) => {
    if (loadingTractors) return tractors.map(v => ({ label: v.plate, value: v.id.toString() }));

    setLoadingTractors(true);
    try {
      const response = await getVehicles({
        search: query,
        vehicle_type: 'truck_tractor',
        per_page: 20,
      });
      setTractors(response.vehicles);
      return response.vehicles.map(v => ({ label: v.plate, value: v.id.toString() }));
    } catch (error) {
      console.error('Failed to search tractors:', error);
      return [];
    } finally {
      setLoadingTractors(false);
    }
  }, [loadingTractors, tractors]);

  // Validation function
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.employee_id) {
      newErrors.employee_id = 'Sürücü seçimi zorunludur.';
    }

    if (!formData.tractor_id) {
      newErrors.tractor_id = 'Çekici seçimi zorunludur.';
    }

    if (!formData.assigned_at) {
      newErrors.assigned_at = 'Atanma tarihi zorunludur.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Submit handler
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createDriverTractorAssignment(formData as DriverTractorAssignmentFormData);

      success('Başarılı', 'Eşleştirme başarıyla oluşturuldu.');
      router.back();
    } catch (error: any) {
      const validationErrors = getValidationErrors(error);
      if (validationErrors) {
        const flatErrors: Record<string, string> = {};
        Object.entries(validationErrors).forEach(([field, messages]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            flatErrors[field] = messages[0];
          }
        });
        setErrors(flatErrors);
      } else {
        showError('Hata', getErrorMessage(error));
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, success, showError]);

  return (
    <View style={[styles.container, { backgroundColor: Brand.primary }]}>
      <FullScreenHeader
        title="Yeni Sürücü-Çekici Eşleştirme"
        showBackButton
        onBackPress={() => router.back()}
        rightIcons={
          <TouchableOpacity
            onPress={handleSubmit}
            style={styles.headerButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Save size={22} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        }
      />
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Form Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formWrapper}>
            <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Eşleştirme Bilgileri</Text>

            <SelectInput
              label="Sürücü *"
              options={drivers.map(d => ({
                label: `${d.first_name} ${d.last_name}`,
                value: d.id.toString()
              }))}
              selectedValue={formData.employee_id?.toString()}
              onValueChange={(val) => handleInputChange('employee_id', parseInt(val))}
              error={errors.employee_id}
              placeholder="Sürücü adı ile ara..."
              searchable
            />

            <SelectInput
              label="Çekici *"
              options={tractors.map(v => ({ label: v.plate, value: v.id.toString() }))}
              selectedValue={formData.tractor_id?.toString()}
              onValueChange={(val) => handleInputChange('tractor_id', parseInt(val))}
              error={errors.tractor_id}
              placeholder="Çekici plakası ile ara..."
              searchable
            />

            <DateInput
              label="Atanma Tarihi *"
              value={formData.assigned_at || ''}
              onChangeDate={(date) => handleInputChange('assigned_at', date)}
              error={errors.assigned_at}
              required
            />

            <Input
              label="Notlar"
              placeholder="İsteğe bağlı notlar"
              value={formData.notes || ''}
              onChangeText={(text) => handleInputChange('notes', text)}
              error={errors.notes}
              multiline
              numberOfLines={3}
            />
            </Card>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  headerButton: {
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
  },
  formWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    ...Shadows.lg,
    overflow: 'hidden',
  },
  card: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  sectionTitle: {
    ...Typography.headingMD,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
});
