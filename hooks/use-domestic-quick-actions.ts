/**
 * Domestic Transport Dashboard Quick Actions
 */

import { useMemo } from 'react';
import { router } from 'expo-router';
import { Package, Truck, MapPin, ClipboardList, Calendar } from 'lucide-react-native';
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
          router.push('/domestic/new?type=collection' as any);
        },
        permission: 'domestic_orders.create',
      },
      {
        id: 'new-delivery',
        label: 'Yeni Teslimat',
        icon: Truck,
        onPress: () => {
          hapticLight();
          router.push('/domestic/new?type=delivery' as any);
        },
        permission: 'domestic_orders.create',
      },
      {
        id: 'new-pre-carriage',
        label: 'Yeni Ön Taşıma',
        icon: Truck,
        onPress: () => {
          hapticLight();
          router.push('/domestic/new?type=pre_carriage' as any);
        },
        permission: 'domestic_orders.create',
      },
      {
        id: 'view-domestic-orders',
        label: 'İş Emirleri',
        icon: ClipboardList,
        onPress: () => {
          hapticLight();
          router.push('/domestic' as any);
        },
        permission: 'domestic_orders.view',
      },
      {
        id: 'domestic-planning',
        label: 'Planlama',
        icon: Calendar,
        onPress: () => {
          hapticLight();
          router.push('/domestic/planning' as any);
        },
        permission: 'domestic_orders.view',
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
    ],
    [hapticLight]
  );
};
