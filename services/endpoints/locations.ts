/**
 * Locations API Endpoints
 *
 * Handles location data (countries, states, cities, tax offices) for mobile app.
 */

import api, { getErrorMessage } from '../api';

/**
 * Location entity interfaces
 */
export interface Country {
  id: number;
  name: string;
  code?: string;
  phone_code?: string;
}

export interface State {
  id: number;
  name: string;
  country_id: number;
  code?: string;
}

export interface City {
  id: number;
  name: string;
  state_id: number;
  country_id?: number;
}

export interface TaxOffice {
  id: number;
  name: string;
  code?: string;
}

/**
 * Search response wrapper
 */
interface LocationSearchResponse<T> {
  success: boolean;
  data: T[];
}

/**
 * Search countries by name
 */
export async function searchCountries(query?: string): Promise<Country[]> {
  try {
    const response = await api.get<LocationSearchResponse<Country>>('/locations/countries', {
      params: { search: query || '' },
    });
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Search states/provinces by country
 */
export async function searchStates(countryId?: number, query?: string): Promise<State[]> {
  try {
    const response = await api.get<LocationSearchResponse<State>>('/locations/states', {
      params: {
        country_id: countryId,
        search: query || '',
      },
    });
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Search cities/districts by state
 */
export async function searchCities(stateId?: number, query?: string): Promise<City[]> {
  try {
    const response = await api.get<LocationSearchResponse<City>>('/locations/cities', {
      params: {
        state_id: stateId,
        search: query || '',
      },
    });
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Search tax offices by name
 */
export async function searchTaxOffices(query?: string): Promise<TaxOffice[]> {
  try {
    const response = await api.get<LocationSearchResponse<TaxOffice>>('/locations/tax-offices', {
      params: { search: query || '' },
    });
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get Turkey country ID (constant)
 */
export const TURKEY_ID = 228;

/**
 * Foreign company default tax number (constant)
 */
export const FOREIGN_DEFAULT_TAX_NUMBER = '22222222222';
