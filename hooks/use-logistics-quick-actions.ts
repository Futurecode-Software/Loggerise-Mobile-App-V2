/**
 * Logistics Dashboard Quick Actions
 */

import { useMemo } from 'react';
import { router } from 'expo-router';
import { Truck, Package, MapPin, Ship, ClipboardList, Boxes } from 'lucide-react-native';
import { QuickAction } from '@/contexts/quick-actions-context';
import { useHaptics } from '@/hooks/use-haptics';

export const useLogisticsQuickActions = (): QuickAction[] => {
  const { hapticLight } = useHaptics();

  return useMemo(
    () => [
      {
        id: 'new-load',
        label: 'Yeni Yük Ekle',
        icon: Package,
        onPress: () => {
          hapticLight();
          router.push('/load/new' as any);
        },
        permission: 'loads.create',
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
        id: 'export-operations',
        label: 'İhracat Operasyonları',
        icon: Ship,
        onPress: () => {
          hapticLight();
          router.push('/exports/operations' as any);
        },
        permission: 'exports.view',
      },
      {
        id: 'import-operations',
        label: 'İthalat Operasyonları',
        icon: ClipboardList,
        onPress: () => {
          hapticLight();
          router.push('/imports/operations' as any);
        },
        permission: 'imports.view',
      },
      {
        id: 'view-loads',
        label: 'Yükleri Gör',
        icon: Boxes,
        onPress: () => {
          hapticLight();
          router.push('/(tabs)/loads' as any);
        },
        permission: 'loads.view',
      },
    ],
    [hapticLight]
  );
};
