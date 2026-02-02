/**
 * Overview Dashboard Quick Actions
 */

import { useMemo } from 'react';
import { router } from 'expo-router';
import {
  Truck,
  Package,
  FileText,
  Bot,
  MessageSquare,
  Users,
  MapPin,
} from 'lucide-react-native';
import { QuickAction } from '@/contexts/quick-actions-context';
import { useHaptics } from '@/hooks/use-haptics';

export const useOverviewQuickActions = (): QuickAction[] => {
  const { hapticLight } = useHaptics();

  return useMemo(
    () => [
      {
        id: 'new-load',
        label: 'Yeni Yük Ekle',
        icon: Package,
        onPress: () => {
          hapticLight();
          router.push('/logistics/load/new' as any);
        },
        permission: 'loads.create',
      },
      {
        id: 'new-quote',
        label: 'Yeni Teklif Oluştur',
        icon: FileText,
        onPress: () => {
          hapticLight();
          router.push('/quote/new' as any);
        },
        permission: 'quotes.create',
      },
      {
        id: 'new-contact',
        label: 'Yeni Cari Ekle',
        icon: Users,
        onPress: () => {
          hapticLight();
          router.push('/contact/new' as any);
        },
        permission: 'contacts.create',
      },
      {
        id: 'view-positions',
        label: 'Pozisyonları Gör',
        icon: MapPin,
        onPress: () => {
          hapticLight();
          router.push('/positions' as any);
        },
        permission: 'positions.view',
      },
      {
        id: 'view-trips',
        label: 'Seferleri Gör',
        icon: Truck,
        onPress: () => {
          hapticLight();
          router.push('/trip' as any);
        },
        permission: 'trips.view',
      },
      {
        id: 'ai-assistant',
        label: 'Loggy AI Asistan',
        icon: Bot,
        onPress: () => {
          hapticLight();
          router.push('/loggy' as any);
        },
        permission: 'ai_assistant.access',
      },
      {
        id: 'new-message',
        label: 'Yeni Mesaj',
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
