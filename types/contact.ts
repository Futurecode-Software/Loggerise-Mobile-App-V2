export type ContactStatus = 'active' | 'passive' | 'blacklist'
export type ContactSegment = 'enterprise' | 'mid_market' | 'small_business' | 'individual'
export type LegalType = 'company' | 'individual' | 'government' | 'public'
export type ContactType = 'customer' | 'supplier' | 'both' | 'self' | 'potential' | 'other'
export type BusinessType = 'customs_agent' | 'logistics_partner' | 'bank' | 'insurance' | 'other'
export type AddressType = 'pickup' | 'delivery' | 'both'

export interface ContactAddress {
  id: number
  contact_id?: number
  title: string
  address: string
  country_id?: number
  country?: { id: number; name: string } | null
  state_id?: number
  state?: { id: number; name: string } | null
  city_id?: number
  city?: { id: number; name: string } | null
  postal_code?: string
  phone?: string
  fax?: string
  email?: string
  is_main?: boolean
  is_billing?: boolean
  is_shipping?: boolean
  is_default?: boolean
  address_type?: 'billing' | 'shipping' | 'both'
  sort_order?: number
  is_active?: boolean
}

export interface ContactAuthority {
  id?: number
  name: string
  title?: string
  department?: string
  email?: string
  phone?: string
  mobile?: string
  is_primary?: boolean
  notes?: string
  sort_order?: number
  is_active?: boolean
}

export interface Contact {
  id: number
  code: string
  type: ContactType
  business_type?: BusinessType
  legal_type: LegalType
  name: string
  short_name: string
  category?: string
  customer_segment?: ContactSegment
  credit_rating?: number
  default_payment_terms?: number
  email?: string
  phone?: string
  fax?: string
  iban?: string[]
  tax_number?: string
  tax_office_id?: number
  tax_office?: {
    id: number
    name: string
  } | null
  efatura_kayitli?: boolean
  earsiv_kayitli?: boolean
  efatura_alias?: string
  efatura_profil?: string
  efatura_sorgulama_tarihi?: string
  currency_type: string
  status: ContactStatus
  sort_order?: number
  is_active: boolean
  country_id?: number
  country?: {
    id: number
    name: string
  } | null
  main_address?: string
  main_state_id?: number
  main_state?: {
    id: number
    name: string
  } | null
  main_city_id?: number
  main_city?: {
    id: number
    name: string
  } | null
  main_latitude?: number
  main_longitude?: number
  main_place_id?: string
  main_formatted_address?: string
  risk_limit?: number
  addresses?: ContactAddress[]
  authorities?: ContactAuthority[]
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface ContactFormData {
  type: ContactType
  business_type?: BusinessType
  legal_type: LegalType
  name: string
  short_name: string
  category?: string
  customer_segment?: ContactSegment
  credit_rating?: number
  default_payment_terms?: number
  email?: string
  phone?: string
  fax?: string
  iban?: string[]
  tax_number?: string
  tax_office_id?: number
  efatura_kayitli?: boolean
  earsiv_kayitli?: boolean
  efatura_alias?: string
  efatura_profil?: string
  currency_type: string
  status: ContactStatus
  sort_order?: number
  is_active: boolean
  country_id?: number
  main_address?: string
  main_state_id?: number
  main_city_id?: number
  main_latitude?: number
  main_longitude?: number
  main_place_id?: string
  main_formatted_address?: string
  risk_limit?: number
  addresses?: ContactAddress[]
  authorities?: ContactAuthority[]
}

export interface ContactListFilters {
  search?: string
  status?: ContactStatus | 'all'
  type?: ContactType
  segment?: ContactSegment
  is_active?: boolean
  page?: number
  perPage?: number
}

export interface ContactListResponse {
  contacts: Contact[]
  pagination: {
    current_page: number
    per_page: number
    total: number
    last_page: number
    from: number
    to: number
  }
}
