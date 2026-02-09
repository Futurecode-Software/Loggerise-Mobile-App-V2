/**
 * Step2LoadItems - Yük Kalemleri
 *
 * Web versiyonu ile %100 uyumlu - Ölçü alanları, otomatik hesaplama, tehlikeli madde detayları
 */

import React, { useCallback } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Card, Input, Checkbox } from '@/components/ui'
import { SelectInput } from '@/components/ui/select-input'
import Toast from 'react-native-toast-message'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius
} from '@/constants/dashboard-theme'

export interface LoadItem {
  id?: number
  cargo_name: string
  cargo_name_foreign?: string
  package_type: string
  package_count: number
  piece_count: number
  gross_weight: string
  net_weight: string
  volumetric_weight: string
  lademetre_weight: string
  total_chargeable_weight: string
  width: string
  height: string
  length: string
  volume: string
  lademetre: string
  is_stackable: boolean
  stackable_rows: number | null
  is_hazardous: boolean
  hazmat_un_no: string
  hazmat_class: string
  hazmat_page_no: string
  hazmat_packing_group: string
  hazmat_flash_point: string
  hazmat_description: string
}

interface Step2LoadItemsProps {
  items: LoadItem[]
  setItems: (items: LoadItem[]) => void
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
]

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
})

// Otomatik hesaplama fonksiyonları (web ile aynı formüller)
const calculateVolume = (width: string, height: string, length: string, packageCount: number): string => {
  const w = parseFloat(width) || 0
  const h = parseFloat(height) || 0
  const l = parseFloat(length) || 0
  if (w === 0 || h === 0 || l === 0) return '0'
  const volume = (w * h * l) / 1000000 * (packageCount || 1)
  return volume.toFixed(3)
}

const calculateVolumetricWeight = (width: string, height: string, length: string, packageCount: number): string => {
  const w = parseFloat(width) || 0
  const h = parseFloat(height) || 0
  const l = parseFloat(length) || 0
  if (w === 0 || h === 0 || l === 0) return '0'
  const volume = (w * h * l) / 1000000 * (packageCount || 1)
  const volumetricWeight = volume * 333
  return volumetricWeight.toFixed(2)
}

const calculateLademetre = (
  width: string,
  length: string,
  packageCount: number,
  isStackable: boolean,
  stackableRows: number | null
): string => {
  const w = parseFloat(width) || 0
  const l = parseFloat(length) || 0
  if (w === 0 || l === 0) return '0'

  const trailerWidth = 240
  const count = packageCount || 1
  let lademetre = (l * w) / (trailerWidth * 100) * count

  if (isStackable && stackableRows && stackableRows > 1) {
    lademetre = lademetre / stackableRows
  }

  return lademetre.toFixed(3)
}

const calculateLademetreWeight = (lademetre: string): string => {
  const ldm = parseFloat(lademetre) || 0
  return (ldm * 1750).toFixed(2)
}

const calculateChargeableWeight = (grossWeight: string, volumetricWeight: string, lademetreWeight: string): string => {
  const gross = parseFloat(grossWeight) || 0
  const volumetric = parseFloat(volumetricWeight) || 0
  const ldmWeight = parseFloat(lademetreWeight) || 0
  return Math.max(gross, volumetric, ldmWeight).toFixed(2)
}

export default function Step2LoadItems({ items, setItems }: Step2LoadItemsProps) {
  const addItem = () => {
    setItems([...items, getDefaultItem()])
  }

  const removeItem = (index: number) => {
    if (items.length === 1) {
      Toast.show({
        type: 'warning',
        text1: 'En az bir yük kalemi olmalıdır',
        position: 'top',
        visibilityTime: 1500,
      })
      return
    }
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = useCallback((index: number, field: keyof LoadItem, value: any) => {
    const updatedItems = [...items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }

    const calculationFields: (keyof LoadItem)[] = [
      'width',
      'height',
      'length',
      'package_count',
      'gross_weight',
      'is_stackable',
      'stackable_rows',
    ]

    if (calculationFields.includes(field)) {
      const item = updatedItems[index]

      const volume = calculateVolume(item.width, item.height, item.length, item.package_count)
      updatedItems[index].volume = volume

      const volumetricWeight = calculateVolumetricWeight(item.width, item.height, item.length, item.package_count)
      updatedItems[index].volumetric_weight = volumetricWeight

      const lademetre = calculateLademetre(
        item.width,
        item.length,
        item.package_count,
        item.is_stackable,
        item.stackable_rows
      )
      updatedItems[index].lademetre = lademetre

      const lademetreWeight = calculateLademetreWeight(lademetre)
      updatedItems[index].lademetre_weight = lademetreWeight

      const chargeableWeight = calculateChargeableWeight(item.gross_weight, volumetricWeight, lademetreWeight)
      updatedItems[index].total_chargeable_weight = chargeableWeight
    }

    setItems(updatedItems)
  }, [items, setItems])

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View>
            <Text style={styles.cardTitle}>Yük Kalemleri</Text>
            <Text style={styles.cardDescription}>
              Yük kalemlerini ekleyin
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={addItem}
          >
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Kalem Ekle</Text>
          </TouchableOpacity>
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Henüz kalem eklenmemiş
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={addItem}
            >
              <Ionicons name="add" size={16} color={DashboardColors.text} />
              <Text style={styles.emptyButtonText}>İlk Kalemi Ekle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          items.map((item, index) => (
            <View
              key={index}
              style={styles.itemCard}
            >
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>Kalem #{index + 1}</Text>
                <TouchableOpacity onPress={() => removeItem(index)}>
                  <Ionicons name="trash-outline" size={18} color={DashboardColors.danger} />
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

              {/* Ölçü Alanları */}
              <Text style={styles.sectionTitle}>Ölçüler (cm)</Text>
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
              <View style={styles.calculatedSection}>
                <View style={styles.calculatedHeader}>
                  <Ionicons name="calculator-outline" size={16} color={DashboardColors.info} />
                  <Text style={styles.calculatedTitle}>
                    Otomatik Hesaplanan Değerler
                  </Text>
                </View>

                <View style={styles.row}>
                  <View style={styles.flex1}>
                    <Text style={styles.calculatedLabel}>Hacim (m³)</Text>
                    <View style={styles.calculatedValue}>
                      <Text style={styles.calculatedValueText}>{item.volume}</Text>
                    </View>
                  </View>
                  <View style={styles.flex1}>
                    <Text style={styles.calculatedLabel}>Hacimsel Ağırlık</Text>
                    <View style={styles.calculatedValue}>
                      <Text style={styles.calculatedValueText}>{item.volumetric_weight} kg</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={styles.flex1}>
                    <Text style={styles.calculatedLabel}>Lademetre (LDM)</Text>
                    <View style={styles.calculatedValue}>
                      <Text style={styles.calculatedValueText}>{item.lademetre}</Text>
                    </View>
                  </View>
                  <View style={styles.flex1}>
                    <Text style={styles.calculatedLabel}>LDM Ağırlık</Text>
                    <View style={styles.calculatedValue}>
                      <Text style={styles.calculatedValueText}>{item.lademetre_weight} kg</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.chargeableWeightRow}>
                  <Text style={styles.chargeableWeightLabel}>
                    Toplam Faturalandırılabilir Ağırlık
                  </Text>
                  <View style={styles.chargeableWeightValue}>
                    <Text style={styles.chargeableWeightValueText}>
                      {item.total_chargeable_weight} kg
                    </Text>
                  </View>
                </View>

                <Text style={styles.calculatedInfo}>
                  Bu değerler genişlik, yükseklik, uzunluk, paket sayısı ve brüt ağırlık bilgilerine göre otomatik hesaplanmaktadır.
                </Text>
              </View>

              {/* Checkboxes */}
              <View style={styles.checkboxRow}>
                <Checkbox
                  checked={item.is_stackable}
                  onCheckedChange={(checked) => updateItem(index, 'is_stackable', checked)}
                />
                <Text style={styles.checkboxLabel}>İstiflenebilir</Text>
              </View>

              {/* İstifleme Bilgileri */}
              {item.is_stackable && (
                <View style={styles.stackableSection}>
                  <Text style={styles.stackableTitle}>İstifleme Bilgileri</Text>
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
                <Ionicons
                  name="warning-outline"
                  size={16}
                  color={item.is_hazardous ? DashboardColors.danger : DashboardColors.textMuted}
                />
                <Text
                  style={[
                    styles.checkboxLabel,
                    item.is_hazardous && { color: DashboardColors.danger },
                  ]}
                >
                  Tehlikeli Madde
                </Text>
              </View>

              {/* Tehlikeli Madde Bilgileri */}
              {item.is_hazardous && (
                <View style={styles.hazmatSection}>
                  <Text style={styles.hazmatTitle}>
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
  )
}

const styles = StyleSheet.create({
  container: {
    gap: DashboardSpacing.sm,
  },
  card: {
    padding: DashboardSpacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: DashboardSpacing.md,
  },
  cardTitle: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '600',
    color: DashboardColors.text,
    marginBottom: 2,
  },
  cardDescription: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 6,
    borderRadius: DashboardBorderRadius.lg,
    backgroundColor: DashboardColors.primary,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: DashboardSpacing.xl,
  },
  emptyText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    marginBottom: DashboardSpacing.sm,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.sm,
    borderWidth: 1,
    borderColor: DashboardColors.border,
    borderRadius: DashboardBorderRadius.lg,
  },
  emptyButtonText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.text,
  },
  itemCard: {
    padding: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.lg,
    borderWidth: 1,
    borderColor: DashboardColors.border,
    backgroundColor: DashboardColors.surface,
    marginBottom: DashboardSpacing.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DashboardSpacing.sm,
  },
  itemTitle: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.text,
  },
  sectionTitle: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: DashboardColors.text,
    marginTop: DashboardSpacing.sm,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    gap: DashboardSpacing.sm,
  },
  flex1: {
    flex: 1,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.xs,
    marginTop: DashboardSpacing.xs,
  },
  checkboxLabel: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.text,
  },
  calculatedSection: {
    marginTop: DashboardSpacing.sm,
    padding: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.lg,
    borderWidth: 1,
    backgroundColor: DashboardColors.infoBg,
    borderColor: '#BFDBFE',
  },
  calculatedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.xs,
    marginBottom: DashboardSpacing.sm,
  },
  calculatedTitle: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: DashboardColors.info,
  },
  calculatedLabel: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.info,
    marginBottom: 2,
  },
  calculatedValue: {
    padding: 6,
    borderRadius: DashboardBorderRadius.sm,
    alignItems: 'flex-end',
    backgroundColor: DashboardColors.surface,
  },
  calculatedValueText: {
    fontSize: DashboardFontSizes.xs,
    fontFamily: 'monospace',
    color: DashboardColors.info,
  },
  chargeableWeightRow: {
    marginTop: DashboardSpacing.sm,
  },
  chargeableWeightLabel: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600',
    color: DashboardColors.info,
    marginBottom: 2,
  },
  chargeableWeightValue: {
    padding: 6,
    borderRadius: DashboardBorderRadius.sm,
    alignItems: 'flex-end',
    backgroundColor: DashboardColors.surface,
  },
  chargeableWeightValueText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: DashboardColors.info,
  },
  calculatedInfo: {
    fontSize: 10,
    marginTop: DashboardSpacing.sm,
    color: '#3B82F6',
  },
  stackableSection: {
    marginTop: DashboardSpacing.sm,
    padding: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.lg,
    borderWidth: 1,
    backgroundColor: DashboardColors.infoBg,
    borderColor: '#BFDBFE',
  },
  stackableTitle: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: DashboardColors.info,
    marginBottom: DashboardSpacing.sm,
  },
  hazmatSection: {
    marginTop: DashboardSpacing.sm,
    padding: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.lg,
    borderWidth: 1,
    backgroundColor: DashboardColors.warningBg,
    borderColor: '#FED7AA',
  },
  hazmatTitle: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: '#9A3412',
    marginBottom: DashboardSpacing.sm,
  },
})
