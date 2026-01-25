/**
 * CRM Tab Component
 *
 * Displays CRM dashboard content with quote and customer stats.
 */

import React from 'react';
import {
  CheckCircle2,
  FileText,
  Users,
  TrendingUp,
} from 'lucide-react-native';
import { useDashboard } from '@/contexts/dashboard-context';
import { MetricsGrid } from '../metrics-grid';
import { BasicTab } from './basic-tab';

export const CRMTab = () => {
  const { crmStats } = useDashboard();

  if (!crmStats) {
    return <BasicTab />;
  }

  const metrics = [
    {
      icon: CheckCircle2,
      label: 'Kazanılan',
      value: crmStats.wonQuotes.count,
    },
    {
      icon: FileText,
      label: 'Toplam Teklif',
      value: crmStats.quoteStats.total,
    },
    {
      icon: Users,
      label: 'Müşteri',
      value: crmStats.customerStats.total,
    },
    {
      icon: TrendingUp,
      label: 'Dönüşüm',
      value: `%${crmStats.conversionRate}`,
    },
  ];

  return <MetricsGrid metrics={metrics} />;
};
