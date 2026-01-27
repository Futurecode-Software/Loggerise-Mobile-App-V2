import api from '../api';

export interface TaxOffice {
  id: number;
  name: string;
  code?: string;
  city?: string;
}

export interface TaxOfficeSearchParams {
  search?: string;
  limit?: number;
}

/**
 * Search tax offices by name or code
 */
export const searchTaxOffices = async (params: TaxOfficeSearchParams): Promise<TaxOffice[]> => {
  const response = await api.get('/locations/tax-offices', { params });
  return response.data.data || [];
};

/**
 * Get a single tax office by ID
 */
export const getTaxOffice = async (id: number): Promise<TaxOffice> => {
  const response = await api.get(`/tax-offices/${id}`);
  return response.data.data;
};
