import { useState } from 'react'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import Toast from 'react-native-toast-message'
import { createContact } from '@/services/endpoints/contacts'
import { transformFormStateToPayload } from '@/utils/contacts/transformers'
import type { ContactFormState } from './useContactFormReducer'

export function useContactFormCreate() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submitForm = async (formState: ContactFormState) => {
    setIsSubmitting(true)
    try {
      const payload = transformFormStateToPayload(formState)
      const contact = await createContact(payload)

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

      Toast.show({
        type: 'success',
        text1: 'Cari başarıyla oluşturuldu',
        position: 'top',
        visibilityTime: 1500
      })

      setTimeout(() => {
        router.replace(`/contacts/${contact.id}`)
      }, 300)
    } catch (err) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)

      Toast.show({
        type: 'error',
        text1: err instanceof Error ? err.message : 'Cari oluşturulamadı',
        position: 'top',
        visibilityTime: 1500
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return { isSubmitting, submitForm }
}
