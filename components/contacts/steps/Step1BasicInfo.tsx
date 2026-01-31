import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native'
import * as Haptics from 'expo-haptics'
import { Card } from '../Card'
import { FormInput } from '../FormInput'
import type { ContactFormState } from '@/hooks/contacts/useContactFormReducer'
import type { ContactType, BusinessType, LegalType, ContactSegment } from '@/types/contact'
import { CONTACT_TYPES, BUSINESS_TYPES, LEGAL_TYPES, CONTACT_SEGMENTS, CONTACT_STATUSES, CREDIT_RATINGS } from '@/constants/contacts/contactFormOptions'
import { DashboardColors, DashboardSpacing, DashboardFontSizes, DashboardBorderRadius } from '@/constants/dashboard-theme'

interface Step1Props {
  state: ContactFormState
  actions: {
    setName: (value: string) => void
    setShortName: (value: string) => void
    setType: (value: ContactType) => void
    setBusinessType: (value: BusinessType | '') => void
    setLegalType: (value: LegalType) => void
    setCategory: (value: string) => void
    setSegment: (value: ContactSegment | '') => void
    setCreditRating: (value: number | null) => void
    setStatus: (value: 'active' | 'passive') => void
    setIsActive: (value: boolean) => void
  }
}

export function Step1BasicInfo({ state, actions }: Step1Props) {
  return (
    <View style={styles.container}>
      <Card title="Müşteri Tipi" icon="flag">
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Müşteri Tipi</Text>
          <View style={styles.chipsContainer}>
            {CONTACT_TYPES.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.chip,
                  state.type === option.value && styles.chipSelected
                ]}
                onPress={() => {
                  Haptics.selectionAsync()
                  actions.setType(option.value)
                }}
              >
                <Text style={[
                  styles.chipText,
                  state.type === option.value && styles.chipTextSelected
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Yasal Tip</Text>
          <View style={styles.chipsContainer}>
            {LEGAL_TYPES.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.chip,
                  state.legal_type === option.value && styles.chipSelected
                ]}
                onPress={() => {
                  Haptics.selectionAsync()
                  actions.setLegalType(option.value as LegalType)
                }}
              >
                <Text style={[
                  styles.chipText,
                  state.legal_type === option.value && styles.chipTextSelected
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Faaliyet Alanı (Opsiyonel)</Text>
          <View style={styles.chipsContainer}>
            {BUSINESS_TYPES.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.chip,
                  state.business_type === option.value && styles.chipSelected
                ]}
                onPress={() => {
                  Haptics.selectionAsync()
                  actions.setBusinessType(state.business_type === option.value ? '' : option.value as BusinessType)
                }}
              >
                <Text style={[
                  styles.chipText,
                  state.business_type === option.value && styles.chipTextSelected
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Card>

      <Card title="Temel Bilgiler" icon="information-circle">
        <FormInput
          label="Müşteri Adı"
          value={state.name}
          onChangeText={actions.setName}
          placeholder="Şirket veya kişi adı"
          required
        />
        <FormInput
          label="Kısa Ad"
          value={state.short_name}
          onChangeText={actions.setShortName}
          placeholder="Kısa ad veya takma ad"
        />
        <FormInput
          label="Kategori"
          value={state.category}
          onChangeText={actions.setCategory}
          placeholder="Müşteri kategorisi"
        />
      </Card>

      <Card title="Segment ve Derecelendirme" icon="bar-chart">
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Müşteri Segmenti</Text>
          <View style={styles.chipsContainer}>
            {CONTACT_SEGMENTS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.chip,
                  state.contact_segment === option.value && styles.chipSelected
                ]}
                onPress={() => {
                  Haptics.selectionAsync()
                  actions.setSegment(option.value)
                }}
              >
                <Text style={[
                  styles.chipText,
                  state.contact_segment === option.value && styles.chipTextSelected
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Kredi Notu</Text>
          <View style={styles.creditRatingContainer}>
            {CREDIT_RATINGS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.creditRatingChip,
                  state.credit_rating === option.value && styles.creditRatingChipSelected
                ]}
                onPress={() => {
                  Haptics.selectionAsync()
                  actions.setCreditRating(option.value)
                }}
              >
                <Text style={[
                  styles.creditRatingText,
                  state.credit_rating === option.value && styles.creditRatingTextSelected
                ]}>
                  {option.value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Card>

      <Card title="Durum" icon="toggle">
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Durum</Text>
          <View style={styles.chipsContainer}>
            {CONTACT_STATUSES.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.chip,
                  state.status === option.value && styles.chipSelected
                ]}
                onPress={() => {
                  Haptics.selectionAsync()
                  actions.setStatus(option.value as 'active' | 'passive')
                }}
              >
                <Text style={[
                  styles.chipText,
                  state.status === option.value && styles.chipTextSelected
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Aktif</Text>
          <Switch
            value={state.is_active}
            onValueChange={(value) => {
              Haptics.selectionAsync()
              actions.setIsActive(value)
            }}
            trackColor={{ false: DashboardColors.border, true: DashboardColors.primary }}
            thumbColor="#fff"
          />
        </View>
      </Card>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: DashboardSpacing.lg,
    gap: DashboardSpacing.md
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
  creditRatingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DashboardSpacing.xs
  },
  creditRatingChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DashboardColors.inputBackground,
    borderWidth: 1,
    borderColor: DashboardColors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  creditRatingChipSelected: {
    backgroundColor: DashboardColors.primary,
    borderColor: DashboardColors.primary
  },
  creditRatingText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.text,
    fontWeight: '600'
  },
  creditRatingTextSelected: {
    color: '#fff'
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  switchLabel: {
    fontSize: DashboardFontSizes.md,
    color: DashboardColors.text,
    fontWeight: '500'
  }
})
