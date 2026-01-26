/**
 * Step2LoadItems - Yük Kalemleri
 *
 * Web versiyonu ile %100 uyumlu - Ölçü alanları, otomatik hesaplama, tehlikeli madde detayları
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Plus, Trash2, Calculator, AlertTriangle, Info } from 'lucide-react-native';
import { Card, Input, Checkbox } from '@/components/ui';
import { SelectInput } from '@/components/ui/select-input';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import { useToast } from '@/hooks/use-toast';

export interface LoadItem {
  cargo_name: string;
  cargo_name_foreign?: string;
  package_type: string;
  package_count: number;
  piece_count: number;
  gross_weight: string;
  net_weight: string;
  volumetric_weight: string;
  lademetre_weight: string;
  total_chargeable_weight: string;
  width: string;
  height: string;
  length: string;
  volume: string;
  lademetre: string;
  is_stackable: boolean;
  stackable_rows: number | null;
  is_hazardous: boolean;
  hazmat_un_no: string;
  hazmat_class: string;
  hazmat_page_no: string;
  hazmat_packing_group: string;
  hazmat_flash_point: string;
  hazmat_description: string;
}

interface Step2LoadItemsProps {
  items: LoadItem[];
  setItems: (items: LoadItem[]) => void;
}

// Web ile aynı paket tipi seçenekleri (25 adet)
const PACKAGE_TYPE_OPTIONS = [
  { label: 'Koli', value: 'koli' },
  { label: 'Palet', value: 'palet' },
  { label: 'Karton', value: 'karton' },
  { label: 'Paket', value: 'paket' },
  { label: 'Torba', value: 'torba' },
  { label: 'Çuval', value: 'cuval' },
  { label: 'Sandık', value: 'sandik' },
  { label: 'Kasa', value: 'kasa' },
  { label: 'Fıçı', value: 'fici' },
  { label: 'Varil', value: 'varil' },
  { label: 'Bidon', value: 'bidon' },
  { label: 'Rulo', value: 'rulo' },
  { label: 'Balya', value: 'balya' },
  { label: 'Bağ', value: 'bag' },
  { label: 'Blok', value: 'blok' },
  { label: 'Askılı', value: 'askili' },
  { label: 'Adet', value: 'adet' },
  { label: 'Kap', value: 'kap' },
  { label: 'Kutu', value: 'kutu' },
  { label: 'Teneke', value: 'teneke' },
  { label: 'Sepet', value: 'sepet' },
  { label: 'Tank', value: 'tank' },
  { label: 'IBC', value: 'ibc' },
  { label: 'Big Bag', value: 'big_bag' },
  { label: 'Konteyner', value: 'konteyner' },
];

const getDefaultItem = (): LoadItem => ({
  cargo_name: '',
  cargo_name_foreign: '',
  package_type: '',
  package_count: 0,
  piece_count: 0,
  gross_weight: '0',
  net_weight: '0',
  volumetric_weight: '0',
  lademetre_weight: '0',
  total_chargeable_weight: '0',
  width: '0',
  height: '0',
  length: '0',
  volume: '0',
  lademetre: '0',
  is_stackable: false,
  stackable_rows: null,
  is_hazardous: false,
  hazmat_un_no: '',
  hazmat_class: '',
  hazmat_page_no: '',
  hazmat_packing_group: '',
  hazmat_flash_point: '0',
  hazmat_description: '',
});

// Otomatik hesaplama fonksiyonları (web ile aynı formüller)
const calculateVolume = (width: string, height: string, length: string, packageCount: number): string => {
  const w = parseFloat(width) || 0;
  const h = parseFloat(height) || 0;
  const l = parseFloat(length) || 0;
  if (w === 0 || h === 0 || l === 0) return '0';
  // cm -> m3 dönüşümü: (w * h * l) / 1000000 * packageCount
  const volume = (w * h * l) / 1000000 * (packageCount || 1);
  return volume.toFixed(3);
};

const calculateVolumetricWeight = (width: string, height: string, length: string, packageCount: number): string => {
  const w = parseFloat(width) || 0;
  const h = parseFloat(height) || 0;
  const l = parseFloat(length) || 0;
  if (w === 0 || h === 0 || l === 0) return '0';
  // Hacimsel ağırlık: hacim * 333 (karayolu için)
  const volume = (w * h * l) / 1000000 * (packageCount || 1);
  const volumetricWeight = volume * 333;
  return volumetricWeight.toFixed(2);
};

const calculateLademetre = (
  width: string,
  length: string,
  packageCount: number,
  isStackable: boolean,
  stackableRows: number | null
): string => {
  const w = parseFloat(width) || 0;
  const l = parseFloat(length) || 0;
  if (w === 0 || l === 0) return '0';

  // Tır genişliği: 240 cm
  const trailerWidth = 240;
  const count = packageCount || 1;

  // LDM = (Uzunluk * Genişlik) / (Tır Genişliği * 100) * Paket Sayısı
  let lademetre = (l * w) / (trailerWidth * 100) * count;

  // İstiflenebilir ise sıra sayısına böl
  if (isStackable && stackableRows && stackableRows > 1) {
    lademetre = lademetre / stackableRows;
  }

  return lademetre.toFixed(3);
};

const calculateLademetreWeight = (lademetre: string): string => {
  const ldm = parseFloat(lademetre) || 0;
  // LDM ağırlık = LDM * 1750 kg
  return (ldm * 1750).toFixed(2);
};

const calculateChargeableWeight = (grossWeight: string, volumetricWeight: string, lademetreWeight: string): string => {
  const gross = parseFloat(grossWeight) || 0;
  const volumetric = parseFloat(volumetricWeight) || 0;
  const ldmWeight = parseFloat(lademetreWeight) || 0;
  // Faturalandırılabilir ağırlık = max(brüt, hacimsel, lademetre ağırlık)
  return Math.max(gross, volumetric, ldmWeight).toFixed(2);
};

export default function Step2LoadItems({ items, setItems }: Step2LoadItemsProps) {
  const colors = Colors.light;
  const toast = useToast();

  const addItem = () => {
    setItems([...items, getDefaultItem()]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) {
      toast.warning('En az bir yük kalemi olmalıdır');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = useCallback((index: number, field: keyof LoadItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Otomatik hesaplama yapılacak alanlar
    const calculationFields: (keyof LoadItem)[] = [
      'width',
      'height',
      'length',
      'package_count',
      'gross_weight',
      'is_stackable',
      'stackable_rows',
    ];

    // Eğer hesaplama yapılması gereken bir alan değiştiyse
    if (calculationFields.includes(field)) {
      const item = updatedItems[index];

      // Hacim hesapla
      const volume = calculateVolume(item.width, item.height, item.length, item.package_count);
      updatedItems[index].volume = volume;

      // Hacimsel ağırlık hesapla
      const volumetricWeight = calculateVolumetricWeight(item.width, item.height, item.length, item.package_count);
      updatedItems[index].volumetric_weight = volumetricWeight;

      // Lademetre hesapla
      const lademetre = calculateLademetre(
        item.width,
        item.length,
        item.package_count,
        item.is_stackable,
        item.stackable_rows
      );
      updatedItems[index].lademetre = lademetre;

      // Lademetre ağırlık hesapla
      const lademetreWeight = calculateLademetreWeight(lademetre);
      updatedItems[index].lademetre_weight = lademetreWeight;

      // Toplam faturalandırılabilir ağırlık hesapla
      const chargeableWeight = calculateChargeableWeight(item.gross_weight, volumetricWeight, lademetreWeight);
      updatedItems[index].total_chargeable_weight = chargeableWeight;
    }

    setItems(updatedItems);
  }, [items, setItems]);

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Yük Kalemleri</Text>
            <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
              Yük kalemlerini ekleyin
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: Brand.primary }]}
            onPress={addItem}
          >
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Kalem Ekle</Text>
          </TouchableOpacity>
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Henüz kalem eklenmemiş
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { borderColor: colors.border }]}
              onPress={addItem}
            >
              <Plus size={16} color={colors.text} />
              <Text style={[styles.emptyButtonText, { color: colors.text }]}>İlk Kalemi Ekle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          items.map((item, index) => (
            <View
              key={index}
              style={[styles.itemCard, { borderColor: colors.border, backgroundColor: colors.surface }]}
            >
              <View style={styles.itemHeader}>
                <Text style={[styles.itemTitle, { color: colors.text }]}>Kalem #{index + 1}</Text>
                <TouchableOpacity onPress={() => removeItem(index)}>
                  <Trash2 size={18} color={colors.danger} />
                </TouchableOpacity>
              </View>

              {/* Mal Adı Alanları */}
              <Input
                label="Mal Adı *"
                placeholder="Örn: Tekstil Ürünleri"
                value={item.cargo_name}
                onChangeText={(value) => updateItem(index, 'cargo_name', value)}
              />

              <Input
                label="Yabancı Dilde Mal Adı"
                placeholder="Örn: Textile Products"
                value={item.cargo_name_foreign}
                onChangeText={(value) => updateItem(index, 'cargo_name_foreign', value)}
              />

              {/* Yük Tipi ve Adetler */}
              <SelectInput
                label="Yük Tipi"
                placeholder="Yük tipi seçiniz"
                value={item.package_type}
                onValueChange={(value) => updateItem(index, 'package_type', value)}
                options={PACKAGE_TYPE_OPTIONS}
              />

              <View style={styles.row}>
                <View style={styles.flex1}>
                  <Input
                    label="Paket Sayısı"
                    placeholder="0"
                    value={String(item.package_count)}
                    onChangeText={(value) => updateItem(index, 'package_count', parseInt(value) || 0)}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.flex1}>
                  <Input
                    label="Parça Sayısı"
                    placeholder="0"
                    value={String(item.piece_count)}
                    onChangeText={(value) => updateItem(index, 'piece_count', parseInt(value) || 0)}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              {/* Ağırlık Alanları */}
              <View style={styles.row}>
                <View style={styles.flex1}>
                  <Input
                    label="Brüt Ağırlık (kg)"
                    placeholder="0.00"
                    value={item.gross_weight}
                    onChangeText={(value) => updateItem(index, 'gross_weight', value)}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.flex1}>
                  <Input
                    label="Net Ağırlık (kg)"
                    placeholder="0.00"
                    value={item.net_weight}
                    onChangeText={(value) => updateItem(index, 'net_weight', value)}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              {/* Ölçü Alanları - Web ile aynı */}
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Ölçüler (cm)</Text>
              <View style={styles.row}>
                <View style={styles.flex1}>
                  <Input
                    label="Genişlik"
                    placeholder="0"
                    value={item.width}
                    onChangeText={(value) => updateItem(index, 'width', value)}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.flex1}>
                  <Input
                    label="Yükseklik"
                    placeholder="0"
                    value={item.height}
                    onChangeText={(value) => updateItem(index, 'height', value)}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.flex1}>
                  <Input
                    label="Uzunluk"
                    placeholder="0"
                    value={item.length}
                    onChangeText={(value) => updateItem(index, 'length', value)}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              {/* Otomatik Hesaplanan Değerler */}
              <View style={[styles.calculatedSection, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                <View style={styles.calculatedHeader}>
                  <Calculator size={16} color="#1E40AF" />
                  <Text style={[styles.calculatedTitle, { color: '#1E40AF' }]}>
                    Otomatik Hesaplanan Değerler
                  </Text>
                </View>

                <View style={styles.row}>
                  <View style={styles.flex1}>
                    <Text style={[styles.calculatedLabel, { color: '#1E40AF' }]}>Hacim (m³)</Text>
                    <View style={[styles.calculatedValue, { backgroundColor: '#FFFFFF' }]}>
                      <Text style={[styles.calculatedValueText, { color: '#1E40AF' }]}>{item.volume}</Text>
                    </View>
                  </View>
                  <View style={styles.flex1}>
                    <Text style={[styles.calculatedLabel, { color: '#1E40AF' }]}>Hacimsel Ağırlık</Text>
                    <View style={[styles.calculatedValue, { backgroundColor: '#FFFFFF' }]}>
                      <Text style={[styles.calculatedValueText, { color: '#1E40AF' }]}>{item.volumetric_weight} kg</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={styles.flex1}>
                    <Text style={[styles.calculatedLabel, { color: '#1E40AF' }]}>Lademetre (LDM)</Text>
                    <View style={[styles.calculatedValue, { backgroundColor: '#FFFFFF' }]}>
                      <Text style={[styles.calculatedValueText, { color: '#1E40AF' }]}>{item.lademetre}</Text>
                    </View>
                  </View>
                  <View style={styles.flex1}>
                    <Text style={[styles.calculatedLabel, { color: '#1E40AF' }]}>LDM Ağırlık</Text>
                    <View style={[styles.calculatedValue, { backgroundColor: '#FFFFFF' }]}>
                      <Text style={[styles.calculatedValueText, { color: '#1E40AF' }]}>{item.lademetre_weight} kg</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.chargeableWeightRow}>
                  <Text style={[styles.chargeableWeightLabel, { color: '#1E40AF' }]}>
                    Toplam Faturalandırılabilir Ağırlık
                  </Text>
                  <View style={[styles.chargeableWeightValue, { backgroundColor: '#FFFFFF' }]}>
                    <Text style={[styles.chargeableWeightValueText, { color: '#1E40AF' }]}>
                      {item.total_chargeable_weight} kg
                    </Text>
                  </View>
                </View>

                <Text style={[styles.calculatedInfo, { color: '#3B82F6' }]}>
                  Bu değerler genişlik, yükseklik, uzunluk, paket sayısı ve brüt ağırlık bilgilerine göre otomatik hesaplanmaktadır.
                </Text>
              </View>

              {/* Checkboxes */}
              <View style={styles.checkboxRow}>
                <Checkbox
                  checked={item.is_stackable}
                  onCheckedChange={(checked) => updateItem(index, 'is_stackable', checked)}
                />
                <Text style={[styles.checkboxLabel, { color: colors.text }]}>İstiflenebilir</Text>
              </View>

              {/* İstifleme Bilgileri */}
              {item.is_stackable && (
                <View style={[styles.stackableSection, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                  <Text style={[styles.stackableTitle, { color: '#1E40AF' }]}>İstifleme Bilgileri</Text>
                  <Input
                    label="Kaç Sıra İstiflenebilir?"
                    placeholder="Örn: 3"
                    value={item.stackable_rows?.toString() || ''}
                    onChangeText={(value) => updateItem(index, 'stackable_rows', value ? parseInt(value) : null)}
                    keyboardType="number-pad"
                  />
                </View>
              )}

              <View style={styles.checkboxRow}>
                <Checkbox
                  checked={item.is_hazardous}
                  onCheckedChange={(checked) => updateItem(index, 'is_hazardous', checked)}
                />
                <AlertTriangle size={16} color={item.is_hazardous ? colors.danger : colors.textMuted} />
                <Text
                  style={[
                    styles.checkboxLabel,
                    { color: item.is_hazardous ? colors.danger : colors.text },
                  ]}
                >
                  Tehlikeli Madde
                </Text>
              </View>

              {/* Tehlikeli Madde Bilgileri - Web ile aynı detaylar */}
              {item.is_hazardous && (
                <View style={[styles.hazmatSection, { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' }]}>
                  <Text style={[styles.hazmatTitle, { color: '#9A3412' }]}>
                    Tehlikeli Madde Bilgileri
                  </Text>

                  <View style={styles.row}>
                    <View style={styles.flex1}>
                      <Input
                        label="UN No *"
                        placeholder="Örn: UN1234"
                        value={item.hazmat_un_no}
                        onChangeText={(value) => updateItem(index, 'hazmat_un_no', value)}
                      />
                    </View>
                    <View style={styles.flex1}>
                      <Input
                        label="Sınıf *"
                        placeholder="Örn: 3"
                        value={item.hazmat_class}
                        onChangeText={(value) => updateItem(index, 'hazmat_class', value)}
                      />
                    </View>
                  </View>

                  <View style={styles.row}>
                    <View style={styles.flex1}>
                      <Input
                        label="Yanma Noktası (°C)"
                        placeholder="0"
                        value={item.hazmat_flash_point}
                        onChangeText={(value) => updateItem(index, 'hazmat_flash_point', value)}
                        keyboardType="decimal-pad"
                      />
                    </View>
                    <View style={styles.flex1}>
                      <Input
                        label="Paketleme Grubu"
                        placeholder="Örn: I, II, III"
                        value={item.hazmat_packing_group}
                        onChangeText={(value) => updateItem(index, 'hazmat_packing_group', value)}
                      />
                    </View>
                  </View>

                  <Input
                    label="Açıklamalar"
                    placeholder="Tehlikeli madde hakkında ek bilgiler..."
                    value={item.hazmat_description}
                    onChangeText={(value) => updateItem(index, 'hazmat_description', value)}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              )}
            </View>
          ))
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  card: {
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardDescription: {
    fontSize: 13,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
  },
  emptyButtonText: {
    fontSize: 14,
  },
  itemCard: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  flex1: {
    flex: 1,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  checkboxLabel: {
    fontSize: 13,
  },
  calculatedSection: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  calculatedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  calculatedTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  calculatedLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  calculatedValue: {
    padding: 6,
    borderRadius: BorderRadius.sm,
    alignItems: 'flex-end',
  },
  calculatedValueText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  chargeableWeightRow: {
    marginTop: Spacing.sm,
  },
  chargeableWeightLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  chargeableWeightValue: {
    padding: 6,
    borderRadius: BorderRadius.sm,
    alignItems: 'flex-end',
  },
  chargeableWeightValueText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  calculatedInfo: {
    fontSize: 10,
    marginTop: Spacing.sm,
  },
  stackableSection: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  stackableTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  hazmatSection: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  hazmatTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
});
