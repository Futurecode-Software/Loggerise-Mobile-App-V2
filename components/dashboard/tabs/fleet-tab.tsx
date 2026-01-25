/**
 * Fleet Tab Component
 *
 * Displays fleet dashboard content with vehicle and driver stats.
 */

import React from 'react';
import {
  Car,
  AlertTriangle,
  UserCheck,
  FileText,
} from 'lucide-react-native';
import { useDashboard } from '@/contexts/dashboard-context';
import { MetricsGrid } from '../metrics-grid';
import { BasicTab } from './basic-tab';

export const FleetTab = () => {
  const { fleetStats } = useDashboard();

  if (!fleetStats) {
    return <BasicTab />;
  }

  const metrics = [
    {
      icon: Car,
      label: 'Aktif Araç',
      value: fleetStats.vehicleStats.active,
    },
    {
      icon: AlertTriangle,
      label: 'Bakımda',
      value: fleetStats.vehicleStats.inMaintenance,
    },
    {
      icon: UserCheck,
      label: 'Aktif Sürücü',
      value: fleetStats.driverStats.active,
    },
    {
      icon: FileText,
      label: 'Sigorta Uyarısı',
      value: fleetStats.expiringInsurances,
    },
  ];

  return <MetricsGrid metrics={metrics} />;
};
