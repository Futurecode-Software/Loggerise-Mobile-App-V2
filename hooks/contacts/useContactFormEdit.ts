import { useState } from 'react'
import { useRouter } from 'expo-router'
import Toast from 'react-native-toast-message'
import * as Haptics from 'expo-haptics'
import { updateContact } from '@/services/endpoints/contacts'
import type { ContactFormState } from './useContactFormReducer'
import type { ContactFormData } from '@/types/contact'

export function useContactFormEdit(contactId: number) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const transformStateToPayload = (state: ContactFormState): ContactFormData => {
    return {
      legalType: state.legalType,
      name: state.name,
      shortName: state.shortName,
      category: state.category,
      email: state.email,
      phone: state.phone,
      fax: state.fax,
      taxNumber: state.taxNumber,
      taxOfficeId: state.taxOfficeId,
      currencyType: state.currencyType,
      status: state.status,
      isActive: state.isActive,
      countryId: state.countryId,
      mainAddress: state.mainAddress,
      mainStateId: state.mainStateId,
      mainCityId: state.mainCityId,
      riskLimit: state.riskLimit,
      notes: state.notes,
      addresses: state.addresses,
      authorities: state.authorities
    }
  }

  const submitForm = async (formState: ContactFormState) => {
    setIsSubmitting(true)
    try {
      const payload = transformStateToPayload(formState)
      await updateContact(contactId, payload)

      Toast.show({
        type: 'success',
        text1: 'Başarıyla güncellendi',
        position: 'top',
        visibilityTime: 1500
      })

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setTimeout(() => router.back(), 300)
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Toast.show({
        type: 'error',
        text1: err instanceof Error ? err.message : 'Güncelleme başarısız',
        position: 'top',
        visibilityTime: 1500
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return { isSubmitting, submitForm }
}
