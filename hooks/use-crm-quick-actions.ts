/**
 * CRM Dashboard Quick Actions
 */

import { useMemo } from 'react';
import { router } from 'expo-router';
import {
  FileText,
  Users,
  UserPlus,
  MessageSquare,
  Package,
  Sparkles,
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
          router.push('/quote/new' as any);
        },
        permission: 'quotes.create',
      },
      {
        id: 'view-quotes',
        label: 'Teklifleri Gör',
        icon: Sparkles,
        onPress: () => {
          hapticLight();
          router.push('/quotes' as any);
        },
        permission: 'quotes.view',
      },
      {
        id: 'view-customers',
        label: 'Müşteriler',
        icon: Users,
        onPress: () => {
          hapticLight();
          router.push('/crm' as any);
        },
        permission: 'crm.view',
      },
      {
        id: 'new-customer',
        label: 'Müşteri Ekle',
        icon: UserPlus,
        onPress: () => {
          hapticLight();
          router.push('/contact/new?type=customer' as any);
        },
        permission: 'contacts.create',
      },
      {
        id: 'view-loads',
        label: 'Yüklere Dönüştür',
        icon: Package,
        onPress: () => {
          hapticLight();
          router.push('/(tabs)/loads' as any);
        },
        permission: 'loads.view',
      },
      {
        id: 'new-message',
        label: 'Müşteriye Mesaj',
        icon: MessageSquare,
        onPress: () => {
          hapticLight();
          router.push('/message/new' as any);
        },
        permission: 'messages.create',
      },
    ],
    [hapticLight]
  );
};
