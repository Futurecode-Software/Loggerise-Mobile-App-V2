/**
 * Domestic Transport Dashboard Quick Actions
 */

import { useMemo } from 'react';
import { router } from 'expo-router';
import { Package, Truck, MapPin, RefreshCw } from 'lucide-react-native';
import { QuickAction } from '@/contexts/quick-actions-context';
import { useHaptics } from '@/hooks/use-haptics';

export const useDomesticQuickActions = (): QuickAction[] => {
  const { hapticLight } = useHaptics();

  return useMemo(
    () => [
      {
        id: 'new-collection',
        label: 'Yeni Toplama',
        icon: Package,
        onPress: () => {
          hapticLight();
          router.push('/domestic/new?type=collection');
        },
        permission: 'domestic_orders.create',
      },
      {
        id: 'new-delivery',
        label: 'Yeni Teslimat',
        icon: Truck,
        onPress: () => {
          hapticLight();
          router.push('/domestic/new?type=delivery');
        },
        permission: 'domestic_orders.create',
      },
      {
        id: 'new-pre-carriage',
        label: 'Yeni Ön Taşıma',
        icon: Truck,
        onPress: () => {
          hapticLight();
          router.push('/domestic/new?type=pre_carriage');
        },
        permission: 'domestic_orders.create',
      },
      {
        id: 'new-position',
        label: 'Pozisyon Oluştur',
        icon: MapPin,
        onPress: () => {
          hapticLight();
          router.push('/(tabs)/positions');
        },
        permission: 'positions.create',
      },
      {
        id: 'update-status',
        label: 'Durum Güncelle',
        icon: RefreshCw,
        onPress: () => {
          hapticLight();
          router.push('/domestic');
        },
        permission: 'domestic_orders.update',
      },
    ],
    [hapticLight]
  );
};
