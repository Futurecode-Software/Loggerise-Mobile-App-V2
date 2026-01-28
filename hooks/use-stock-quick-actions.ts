/**
 * Stock Management Dashboard Quick Actions
 */

import { useMemo } from 'react';
import { router } from 'expo-router';
import {
  Package,
  FolderTree,
  Tag,
  Layers,
  Box,
  ArrowLeftRight,
  Warehouse,
} from 'lucide-react-native';
import { QuickAction } from '@/contexts/quick-actions-context';
import { useHaptics } from '@/hooks/use-haptics';

export const useStockQuickActions = (): QuickAction[] => {
  const { hapticLight } = useHaptics();

  return useMemo(
    () => [
      {
        id: 'view-products',
        label: 'Ürünleri Gör',
        icon: Package,
        onPress: () => {
          hapticLight();
          router.push('/products' as any);
        },
        permission: 'products.view',
      },
      {
        id: 'new-product',
        label: 'Yeni Ürün Ekle',
        icon: Box,
        onPress: () => {
          hapticLight();
          router.push('/stock/products/new' as any);
        },
        permission: 'products.create',
      },
      {
        id: 'view-categories',
        label: 'Kategoriler',
        icon: FolderTree,
        onPress: () => {
          hapticLight();
          router.push('/stock/categories' as any);
        },
        permission: 'product_categories.view',
      },
      {
        id: 'view-brands',
        label: 'Markalar',
        icon: Tag,
        onPress: () => {
          hapticLight();
          router.push('/stock/brands' as any);
        },
        permission: 'product_brands.view',
      },
      {
        id: 'view-models',
        label: 'Modeller',
        icon: Layers,
        onPress: () => {
          hapticLight();
          router.push('/stock/models' as any);
        },
        permission: 'product_models.view',
      },
      {
        id: 'view-warehouses',
        label: 'Depolar',
        icon: Warehouse,
        onPress: () => {
          hapticLight();
          router.push('/warehouse' as any);
        },
        permission: 'warehouses.view',
      },
      {
        id: 'stock-movements',
        label: 'Stok Hareketleri',
        icon: ArrowLeftRight,
        onPress: () => {
          hapticLight();
          router.push('/stock/movements' as any);
        },
        permission: 'stock_movements.view',
      },
    ],
    [hapticLight]
  );
};
