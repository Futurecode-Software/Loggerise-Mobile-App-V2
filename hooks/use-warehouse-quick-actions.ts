/**
 * Warehouse Dashboard Quick Actions
 */

import { useMemo } from 'react';
import { router } from 'expo-router';
import { PackageCheck, Truck, Warehouse, Send } from 'lucide-react-native';
import { QuickAction } from '@/contexts/quick-actions-context';
import { useHaptics } from '@/hooks/use-haptics';

export const useWarehouseQuickActions = (): QuickAction[] => {
  const { hapticLight } = useHaptics();

  return useMemo(
    () => [
      {
        id: 'warehouse-receiving',
        label: 'Depo Kabul Ekle',
        icon: PackageCheck,
        onPress: () => {
          hapticLight();
          router.push('/(tabs)/positions');
        },
        permission: 'positions.create',
      },
      {
        id: 'pre-carriage',
        label: 'Ön Taşıma Ekle',
        icon: Truck,
        onPress: () => {
          hapticLight();
          router.push('/(tabs)/positions');
        },
        permission: 'positions.create',
      },
      {
        id: 'new-warehouse',
        label: 'Yeni Depo Ekle',
        icon: Warehouse,
        onPress: () => {
          hapticLight();
          router.push('/warehouse/new');
        },
        permission: 'warehouses.create',
      },
      {
        id: 'ready-shipment',
        label: 'Hazır Sevkiyat',
        icon: Send,
        onPress: () => {
          hapticLight();
          router.push('/(tabs)/positions');
        },
        disabled: true, // Backend endpoint eksik
      },
    ],
    [hapticLight]
  );
};
