/**
 * Warehouse Tab Component
 *
 * Displays warehouse dashboard content with position and receiving stats.
 */

import React from 'react';
import {
  Clock,
  Package,
  CheckCircle2,
  Warehouse,
} from 'lucide-react-native';
import { useDashboard } from '@/contexts/dashboard-context';
import { MetricsGrid } from '../metrics-grid';
import { BasicTab } from './basic-tab';

export const WarehouseTab = () => {
  const { warehouseStats } = useDashboard();

  if (!warehouseStats) {
    return <BasicTab />;
  }

  const stats = warehouseStats.summaryStats;

  const metrics = [
    {
      icon: Clock,
      label: 'Ön Taşıma Bek.',
      value: stats?.pending_pre_carriages || 0,
    },
    {
      icon: Package,
      label: 'Kabul Bekleyen',
      value: stats?.pending_warehouse_receiving || 0,
    },
    {
      icon: CheckCircle2,
      label: 'Hazır',
      value: stats?.ready_for_disposition || 0,
    },
    {
      icon: Warehouse,
      label: 'Toplam Pozisyon',
      value: stats?.total_positions || 0,
    },
  ];

  return <MetricsGrid metrics={metrics} />;
};
