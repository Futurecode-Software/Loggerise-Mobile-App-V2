import { useState } from 'react'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import Toast from 'react-native-toast-message'
import { updateContact } from '@/services/endpoints/contacts'
import { transformFormStateToPayload } from '@/utils/contacts/transformers'
import type { ContactFormState } from './useContactFormReducer'

export function useContactFormSubmit(contactId: number | null) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submitForm = async (formState: ContactFormState) => {
    if (!contactId) {
      Toast.show({
        type: 'error',
        text1: 'Müşteri ID bulunamadı',
        position: 'top',
        visibilityTime: 1500
      })
      return
    }

    setIsSubmitting(true)
    try {
      const payload = transformFormStateToPayload(formState)
      await updateContact(contactId, payload)

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

      Toast.show({
        type: 'success',
        text1: 'Müşteri başarıyla güncellendi',
        position: 'top',
        visibilityTime: 1500
      })

      setTimeout(() => {
        router.back()
      }, 300)
    } catch (err) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)

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
