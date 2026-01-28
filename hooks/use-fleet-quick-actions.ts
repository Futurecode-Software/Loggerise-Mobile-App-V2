/**
 * Fleet Management Dashboard Quick Actions
 */

import { useMemo } from 'react';
import { router } from 'expo-router';
import {
  Car,
  AlertTriangle,
  UserPlus,
  Truck,
  MapPinned,
  Link2,
  CircleGauge,
  Users,
} from 'lucide-react-native';
import { QuickAction } from '@/contexts/quick-actions-context';
import { useHaptics } from '@/hooks/use-haptics';

export const useFleetQuickActions = (): QuickAction[] => {
  const { hapticLight } = useHaptics();

  return useMemo(
    () => [
      {
        id: 'view-vehicles',
        label: 'Araçları Gör',
        icon: Truck,
        onPress: () => {
          hapticLight();
          router.push('/vehicle' as any);
        },
        permission: 'vehicles.view',
      },
      {
        id: 'new-vehicle',
        label: 'Yeni Araç Ekle',
        icon: Car,
        onPress: () => {
          hapticLight();
          router.push('/vehicle/new' as any);
        },
        permission: 'vehicles.create',
      },
      {
        id: 'view-employees',
        label: 'Personeller',
        icon: Users,
        onPress: () => {
          hapticLight();
          router.push('/employee' as any);
        },
        permission: 'employees.view',
      },
      {
        id: 'new-employee',
        label: 'Personel Ekle',
        icon: UserPlus,
        onPress: () => {
          hapticLight();
          router.push('/employee/new' as any);
        },
        permission: 'employees.create',
      },
      {
        id: 'fault-reports',
        label: 'Arıza Bildirimleri',
        icon: AlertTriangle,
        onPress: () => {
          hapticLight();
          router.push('/fleet/fault-reports' as any);
        },
        permission: 'vehicle_faults.view',
      },
      {
        id: 'tire-warehouse',
        label: 'Lastik Deposu',
        icon: CircleGauge,
        onPress: () => {
          hapticLight();
          router.push('/fleet/tire-warehouse' as any);
        },
        permission: 'tire_warehouse.view',
      },
      {
        id: 'tractor-trailer',
        label: 'Çekici-Römork',
        icon: Link2,
        onPress: () => {
          hapticLight();
          router.push('/fleet/tractor-trailer' as any);
        },
        permission: 'fleet_matching.view',
      },
      {
        id: 'fleet-tracking',
        label: 'Filo Takip',
        icon: MapPinned,
        onPress: () => {
          hapticLight();
          router.push('/fleet/tracking' as any);
        },
        permission: 'fleet_tracking.view',
      },
    ],
    [hapticLight]
  );
};
