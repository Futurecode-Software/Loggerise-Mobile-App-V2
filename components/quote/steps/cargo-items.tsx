/**
 * Quote Create - Step 2: Yük Kalemleri
 *
 * Dinamik cargo items listesi
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Plus, Trash2, Package } from 'lucide-react-native';
import { Input, Card, Checkbox } from '@/components/ui';
import { SelectInput } from '@/components/ui/select-input';
import { Colors, Spacing, Brand } from '@/constants/theme';
import { NewQuoteFormData, NewCargoItem } from '@/services/endpoints/quotes-new-format';

interface QuoteCreateCargoItemsScreenProps {
  data: Partial<NewQuoteFormData>;
  onChange: (updates: Partial<NewQuoteFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const PACKAGE_TYPE_OPTIONS = [
  { label: 'Palet', value: 'Palet' },
  { label: 'Koli', value: 'Koli' },
  { label: 'Çuval', value: 'Çuval' },
  { label: 'Varil', value: 'Varil' },
  { label: 'Konteyner', value: 'Konteyner' },
  { label: 'Rulo', value: 'Rulo' },
  { label: 'Diğer', value: 'Diğer' },
];

const EMPTY_CARGO_ITEM: NewCargoItem = {
  cargo_name: '',
  cargo_name_foreign: '',
  package_type: '',
  package_count: 0,
  gross_weight: 0,
};

export function QuoteCreateCargoItemsScreen({
  data,
  onChange,
  onNext,
  onBack,
}: QuoteCreateCargoItemsScreenProps) {
  const colors = Colors.light;
  const cargoItems = data.cargo_items || [];

  // Add new cargo item
  const addCargoItem = useCallback(() => {
    const newItems = [...cargoItems, { ...EMPTY_CARGO_ITEM }];
    onChange({ cargo_items: newItems });
  }, [cargoItems, onChange]);

  // Remove cargo item
  const removeCargoItem = useCallback(
    (index: number) => {
      if (cargoItems.length === 1) {
        Alert.alert('Uyarı', 'En az bir kargo kalemi olmalıdır.');
        return;
      }

      Alert.alert('Kalem Sil', 'Bu kargo kalemini silmek istediğinizden emin misiniz?', [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            const newItems = cargoItems.filter((_, i) => i !== index);
            onChange({ cargo_items: newItems });
          },
        },
      ]);
    },
    [cargoItems, onChange]
  );

  // Update cargo item field
  const updateCargoItem = useCallback(
    (index: number, field: keyof NewCargoItem, value: any) => {
      const newItems = [...cargoItems];
      newItems[index] = {
        ...newItems[index],
        [field]: value,
      };
      onChange({ cargo_items: newItems });
    },
    [cargoItems, onChange]
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {cargoItems.length === 0 && (
          <Card style={styles.emptyCard}>
            <Package size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>Henüz kargo kalemi eklenmedi</Text>
            <Text style={styles.emptySubtext}>
              Aşağıdaki "Kalem Ekle" butonuna basarak kargo kalemi ekleyebilirsiniz
            </Text>
          </Card>
        )}

        {cargoItems.map((item, index) => (
          <Card key={index} style={styles.cargoItemCard}>
            <View style={styles.cargoItemHeader}>
              <Text style={styles.cargoItemTitle}>Kalem #{index + 1}</Text>
              {cargoItems.length > 1 && (
                <TouchableOpacity
                  onPress={() => removeCargoItem(index)}
                  style={styles.deleteButton}
                  activeOpacity={0.7}
                >
                  <Trash2 size={20} color="#DC2626" />
                </TouchableOpacity>
              )}
            </View>

            {/* Mal Adı */}
            <Input
              label="Mal Adı *"
              placeholder="Örn: Tekstil Ürünleri"
              value={item.cargo_name}
              onChangeText={(value) => updateCargoItem(index, 'cargo_name', value)}
              required
            />

            {/* Mal Adı (Yabancı) */}
            <Input
              label="Mal Adı (Yabancı Dil)"
              placeholder="Örn: Textile Products"
              value={item.cargo_name_foreign}
              onChangeText={(value) =>
                updateCargoItem(index, 'cargo_name_foreign', value)
              }
            />

            {/* Paket Tipi ve Sayısı */}
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <SelectInput
                  label="Paket Tipi"
                  placeholder="Seçiniz..."
                  value={item.package_type}
                  onValueChange={(value) =>
                    updateCargoItem(index, 'package_type', value)
                  }
                  options={PACKAGE_TYPE_OPTIONS}
                />
              </View>
              <View style={styles.halfWidth}>
                <Input
                  label="Paket Sayısı"
                  placeholder="0"
                  value={item.package_count?.toString() || ''}
                  onChangeText={(value) =>
                    updateCargoItem(index, 'package_count', parseInt(value) || 0)
                  }
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Ağırlıklar */}
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Input
                  label="Brüt Ağırlık (kg)"
                  placeholder="0"
                  value={item.gross_weight?.toString() || ''}
                  onChangeText={(value) =>
                    updateCargoItem(index, 'gross_weight', parseFloat(value) || 0)
                  }
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.halfWidth}>
                <Input
                  label="Net Ağırlık (kg)"
                  placeholder="0"
                  value={item.net_weight?.toString() || ''}
                  onChangeText={(value) =>
                    updateCargoItem(index, 'net_weight', parseFloat(value) || 0)
                  }
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* İstifleme */}
            <View style={styles.checkboxRow}>
              <Checkbox
                label="İstifleme yapılabilir"
                value={item.is_stackable || false}
                onValueChange={(value) =>
                  updateCargoItem(index, 'is_stackable', value)
                }
              />
            </View>

            {/* Tehlikeli Madde */}
            <View style={styles.checkboxRow}>
              <Checkbox
                label="Tehlikeli madde"
                value={item.is_hazardous || false}
                onValueChange={(value) =>
                  updateCargoItem(index, 'is_hazardous', value)
                }
              />
            </View>

            {/* Tehlikeli Madde Detayları (sadece tehlikeli ise) */}
            {item.is_hazardous && (
              <View style={styles.hazmatSection}>
                <Text style={styles.hazmatTitle}>Tehlikeli Madde Bilgileri</Text>
                <View style={styles.row}>
                  <View style={styles.halfWidth}>
                    <Input
                      label="UN No"
                      placeholder="1234"
                      value={item.hazmat_un_no}
                      onChangeText={(value) =>
                        updateCargoItem(index, 'hazmat_un_no', value)
                      }
                    />
                  </View>
                  <View style={styles.halfWidth}>
                    <Input
                      label="Sınıf"
                      placeholder="3"
                      value={item.hazmat_class}
                      onChangeText={(value) =>
                        updateCargoItem(index, 'hazmat_class', value)
                      }
                    />
                  </View>
                </View>
              </View>
            )}
          </Card>
        ))}

        {/* Add Item Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={addCargoItem}
          activeOpacity={0.7}
        >
          <Plus size={20} color={Brand.primary} />
          <Text style={styles.addButtonText}>Kalem Ekle</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>Geri</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.nextButton}
          onPress={onNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>Sonraki Adım</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  cargoItemCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  cargoItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cargoItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  deleteButton: {
    padding: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -Spacing.xs,
  },
  halfWidth: {
    flex: 1,
    paddingHorizontal: Spacing.xs,
  },
  checkboxRow: {
    marginVertical: Spacing.sm,
  },
  hazmatSection: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },
  hazmatTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#991B1B',
    marginBottom: Spacing.sm,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Brand.primary,
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Brand.primary,
    marginLeft: Spacing.sm,
  },
  bottomActions: {
    flexDirection: 'row',
    padding: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: Spacing.sm,
  },
  backButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  nextButton: {
    flex: 1,
    backgroundColor: Brand.primary,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
