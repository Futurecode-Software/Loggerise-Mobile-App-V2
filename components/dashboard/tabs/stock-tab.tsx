/**
 * Stock Tab Component
 *
 * Displays stock dashboard content with inventory stats.
 */

import React from 'react';
import {
  TrendingUp,
  Package,
  AlertCircle,
  Warehouse,
} from 'lucide-react-native';
import { useDashboard } from '@/contexts/dashboard-context';
import { formatCurrencyCompact } from '@/utils/formatters';
import { MetricsGrid } from '../metrics-grid';
import { BasicTab } from './basic-tab';

export const StockTab = () => {
  const { stockStats } = useDashboard();

  if (!stockStats) {
    return <BasicTab />;
  }

  const metrics = [
    {
      icon: TrendingUp,
      label: 'Stok Değeri',
      value: formatCurrencyCompact(stockStats.totalStockValue),
    },
    {
      icon: Package,
      label: 'Toplam Ürün',
      value: stockStats.productStats.total,
    },
    {
      icon: AlertCircle,
      label: 'Düşük Stok',
      value: stockStats.productStats.lowStock,
    },
    {
      icon: Warehouse,
      label: 'Aktif Depo',
      value: stockStats.warehouseStats.active,
    },
  ];

  return <MetricsGrid metrics={metrics} />;
};
