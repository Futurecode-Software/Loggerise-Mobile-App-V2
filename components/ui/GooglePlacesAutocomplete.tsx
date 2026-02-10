/**
 * Google Places Autocomplete Component
 *
 * Google Places API (New) kullanarak adres araması yapar.
 * Inline dropdown ile sonuçları gösterir (iç içe modal sorunu yok).
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  FlatList,
} from 'react-native'
import { MapPin, Search, X } from 'lucide-react-native'
import Constants from 'expo-constants'
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme'
import { PlaceDetails } from '@/services/endpoints/locations'

// Google Places API key
const GOOGLE_API_KEY = Constants.expoConfig?.extra?.googleMapsApiKey || ''

interface GooglePlacesAutocompleteProps {
  value?: string
  onChange?: (value: string) => void
  onPlaceSelect: (place: PlaceDetails | null) => void
  placeholder?: string
  label?: string
  error?: string
}

interface PlaceSuggestion {
  placeId: string
  mainText: string
  secondaryText: string
}

export function GooglePlacesAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = 'Adres aramak için yazın...',
  label,
  error,
}: GooglePlacesAutocompleteProps) {
  const colors = Colors.light

  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState(value || '')
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<TextInput>(null)

  useEffect(() => {
    if (value !== undefined) {
      setSelectedAddress(value)
    }
  }, [value])

  // Places API (New) - Autocomplete
  const fetchSuggestions = useCallback(async (input: string) => {
    if (!input || input.length < 3) {
      setSuggestions([])
      return
    }

    if (!GOOGLE_API_KEY) {
      if (__DEV__) console.error('[GooglePlaces] API key is missing')
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(
        'https://places.googleapis.com/v1/places:autocomplete',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_API_KEY,
          },
          body: JSON.stringify({
            input,
            languageCode: 'tr',
          }),
        }
      )
      const data = await response.json()

      if (data.suggestions && data.suggestions.length > 0) {
        const mapped: PlaceSuggestion[] = data.suggestions
          .filter((s: any) => s.placePrediction)
          .map((s: any) => ({
            placeId: s.placePrediction.placeId,
            mainText: s.placePrediction.structuredFormat?.mainText?.text || '',
            secondaryText: s.placePrediction.structuredFormat?.secondaryText?.text || '',
          }))
        setSuggestions(mapped)
      } else {
        setSuggestions([])
      }
    } catch (err: unknown) {
      if (__DEV__) console.error('[GooglePlaces] Autocomplete error:', err)
      setSuggestions([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Places API (New) - Place Details
  const fetchPlaceDetails = useCallback(async (placeId: string): Promise<PlaceDetails | null> => {
    if (!GOOGLE_API_KEY) {
      if (__DEV__) console.error('[GooglePlaces] API key is missing')
      return null
    }

    try {
      const response = await fetch(
        `https://places.googleapis.com/v1/places/${placeId}`,
        {
          method: 'GET',
          headers: {
            'X-Goog-Api-Key': GOOGLE_API_KEY,
            'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,addressComponents',
          },
        }
      )
      const data = await response.json()

      if (data.formattedAddress) {
        const extracted = extractAddressComponents(data.addressComponents)

        const placeDetails: PlaceDetails = {
          address: data.formattedAddress || '',
          formatted_address: data.formattedAddress || '',
          place_id: placeId,
          latitude: data.location?.latitude || 0,
          longitude: data.location?.longitude || 0,
          ...extracted,
        }

        return placeDetails
      }
    } catch (err: unknown) {
      if (__DEV__) console.error('[GooglePlaces] Details error:', err)
    }
    return null
  }, [])

  const extractAddressComponents = (components: any[]): Partial<PlaceDetails> => {
    const result: Partial<PlaceDetails> = {}

    if (!components) return result

    for (const component of components) {
      const types = component.types

      if (types.includes('country')) {
        result.country = component.longText
        result.country_code = component.shortText
      }
      if (types.includes('administrative_area_level_1')) {
        result.state = component.longText
      }
      if (types.includes('administrative_area_level_2') || types.includes('locality')) {
        if (!result.city) {
          result.city = component.longText
        }
      }
      if (
        types.includes('administrative_area_level_3') ||
        types.includes('sublocality') ||
        types.includes('sublocality_level_1')
      ) {
        result.district = component.longText
      }
      if (types.includes('postal_code')) {
        result.postal_code = component.longText
      }
      if (types.includes('route')) {
        result.street = component.longText
      }
      if (types.includes('street_number')) {
        result.street_number = component.longText
      }
    }

    return result
  }

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text)

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }

    debounceTimeout.current = setTimeout(() => {
      fetchSuggestions(text)
    }, 500)
  }, [fetchSuggestions])

  const handleSelectSuggestion = useCallback(async (suggestion: PlaceSuggestion) => {
    setIsLoadingDetails(true)
    setSearchQuery('')
    setSuggestions([])
    setIsFocused(false)
    inputRef.current?.blur()

    const details = await fetchPlaceDetails(suggestion.placeId)
    if (details) {
      setSelectedAddress(details.formatted_address)
      onChange?.(details.formatted_address)
      onPlaceSelect(details)
    }

    setIsLoadingDetails(false)
  }, [fetchPlaceDetails, onChange, onPlaceSelect])

  const handleClear = useCallback(() => {
    setSearchQuery('')
    setSuggestions([])
    setSelectedAddress('')
    onChange?.('')
    onPlaceSelect(null)
  }, [onChange, onPlaceSelect])

  const handleFocus = useCallback(() => {
    setIsFocused(true)
  }, [])

  const handleBlur = useCallback(() => {
    // Küçük gecikme: suggestion'a tıklamadan önce blur olmasını engelle
    setTimeout(() => {
      setIsFocused(false)
    }, 200)
  }, [])

  const showResults = isFocused && (suggestions.length > 0 || isSearching || searchQuery.length >= 3)

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      )}

      {/* Seçili adres gösterimi */}
      {selectedAddress && !isFocused ? (
        <View style={[styles.selectedContainer, { borderColor: colors.border }]}>
          <MapPin size={16} color={colors.primary} />
          <Text style={[styles.selectedText, { color: colors.text }]} numberOfLines={2}>
            {selectedAddress}
          </Text>
          <TouchableOpacity
            onPress={handleClear}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      ) : (
        /* Arama input'u */
        <View style={[
          styles.inputContainer,
          {
            borderColor: error ? colors.danger : isFocused ? colors.primary : colors.border,
          },
        ]}>
          <Search size={18} color={isFocused ? colors.primary : colors.icon} />
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: colors.text }]}
            placeholder={placeholder}
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={handleSearchChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {(searchQuery.length > 0 || isLoadingDetails) && (
            isLoadingDetails ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('')
                  setSuggestions([])
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )
          )}
        </View>
      )}

      {error && (
        <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
      )}

      {/* Inline sonuç listesi */}
      {showResults && (
        <View style={[styles.resultsContainer, { borderColor: colors.border }]}>
          {isSearching ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textMuted }]}>Aranıyor...</Text>
            </View>
          ) : suggestions.length === 0 && searchQuery.length >= 3 ? (
            <View style={styles.emptyRow}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Sonuç bulunamadı</Text>
            </View>
          ) : (
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.placeId}
              keyboardShouldPersistTaps="handled"
              scrollEnabled={suggestions.length > 4}
              style={styles.resultsList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.resultItem}
                  onPress={() => handleSelectSuggestion(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.resultIcon}>
                    <MapPin size={16} color={colors.textMuted} />
                  </View>
                  <View style={styles.resultTextContainer}>
                    <Text style={[styles.resultMainText, { color: colors.text }]} numberOfLines={1}>
                      {item.mainText}
                    </Text>
                    {item.secondaryText ? (
                      <Text style={[styles.resultSecondaryText, { color: colors.textMuted }]} numberOfLines={1}>
                        {item.secondaryText}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}

      {!isFocused && !selectedAddress && (
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Adres seçince koordinatlar otomatik dolar
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
    zIndex: 10,
  },
  label: {
    ...Typography.bodySM,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  selectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    backgroundColor: '#F0FDF4',
  },
  selectedText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    ...Typography.bodySM,
    marginTop: Spacing.xs,
  },
  hint: {
    ...Typography.bodyXS,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  // Inline results
  resultsContainer: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: BorderRadius.md,
    borderBottomRightRadius: BorderRadius.md,
    backgroundColor: '#FFFFFF',
    maxHeight: 240,
    overflow: 'hidden',
  },
  resultsList: {
    maxHeight: 240,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  resultIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  resultTextContainer: {
    flex: 1,
  },
  resultMainText: {
    ...Typography.bodyMD,
    fontWeight: '500',
  },
  resultSecondaryText: {
    ...Typography.bodySM,
    marginTop: 1,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  loadingText: {
    ...Typography.bodySM,
  },
  emptyRow: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  emptyText: {
    ...Typography.bodySM,
  },
})
