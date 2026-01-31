/**
 * Contact Form Reducer Hook
 *
 * Context7 Best Practice: useReducer for complex state with multiple related fields
 * Source: https://react.dev/reference/react/useReducer
 */

import { useReducer, useCallback, useMemo } from 'react'
import type { Contact, ContactType, BusinessType, LegalType, ContactSegment, ContactStatus, ContactAddress, ContactAuthority } from '@/types/contact'
import { loadContactDataToState } from '@/utils/contacts/transformers'

export interface SelectOption {
  value: string
  label: string
}

export interface ContactFormState {
  // Step 1: Temel Bilgiler
  type: ContactType
  business_type: BusinessType | ''
  legal_type: LegalType
  name: string
  short_name: string
  category: string
  contact_segment: ContactSegment | ''
  credit_rating: number | null
  is_active: boolean
  status: 'active' | 'passive'

  // Step 2: İletişim Bilgileri
  email: string
  phone: string
  fax: string
  main_address: string
  country_id: number | null
  main_state_id: number | null
  main_city_id: number | null

  // Step 3: Mali Bilgiler
  tax_number: string
  tax_office_id: number | null
  currency_type: string
  default_payment_terms: number | null
  risk_limit: number | null

  // Step 4: Adresler
  addresses: ContactAddress[]

  // Step 5: Yetkili Kişiler
  authorities: ContactAuthority[]

  // Select Options
  selectedCountry: SelectOption | null
  selectedState: SelectOption | null
  selectedCity: SelectOption | null
  selectedTaxOffice: SelectOption | null
}

// Default değerler
const getDefaultAddress = (): ContactAddress => ({
  title: '',
  address: '',
  country_id: null,
  state_id: null,
  city_id: null,
  postal_code: null,
  latitude: null,
  longitude: null,
  phone: null,
  fax: null,
  is_main: false,
  is_billing: false,
  is_shipping: false,
  address_type: null,
  is_active: true
})

const getDefaultAuthority = (): ContactAuthority => ({
  name: '',
  title: null,
  department: null,
  email: null,
  phone: null,
  mobile: null,
  is_primary: false,
  notes: null,
  is_active: true
})

const initialState: ContactFormState = {
  type: 'customer',
  business_type: '',
  legal_type: 'company',
  name: '',
  short_name: '',
  category: '',
  contact_segment: '',
  credit_rating: null,
  is_active: true,
  status: 'active',

  email: '',
  phone: '',
  fax: '',
  main_address: '',
  country_id: null,
  main_state_id: null,
  main_city_id: null,

  tax_number: '',
  tax_office_id: null,
  currency_type: 'TRY',
  default_payment_terms: null,
  risk_limit: null,

  addresses: [],
  authorities: [],

  selectedCountry: null,
  selectedState: null,
  selectedCity: null,
  selectedTaxOffice: null
}

type FormAction =
  | { type: 'SET_NAME'; payload: string }
  | { type: 'SET_SHORT_NAME'; payload: string }
  | { type: 'SET_TYPE'; payload: ContactType }
  | { type: 'SET_BUSINESS_TYPE'; payload: BusinessType | '' }
  | { type: 'SET_LEGAL_TYPE'; payload: LegalType }
  | { type: 'SET_CATEGORY'; payload: string }
  | { type: 'SET_SEGMENT'; payload: ContactSegment | '' }
  | { type: 'SET_CREDIT_RATING'; payload: number | null }
  | { type: 'SET_IS_ACTIVE'; payload: boolean }
  | { type: 'SET_STATUS'; payload: 'active' | 'passive' }
  | { type: 'SET_EMAIL'; payload: string }
  | { type: 'SET_PHONE'; payload: string }
  | { type: 'SET_FAX'; payload: string }
  | { type: 'SET_MAIN_ADDRESS'; payload: string }
  | { type: 'SET_COUNTRY'; payload: SelectOption | null }
  | { type: 'SET_STATE'; payload: SelectOption | null }
  | { type: 'SET_CITY'; payload: SelectOption | null }
  | { type: 'SET_TAX_NUMBER'; payload: string }
  | { type: 'SET_TAX_OFFICE'; payload: SelectOption | null }
  | { type: 'SET_CURRENCY'; payload: string }
  | { type: 'SET_PAYMENT_TERMS'; payload: number | null }
  | { type: 'SET_RISK_LIMIT'; payload: number | null }
  | { type: 'ADD_ADDRESS' }
  | { type: 'REMOVE_ADDRESS'; payload: number }
  | { type: 'UPDATE_ADDRESS'; payload: { index: number; field: keyof ContactAddress; value: any } }
  | { type: 'ADD_AUTHORITY' }
  | { type: 'REMOVE_AUTHORITY'; payload: number }
  | { type: 'UPDATE_AUTHORITY'; payload: { index: number; field: keyof ContactAuthority; value: any } }
  | { type: 'LOAD_FROM_API'; payload: Contact }
  | { type: 'RESET' }

function contactFormReducer(state: ContactFormState, action: FormAction): ContactFormState {
  switch (action.type) {
    case 'SET_NAME':
      return { ...state, name: action.payload }
    case 'SET_SHORT_NAME':
      return { ...state, short_name: action.payload }
    case 'SET_TYPE':
      return { ...state, type: action.payload }
    case 'SET_BUSINESS_TYPE':
      return { ...state, business_type: action.payload }
    case 'SET_LEGAL_TYPE':
      return { ...state, legal_type: action.payload }
    case 'SET_CATEGORY':
      return { ...state, category: action.payload }
    case 'SET_SEGMENT':
      return { ...state, contact_segment: action.payload }
    case 'SET_CREDIT_RATING':
      return { ...state, credit_rating: action.payload }
    case 'SET_IS_ACTIVE':
      return { ...state, is_active: action.payload }
    case 'SET_STATUS':
      return { ...state, status: action.payload }
    case 'SET_EMAIL':
      return { ...state, email: action.payload }
    case 'SET_PHONE':
      return { ...state, phone: action.payload }
    case 'SET_FAX':
      return { ...state, fax: action.payload }
    case 'SET_MAIN_ADDRESS':
      return { ...state, main_address: action.payload }
    case 'SET_COUNTRY':
      return {
        ...state,
        selectedCountry: action.payload,
        country_id: action.payload ? parseInt(action.payload.value, 10) : null,
        selectedState: null,
        main_state_id: null,
        selectedCity: null,
        main_city_id: null
      }
    case 'SET_STATE':
      return {
        ...state,
        selectedState: action.payload,
        main_state_id: action.payload ? parseInt(action.payload.value, 10) : null,
        selectedCity: null,
        main_city_id: null
      }
    case 'SET_CITY':
      return {
        ...state,
        selectedCity: action.payload,
        main_city_id: action.payload ? parseInt(action.payload.value, 10) : null
      }
    case 'SET_TAX_NUMBER':
      return { ...state, tax_number: action.payload }
    case 'SET_TAX_OFFICE':
      return {
        ...state,
        selectedTaxOffice: action.payload,
        tax_office_id: action.payload ? parseInt(action.payload.value, 10) : null
      }
    case 'SET_CURRENCY':
      return { ...state, currency_type: action.payload }
    case 'SET_PAYMENT_TERMS':
      return { ...state, default_payment_terms: action.payload }
    case 'SET_RISK_LIMIT':
      return { ...state, risk_limit: action.payload }
    case 'ADD_ADDRESS':
      return { ...state, addresses: [...state.addresses, getDefaultAddress()] }
    case 'REMOVE_ADDRESS':
      return { ...state, addresses: state.addresses.filter((_, i) => i !== action.payload) }
    case 'UPDATE_ADDRESS': {
      const { index, field, value } = action.payload
      const updated = [...state.addresses]
      updated[index] = { ...updated[index], [field]: value }
      return { ...state, addresses: updated }
    }
    case 'ADD_AUTHORITY':
      return { ...state, authorities: [...state.authorities, getDefaultAuthority()] }
    case 'REMOVE_AUTHORITY':
      return { ...state, authorities: state.authorities.filter((_, i) => i !== action.payload) }
    case 'UPDATE_AUTHORITY': {
      const { index, field, value } = action.payload
      const updated = [...state.authorities]
      updated[index] = { ...updated[index], [field]: value }
      return { ...state, authorities: updated }
    }
    case 'LOAD_FROM_API':
      return { ...state, ...loadContactDataToState(action.payload) }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

/**
 * Custom Hook: useContactFormReducer
 *
 * Context7 Pattern: Extract stateful logic into custom hooks
 * Source: https://react.dev/learn/reusing-logic-with-custom-hooks
 */
export function useContactFormReducer() {
  const [state, dispatch] = useReducer(contactFormReducer, initialState)

  // Action creators with useMemo for performance
  const actions = useMemo(() => ({
    setName: (value: string) => dispatch({ type: 'SET_NAME', payload: value }),
    setShortName: (value: string) => dispatch({ type: 'SET_SHORT_NAME', payload: value }),
    setType: (value: ContactType) => dispatch({ type: 'SET_TYPE', payload: value }),
    setBusinessType: (value: BusinessType | '') => dispatch({ type: 'SET_BUSINESS_TYPE', payload: value }),
    setLegalType: (value: LegalType) => dispatch({ type: 'SET_LEGAL_TYPE', payload: value }),
    setCategory: (value: string) => dispatch({ type: 'SET_CATEGORY', payload: value }),
    setSegment: (value: ContactSegment | '') => dispatch({ type: 'SET_SEGMENT', payload: value }),
    setCreditRating: (value: number | null) => dispatch({ type: 'SET_CREDIT_RATING', payload: value }),
    setIsActive: (value: boolean) => dispatch({ type: 'SET_IS_ACTIVE', payload: value }),
    setStatus: (value: 'active' | 'passive') => dispatch({ type: 'SET_STATUS', payload: value }),
    setEmail: (value: string) => dispatch({ type: 'SET_EMAIL', payload: value }),
    setPhone: (value: string) => dispatch({ type: 'SET_PHONE', payload: value }),
    setFax: (value: string) => dispatch({ type: 'SET_FAX', payload: value }),
    setMainAddress: (value: string) => dispatch({ type: 'SET_MAIN_ADDRESS', payload: value }),
    setCountry: (value: SelectOption | null) => dispatch({ type: 'SET_COUNTRY', payload: value }),
    setState: (value: SelectOption | null) => dispatch({ type: 'SET_STATE', payload: value }),
    setCity: (value: SelectOption | null) => dispatch({ type: 'SET_CITY', payload: value }),
    setTaxNumber: (value: string) => dispatch({ type: 'SET_TAX_NUMBER', payload: value }),
    setTaxOffice: (value: SelectOption | null) => dispatch({ type: 'SET_TAX_OFFICE', payload: value }),
    setCurrency: (value: string) => dispatch({ type: 'SET_CURRENCY', payload: value }),
    setPaymentTerms: (value: number | null) => dispatch({ type: 'SET_PAYMENT_TERMS', payload: value }),
    setRiskLimit: (value: number | null) => dispatch({ type: 'SET_RISK_LIMIT', payload: value }),
    addAddress: () => dispatch({ type: 'ADD_ADDRESS' }),
    removeAddress: (index: number) => dispatch({ type: 'REMOVE_ADDRESS', payload: index }),
    updateAddress: (index: number, field: keyof ContactAddress, value: any) =>
      dispatch({ type: 'UPDATE_ADDRESS', payload: { index, field, value } }),
    addAuthority: () => dispatch({ type: 'ADD_AUTHORITY' }),
    removeAuthority: (index: number) => dispatch({ type: 'REMOVE_AUTHORITY', payload: index }),
    updateAuthority: (index: number, field: keyof ContactAuthority, value: any) =>
      dispatch({ type: 'UPDATE_AUTHORITY', payload: { index, field, value } }),
    loadFromApi: (data: Contact) => dispatch({ type: 'LOAD_FROM_API', payload: data }),
    reset: () => dispatch({ type: 'RESET' })
  }), [])

  return { state, actions }
}
