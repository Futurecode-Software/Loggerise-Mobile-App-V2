/**
 * Warehouse Dashboard Quick Actions
 */

import { useMemo } from 'react';
import { router } from 'expo-router';
import { Warehouse, PackageCheck, Boxes, Truck, MapPin } from 'lucide-react-native';
import { QuickAction } from '@/contexts/quick-actions-context';
import { useHaptics } from '@/hooks/use-haptics';

export const useWarehouseQuickActions = (): QuickAction[] => {
  const { hapticLight } = useHaptics();

  return useMemo(
    () => [
      {
        id: 'view-warehouses',
        label: 'Depoları Gör',
        icon: Warehouse,
        onPress: () => {
          hapticLight();
          router.push('/warehouse' as any);
        },
        permission: 'warehouses.view',
      },
      {
        id: 'new-warehouse',
        label: 'Yeni Depo Ekle',
        icon: PackageCheck,
        onPress: () => {
          hapticLight();
          router.push('/warehouse/new' as any);
        },
        permission: 'warehouses.create',
      },
      {
        id: 'export-warehouse-items',
        label: 'Depo Malları',
        icon: Boxes,
        onPress: () => {
          hapticLight();
          router.push('/export-warehouse/items' as any);
        },
        permission: 'export_warehouse.view',
      },
      {
        id: 'export-expected',
        label: 'Beklenen Mallar',
        icon: Truck,
        onPress: () => {
          hapticLight();
          router.push('/export-warehouse/expected' as any);
        },
        permission: 'export_warehouse.view',
      },
      {
        id: 'export-positions',
        label: 'Pozisyon Durumu',
        icon: MapPin,
        onPress: () => {
          hapticLight();
          router.push('/export-warehouse/positions' as any);
        },
        permission: 'export_warehouse.view',
      },
    ],
    [hapticLight]
  );
};
