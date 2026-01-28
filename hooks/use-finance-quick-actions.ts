/**
 * Finance Dashboard Quick Actions
 */

import { useMemo } from 'react';
import { router } from 'expo-router';
import {
  Building2,
  Wallet,
  Users,
  ArrowUpDown,
  Receipt,
  Banknote,
  FileText,
} from 'lucide-react-native';
import { QuickAction } from '@/contexts/quick-actions-context';
import { useHaptics } from '@/hooks/use-haptics';

export const useFinanceQuickActions = (): QuickAction[] => {
  const { hapticLight } = useHaptics();

  return useMemo(
    () => [
      {
        id: 'view-cash-registers',
        label: 'Kasalar',
        icon: Wallet,
        onPress: () => {
          hapticLight();
          router.push('/cash-register' as any);
        },
        permission: 'cash_registers.view',
      },
      {
        id: 'view-banks',
        label: 'Bankalar',
        icon: Building2,
        onPress: () => {
          hapticLight();
          router.push('/bank' as any);
        },
        permission: 'banks.view',
      },
      {
        id: 'view-contacts',
        label: 'Cariler',
        icon: Users,
        onPress: () => {
          hapticLight();
          router.push('/(tabs)/contacts' as any);
        },
        permission: 'contacts.view',
      },
      {
        id: 'view-transactions',
        label: 'Mali Hareketler',
        icon: ArrowUpDown,
        onPress: () => {
          hapticLight();
          router.push('/transactions' as any);
        },
        permission: 'financial_transactions.view',
      },
      {
        id: 'new-check',
        label: 'Çek Ekle',
        icon: Receipt,
        onPress: () => {
          hapticLight();
          router.push('/check/new' as any);
        },
        permission: 'checks.create',
      },
      {
        id: 'new-promissory-note',
        label: 'Senet Ekle',
        icon: Banknote,
        onPress: () => {
          hapticLight();
          router.push('/promissory-note/new' as any);
        },
        permission: 'promissory_notes.create',
      },
      {
        id: 'new-invoice',
        label: 'Fatura Kes',
        icon: FileText,
        onPress: () => {
          hapticLight();
          router.push('/finance/invoices/new' as any);
        },
        permission: 'invoices.create',
      },
    ],
    [hapticLight]
  );
};
