/**
 * Step 5: Yetkili Kişiler
 *
 * Müşteri yetkili kişi bilgileri - dinamik array
 */

import React from 'react'
import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { DashboardColors, DashboardSpacing, DashboardFontSizes, DashboardBorderRadius } from '@/constants/dashboard-theme'
import type { ContactAuthority } from '@/types/contact'
import { Card } from '@/components/contacts/Card'
import { FormInput } from '@/components/contacts/FormInput'

interface Step5Props {
  authorities: ContactAuthority[]
  onUpdateAuthority: (index: number, field: keyof ContactAuthority, value: any) => void
  onAddAuthority: () => void
  onRemoveAuthority: (index: number) => void
}

export function Step5Authorities({
  authorities,
  onUpdateAuthority,
  onAddAuthority,
  onRemoveAuthority
}: Step5Props) {
  // Empty state
  if (authorities.length === 0) {
    return (
      <View style={styles.stepContent}>
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="people-outline" size={64} color={DashboardColors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Henüz yetkili kişi eklenmemiş</Text>
          <Text style={styles.emptyDescription}>
            İlk yetkili kişiyi ekleyerek başlayın
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              onAddAuthority()
            }}
          >
            <Ionicons name="add-circle" size={20} color={DashboardColors.primary} />
            <Text style={styles.emptyButtonText}>İlk Yetkiliyi Ekle</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.stepContent}>
      {authorities.map((authority, index) => (
        <Card
          key={index}
          title={`Yetkili #${index + 1}`}
          description={authority.name || 'Yeni yetkili'}
          icon="person-outline"
        >
          <FormInput
            label="Ad Soyad"
            value={authority.name}
            onChangeText={(text) => onUpdateAuthority(index, 'name', text)}
            placeholder="Ad Soyad"
            required
          />

          <View style={styles.rowInputs}>
            <View style={styles.halfInput}>
              <FormInput
                label="Ünvan"
                value={authority.title || ''}
                onChangeText={(text) => onUpdateAuthority(index, 'title', text)}
                placeholder="Örn: Genel Müdür"
              />
            </View>
            <View style={styles.halfInput}>
              <FormInput
                label="Departman"
                value={authority.department || ''}
                onChangeText={(text) => onUpdateAuthority(index, 'department', text)}
                placeholder="Örn: Satış"
              />
            </View>
          </View>

          <FormInput
            label="E-posta"
            value={authority.email || ''}
            onChangeText={(text) => onUpdateAuthority(index, 'email', text)}
            placeholder="ornek@sirket.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={styles.rowInputs}>
            <View style={styles.halfInput}>
              <FormInput
                label="Telefon"
                value={authority.phone || ''}
                onChangeText={(text) => onUpdateAuthority(index, 'phone', text)}
                placeholder="+90 xxx xxx xx xx"
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.halfInput}>
              <FormInput
                label="Mobil"
                value={authority.mobile || ''}
                onChangeText={(text) => onUpdateAuthority(index, 'mobile', text)}
                placeholder="+90 xxx xxx xx xx"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <FormInput
            label="Notlar"
            value={authority.notes || ''}
            onChangeText={(text) => onUpdateAuthority(index, 'notes', text)}
            placeholder="Ek bilgiler"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Birincil Yetkili</Text>
            <Switch
              value={authority.is_primary}
              onValueChange={(value) => {
                Haptics.selectionAsync()
                onUpdateAuthority(index, 'is_primary', value)
              }}
              trackColor={{ false: DashboardColors.border, true: DashboardColors.primary }}
              thumbColor="#fff"
            />
          </View>

          {authorities.length > 1 && (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
                onRemoveAuthority(index)
              }}
            >
              <Ionicons name="trash-outline" size={18} color={DashboardColors.danger} />
              <Text style={styles.removeButtonText}>Yetkiliyi Kaldır</Text>
            </TouchableOpacity>
          )}
        </Card>
      ))}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          onAddAuthority()
        }}
      >
        <Ionicons name="add-circle" size={20} color={DashboardColors.primary} />
        <Text style={styles.addButtonText}>Yeni Yetkili Ekle</Text>
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
