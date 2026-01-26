import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Plus, Edit2, Trash2, Package } from 'lucide-react-native';
import { Card, Button, ConfirmDialog } from '@/components/ui';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import CargoItemForm, { CargoItem } from './cargo-item-form';
import { useToast } from '@/hooks/use-toast';

interface QuoteFormStep2Props {
  cargoItems: CargoItem[];
  setCargoItems: (items: CargoItem[]) => void;
  errors: Record<string, string>;
}

export default function QuoteFormStep2({
  cargoItems,
  setCargoItems,
  errors,
}: QuoteFormStep2Props) {
  const colors = Colors.light;
  const toast = useToast();

  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<CargoItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  const handleAddItem = () => {
    setEditingItem(null);
    setShowItemForm(true);
  };

  const handleEditItem = (item: CargoItem) => {
    setEditingItem(item);
    setShowItemForm(true);
  };

  const handleDeleteItem = (itemId: string) => {
    setDeletingItemId(itemId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deletingItemId) {
      setCargoItems(cargoItems.filter((item) => item.id !== deletingItemId));
      setDeleteDialogOpen(false);
      setDeletingItemId(null);
    }
  };

  const handleSaveItem = (item: CargoItem) => {
    if (editingItem) {
      // Update existing item
      setCargoItems(
        cargoItems.map((existing) => (existing.id === item.id ? item : existing))
      );
    } else {
      // Add new item
      setCargoItems([...cargoItems, item]);
    }
  };

  const renderCargoItem = ({ item }: { item: CargoItem }) => (
    <Card style={styles.cargoItemCard}>
      <View style={styles.cargoItemHeader}>
        <View style={[styles.cargoItemIcon, { backgroundColor: Brand.primary + '15' }]}>
          <Package size={20} color={Brand.primary} />
        </View>
        <View style={styles.cargoItemInfo}>
          <Text style={[styles.cargoItemDescription, { color: colors.text }]} numberOfLines={2}>
            {item.description}
          </Text>
          <Text style={[styles.cargoItemDetails, { color: colors.textSecondary }]}>
            {item.quantity} {item.unit}
            {item.weight && ` • ${item.weight} kg`}
            {item.volume && ` • ${item.volume} m³`}
          </Text>
          {item.loading_type && (
            <Text style={[styles.cargoItemType, { color: colors.textMuted }]}>
              {item.loading_type}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.cargoItemActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.surface }]}
          onPress={() => handleEditItem(item)}
        >
          <Edit2 size={16} color={Brand.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.danger + '10' }]}
          onPress={() => handleDeleteItem(item.id!)}
        >
          <Trash2 size={16} color={colors.danger} />
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.surface }]}>
        <Package size={48} color={colors.textMuted} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>Henüz yük kalemi yok</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Yük kalemleri eklemek için + butonunu kullanın
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Yük Kalemleri ({cargoItems.length})
          </Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: Brand.primary }]}
            onPress={handleAddItem}
          >
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {errors.cargo_items && (
          <Text style={[styles.errorText, { color: colors.danger }]}>{errors.cargo_items}</Text>
        )}

        {cargoItems.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={cargoItems}
            renderItem={renderCargoItem}
            keyExtractor={(item) => item.id!}
            contentContainerStyle={styles.cargoItemsList}
            scrollEnabled={false}
          />
        )}
      </Card>

      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Özet</Text>

        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
            Toplam Kalem
          </Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {cargoItems.length} adet
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
            Toplam Ağırlık
          </Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {cargoItems
              .reduce((sum, item) => sum + (item.weight || 0) * item.quantity, 0)
              .toFixed(2)}{' '}
            kg
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Toplam Hacim</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {cargoItems
              .reduce((sum, item) => sum + (item.volume || 0) * item.quantity, 0)
              .toFixed(2)}{' '}
            m³
          </Text>
        </View>
      </Card>

      {/* Cargo Item Form Modal */}
      <CargoItemForm
        visible={showItemForm}
        item={editingItem}
        onClose={() => {
          setShowItemForm(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={deleteDialogOpen}
        title="Yük Kalemini Sil"
        message="Bu yük kalemini silmek istediğinizden emin misiniz?"
        confirmText="Sil"
        cancelText="İptal"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
        variant="destructive"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: Spacing.md,
  },
  section: {
    padding: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.headingMD,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...Typography.bodyXS,
    marginBottom: Spacing.md,
  },
  cargoItemsList: {
    gap: Spacing.md,
  },
  cargoItemCard: {
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cargoItemHeader: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cargoItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cargoItemInfo: {
    flex: 1,
  },
  cargoItemDescription: {
    ...Typography.bodyMD,
    fontWeight: '600',
    marginBottom: 4,
  },
  cargoItemDetails: {
    ...Typography.bodySM,
    marginBottom: 2,
  },
  cargoItemType: {
    ...Typography.bodyXS,
    textTransform: 'capitalize',
  },
  cargoItemActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['2xl'],
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.headingMD,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...Typography.bodyMD,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  summaryLabel: {
    ...Typography.bodyMD,
  },
  summaryValue: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
});
