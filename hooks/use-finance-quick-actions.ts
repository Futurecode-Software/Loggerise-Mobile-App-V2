/**
 * Finance Dashboard Quick Actions
 */

import { useMemo } from 'react';
import { router } from 'expo-router';
import {
  DollarSign,
  CreditCard,
  FileText,
  Banknote,
  ArrowUpDown,
} from 'lucide-react-native';
import { QuickAction } from '@/contexts/quick-actions-context';
import { useHaptics } from '@/hooks/use-haptics';

export const useFinanceQuickActions = (): QuickAction[] => {
  const { hapticLight } = useHaptics();

  return useMemo(
    () => [
      {
        id: 'collection',
        label: 'Tahsilat Kaydet',
        icon: DollarSign,
        onPress: () => {
          hapticLight();
          router.push('/(tabs)/transactions');
        },
        permission: 'financial_transactions.create',
      },
      {
        id: 'payment',
        label: 'Ödeme Kaydet',
        icon: CreditCard,
        onPress: () => {
          hapticLight();
          router.push('/(tabs)/transactions');
        },
        permission: 'financial_transactions.create',
      },
      {
        id: 'check',
        label: 'Çek Ekle',
        icon: FileText,
        onPress: () => {
          hapticLight();
          router.push('/checks/new');
        },
        permission: 'checks.create',
      },
      {
        id: 'promissory-note',
        label: 'Senet Ekle',
        icon: FileText,
        onPress: () => {
          hapticLight();
          router.push('/promissory-notes/new');
        },
        permission: 'promissory_notes.create',
      },
      {
        id: 'bank-transfer',
        label: 'Banka Transferi',
        icon: ArrowUpDown,
        onPress: () => {
          hapticLight();
          router.push('/(tabs)/transactions');
        },
        permission: 'financial_transactions.create',
      },
      {
        id: 'invoice',
        label: 'Fatura Kes',
        icon: Banknote,
        onPress: () => {
          hapticLight();
          router.push('/invoices/new');
        },
        permission: 'invoices.create',
      },
    ],
    [hapticLight]
  );
};
