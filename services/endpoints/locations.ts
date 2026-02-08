/**
 * Locations API Endpoints
 *
 * Handles country, state, city lookups for address forms
 */

import api, { getErrorMessage } from '../api';

/**
 * Constants
 */
export const TURKEY_ID = 1;
export const FOREIGN_DEFAULT_TAX_NUMBER = '0000000000';

/**
 * Location types
 */
export interface Country {
  id: number;
  name: string;
  code: string;
}

export interface State {
  id: number;
  name: string;
  country_id: number;
}

export interface City {
  id: number;
  name: string;
  state_id: number;
}

export interface TaxOffice {
  id: number;
  name: string;
  code: string;
  city_id: number;
}

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
    if (__DEV__) console.error('Location lookup error:', error);
    return {}; // Silent fail - user can manually select
  }
}

/**
 * Search tax offices by city
 */
export async function searchTaxOffices(
  cityId?: number | string,
  search?: string
): Promise<LocationOption[]> {
  try {
    const response = await api.get<{ success: boolean; data: TaxOffice[] }>(
      '/locations/tax-offices',
      {
        params: {
          city_id: cityId,
          search,
        },
      }
    );
    return response.data.data.map((item) => ({
      value: item.id,
      label: item.name,
    }));
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Port info
 */
export interface Port {
  id: number;
  name: string;
  port_code?: string;
}

/**
 * Ferry company info
 */
export interface FerryCompany {
  id: number;
  name: string;
  short_code?: string;
}

/**
 * Search ports by name/code
 */
export async function searchPorts(search?: string): Promise<Port[]> {
  try {
    const response = await api.get<{ success: boolean; data: Port[] }>(
      '/locations/ports',
      { params: { search } }
    );
    return response.data.data || [];
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Search ferry companies by name/code
 */
export async function searchFerryCompanies(search?: string): Promise<FerryCompany[]> {
  try {
    const response = await api.get<{ success: boolean; data: FerryCompany[] }>(
      '/locations/ferry-companies',
      { params: { search } }
    );
    return response.data.data || [];
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}
