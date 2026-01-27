/**
 * Google Places Autocomplete Component
 *
 * Direkt Google Places API'ye istek atar (backend proxy kullanmaz)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { MapPin } from 'lucide-react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { PlaceDetails } from '@/services/endpoints/locations';

// Google Places API key from env
// Mobil için ayrı key varsa onu kullan, yoksa genel key'i kullan
const GOOGLE_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_MOBILE ||
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

interface GooglePlacesAutocompleteProps {
  value?: string;
  onChange?: (value: string) => void;
  onPlaceSelect: (place: PlaceDetails | null) => void;
  placeholder?: string;
  label?: string;
  error?: string;
}

interface PlacePrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export function GooglePlacesAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = 'Adres aramak için yazmaya başlayın...',
  label,
  error,
}: GooglePlacesAutocompleteProps) {
  const colors = Colors.light;

  const [inputValue, setInputValue] = useState(value || '');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);
  const debounceTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (value !== undefined) {
      setInputValue(value);
    }
  }, [value]);

  const fetchPredictions = async (input: string) => {
    if (!input || input.length < 3) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    if (!GOOGLE_API_KEY) {
      console.error('[GooglePlaces] API key is missing');
      return;
    }

    setIsLoading(true);
    try {
      console.log('[GooglePlaces] Fetching predictions for:', input);

      // Direkt Google Places API'ye istek at
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        input
      )}&language=tr&components=country:tr&key=${GOOGLE_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      console.log('[GooglePlaces] API Response status:', data.status);

      if (data.status === 'OK' && data.predictions) {
        console.log('[GooglePlaces] Found predictions:', data.predictions.length);
        setPredictions(data.predictions);
        setShowPredictions(true);
      } else {
        console.log('[GooglePlaces] No predictions:', data.status, data.error_message);
        setPredictions([]);
        setShowPredictions(false);
      }
    } catch (err) {
      console.error('[GooglePlaces] Fetch error:', err);
      setPredictions([]);
      setShowPredictions(false);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlaceDetails = async (placeId: string) => {
    if (!GOOGLE_API_KEY) {
      console.error('[GooglePlaces] API key is missing');
      return null;
    }

    try {
      console.log('[GooglePlaces] Fetching place details for:', placeId);

      // Direkt Google Places API'ye istek at
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
        placeId
      )}&language=tr&fields=formatted_address,geometry,address_components,place_id&key=${GOOGLE_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.result) {
        const result = data.result;
        const extracted = extractAddressComponents(result.address_components);

        const placeDetails: PlaceDetails = {
          address: result.formatted_address || '',
          formatted_address: result.formatted_address || '',
          place_id: placeId,
          latitude: result.geometry?.location?.lat || 0,
          longitude: result.geometry?.location?.lng || 0,
          ...extracted,
        };

        console.log('[GooglePlaces] Place details:', placeDetails);
        return placeDetails;
      }
    } catch (err) {
      console.error('[GooglePlaces] Details fetch error:', err);
    }
    return null;
  };

  const extractAddressComponents = (components: any[]): Partial<PlaceDetails> => {
    const result: Partial<PlaceDetails> = {};

    if (!components) return result;

    for (const component of components) {
      const types = component.types;

      if (types.includes('country')) {
        result.country = component.long_name;
        result.country_code = component.short_name;
      }
      if (types.includes('administrative_area_level_1')) {
        result.state = component.long_name;
      }
      if (types.includes('administrative_area_level_2') || types.includes('locality')) {
        if (!result.city) {
          result.city = component.long_name;
        }
      }
      if (
        types.includes('administrative_area_level_3') ||
        types.includes('sublocality') ||
        types.includes('sublocality_level_1')
      ) {
        result.district = component.long_name;
      }
      if (types.includes('postal_code')) {
        result.postal_code = component.long_name;
      }
      if (types.includes('route')) {
        result.street = component.long_name;
      }
      if (types.includes('street_number')) {
        result.street_number = component.long_name;
      }
    }

    return result;
  };

  const handleTextChange = (text: string) => {
    setInputValue(text);
    onChange?.(text);

    // Debounce API calls
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      fetchPredictions(text);
    }, 500);
  };

  const handleSelectPrediction = async (prediction: PlacePrediction) => {
    setInputValue(prediction.description);
    setShowPredictions(false);
    setPredictions([]);

    const details = await fetchPlaceDetails(prediction.place_id);
    if (details) {
      onChange?.(details.formatted_address);
      onPlaceSelect(details);
    }
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      )}

      <View style={styles.inputWrapper}>
        <View style={styles.iconContainer}>
          <MapPin size={18} color={colors.icon} />
        </View>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: error ? colors.danger : colors.border,
              color: colors.text,
            },
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={inputValue}
          onChangeText={handleTextChange}
          onFocus={() => {
            if (predictions.length > 0) {
              setShowPredictions(true);
            }
          }}
        />
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}
      </View>

      {showPredictions && predictions.length > 0 && (
        <View style={[styles.predictionsContainer, { borderColor: colors.border }]}>
          <FlatList
            data={predictions}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.predictionItem, { borderBottomColor: colors.border }]}
                onPress={() => handleSelectPrediction(item)}
              >
                <Text style={[styles.mainText, { color: colors.text }]}>
                  {item.structured_formatting.main_text}
                </Text>
                <Text style={[styles.secondaryText, { color: colors.textMuted }]}>
                  {item.structured_formatting.secondary_text}
                </Text>
              </TouchableOpacity>
            )}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}

      {error && (
        <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
      )}

      <Text style={[styles.hint, { color: colors.textMuted }]}>
        Adres seçince koordinatlar otomatik dolar
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
    zIndex: 1000,
  },
  label: {
    ...Typography.bodySM,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    position: 'absolute',
    left: Spacing.md,
    zIndex: 1,
  },
  input: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingLeft: 40,
    paddingRight: Spacing.md,
    fontSize: 15,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    position: 'absolute',
    right: Spacing.md,
  },
  predictionsContainer: {
    maxHeight: 200,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xs,
    backgroundColor: '#FFFFFF',
  },
  predictionItem: {
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  mainText: {
    ...Typography.bodyMD,
    fontWeight: '500',
    marginBottom: 2,
  },
  secondaryText: {
    ...Typography.bodySM,
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
});
