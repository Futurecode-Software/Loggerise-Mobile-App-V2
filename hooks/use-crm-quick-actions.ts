/**
 * CRM Dashboard Quick Actions
 */

import { useMemo } from 'react';
import { router } from 'expo-router';
import {
  FileText,
  Copy,
  UserPlus,
  MessageSquare,
  Send,
  Package,
} from 'lucide-react-native';
import { QuickAction } from '@/contexts/quick-actions-context';
import { useHaptics } from '@/hooks/use-haptics';

export const useCrmQuickActions = (): QuickAction[] => {
  const { hapticLight } = useHaptics();

  return useMemo(
    () => [
      {
        id: 'new-quote',
        label: 'Yeni Teklif',
        icon: FileText,
        onPress: () => {
          hapticLight();
          router.push('/quote/new');
        },
        permission: 'quotes.create',
      },
      {
        id: 'duplicate-quote',
        label: 'Teklif Kopyala',
        icon: Copy,
        onPress: () => {
          hapticLight();
          router.push('/quotes');
        },
        permission: 'quotes.create',
      },
      {
        id: 'new-customer',
        label: 'Müşteri Ekle',
        icon: UserPlus,
        onPress: () => {
          hapticLight();
          router.push('/contact/new?type=customer');
        },
        permission: 'contacts.create',
      },
      {
        id: 'new-interaction',
        label: 'Etkileşim Ekle',
        icon: MessageSquare,
        onPress: () => {
          hapticLight();
          router.push('/crm/interactions/new');
        },
        permission: 'crm_interactions.create',
      },
      {
        id: 'send-quote',
        label: 'Teklifi Gönder',
        icon: Send,
        onPress: () => {
          hapticLight();
          router.push('/quotes');
        },
        permission: 'quotes.send',
      },
      {
        id: 'convert-to-loads',
        label: 'Yüklere Dönüştür',
        icon: Package,
        onPress: () => {
          hapticLight();
          router.push('/quotes');
        },
        permission: 'quotes.convert',
      },
    ],
    [hapticLight]
  );
};
