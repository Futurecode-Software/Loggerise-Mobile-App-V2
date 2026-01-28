/**
 * HR (Human Resources) Dashboard Quick Actions
 */

import { useMemo } from 'react';
import { router } from 'expo-router';
import {
  UserPlus,
  Users,
  Briefcase,
  FileText,
  Calendar,
} from 'lucide-react-native';
import { QuickAction } from '@/contexts/quick-actions-context';
import { useHaptics } from '@/hooks/use-haptics';

export const useHrQuickActions = (): QuickAction[] => {
  const { hapticLight } = useHaptics();

  return useMemo(
    () => [
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
        label: 'Yeni Personel',
        icon: UserPlus,
        onPress: () => {
          hapticLight();
          router.push('/employee/new' as any);
        },
        permission: 'employees.create',
      },
      {
        id: 'job-postings',
        label: 'İş İlanları',
        icon: Briefcase,
        onPress: () => {
          hapticLight();
          router.push('/hr/job-postings' as any);
        },
        permission: 'job_postings.view',
      },
      {
        id: 'job-applications',
        label: 'İşe Alım Başvuruları',
        icon: FileText,
        onPress: () => {
          hapticLight();
          router.push('/hr/job-applications' as any);
        },
        permission: 'job_applications.view',
      },
      {
        id: 'view-events',
        label: 'Ajandam',
        icon: Calendar,
        onPress: () => {
          hapticLight();
          router.push('/event' as any);
        },
        permission: 'events.view',
      },
    ],
    [hapticLight]
  );
};
