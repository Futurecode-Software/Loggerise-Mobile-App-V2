/**
 * Edit Driver-Tractor Assignment Screen
 *
 * Edit existing driver-tractor assignment (sürücü-çekici eşleştirme).
 * Matches backend Mobile API endpoints:
 * - GET /api/v1/mobile/filo-yonetimi/surucu-cekici-eslestirme/{id}
 * - PUT /api/v1/mobile/filo-yonetimi/surucu-cekici-eslestirme/{id}
 * - DELETE /api/v1/mobile/filo-yonetimi/surucu-cekici-eslestirme/{id}
 */

import React, { useState, useCallback, useEffect } from 'react';
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
import { router, useLocalSearchParams } from 'expo-router';
import { Save, Trash2 } from 'lucide-react-native';
import { FullScreenHeader } from '@/components/header/FullScreenHeader';
import { Input, Card, Checkbox } from '@/components/ui';
import { SelectInput } from '@/components/ui/select-input';
import { DateInput } from '@/components/ui/date-input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import { useToast } from '@/hooks/use-toast';
import {
  getDriverTractorAssignments,
  updateDriverTractorAssignment,
  deleteDriverTractorAssignment,
  DriverTractorAssignment,
} from '@/services/endpoints/fleet';
import { getVehicles, Vehicle } from '@/services/endpoints/vehicles';
import { getEmployees, Employee } from '@/services/endpoints/employees';
import { getErrorMessage, getValidationErrors } from '@/services/api';

export default function EditDriverTractorAssignmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = Colors.light;
  const { success, error: showError } = useToast();

  // Assignment state
  const [assignment, setAssignment] = useState<DriverTractorAssignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState<{
    employee_id?: number;
    tractor_id?: number;
    assigned_at: string;
    notes?: string;
    is_active: boolean;
  }>({
    assigned_at: new Date().toISOString().split('T')[0],
    is_active: true,
  });

  // Search state
  const [drivers, setDrivers] = useState<Employee[]>([]);
  const [tractors, setTractors] = useState<Vehicle[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [loadingTractors, setLoadingTractors] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch assignment data
  const fetchAssignment = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const response = await getDriverTractorAssignments({ page: 1, per_page: 1 });
      const foundAssignment = response.assignments.find(a => a.id === parseInt(id));

      if (!foundAssignment) {
        showError('Hata', 'Eşleştirme bulunamadı.');
        router.back();
        return;
      }

      setAssignment(foundAssignment);

      // Initialize form with assignment data
      setFormData({
        employee_id: foundAssignment.employee_id,
        tractor_id: foundAssignment.tractor_id,
        assigned_at: foundAssignment.assigned_at
          ? new Date(foundAssignment.assigned_at).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        notes: foundAssignment.notes || '',
        is_active: foundAssignment.is_active,
      });

      // Set initial data if available
      if (foundAssignment.employee) {
        setDrivers([foundAssignment.employee as Employee]);
      }
      if (foundAssignment.tractor) {
        setTractors([foundAssignment.tractor as Vehicle]);
      }
    } catch (error) {
      console.error('Failed to fetch assignment:', error);
      showError('Hata', getErrorMessage(error));
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [id, showError]);

  useEffect(() => {
    fetchAssignment();
  }, [fetchAssignment]);

  // Handle input change
  const handleInputChange = useCallback((field: string, value: any) => {
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
    if (!validateForm() || !id) {
      return;
    }

    setIsSubmitting(true);
    try {
      await updateDriverTractorAssignment(parseInt(id), formData);

      success('Başarılı', 'Eşleştirme başarıyla güncellendi.');
      setTimeout(() => {
        router.back();
      }, 1500);
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
  }, [formData, validateForm, id, success, showError]);

  // Delete handler
  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!id) return;

    setIsDeleting(true);
    try {
      await deleteDriverTractorAssignment(parseInt(id));
      success('Başarılı', 'Eşleştirme başarıyla silindi.');
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error) {
      showError('Hata', getErrorMessage(error));
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <FullScreenHeader
          title="Eşleştirme Düzenle"
          showBackButton
          onBackPress={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Eşleştirme yükleniyor...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FullScreenHeader
        title="Eşleştirme Düzenle"
        showBackButton
        onBackPress={() => router.back()}
        rightIcons={
          <>
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
            <TouchableOpacity
              onPress={handleDelete}
              style={styles.headerButton}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Trash2 size={22} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </>
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

            {/* Aktif/Pasif */}
            <View style={[styles.switchRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.switchContent}>
                <Text style={[styles.switchLabel, { color: colors.text }]}>
                  Aktif Eşleştirme
                </Text>
                <Text style={[styles.switchDescription, { color: colors.textSecondary }]}>
                  Bu eşleştirme aktif olacak
                </Text>
              </View>
              <Checkbox
                value={formData.is_active}
                onValueChange={(val) => handleInputChange('is_active', val)}
              />
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        visible={showDeleteDialog}
        title="Eşleştirmeyi Sil"
        message={
          assignment
            ? `${assignment.employee?.full_name || 'Sürücü'} - ${assignment.tractor?.plate || 'Çekici'} eşleştirmesini silmek istediğinize emin misiniz?`
            : 'Bu eşleştirmeyi silmek istediğinize emin misiniz?'
        }
        confirmText="Sil"
        cancelText="İptal"
        isDangerous
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.bodyMD,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginVertical: Spacing.xs,
  },
  switchContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  switchLabel: {
    ...Typography.bodyMD,
    fontWeight: '500',
  },
  switchDescription: {
    ...Typography.bodySM,
    marginTop: Spacing.xs,
  },
});
