import { View, StyleSheet } from 'react-native'
import { useCallback } from 'react'
import * as Haptics from 'expo-haptics'
import { Card } from '../Card'
import { FormInput } from '../FormInput'
import { SearchableSelect } from '@/components/ui'
import type { ContactFormState, SelectOption } from '@/hooks/contacts/useContactFormReducer'
import type { SearchableSelectOption } from '@/components/ui'
import { searchCountries, searchStates, searchCities } from '@/services/endpoints/locations'
import { DashboardSpacing } from '@/constants/dashboard-theme'

interface Step2Props {
  state: ContactFormState
  actions: {
    setEmail: (value: string) => void
    setPhone: (value: string) => void
    setFax: (value: string) => void
    setMainAddress: (value: string) => void
    setCountry: (value: SelectOption | null) => void
    setState: (value: SelectOption | null) => void
    setCity: (value: SelectOption | null) => void
  }
}

export function Step2Contact({ state, actions }: Step2Props) {
  // Country load function
  const loadCountries = useCallback(async (search: string): Promise<SearchableSelectOption[]> => {
    try {
      const countries = await searchCountries(search)
      return countries.map(country => ({
        value: country.id.toString(),
        label: country.name,
        subtitle: `${country.iso2?.toUpperCase() || ''} / ${country.iso3?.toUpperCase() || ''}`,
        data: country
      }))
    } catch (error) {
      if (__DEV__) console.error('Country search error:', error)
      return []
    }
  }, [])

  // State load function (depends on country)
  const loadStates = useCallback(async (search: string): Promise<SearchableSelectOption[]> => {
    if (!state.country_id) return []

    try {
      const states = await searchStates(state.country_id, search)
      return states.map(st => ({
        value: st.id.toString(),
        label: st.name,
        subtitle: st.country_name,
        data: st
      }))
    } catch (error) {
      if (__DEV__) console.error('State search error:', error)
      return []
    }
  }, [state.country_id])

  // City load function (depends on state)
  const loadCities = useCallback(async (search: string): Promise<SearchableSelectOption[]> => {
    if (!state.main_state_id) return []

    try {
      const cities = await searchCities(state.main_state_id, search)
      return cities.map(city => ({
        value: city.id.toString(),
        label: city.name,
        subtitle: city.state_name || undefined,
        data: city
      }))
    } catch (error) {
      if (__DEV__) console.error('City search error:', error)
      return []
    }
  }, [state.main_state_id])

  return (
    <View style={styles.container}>
      <Card title="İletişim Bilgileri" icon="call">
        <FormInput
          label="E-posta"
          value={state.email}
          onChangeText={actions.setEmail}
          placeholder="ornek@sirket.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <FormInput
          label="Telefon"
          value={state.phone}
          onChangeText={actions.setPhone}
          placeholder="+90 xxx xxx xx xx"
          keyboardType="phone-pad"
        />
        <FormInput
          label="Faks"
          value={state.fax}
          onChangeText={actions.setFax}
          placeholder="+90 xxx xxx xx xx"
          keyboardType="phone-pad"
        />
      </Card>

      <Card title="Adres Bilgileri" icon="location">
        <SearchableSelect
          label="Ülke"
          placeholder="Ülke seçin"
          required
          modalTitle="Ülke Seçin"
          searchPlaceholder="Ülke ara..."
          emptyMessage="Ülke bulunamadı"
          selectedOption={state.selectedCountry}
          onSelect={(option) => {
            Haptics.selectionAsync()
            actions.setCountry(option)
          }}
          onClear={() => {
            Haptics.selectionAsync()
            actions.setCountry(null)
          }}
          loadOptions={loadCountries}
        />

        {state.country_id && (
          <SearchableSelect
            label="İl / Eyalet"
            placeholder="İl / Eyalet seçin"
            modalTitle="İl / Eyalet Seçin"
            searchPlaceholder="İl / Eyalet ara..."
            emptyMessage="İl / Eyalet bulunamadı"
            selectedOption={state.selectedState}
            onSelect={(option) => {
              Haptics.selectionAsync()
              actions.setState(option)
            }}
            onClear={() => {
              Haptics.selectionAsync()
              actions.setState(null)
            }}
            loadOptions={loadStates}
          />
        )}

        {state.main_state_id && (
          <SearchableSelect
            label="İlçe / Şehir"
            placeholder="İlçe / Şehir seçin"
            modalTitle="İlçe / Şehir Seçin"
            searchPlaceholder="İlçe / Şehir ara..."
            emptyMessage="İlçe / Şehir bulunamadı"
            selectedOption={state.selectedCity}
            onSelect={(option) => {
              Haptics.selectionAsync()
              actions.setCity(option)
            }}
            onClear={() => {
              Haptics.selectionAsync()
              actions.setCity(null)
            }}
            loadOptions={loadCities}
          />
        )}

        <FormInput
          label="Ana Adres"
          value={state.main_address}
          onChangeText={actions.setMainAddress}
          placeholder="Açık adres"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </Card>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: DashboardSpacing.lg,
    gap: DashboardSpacing.md
  }
})
