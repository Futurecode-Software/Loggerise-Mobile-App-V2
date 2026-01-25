/**
 * Overview Tab Component
 *
 * Displays overview dashboard content with general business metrics.
 */

import React from 'react';
import {
  Truck,
  MapPin,
  Package,
  TrendingUp,
} from 'lucide-react-native';
import { useDashboard } from '@/contexts/dashboard-context';
import { formatCurrencyCompact } from '@/utils/formatters';
import { DashboardTheme } from '@/constants/dashboard-theme';
import { MetricsGrid } from '../metrics-grid';
import { SummaryCard } from '../summary-card';
import { BasicTab } from './basic-tab';

export const OverviewTab = () => {
  const { overviewStats, basicStats } = useDashboard();

  if (!overviewStats) {
    return <BasicTab />;
  }

  const metrics = [
    {
      icon: Truck,
      label: 'Aktif Seferler',
      value: overviewStats.activeTrips,
    },
    {
      icon: MapPin,
      label: 'Yurtiçi İş Emri',
      value: overviewStats.activeDomesticOrders,
    },
    {
      icon: Package,
      label: 'Kabul Bekleyen',
      value: overviewStats.pendingReceiving,
    },
    {
      icon: TrendingUp,
      label: 'Aylık Gelir',
      value: formatCurrencyCompact(overviewStats.monthlyRevenue),
    },
  ];

  const summaryItems = [
    {
      value: overviewStats.completedTodayDomestic,
      label: 'Tamamlanan',
      color: DashboardTheme.success,
    },
    {
      value: overviewStats.delayedDomestic,
      label: 'Geciken',
      color: DashboardTheme.danger,
    },
    {
      value: overviewStats.readyPositions,
      label: 'Hazır',
      color: DashboardTheme.accent,
    },
  ];

  return (
    <>
      <MetricsGrid metrics={metrics} />
      <SummaryCard items={summaryItems} />
    </>
  );
};
