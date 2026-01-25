/**
 * Domestic Tab Component
 *
 * Displays domestic transport dashboard content with order stats.
 */

import React from 'react';
import {
  MapPin,
  Truck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react-native';
import { useDashboard } from '@/contexts/dashboard-context';
import { MetricsGrid } from '../metrics-grid';
import { BasicTab } from './basic-tab';

export const DomesticTab = () => {
  const { domesticStats } = useDashboard();

  if (!domesticStats) {
    return <BasicTab />;
  }

  const stats = domesticStats.summaryStats;

  const metrics = [
    {
      icon: MapPin,
      label: 'Toplam İş Emri',
      value: stats.total_orders,
    },
    {
      icon: Truck,
      label: 'Yolda',
      value: stats.in_transit_orders,
    },
    {
      icon: CheckCircle2,
      label: 'Bugün Biten',
      value: stats.completed_today,
    },
    {
      icon: AlertCircle,
      label: 'Geciken',
      value: stats.delayed_orders,
    },
  ];

  return <MetricsGrid metrics={metrics} />;
};
