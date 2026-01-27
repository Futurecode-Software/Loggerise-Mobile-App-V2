/**
 * Locations API Endpoints
 *
 * Handles country, state, city lookups for address forms
 */

import api, { getErrorMessage } from '../api';

/**
 * Location option for selects
 */
export interface LocationOption {
  value: string | number;
  label: string;
}

/**
 * Get countries with search
 */
export async function searchCountries(search?: string): Promise<LocationOption[]> {
  try {
    const response = await api.get<{ success: boolean; data: any[] }>(
      '/locations/countries',
      { params: { search } }
    );
    // Map backend response (id, name) to frontend format (value, label)
    return response.data.data.map((item: any) => ({
      value: item.id,
      label: item.name,
    }));
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get states by country with search
 */
export async function searchStates(
  countryId: number | string,
  search?: string
): Promise<LocationOption[]> {
  try {
    const response = await api.get<{ success: boolean; data: any[] }>(
      '/locations/states',
      { params: { country_id: countryId, search } }
    );
    // Map backend response (id, name) to frontend format (value, label)
    return response.data.data.map((item: any) => ({
      value: item.id,
      label: item.name,
    }));
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get cities by state with search
 */
export async function searchCities(
  stateId: number | string,
  countryId?: number | string,
  search?: string
): Promise<LocationOption[]> {
  try {
    const response = await api.get<{ success: boolean; data: any[] }>(
      '/locations/cities',
      {
        params: {
          state_id: stateId,
          country_id: countryId,
          search,
        },
      }
    );
    // Map backend response (id, name) to frontend format (value, label)
    return response.data.data.map((item: any) => ({
      value: item.id,
      label: item.name,
    }));
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Place details from Google Maps
 */
export interface PlaceDetails {
  address: string;
  formatted_address: string;
  place_id: string;
  latitude: number;
  longitude: number;
  country?: string;
  country_code?: string;
  state?: string;
  city?: string;
  district?: string;
  postal_code?: string;
  street?: string;
  street_number?: string;
}

/**
 * Location lookup response
 */
interface LocationLookupResponse {
  country_id?: number;
  state_id?: number;
  city_id?: number;
}

/**
 * Lookup location IDs from Google Maps place details
 */
export async function lookupLocation(place: Partial<PlaceDetails>): Promise<LocationLookupResponse> {
  try {
    const response = await api.post<{ success: boolean; data: LocationLookupResponse }>(
      '/locations/lookup',
      {
        country_code: place.country_code,
        country_name: place.country,
        state_name: place.state,
        city_name: place.city || place.district,
      }
    );
    return response.data.data || {};
  } catch (error) {
    console.error('Location lookup error:', error);
    return {}; // Silent fail - user can manually select
  }
}
