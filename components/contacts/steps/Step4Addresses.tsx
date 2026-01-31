/**
 * Step 4: Adresler
 *
 * Müşteri adres bilgileri - dinamik array
 */

import React from 'react'
import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { DashboardColors, DashboardSpacing, DashboardFontSizes, DashboardBorderRadius } from '@/constants/dashboard-theme'
import type { ContactAddress } from '@/types/contact'
import { Card } from '@/components/contacts/Card'
import { FormInput } from '@/components/contacts/FormInput'

interface Step4Props {
  addresses: ContactAddress[]
  onUpdateAddress: (index: number, field: keyof ContactAddress, value: any) => void
  onAddAddress: () => void
  onRemoveAddress: (index: number) => void
}

const ADDRESS_TYPES = [
  { value: 'pickup', label: 'Yükleme' },
  { value: 'delivery', label: 'Teslimat' },
  { value: 'both', label: 'Her İkisi' }
]

export function Step4Addresses({
  addresses,
  onUpdateAddress,
  onAddAddress,
  onRemoveAddress
}: Step4Props) {
  // Empty state
  if (addresses.length === 0) {
    return (
      <View style={styles.stepContent}>
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="location-outline" size={64} color={DashboardColors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Henüz adres eklenmemiş</Text>
          <Text style={styles.emptyDescription}>
            İlk adresi ekleyerek başlayın
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              onAddAddress()
            }}
          >
            <Ionicons name="add-circle" size={20} color={DashboardColors.primary} />
            <Text style={styles.emptyButtonText}>İlk Adresi Ekle</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.stepContent}>
      {addresses.map((address, index) => (
        <Card
          key={index}
          title={`Adres #${index + 1}`}
          description={address.title || 'Yeni adres'}
          icon="location-outline"
        >
          <FormInput
            label="Adres Başlığı"
            value={address.title}
            onChangeText={(text) => onUpdateAddress(index, 'title', text)}
            placeholder="Örn: Merkez Ofis, Fabrika, vb."
            required
          />

          <FormInput
            label="Adres"
            value={address.address}
            onChangeText={(text) => onUpdateAddress(index, 'address', text)}
            placeholder="Açık adres"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            required
          />

          <View style={styles.rowInputs}>
            <View style={styles.halfInput}>
              <FormInput
                label="Telefon"
                value={address.phone || ''}
                onChangeText={(text) => onUpdateAddress(index, 'phone', text)}
                placeholder="+90 xxx xxx xx xx"
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.halfInput}>
              <FormInput
                label="Posta Kodu"
                value={address.postal_code || ''}
                onChangeText={(text) => onUpdateAddress(index, 'postal_code', text)}
                placeholder="34000"
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Adres Tipi</Text>
            <View style={styles.chipsContainer}>
              {ADDRESS_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.chip,
                    address.address_type === type.value && styles.chipSelected
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync()
                    onUpdateAddress(index, 'address_type', type.value)
                  }}
                >
                  <Text style={[
                    styles.chipText,
                    address.address_type === type.value && styles.chipTextSelected
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.switchesContainer}>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Ana Adres</Text>
              <Switch
                value={address.is_main}
                onValueChange={(value) => {
                  Haptics.selectionAsync()
                  onUpdateAddress(index, 'is_main', value)
                }}
                trackColor={{ false: DashboardColors.border, true: DashboardColors.primary }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Fatura Adresi</Text>
              <Switch
                value={address.is_billing}
                onValueChange={(value) => {
                  Haptics.selectionAsync()
                  onUpdateAddress(index, 'is_billing', value)
                }}
                trackColor={{ false: DashboardColors.border, true: DashboardColors.primary }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Sevkiyat Adresi</Text>
              <Switch
                value={address.is_shipping}
                onValueChange={(value) => {
                  Haptics.selectionAsync()
                  onUpdateAddress(index, 'is_shipping', value)
                }}
                trackColor={{ false: DashboardColors.border, true: DashboardColors.primary }}
                thumbColor="#fff"
              />
            </View>
          </View>

          {addresses.length > 1 && (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
                onRemoveAddress(index)
              }}
            >
              <Ionicons name="trash-outline" size={18} color={DashboardColors.danger} />
              <Text style={styles.removeButtonText}>Adresi Kaldır</Text>
            </TouchableOpacity>
          )}
        </Card>
      ))}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          onAddAddress()
        }}
      >
        <Ionicons name="add-circle" size={20} color={DashboardColors.primary} />
        <Text style={styles.addButtonText}>Yeni Adres Ekle</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  stepContent: {
    padding: DashboardSpacing.lg,
    gap: DashboardSpacing.md
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DashboardSpacing['3xl']
  },
  emptyIconContainer: {
    marginBottom: DashboardSpacing.lg
  },
  emptyTitle: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '600',
    color: DashboardColors.text,
    marginBottom: DashboardSpacing.xs
  },
  emptyDescription: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textMuted,
    textAlign: 'center',
    marginBottom: DashboardSpacing.lg
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.xs,
    paddingHorizontal: DashboardSpacing.lg,
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
    backgroundColor: DashboardColors.primaryGlow,
    borderWidth: 1,
    borderColor: DashboardColors.primary
  },
  emptyButtonText: {
    fontSize: DashboardFontSizes.md,
    fontWeight: '600',
    color: DashboardColors.primary
  },
  rowInputs: {
    flexDirection: 'row',
    gap: DashboardSpacing.sm
  },
  halfInput: {
    flex: 1
  },
  section: {
    gap: DashboardSpacing.sm
  },
  sectionLabel: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: DashboardColors.text
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DashboardSpacing.sm
  },
  chip: {
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.full,
    backgroundColor: DashboardColors.inputBackground,
    borderWidth: 1,
    borderColor: DashboardColors.border
  },
  chipSelected: {
    backgroundColor: DashboardColors.primary,
    borderColor: DashboardColors.primary
  },
  chipText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.text,
    fontWeight: '500'
  },
  chipTextSelected: {
    color: '#fff'
  },
  switchesContainer: {
    gap: DashboardSpacing.sm
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: DashboardSpacing.xs
  },
  switchLabel: {
    fontSize: DashboardFontSizes.md,
    color: DashboardColors.text,
    fontWeight: '500'
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DashboardSpacing.xs,
    paddingVertical: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.lg,
    backgroundColor: DashboardColors.dangerGlow,
    borderWidth: 1,
    borderColor: DashboardColors.danger,
    marginTop: DashboardSpacing.sm
  },
  removeButtonText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: DashboardColors.danger
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DashboardSpacing.xs,
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
    backgroundColor: DashboardColors.primaryGlow,
    borderWidth: 1,
    borderColor: DashboardColors.primary
  },
  addButtonText: {
    fontSize: DashboardFontSizes.md,
    fontWeight: '600',
    color: DashboardColors.primary
  }
})
