/**
 * HR Tab Component
 *
 * Displays HR dashboard content with employee and recruitment stats.
 */

import React from 'react';
import {
  Users,
  Briefcase,
  FileText,
  Calendar,
} from 'lucide-react-native';
import { useDashboard } from '@/contexts/dashboard-context';
import { MetricsGrid } from '../metrics-grid';
import { BasicTab } from './basic-tab';

export const HRTab = () => {
  const { hrStats } = useDashboard();

  if (!hrStats) {
    return <BasicTab />;
  }

  const metrics = [
    {
      icon: Users,
      label: 'Aktif Personel',
      value: hrStats.activeEmployees,
    },
    {
      icon: Briefcase,
      label: 'Aktif İlan',
      value: hrStats.activeJobPostings,
    },
    {
      icon: FileText,
      label: 'Bekleyen Başvuru',
      value: hrStats.pendingApplications,
    },
    {
      icon: Calendar,
      label: 'Mülakat',
      value: hrStats.interviewScheduled,
    },
  ];

  return <MetricsGrid metrics={metrics} />;
};
