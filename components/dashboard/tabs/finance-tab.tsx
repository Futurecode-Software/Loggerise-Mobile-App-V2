/**
 * Finance Tab Component
 *
 * Displays finance dashboard content with receivables, payables, and income stats.
 */

import React from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  TrendingUp,
} from 'lucide-react-native';
import { useDashboard } from '@/contexts/dashboard-context';
import { formatCurrencyCompact } from '@/utils/formatters';
import { MetricsGrid } from '../metrics-grid';
import { BasicTab } from './basic-tab';

export const FinanceTab = () => {
  const { financeStats } = useDashboard();

  if (!financeStats) {
    return <BasicTab />;
  }

  const metrics = [
    {
      icon: ArrowUpRight,
      label: 'Alacak',
      value: formatCurrencyCompact(financeStats.receivables.total),
    },
    {
      icon: ArrowDownRight,
      label: 'Borç',
      value: formatCurrencyCompact(financeStats.payables.total),
    },
    {
      icon: Clock,
      label: 'Gecikmiş Alacak',
      value: formatCurrencyCompact(financeStats.receivables.overdue),
    },
    {
      icon: TrendingUp,
      label: 'Aylık Gelir',
      value: formatCurrencyCompact(financeStats.incomeStats.totalIncome),
    },
  ];

  return <MetricsGrid metrics={metrics} />;
};
