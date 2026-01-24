/**
 * Contacts API Endpoints
 *
 * Handles contact (cari) management operations.
 */

import api, { getErrorMessage, PaginatedResponse } from '../api';

/**
 * Contact type enum
 */
export type ContactType = 'company' | 'individual' | 'self';

/**
 * Contact status enum
 */
export type ContactStatus = 'active' | 'passive' | 'blacklisted';

/**
 * Contact entity
 */
export interface Contact {
  id: number;
  code: string;
  name: string;
  short_name?: string;
  type: ContactType;
  status: ContactStatus;
  is_customer: boolean;
  is_supplier: boolean;
  email?: string;
  phone?: string;
  tax_number?: string;
  identity_number?: string;
  tax_office?: {
    id: number;
    name: string;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Contact with details (addresses and authorities)
 */
export interface ContactDetail extends Contact {
  addresses: ContactAddress[];
  authorities: ContactAuthority[];
}

/**
 * Contact address
 */
export interface ContactAddress {
  id: number;
  contact_id: number;
  title: string;
  address_type: 'billing' | 'shipping' | 'both';
  address_line_1?: string;
  address_line_2?: string;
  country?: { id: number; name: string };
  state?: { id: number; name: string };
  city?: { id: number; name: string };
  postal_code?: string;
  phone?: string;
  email?: string;
  is_default: boolean;
  is_active: boolean;
}

/**
 * Contact authority (yetkili kisi)
 */
export interface ContactAuthority {
  id: number;
  contact_id: number;
  name: string;
  title?: string;
  department?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  is_primary: boolean;
  is_active: boolean;
}

/**
 * Contact list filters
 */
export interface ContactFilters {
  search?: string;
  type?: ContactType;
  status?: ContactStatus;
  is_active?: boolean;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

/**
 * Pagination info
 */
export interface Pagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number | null;
  to: number | null;
}

/**
 * Contacts list response
 */
interface ContactsListResponse {
  success: boolean;
  data: {
    contacts: Contact[];
    pagination: Pagination;
  };
}

/**
 * Single contact response
 */
interface ContactResponse {
  success: boolean;
  data: ContactDetail;
}

/**
 * Create/Update contact data
 */
export interface ContactFormData {
  name: string;
  short_name?: string;
  type: ContactType;
  status?: ContactStatus;
  is_customer?: boolean;
  is_supplier?: boolean;
  email?: string;
  phone?: string;
  tax_number?: string;
  identity_number?: string;
  tax_office_id?: number;
  addresses?: Partial<ContactAddress>[];
  authorities?: Partial<ContactAuthority>[];
}

/**
 * Get contacts list with optional filters
 */
export async function getContacts(
  filters?: ContactFilters
): Promise<{ contacts: Contact[]; pagination: Pagination }> {
  try {
    const response = await api.get<ContactsListResponse>('/contacts', {
      params: filters,
    });
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get single contact by ID
 */
export async function getContact(id: number): Promise<ContactDetail> {
  try {
    const response = await api.get<ContactResponse>(`/contacts/${id}`);
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Create new contact
 */
export async function createContact(data: ContactFormData): Promise<ContactDetail> {
  try {
    const response = await api.post<ContactResponse>('/contacts', data);
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Update existing contact
 */
export async function updateContact(
  id: number,
  data: Partial<ContactFormData>
): Promise<ContactDetail> {
  try {
    const response = await api.put<ContactResponse>(`/contacts/${id}`, data);
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Delete contact
 */
export async function deleteContact(id: number): Promise<void> {
  try {
    await api.delete(`/contacts/${id}`);
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

// ============================================
// ADDRESS MANAGEMENT
// ============================================

/**
 * Address form data for create/update
 */
export interface AddressFormData {
  title: string;
  address_line_1: string;
  address_line_2?: string;
  country_id?: number;
  state_id?: number;
  city_id?: number;
  postal_code?: string;
  phone?: string;
  email?: string;
  address_type: 'billing' | 'shipping' | 'both';
  is_default?: boolean;
  is_active?: boolean;
}

/**
 * Create new address for contact
 */
export async function createContactAddress(
  contactId: number,
  data: AddressFormData
): Promise<ContactAddress> {
  try {
    const response = await api.post<{ success: boolean; data: ContactAddress }>(
      `/contacts/${contactId}/addresses`,
      data
    );
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Update existing address
 */
export async function updateContactAddress(
  contactId: number,
  addressId: number,
  data: Partial<AddressFormData>
): Promise<ContactAddress> {
  try {
    const response = await api.put<{ success: boolean; data: ContactAddress }>(
      `/contacts/${contactId}/addresses/${addressId}`,
      data
    );
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Delete address
 */
export async function deleteContactAddress(
  contactId: number,
  addressId: number
): Promise<void> {
  try {
    await api.delete(`/contacts/${contactId}/addresses/${addressId}`);
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

// ============================================
// AUTHORITY MANAGEMENT
// ============================================

/**
 * Authority form data for create/update
 */
export interface AuthorityFormData {
  name: string;
  title?: string;
  department?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  is_primary?: boolean;
  is_active?: boolean;
}

/**
 * Create new authority for contact
 */
export async function createContactAuthority(
  contactId: number,
  data: AuthorityFormData
): Promise<ContactAuthority> {
  try {
    const response = await api.post<{ success: boolean; data: ContactAuthority }>(
      `/contacts/${contactId}/authorities`,
      data
    );
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Update existing authority
 */
export async function updateContactAuthority(
  contactId: number,
  authorityId: number,
  data: Partial<AuthorityFormData>
): Promise<ContactAuthority> {
  try {
    const response = await api.put<{ success: boolean; data: ContactAuthority }>(
      `/contacts/${contactId}/authorities/${authorityId}`,
      data
    );
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Delete authority
 */
export async function deleteContactAuthority(
  contactId: number,
  authorityId: number
): Promise<void> {
  try {
    await api.delete(`/contacts/${contactId}/authorities/${authorityId}`);
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}
