/**
 * Logistics Tab Component
 *
 * Displays logistics dashboard content with trip metrics,
 * expiring documents, and recent trips.
 */

import React from 'react';
import {
  Truck,
  Clock,
  Calendar,
  BarChart3,
  AlertTriangle,
} from 'lucide-react-native';
import { useDashboard } from '@/contexts/dashboard-context';
import { DashboardTheme } from '@/constants/dashboard-theme';
import { MetricsGrid } from '../metrics-grid';
import { ListCard } from '../list-card';
import { BasicTab } from './basic-tab';

export const LogisticsTab = () => {
  const { logisticsStats } = useDashboard();

  if (!logisticsStats) {
    return <BasicTab />;
  }

  const metrics = [
    {
      icon: Truck,
      label: 'Aylık Sefer',
      value: logisticsStats.monthlyTripsCount,
      growth: logisticsStats.monthlyTripsGrowth,
    },
    {
      icon: Clock,
      label: 'Aktif Sefer',
      value: logisticsStats.activeTripsCount,
    },
    {
      icon: Calendar,
      label: 'Planlanan',
      value: logisticsStats.plannedTripsCount,
    },
    {
      icon: BarChart3,
      label: 'Toplam',
      value: logisticsStats.totalTripsCount,
    },
  ];

  const expiringDocItems = logisticsStats.expiringDocuments.map((doc) => ({
    id: doc.id,
    title: doc.name,
    meta: `${doc.days_until_expiry} gün kaldı`,
    dotColor: DashboardTheme.warning,
  }));

  const recentTripItems = logisticsStats.recentTrips.map((trip) => ({
    id: trip.id,
    title: trip.trip_number,
    meta: trip.name || '-',
    dotColor:
      trip.status === 'in_progress'
        ? DashboardTheme.success
        : DashboardTheme.textMuted,
    status: {
      text: trip.status === 'in_progress' ? 'Devam' : 'Bitti',
      isActive: trip.status === 'in_progress',
    },
  }));

  return (
    <>
      <MetricsGrid metrics={metrics} />

      {expiringDocItems.length > 0 && (
        <ListCard
          title="Süresi Yaklaşan Belgeler"
          titleIcon={AlertTriangle}
          titleIconColor={DashboardTheme.warning}
          items={expiringDocItems}
          delay={200}
        />
      )}

      {recentTripItems.length > 0 && (
        <ListCard
          title="Son Seferler"
          titleIcon={Truck}
          titleIconColor={DashboardTheme.accent}
          items={recentTripItems}
          delay={300}
        />
      )}
    </>
  );
};
