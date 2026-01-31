import type { Contact } from '@/types/contact'
import type { ContactFormState, SelectOption } from '@/hooks/contacts/useContactFormReducer'

/**
 * API'den gelen Contact verisini form state'ine dönüştürür
 * Edit sayfasında kullanılır
 */
export function loadContactDataToState(contact: Contact): Partial<ContactFormState> {
  return {
    type: contact.type,
    business_type: contact.business_type || '',
    legal_type: contact.legal_type,
    name: contact.name,
    short_name: contact.short_name || '',
    category: contact.category || '',
    contact_segment: contact.customer_segment || '',
    credit_rating: contact.credit_rating || null,
    is_active: contact.is_active,
    status: contact.status === 'active' ? 'active' : 'passive',

    email: contact.email || '',
    phone: contact.phone || '',
    fax: contact.fax || '',
    main_address: contact.main_address || '',
    country_id: contact.country_id || null,
    main_state_id: contact.main_state_id || null,
    main_city_id: contact.main_city_id || null,

    tax_number: contact.tax_number || '',
    tax_office_id: contact.tax_office_id || null,
    currency_type: contact.currency_type || 'TRY',
    default_payment_terms: contact.default_payment_terms || null,
    risk_limit: contact.risk_limit || null,

    addresses: contact.addresses || [],
    authorities: contact.authorities || [],

    // Select options - API'den gelen ilişkili verilerle doldurulur
    selectedCountry: contact.country ? {
      value: contact.country.id.toString(),
      label: contact.country.name
    } : null,

    selectedState: contact.main_state ? {
      value: contact.main_state.id.toString(),
      label: contact.main_state.name
    } : null,

    selectedCity: contact.main_city ? {
      value: contact.main_city.id.toString(),
      label: contact.main_city.name
    } : null,

    selectedTaxOffice: contact.tax_office ? {
      value: contact.tax_office.id.toString(),
      label: contact.tax_office.name
    } : null
  }
}

/**
 * Form state'ini API payload'una dönüştürür
 * Create ve Update işlemleri için kullanılır
 */
export function transformFormStateToPayload(state: ContactFormState) {
  return {
    type: state.type,
    business_type: state.business_type || undefined,
    legal_type: state.legal_type,
    name: state.name,
    short_name: state.short_name || undefined,
    category: state.category || undefined,
    customer_segment: state.contact_segment || undefined,
    credit_rating: state.credit_rating || undefined,
    is_active: state.is_active,
    status: state.status,

    email: state.email || undefined,
    phone: state.phone || undefined,
    fax: state.fax || undefined,
    main_address: state.main_address || undefined,
    country_id: state.country_id || undefined,
    main_state_id: state.main_state_id || undefined,
    main_city_id: state.main_city_id || undefined,

    tax_number: state.tax_number || undefined,
    tax_office_id: state.tax_office_id || undefined,
    currency_type: state.currency_type,
    default_payment_terms: state.default_payment_terms || undefined,
    risk_limit: state.risk_limit || undefined,

    addresses: state.addresses,
    authorities: state.authorities
  }
}
