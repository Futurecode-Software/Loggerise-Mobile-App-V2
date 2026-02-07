/**
 * Google Places Autocomplete Component
 *
 * Google Places API (New) kullanarak adres araması yapar.
 * BottomSheet modal ile sonuçları gösterir.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import {
  BottomSheetModal,
  BottomSheetFlatList,
  BottomSheetBackdrop,
  BottomSheetTextInput,
  useBottomSheetSpringConfigs,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet'
import { MapPin, Search, X } from 'lucide-react-native'
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme'
import { PlaceDetails } from '@/services/endpoints/locations'

// Google Places API key
const GOOGLE_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_MOBILE ||
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || ''

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
  placeholder = 'Adres aramak için tıklayın...',
  label,
  error,
}: GooglePlacesAutocompleteProps) {
  const colors = Colors.light

  const [displayValue, setDisplayValue] = useState(value || '')
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const bottomSheetRef = useRef<BottomSheetModal>(null)

  useEffect(() => {
    if (value !== undefined) {
      setDisplayValue(value)
    }
  }, [value])

  const snapPoints = useMemo(() => ['92%'], [])

  const animationConfigs = useBottomSheetSpringConfigs({
    damping: 80,
    overshootClamping: true,
    stiffness: 500,
  })

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  )

  // Places API (New) - Autocomplete
  const fetchSuggestions = useCallback(async (input: string) => {
    if (!input || input.length < 3) {
      setSuggestions([])
      return
    }

    if (!GOOGLE_API_KEY) {
      console.error('[GooglePlaces] API key is missing')
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
      console.error('[GooglePlaces] Autocomplete error:', err)
      setSuggestions([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Places API (New) - Place Details
  const fetchPlaceDetails = useCallback(async (placeId: string): Promise<PlaceDetails | null> => {
    if (!GOOGLE_API_KEY) {
      console.error('[GooglePlaces] API key is missing')
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
      console.error('[GooglePlaces] Details error:', err)
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
    bottomSheetRef.current?.dismiss()

    const details = await fetchPlaceDetails(suggestion.placeId)
    if (details) {
      setDisplayValue(details.formatted_address)
      onChange?.(details.formatted_address)
      onPlaceSelect(details)
    }

    setIsLoadingDetails(false)
  }, [fetchPlaceDetails, onChange, onPlaceSelect])

  const handleOpenModal = useCallback(() => {
    setSearchQuery('')
    setSuggestions([])
    bottomSheetRef.current?.present()
  }, [])

  const handleDismiss = useCallback(() => {
    setSearchQuery('')
    setSuggestions([])
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }
  }, [])

  const renderItem = useCallback(
    ({ item }: { item: PlaceSuggestion }) => (
      <TouchableOpacity
        style={styles.item}
        onPress={() => handleSelectSuggestion(item)}
        activeOpacity={0.7}
      >
        <View style={styles.itemIcon}>
          <MapPin size={18} color={colors.textMuted} />
        </View>
        <View style={styles.itemTextContainer}>
          <Text style={[styles.itemMainText, { color: colors.text }]} numberOfLines={1}>
            {item.mainText}
          </Text>
          {item.secondaryText ? (
            <Text style={[styles.itemSecondaryText, { color: colors.textMuted }]} numberOfLines={1}>
              {item.secondaryText}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    ),
    [colors, handleSelectSuggestion]
  )

  const renderEmpty = useCallback(() => {
    if (isSearching) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>Aranıyor...</Text>
        </View>
      )
    }

    if (searchQuery.length > 0 && searchQuery.length < 3) {
      return (
        <View style={styles.emptyContainer}>
          <Search size={48} color={colors.textMuted} strokeWidth={1.5} />
          <Text style={[styles.emptyText, { color: colors.text }]}>En az 3 karakter yazın</Text>
        </View>
      )
    }

    if (searchQuery.length >= 3) {
      return (
        <View style={styles.emptyContainer}>
          <Search size={48} color={colors.textMuted} strokeWidth={1.5} />
          <Text style={[styles.emptyText, { color: colors.text }]}>Sonuç bulunamadı</Text>
        </View>
      )
    }

    return (
      <View style={styles.emptyContainer}>
        <MapPin size={48} color={colors.textMuted} strokeWidth={1.5} />
        <Text style={[styles.emptyText, { color: colors.text }]}>Adres aramak için yazın</Text>
        <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
          En az 3 karakter girin
        </Text>
      </View>
    )
  }, [isSearching, searchQuery, colors])

  const renderHeader = useCallback(() => (
    <>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: colors.text }]}>Adres Ara</Text>
          {suggestions.length > 0 && (
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {suggestions.length} sonuç
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={() => bottomSheetRef.current?.dismiss()}
          style={styles.closeButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={24} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={[styles.searchContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <Search size={20} color={colors.icon} />
        <BottomSheetTextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Adres veya yer adı yazın..."
          placeholderTextColor={colors.placeholder}
          value={searchQuery}
          onChangeText={handleSearchChange}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setSearchQuery('')
              setSuggestions([])
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </>
  ), [suggestions.length, searchQuery, colors, handleSearchChange])

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      )}

      {/* Tıklanabilir input alanı */}
      <TouchableOpacity
        style={[
          styles.inputTouchable,
          {
            borderColor: error ? colors.danger : colors.border,
          },
        ]}
        onPress={handleOpenModal}
        activeOpacity={0.7}
      >
        <MapPin size={18} color={colors.icon} />
        <Text
          style={[
            styles.inputText,
            {
              color: displayValue ? colors.text : colors.textMuted,
            },
          ]}
          numberOfLines={1}
        >
          {displayValue || placeholder}
        </Text>
        {isLoadingDetails && (
          <ActivityIndicator size="small" color={colors.primary} />
        )}
      </TouchableOpacity>

      {error && (
        <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
      )}

      <Text style={[styles.hint, { color: colors.textMuted }]}>
        Adres seçince koordinatlar otomatik dolar
      </Text>

      {/* BottomSheet Modal */}
      <BottomSheetModal
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose
        enableContentPanningGesture={false}
        enableDynamicSizing={false}
        animateOnMount
        animationConfigs={animationConfigs}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.background}
        handleIndicatorStyle={styles.handleIndicator}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        onDismiss={handleDismiss}
      >
        {renderHeader()}

        <BottomSheetFlatList
          data={suggestions}
          renderItem={renderItem}
          keyExtractor={(item: PlaceSuggestion) => item.placeId}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      </BottomSheetModal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.bodySM,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  inputTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: '#FFFFFF',
  },
  inputText: {
    flex: 1,
    fontSize: 15,
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
  // BottomSheet styles
  background: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  handleIndicator: {
    backgroundColor: '#9CA3AF',
    width: 48,
    height: 5,
    borderRadius: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    ...Typography.headingLG,
    marginBottom: 2,
  },
  subtitle: {
    ...Typography.bodySM,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    ...Typography.bodyMD,
    paddingVertical: Spacing.xs,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    marginBottom: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemMainText: {
    ...Typography.bodyMD,
    fontWeight: '500',
    marginBottom: 2,
  },
  itemSecondaryText: {
    ...Typography.bodySM,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['5xl'],
    paddingHorizontal: Spacing['2xl'],
  },
  emptyText: {
    ...Typography.bodyLG,
    fontWeight: '500',
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  emptySubtext: {
    ...Typography.bodySM,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
})
