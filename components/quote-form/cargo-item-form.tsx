import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { X } from 'lucide-react-native';
import { Input, Button, Card } from '@/components/ui';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';

export interface CargoItem {
  id?: string; // Temporary ID for UI
  description: string;
  quantity: number;
  unit: string;
  weight?: number;
  volume?: number;
  loading_type?: string;
  unit_price?: number;
}

interface CargoItemFormProps {
  visible: boolean;
  item?: CargoItem | null;
  onClose: () => void;
  onSave: (item: CargoItem) => void;
}

const LOADING_TYPES = [
  { value: 'full', label: 'Full Yük' },
  { value: 'partial', label: 'Parsiyel' },
  { value: 'ltl', label: 'LTL' },
  { value: 'container', label: 'Konteyner' },
];

const UNITS = [
  { value: 'adet', label: 'Adet' },
  { value: 'koli', label: 'Koli' },
  { value: 'palet', label: 'Palet' },
  { value: 'kg', label: 'Kilogram' },
  { value: 'ton', label: 'Ton' },
  { value: 'm3', label: 'Metreküp' },
];

export default function CargoItemForm({ visible, item, onClose, onSave }: CargoItemFormProps) {
  const colors = Colors.light;

  const [formData, setFormData] = useState<CargoItem>(
    item || {
      description: '',
      quantity: 1,
      unit: 'adet',
      weight: undefined,
      volume: undefined,
      loading_type: 'full',
      unit_price: undefined,
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form when item changes
  React.useEffect(() => {
    if (item) {
      setFormData(item);
    } else {
      setFormData({
        description: '',
        quantity: 1,
        unit: 'adet',
        weight: undefined,
        volume: undefined,
        loading_type: 'full',
        unit_price: undefined,
      });
    }
    setErrors({});
  }, [item, visible]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.description?.trim()) {
      newErrors.description = 'Açıklama zorunludur';
    }

    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'Geçerli bir miktar giriniz';
    }

    if (!formData.unit) {
      newErrors.unit = 'Birim zorunludur';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    onSave({
      ...formData,
      id: formData.id || Date.now().toString(), // Generate temp ID if new
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {item ? 'Yük Kalemini Düzenle' : 'Yük Kalemi Ekle'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.modalBody}>
            <Input
              label="Açıklama"
              placeholder="Örn: Palet - Elektronik Malzeme"
              value={formData.description}
              onChangeText={(value) => setFormData({ ...formData, description: value })}
              error={errors.description}
              required
            />

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Input
                  label="Miktar"
                  placeholder="1"
                  value={formData.quantity?.toString() || ''}
                  onChangeText={(value) =>
                    setFormData({ ...formData, quantity: parseFloat(value) || 0 })
                  }
                  error={errors.quantity}
                  keyboardType="numeric"
                  required
                />
              </View>

              <View style={styles.halfWidth}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Birim <Text style={{ color: colors.danger }}>*</Text>
                </Text>
                <View style={styles.unitButtons}>
                  {UNITS.slice(0, 3).map((unit) => (
                    <TouchableOpacity
                      key={unit.value}
                      style={[
                        styles.unitButton,
                        {
                          backgroundColor:
                            formData.unit === unit.value ? Brand.primary + '15' : colors.surface,
                          borderColor:
                            formData.unit === unit.value ? Brand.primary : colors.border,
                        },
                      ]}
                      onPress={() => setFormData({ ...formData, unit: unit.value })}
                    >
                      <Text
                        style={[
                          styles.unitButtonText,
                          { color: formData.unit === unit.value ? Brand.primary : colors.text },
                        ]}
                      >
                        {unit.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Input
                  label="Ağırlık (kg)"
                  placeholder="0"
                  value={formData.weight?.toString() || ''}
                  onChangeText={(value) =>
                    setFormData({ ...formData, weight: parseFloat(value) || undefined })
                  }
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.halfWidth}>
                <Input
                  label="Hacim (m³)"
                  placeholder="0"
                  value={formData.volume?.toString() || ''}
                  onChangeText={(value) =>
                    setFormData({ ...formData, volume: parseFloat(value) || undefined })
                  }
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Yükleme Tipi</Text>
              <View style={styles.loadingTypeButtons}>
                {LOADING_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.loadingTypeButton,
                      {
                        backgroundColor:
                          formData.loading_type === type.value
                            ? Brand.primary + '15'
                            : colors.surface,
                        borderColor:
                          formData.loading_type === type.value ? Brand.primary : colors.border,
                      },
                    ]}
                    onPress={() => setFormData({ ...formData, loading_type: type.value })}
                  >
                    <Text
                      style={[
                        styles.loadingTypeText,
                        {
                          color:
                            formData.loading_type === type.value ? Brand.primary : colors.text,
                        },
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Input
              label="Birim Fiyat"
              placeholder="0.00"
              value={formData.unit_price?.toString() || ''}
              onChangeText={(value) =>
                setFormData({ ...formData, unit_price: parseFloat(value) || undefined })
              }
              keyboardType="numeric"
            />
          </View>

          {/* Footer */}
          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <Button title="İptal" onPress={onClose} variant="secondary" style={styles.footerButton} />
            <Button
              title={item ? 'Güncelle' : 'Ekle'}
              onPress={handleSave}
              variant="primary"
              style={styles.footerButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  modalTitle: {
    ...Typography.headingLG,
    flex: 1,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  modalBody: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  formGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.bodySM,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  unitButtons: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  unitButton: {
    flex: 1,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  unitButtonText: {
    ...Typography.bodyXS,
    fontWeight: '600',
  },
  loadingTypeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  loadingTypeButton: {
    flex: 1,
    minWidth: '45%',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  loadingTypeText: {
    ...Typography.bodySM,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
  },
});
