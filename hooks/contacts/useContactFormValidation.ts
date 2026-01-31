import { useMemo } from 'react'
import type { ContactFormState } from './useContactFormReducer'

export interface ValidationErrors {
  name?: string
  email?: string
  phone?: string
  taxNumber?: string
  riskLimit?: string
  addresses?: Record<number, { address?: string; city?: string }>
  authorities?: Record<number, { name?: string; phone?: string }>
}

// Email validation regex (RFC 5322 compliant)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Telefon validation (Türkiye formatı: 5XX XXX XX XX)
const PHONE_REGEX = /^5\d{9}$/

// Vergi numarası validation (10 veya 11 haneli)
const TAX_NUMBER_REGEX = /^\d{10,11}$/

export function useContactFormValidation(state: ContactFormState) {
  const errors = useMemo<ValidationErrors>(() => {
    const newErrors: ValidationErrors = {}

    // Step 1: Basic Info validations
    if (!state.name?.trim()) {
      newErrors.name = 'Müşteri adı zorunludur'
    } else if (state.name.trim().length < 2) {
      newErrors.name = 'Müşteri adı en az 2 karakter olmalıdır'
    }

    // Step 2: Contact validations
    if (state.email && !EMAIL_REGEX.test(state.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi giriniz'
    }

    if (state.phone) {
      // Remove spaces and special characters
      const cleanPhone = state.phone.replace(/[\s-()]/g, '')
      if (!PHONE_REGEX.test(cleanPhone)) {
        newErrors.phone = 'Geçerli bir telefon numarası giriniz (5XX XXX XX XX)'
      }
    }

    // Tax number validation
    if (state.taxNumber) {
      const cleanTaxNumber = state.taxNumber.replace(/[\s-]/g, '')
      if (!TAX_NUMBER_REGEX.test(cleanTaxNumber)) {
        newErrors.taxNumber = 'Vergi numarası 10 veya 11 haneli olmalıdır'
      }
    }

    // Step 3: Financial validations
    if (state.riskLimit !== undefined && state.riskLimit < 0) {
      newErrors.riskLimit = 'Risk limiti negatif olamaz'
    }

    // Step 4: Addresses validations
    if (state.addresses && state.addresses.length > 0) {
      const addressErrors: Record<number, { address?: string; city?: string }> = {}
      state.addresses.forEach((address, index) => {
        const addrErrors: { address?: string; city?: string } = {}

        if (!address.address?.trim()) {
          addrErrors.address = 'Adres zorunludur'
        }

        if (!address.cityId) {
          addrErrors.city = 'Şehir seçimi zorunludur'
        }

        if (Object.keys(addrErrors).length > 0) {
          addressErrors[index] = addrErrors
        }
      })

      if (Object.keys(addressErrors).length > 0) {
        newErrors.addresses = addressErrors
      }
    }

    // Step 5: Authorities validations
    if (state.authorities && state.authorities.length > 0) {
      const authorityErrors: Record<number, { name?: string; phone?: string }> = {}
      state.authorities.forEach((authority, index) => {
        const authErrors: { name?: string; phone?: string } = {}

        if (!authority.name?.trim()) {
          authErrors.name = 'Yetkili adı zorunludur'
        }

        if (authority.phone) {
          const cleanPhone = authority.phone.replace(/[\s-()]/g, '')
          if (!PHONE_REGEX.test(cleanPhone)) {
            authErrors.phone = 'Geçerli bir telefon numarası giriniz'
          }
        }

        if (Object.keys(authErrors).length > 0) {
          authorityErrors[index] = authErrors
        }
      })

      if (Object.keys(authorityErrors).length > 0) {
        newErrors.authorities = authorityErrors
      }
    }

    return newErrors
  }, [
    state.name,
    state.email,
    state.phone,
    state.taxNumber,
    state.riskLimit,
    state.addresses,
    state.authorities
  ])

  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0
  }, [errors])

  const getFieldError = (field: keyof ValidationErrors): string | undefined => {
    return errors[field] as string | undefined
  }

  const hasError = (field: keyof ValidationErrors): boolean => {
    return !!errors[field]
  }

  return {
    errors,
    isValid,
    getFieldError,
    hasError
  }
}
