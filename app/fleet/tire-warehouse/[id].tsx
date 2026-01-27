/**
 * Edit Tire Screen
 *
 * Edit existing tire with assign to vehicle and maintenance features.
 * Matches backend Mobile API endpoints:
 * - GET /api/v1/mobile/filo-yonetimi/lastik-deposu/{id}
 * - PUT /api/v1/mobile/filo-yonetimi/lastik-deposu/{id}
 * - DELETE /api/v1/mobile/filo-yonetimi/lastik-deposu/{id}
 * - POST /api/v1/mobile/filo-yonetimi/lastik-deposu/{id}/ata (assign)
 * - POST /api/v1/mobile/filo-yonetimi/lastik-deposu/{id}/bakimlar (maintenance)
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
  Modal,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Save, Trash2, Car, Wrench, X } from 'lucide-react-native';
import { FullScreenHeader } from '@/components/header/FullScreenHeader';
import { Input, Card } from '@/components/ui';
import { SelectInput } from '@/components/ui/select-input';
import { DateInput } from '@/components/ui/date-input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import { useToast } from '@/hooks/use-toast';
import api, { getErrorMessage, getValidationErrors } from '@/services/api';
import { getVehicles, Vehicle } from '@/services/endpoints/vehicles';

// Tire type options
const TIRE_TYPE_OPTIONS = [
  { label: 'Yaz Lastiği', value: 'summer' },
  { label: 'Kış Lastiği', value: 'winter' },
  { label: 'Dört Mevsim', value: 'all_season' },
];

// Condition options
const CONDITION_OPTIONS = [
  { label: 'Yeni', value: 'new' },
  { label: 'İyi', value: 'good' },
  { label: 'Orta', value: 'fair' },
  { label: 'Kötü', value: 'poor' },
  { label: 'Eskimiş', value: 'worn_out' },
];

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

export default function EditTireScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = Colors.light;
  const { success, error: showError } = useToast();

  // Tire state
  const [tire, setTire] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState<any>({
    serial_number: '',
    brand: '',
    model: '',
    size: '',
    tire_type: 'summer',
    condition: 'new',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Assign modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignData, setAssignData] = useState<{
    vehicle_id?: number;
    position?: string;
    assigned_at: string;
  }>({
    assigned_at: new Date().toISOString().split('T')[0],
  });
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);

  // Maintenance modal state
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintenanceData, setMaintenanceData] = useState<{
    maintenance_date: string;
    description: string;
    cost?: string;
  }>({
    maintenance_date: new Date().toISOString().split('T')[0],
    description: '',
  });
  const [isAddingMaintenance, setIsAddingMaintenance] = useState(false);

  // Fetch tire data
  const fetchTire = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const response = await api.get(`/filo-yonetimi/lastik-deposu/${id}`);
      const tireData = response.data.data.tire;

      setTire(tireData);

      // Initialize form with tire data
      setFormData({
        serial_number: tireData.serial_number || '',
        brand: tireData.brand || '',
        model: tireData.model || '',
        size: tireData.size || '',
        dot_code: tireData.dot_code || '',
        tire_type: tireData.tire_type || 'summer',
        tread_depth: tireData.tread_depth?.toString() || '',
        purchase_date: tireData.purchase_date
          ? new Date(tireData.purchase_date).toISOString().split('T')[0]
          : '',
        purchase_price: tireData.purchase_price?.toString() || '',
        supplier: tireData.supplier || '',
        condition: tireData.condition || 'new',
        warehouse_location: tireData.warehouse_location || '',
        notes: tireData.notes || '',
      });
    } catch (error) {
      console.error('Failed to fetch tire:', error);
      showError('Hata', getErrorMessage(error));
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [id, showError]);

  useEffect(() => {
    fetchTire();
  }, [fetchTire]);

  // Handle input change
  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // Search vehicles
  const searchVehicles = useCallback(async (query: string) => {
    try {
      const response = await getVehicles({
        search: query,
        per_page: 20,
      });
      setVehicles(response.vehicles);
      return response.vehicles.map(v => ({ label: v.plate, value: v.id.toString() }));
    } catch (error) {
      console.error('Failed to search vehicles:', error);
      return [];
    }
  }, []);

  // Validation function
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.serial_number?.trim()) {
      newErrors.serial_number = 'Seri numarası zorunludur.';
    }

    if (!formData.brand?.trim()) {
      newErrors.brand = 'Marka zorunludur.';
    }

    if (!formData.model?.trim()) {
      newErrors.model = 'Model zorunludur.';
    }

    if (!formData.size?.trim()) {
      newErrors.size = 'Ebat zorunludur.';
    }

    if (!formData.tire_type) {
      newErrors.tire_type = 'Lastik tipi zorunludur.';
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
      // Prepare data - convert string numbers to actual numbers
      const submitData: any = { ...formData };
      if (submitData.tread_depth) {
        submitData.tread_depth = parseFloat(submitData.tread_depth);
      }
      if (submitData.purchase_price) {
        submitData.purchase_price = parseFloat(submitData.purchase_price);
      }

      const response = await api.put(`/filo-yonetimi/lastik-deposu/${id}`, submitData);

      success('Başarılı', response.data.message || 'Lastik başarıyla güncellendi.');
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
      await api.delete(`/filo-yonetimi/lastik-deposu/${id}`);
      success('Başarılı', 'Lastik başarıyla silindi.');
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

  // Assign to vehicle handler
  const handleAssignToVehicle = async () => {
    if (!assignData.vehicle_id || !assignData.position || !id) {
      showError('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }

    setIsAssigning(true);
    try {
      const response = await api.post(`/filo-yonetimi/lastik-deposu/${id}/ata`, assignData);
      success('Başarılı', response.data.message || 'Lastik araca atandı.');
      setShowAssignModal(false);
      fetchTire(); // Refresh tire data
    } catch (error) {
      showError('Hata', getErrorMessage(error));
    } finally {
      setIsAssigning(false);
    }
  };

  // Add maintenance record handler
  const handleAddMaintenance = async () => {
    if (!maintenanceData.maintenance_date || !maintenanceData.description || !id) {
      showError('Hata', 'Lütfen tarih ve açıklama alanlarını doldurun.');
      return;
    }

    setIsAddingMaintenance(true);
    try {
      const submitData: any = { ...maintenanceData };
      if (submitData.cost) {
        submitData.cost = parseFloat(submitData.cost);
      }

      const response = await api.post(`/filo-yonetimi/lastik-deposu/${id}/bakimlar`, submitData);
      success('Başarılı', response.data.message || 'Bakım kaydı eklendi.');
      setShowMaintenanceModal(false);
      fetchTire(); // Refresh tire data
    } catch (error) {
      showError('Hata', getErrorMessage(error));
    } finally {
      setIsAddingMaintenance(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <FullScreenHeader
          title="Lastik Düzenle"
          showBackButton
          onBackPress={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Lastik yükleniyor...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Brand.primary }]}>
      <FullScreenHeader
        title="Lastik Düzenle"
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
          <View style={styles.formWrapper}>
            {/* Action Buttons */}
            {tire?.status === 'in_stock' && (
              <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: Brand.primary }]}
                onPress={() => setShowAssignModal(true)}
              >
                <Car size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Araca Ata</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#f59e0b' }]}
                onPress={() => setShowMaintenanceModal(true)}
              >
                <Wrench size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Bakım Ekle</Text>
              </TouchableOpacity>
              </View>
            )}

            <Card style={styles.card}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Temel Bilgiler</Text>

            <Input
              label="Seri Numarası *"
              placeholder="Örn: TIRE-2024-001"
              value={formData.serial_number}
              onChangeText={(text) => handleInputChange('serial_number', text)}
              error={errors.serial_number}
              maxLength={255}
            />

            <Input
              label="Marka *"
              placeholder="Örn: Michelin, Bridgestone"
              value={formData.brand}
              onChangeText={(text) => handleInputChange('brand', text)}
              error={errors.brand}
              maxLength={255}
            />

            <Input
              label="Model *"
              placeholder="Örn: XZE2+"
              value={formData.model}
              onChangeText={(text) => handleInputChange('model', text)}
              error={errors.model}
              maxLength={255}
            />

            <Input
              label="Ebat *"
              placeholder="Örn: 315/80 R 22.5"
              value={formData.size}
              onChangeText={(text) => handleInputChange('size', text)}
              error={errors.size}
              maxLength={255}
            />

            <SelectInput
              label="Lastik Tipi *"
              options={TIRE_TYPE_OPTIONS}
              selectedValue={formData.tire_type}
              onValueChange={(val) => handleInputChange('tire_type', val)}
              error={errors.tire_type}
            />

            <SelectInput
              label="Durum"
              options={CONDITION_OPTIONS}
              selectedValue={formData.condition}
              onValueChange={(val) => handleInputChange('condition', val)}
              error={errors.condition}
            />

            <Input
              label="Diş Derinliği (mm)"
              placeholder="Örn: 15.5"
              value={formData.tread_depth || ''}
              onChangeText={(text) => handleInputChange('tread_depth', text)}
              error={errors.tread_depth}
              keyboardType="decimal-pad"
            />

            <Input
              label="DOT Kodu"
              placeholder="Üretim kodu (opsiyonel)"
              value={formData.dot_code || ''}
              onChangeText={(text) => handleInputChange('dot_code', text)}
              error={errors.dot_code}
              maxLength={255}
            />
            </Card>

            <Card style={styles.card}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Satın Alma Bilgileri</Text>

            <DateInput
              label="Satın Alma Tarihi"
              value={formData.purchase_date || ''}
              onChangeDate={(date) => handleInputChange('purchase_date', date)}
              error={errors.purchase_date}
            />

            <Input
              label="Satın Alma Fiyatı (TL)"
              placeholder="Örn: 5000"
              value={formData.purchase_price || ''}
              onChangeText={(text) => handleInputChange('purchase_price', text)}
              error={errors.purchase_price}
              keyboardType="decimal-pad"
            />

            <Input
              label="Tedarikçi"
              placeholder="Tedarikçi adı (opsiyonel)"
              value={formData.supplier || ''}
              onChangeText={(text) => handleInputChange('supplier', text)}
              error={errors.supplier}
              maxLength={255}
            />
            </Card>

            <Card style={styles.card}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Depo Bilgileri</Text>

            <Input
              label="Depo Konumu"
              placeholder="Örn: Raf A1, Bölüm 3"
              value={formData.warehouse_location || ''}
              onChangeText={(text) => handleInputChange('warehouse_location', text)}
              error={errors.warehouse_location}
              maxLength={255}
            />

            <Input
              label="Notlar"
              placeholder="İsteğe bağlı notlar"
              value={formData.notes || ''}
              onChangeText={(text) => handleInputChange('notes', text)}
              error={errors.notes}
              multiline
              numberOfLines={3}
              maxLength={1000}
            />
            </Card>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        visible={showDeleteDialog}
        title="Lastiği Sil"
        message={
          tire
            ? `${tire.serial_number} seri numaralı lastiği silmek istediğinize emin misiniz?`
            : 'Bu lastiği silmek istediğinize emin misiniz?'
        }
        confirmText="Sil"
        cancelText="İptal"
        isDangerous
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />

      {/* Assign to Vehicle Modal */}
      <Modal
        visible={showAssignModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAssignModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Araca Ata</Text>
              <TouchableOpacity onPress={() => setShowAssignModal(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <SelectInput
                label="Araç *"
                options={vehicles.map(v => ({ label: v.plate, value: v.id.toString() }))}
                selectedValue={assignData.vehicle_id?.toString()}
                onValueChange={(val) => setAssignData({ ...assignData, vehicle_id: parseInt(val) })}
                placeholder="Araç plakası ile ara..."
                searchable
              />

              <SelectInput
                label="Pozisyon *"
                options={TIRE_POSITION_OPTIONS}
                selectedValue={assignData.position}
                onValueChange={(val) => setAssignData({ ...assignData, position: val })}
                placeholder="Seçiniz..."
              />

              <DateInput
                label="Atanma Tarihi *"
                value={assignData.assigned_at}
                onChangeDate={(date) => setAssignData({ ...assignData, assigned_at: date })}
                required
              />

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: Brand.primary }]}
                onPress={handleAssignToVehicle}
                disabled={isAssigning}
              >
                {isAssigning ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonText}>Ata</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Maintenance Modal */}
      <Modal
        visible={showMaintenanceModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMaintenanceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Bakım Kaydı Ekle</Text>
              <TouchableOpacity onPress={() => setShowMaintenanceModal(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <DateInput
                label="Bakım Tarihi *"
                value={maintenanceData.maintenance_date}
                onChangeDate={(date) =>
                  setMaintenanceData({ ...maintenanceData, maintenance_date: date })
                }
                required
              />

              <Input
                label="Açıklama *"
                placeholder="Bakım açıklaması"
                value={maintenanceData.description}
                onChangeText={(text) =>
                  setMaintenanceData({ ...maintenanceData, description: text })
                }
                multiline
                numberOfLines={3}
              />

              <Input
                label="Maliyet (TL)"
                placeholder="Opsiyonel"
                value={maintenanceData.cost || ''}
                onChangeText={(text) =>
                  setMaintenanceData({ ...maintenanceData, cost: text })
                }
                keyboardType="decimal-pad"
              />

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#f59e0b' }]}
                onPress={handleAddMaintenance}
                disabled={isAddingMaintenance}
              >
                {isAddingMaintenance ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonText}>Kaydet</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  formWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    ...Shadows.lg,
    overflow: 'hidden',
    padding: Spacing.lg,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  actionButtonText: {
    color: '#FFFFFF',
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  card: {
    padding: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.headingMD,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    ...Typography.headingMD,
  },
  modalBody: {
    padding: Spacing.lg,
  },
  modalButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  modalButtonText: {
    color: '#FFFFFF',
    ...Typography.bodyMD,
    fontWeight: '600',
  },
});
