/**
 * HR (Human Resources) Dashboard Quick Actions
 */

import { useMemo } from 'react';
import { router } from 'expo-router';
import {
  UserPlus,
  Award,
  Users,
  Briefcase,
  CalendarCheck,
  UserCheck,
} from 'lucide-react-native';
import { QuickAction } from '@/contexts/quick-actions-context';
import { useHaptics } from '@/hooks/use-haptics';

export const useHrQuickActions = (): QuickAction[] => {
  const { hapticLight } = useHaptics();

  return useMemo(
    () => [
      {
        id: 'new-employee',
        label: 'Yeni Personel',
        icon: UserPlus,
        onPress: () => {
          hapticLight();
          router.push('/employee/new');
        },
        permission: 'employees.create',
      },
      {
        id: 'certificate',
        label: 'Belge Ekle',
        icon: Award,
        onPress: () => {
          hapticLight();
          router.push('/employees/certificates/new');
        },
        permission: 'employee_certificates.create',
      },
      {
        id: 'family-member',
        label: 'Aile Üyesi Ekle',
        icon: Users,
        onPress: () => {
          hapticLight();
          router.push('/employees/family-members/new');
        },
        permission: 'employee_family_members.create',
      },
      {
        id: 'job-posting',
        label: 'İş İlanı Oluştur',
        icon: Briefcase,
        onPress: () => {
          hapticLight();
          router.push('/job-postings/new');
        },
        disabled: true, // Backend endpoint eksik
        permission: 'job_postings.create',
      },
      {
        id: 'evaluate-application',
        label: 'Başvuru Değerlendir',
        icon: UserCheck,
        onPress: () => {
          hapticLight();
          router.push('/job-applications');
        },
        disabled: true, // Backend endpoint eksik
        permission: 'job_applications.update',
      },
      {
        id: 'schedule-interview',
        label: 'Mülakat Planla',
        icon: CalendarCheck,
        onPress: () => {
          hapticLight();
          router.push('/job-applications/interviews');
        },
        disabled: true, // Backend endpoint eksik
        permission: 'job_applications.update',
      },
    ],
    [hapticLight]
  );
};
