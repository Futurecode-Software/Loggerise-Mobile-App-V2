/**
 * Stock Management Dashboard Quick Actions
 */

import { useMemo } from 'react';
import { router } from 'expo-router';
import {
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  FolderTree,
  Tag,
  ArrowLeftRight,
} from 'lucide-react-native';
import { QuickAction } from '@/contexts/quick-actions-context';
import { useHaptics } from '@/hooks/use-haptics';

export const useStockQuickActions = (): QuickAction[] => {
  const { hapticLight } = useHaptics();

  return useMemo(
    () => [
      {
        id: 'new-product',
        label: 'Yeni Ürün Ekle',
        icon: Package,
        onPress: () => {
          hapticLight();
          router.push('/products');
        },
        permission: 'products.create',
      },
      {
        id: 'stock-in',
        label: 'Stok Giriş',
        icon: ArrowDownToLine,
        onPress: () => {
          hapticLight();
          router.push('/stock/new?type=stock_in');
        },
        permission: 'stock_movements.create',
      },
      {
        id: 'stock-out',
        label: 'Stok Çıkış',
        icon: ArrowUpFromLine,
        onPress: () => {
          hapticLight();
          router.push('/stock/new?type=stock_out');
        },
        permission: 'stock_movements.create',
      },
      {
        id: 'category',
        label: 'Kategori Ekle',
        icon: FolderTree,
        onPress: () => {
          hapticLight();
          router.push('/products');
        },
        permission: 'product_categories.create',
      },
      {
        id: 'brand',
        label: 'Marka Ekle',
        icon: Tag,
        onPress: () => {
          hapticLight();
          router.push('/products');
        },
        permission: 'product_brands.create',
      },
      {
        id: 'transfer',
        label: 'Stok Transfer',
        icon: ArrowLeftRight,
        onPress: () => {
          hapticLight();
          router.push('/stock/transfer');
        },
        permission: 'stock_movements.create',
      },
    ],
    [hapticLight]
  );
};
