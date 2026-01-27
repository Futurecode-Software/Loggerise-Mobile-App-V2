/**
 * Overview Dashboard Quick Actions
 */

import { useMemo } from 'react';
import { router, RelativePathString } from 'expo-router';
import {
  Truck,
  Package,
  FileText,
  Brain,
  MessageSquare,
} from 'lucide-react-native';
import { QuickAction } from '@/contexts/quick-actions-context';
import { useHaptics } from '@/hooks/use-haptics';

export const useOverviewQuickActions = (): QuickAction[] => {
  const { hapticLight } = useHaptics();

  return useMemo(
    () => [
      {
        id: 'new-trip',
        label: 'Yeni Sefer Oluştur',
        icon: Truck,
        onPress: () => {
          hapticLight();
          router.push('/trips/new' as RelativePathString);
        },
        permission: 'trips.create',
      },
      {
        id: 'new-load',
        label: 'Yeni Yük Ekle',
        icon: Package,
        onPress: () => {
          hapticLight();
          router.push('/loads/new' as RelativePathString);
        },
        permission: 'loads.create',
      },
      {
        id: 'new-quote',
        label: 'Yeni Teklif Oluştur',
        icon: FileText,
        onPress: () => {
          hapticLight();
          router.push('/quote/new');
        },
        permission: 'quotes.create',
      },
      {
        id: 'ai-report',
        label: 'AI Rapor Oluştur',
        icon: Brain,
        onPress: () => {
          hapticLight();
          router.push('/ai-reports');
        },
        permission: 'ai_reports.create',
      },
      {
        id: 'new-message',
        label: 'Yeni Mesaj',
        icon: MessageSquare,
        onPress: () => {
          hapticLight();
          router.push('/messages');
        },
        permission: 'messages.create',
      },
    ],
    [hapticLight]
  );
};
