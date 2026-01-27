/**
 * Logistics Dashboard Quick Actions
 */

import { useMemo } from 'react';
import { router, RelativePathString } from 'expo-router';
import { Truck, Package, MapPin, UserCheck } from 'lucide-react-native';
import { QuickAction } from '@/contexts/quick-actions-context';
import { useHaptics } from '@/hooks/use-haptics';

export const useLogisticsQuickActions = (): QuickAction[] => {
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
          router.push('/(tabs)/loads');
        },
        permission: 'loads.create',
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
        id: 'assign-driver',
        label: 'Sürücü Ata',
        icon: UserCheck,
        onPress: () => {
          hapticLight();
          router.push('/trips' as RelativePathString);
        },
        permission: 'trips.update',
      },
    ],
    [hapticLight]
  );
};
