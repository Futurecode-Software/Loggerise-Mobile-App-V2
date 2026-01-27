/**
 * Fleet Management Dashboard Quick Actions
 */

import { useMemo } from 'react';
import { router, RelativePathString } from 'expo-router';
import {
  Car,
  Wrench,
  AlertTriangle,
  Shield,
  ClipboardCheck,
  UserPlus,
} from 'lucide-react-native';
import { QuickAction } from '@/contexts/quick-actions-context';
import { useHaptics } from '@/hooks/use-haptics';

export const useFleetQuickActions = (): QuickAction[] => {
  const { hapticLight } = useHaptics();

  return useMemo(
    () => [
      {
        id: 'new-vehicle',
        label: 'Yeni Araç Ekle',
        icon: Car,
        onPress: () => {
          hapticLight();
          router.push('/vehicle/new');
        },
        permission: 'vehicles.create',
      },
      {
        id: 'maintenance',
        label: 'Bakım Kaydet',
        icon: Wrench,
        onPress: () => {
          hapticLight();
          router.push('/(tabs)/vehicles' as RelativePathString);
        },
        permission: 'vehicle_maintenances.create',
      },
      {
        id: 'fault-report',
        label: 'Arıza Bildir',
        icon: AlertTriangle,
        onPress: () => {
          hapticLight();
          router.push('/(tabs)/vehicles' as RelativePathString);
        },
        permission: 'vehicle_faults.create',
      },
      {
        id: 'insurance',
        label: 'Sigorta Ekle',
        icon: Shield,
        onPress: () => {
          hapticLight();
          router.push('/(tabs)/vehicles' as RelativePathString);
        },
        permission: 'vehicle_insurances.create',
      },
      {
        id: 'inspection',
        label: 'Muayene Kaydet',
        icon: ClipboardCheck,
        onPress: () => {
          hapticLight();
          router.push('/(tabs)/vehicles' as RelativePathString);
        },
        permission: 'vehicle_inspections.create',
      },
      {
        id: 'new-employee',
        label: 'Personel Ekle',
        icon: UserPlus,
        onPress: () => {
          hapticLight();
          router.push('/employee/new');
        },
        permission: 'employees.create',
      },
    ],
    [hapticLight]
  );
};
