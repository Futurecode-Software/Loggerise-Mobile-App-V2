import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useCallback } from 'react'
import * as Haptics from 'expo-haptics'
import { Card } from '../Card'
import { FormInput } from '../FormInput'
import { SearchableSelect } from '@/components/ui'
import type { ContactFormState, SelectOption } from '@/hooks/contacts/useContactFormReducer'
import type { SearchableSelectOption } from '@/components/ui'
import { CURRENCIES } from '@/constants/contacts/contactFormOptions'
import { searchTaxOffices } from '@/services/endpoints/locations'
import { DashboardColors, DashboardSpacing, DashboardFontSizes, DashboardBorderRadius } from '@/constants/dashboard-theme'

interface Step3Props {
  state: ContactFormState
  actions: {
    setName: (value: string) => void
    setTaxNumber: (value: string) => void
    setTaxOffice: (value: SelectOption | null) => void
    setCurrency: (value: string) => void
    setPaymentTerms: (value: number | null) => void
    setRiskLimit: (value: number | null) => void
  }
}

export function Step3Financial({ state, actions }: Step3Props) {
  // E-Fatura query effect (debounced) - TODO: Implement with /invoice-data/efatura-user/query
  /* Temporarily disabled until queryTaxNumber endpoint is implemented
  useEffect(() => {
    // Clear previous timeout
    if (taxNumberTimeoutRef.current) {
      clearTimeout(taxNumberTimeoutRef.current)
    }

    // Only query if tax number is 10 or 11 digits
    if (state.tax_number.length === 10 || state.tax_number.length === 11) {
      taxNumberTimeoutRef.current = setTimeout(async () => {
        setIsQueryingTaxNumber(true)

        try {
          const result = await queryTaxNumber(state.tax_number)

          if (result && result.efatura_kayitli) {
            // Auto-fill company name if empty
            if (!state.name && result.unvan) {
              actions.setName(result.unvan)
            }

            Toast.show({
              type: 'success',
              text1: 'E-Fatura mükellefi bulundu',
              text2: result.unvan,
              position: 'top',
              visibilityTime: 2000
            })
          } else if (result && !result.efatura_kayitli) {
            Toast.show({
              type: 'info',
              text1: 'E-Fatura mükellefi değil',
              text2: result.unvan || 'Bilgileri manuel girebilirsiniz',
              position: 'top',
              visibilityTime: 2000
            })

            // Auto-fill company name anyway
            if (!state.name && result.unvan) {
              actions.setName(result.unvan)
            }
          } else {
            Toast.show({
              type: 'info',
              text1: 'Vergi numarası bulunamadı',
              text2: 'Bilgileri manuel girebilirsiniz',
              position: 'top',
              visibilityTime: 2000
            })
          }
        } catch (error) {
          if (__DEV__) console.error('E-Fatura query error:', error)
        } finally {
          setIsQueryingTaxNumber(false)
        }
      }, 800) // 800ms debounce
    }

    return () => {
      if (taxNumberTimeoutRef.current) {
        clearTimeout(taxNumberTimeoutRef.current)
      }
    }
  }, [state.tax_number])
  */

  // Tax office load function
  const loadTaxOffices = useCallback(async (search: string): Promise<SearchableSelectOption[]> => {
    try {
      const offices = await searchTaxOffices(undefined, search)
      return offices.map(office => ({
        value: office.id.toString(),
        label: office.name,
        subtitle: office.province ? `${office.code} - ${office.province}` : office.code,
        data: office
      }))
    } catch (error) {
      if (__DEV__) console.error('Tax office search error:', error)
      return []
    }
  }, [])

  return (
    <View style={styles.container}>
      <Card title="Vergi Bilgileri" icon="document-text">
        <View>
          <FormInput
            label="Vergi Kimlik No"
            value={state.tax_number}
            onChangeText={(text) => {
              const numbersOnly = text.replace(/[^0-9]/g, '').slice(0, 11)
              actions.setTaxNumber(numbersOnly)
            }}
            placeholder="11 haneli vergi kimlik numarası"
            keyboardType="number-pad"
            maxLength={11}
          />
          {/* E-Fatura query indicator - disabled for now
          {isQueryingTaxNumber && (
            <View style={styles.queryingIndicator}>
              <ActivityIndicator size="small" color={DashboardColors.primary} />
              <Text style={styles.queryingText}>E-Fatura sorgulanıyor...</Text>
            </View>
          )}
          */}
        </View>

        <SearchableSelect
          label="Vergi Dairesi"
          placeholder="Vergi dairesi seçin"
          modalTitle="Vergi Dairesi Seçin"
          searchPlaceholder="Vergi dairesi ara..."
          emptyMessage="Vergi dairesi bulunamadı"
          selectedOption={state.selectedTaxOffice}
          onSelect={(option) => {
            Haptics.selectionAsync()
            actions.setTaxOffice(option)
          }}
          onClear={() => {
            Haptics.selectionAsync()
            actions.setTaxOffice(null)
          }}
          loadOptions={loadTaxOffices}
        />
      </Card>

      <Card title="Mali Bilgiler" icon="cash">
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Para Birimi</Text>
          <View style={styles.chipsContainer}>
            {CURRENCIES.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.chip,
                  state.currency_type === option.value && styles.chipSelected
                ]}
                onPress={() => {
                  Haptics.selectionAsync()
                  actions.setCurrency(option.value)
                }}
              >
                <Text style={[
                  styles.chipText,
                  state.currency_type === option.value && styles.chipTextSelected
                ]}>
                  {option.value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <FormInput
          label="Varsayılan Ödeme Vadesi (Gün)"
          value={state.default_payment_terms?.toString() || ''}
          onChangeText={(text) => {
            const value = text.replace(/[^0-9]/g, '')
            actions.setPaymentTerms(value ? parseInt(value, 10) : null)
          }}
          placeholder="Örn: 30"
          keyboardType="number-pad"
        />

        <FormInput
          label="Risk Limiti"
          value={state.risk_limit?.toString() || ''}
          onChangeText={(text) => {
            const value = text.replace(/[^0-9.]/g, '')
            actions.setRiskLimit(value ? parseFloat(value) : null)
          }}
          placeholder="Limitsiz bırakmak için boş bırakın"
          keyboardType="decimal-pad"
        />
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
  queryingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    marginTop: DashboardSpacing.xs,
    paddingHorizontal: DashboardSpacing.xs
  },
  queryingText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textMuted,
    fontStyle: 'italic'
  }
})
