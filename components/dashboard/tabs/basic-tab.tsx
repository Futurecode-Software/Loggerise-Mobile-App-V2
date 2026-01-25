/**
 * Basic Tab Component
 *
 * Fallback tab content showing basic stats when specific stats are not available.
 */

import React from 'react';
import { Truck, Package, TrendingUp, Users } from 'lucide-react-native';
import { useDashboard } from '@/contexts/dashboard-context';
import { formatCurrencyCompact, formatNumber } from '@/utils/formatters';
import { MetricsGrid } from '../metrics-grid';

export const BasicTab = () => {
  const { basicStats } = useDashboard();

  const metrics = [
    {
      icon: Truck,
      label: 'Toplam Sefer',
      value: basicStats.total_trips,
    },
    {
      icon: Package,
      label: 'Aktif Yükler',
      value: basicStats.active_loads,
    },
    {
      icon: TrendingUp,
      label: 'Aylık Gelir',
      value: formatCurrencyCompact(basicStats.monthly_revenue),
    },
    {
      icon: Users,
      label: 'Toplam Cari',
      value: formatNumber(basicStats.total_contacts),
    },
  ];

  return <MetricsGrid metrics={metrics} />;
};
