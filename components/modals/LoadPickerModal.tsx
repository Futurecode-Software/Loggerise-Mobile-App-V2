import React, { forwardRef, useImperativeHandle, useRef, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Package, Check } from 'lucide-react-native';
import {
  BottomSheetModal,
  BottomSheetFlatList,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  useBottomSheetSpringConfigs,
} from '@gorhom/bottom-sheet';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import type { Load } from '@/services/endpoints/loads';
import { getStatusColor } from '@/services/endpoints/loads';

export interface LoadPickerModalRef {
  present: () => void;
  dismiss: () => void;
}

interface LoadPickerModalProps {
  loads: Load[];
  onSelectLoad: (load: Load) => Promise<void>;
  loadingLoadId: number | null;
}

/**
 * Load Picker Bottom Sheet Modal
 *
 * Displays unassigned loads in a scrollable list
 * Allows multiple selections without closing
 * Closes only on X button or swipe down
 */
const LoadPickerModal = forwardRef<LoadPickerModalRef, LoadPickerModalProps>(
  ({ loads, onSelectLoad, loadingLoadId }, ref) => {
    const colors = Colors.light;
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const [selectedLoads, setSelectedLoads] = useState<Set<number>>(new Set());

    // Snap points for the modal
    // Starts at 50% (half screen), expandable to 75% and 90%
    const snapPoints = useMemo(() => ['50%', '75%', '90%'], []);

    // iOS-like spring animation config
    const animationConfigs = useBottomSheetSpringConfigs({
      damping: 80,
      overshootClamping: true,
      restDisplacementThreshold: 0.1,
      restSpeedThreshold: 0.1,
      stiffness: 500,
    });

    // Custom backdrop with dimmed background
    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
          pressBehavior="close"
        />
      ),
      []
    );

    // Expose present/dismiss methods to parent
    useImperativeHandle(ref, () => ({
      present: () => {
        bottomSheetRef.current?.present();
      },
      dismiss: () => {
        bottomSheetRef.current?.dismiss();
      },
    }));

    const handleDismiss = () => {
      // Reset selected loads when modal is closed
      setTimeout(() => {
        setSelectedLoads(new Set());
      }, 200);
    };

    const handleSelectLoad = async (load: Load) => {
      try {
        await onSelectLoad(load);
        // Add to selected set for visual feedback
        setSelectedLoads((prev) => new Set([...prev, load.id]));
        // Don't close modal - user might want to select more loads
      } catch (err) {
        // Error is handled by parent
        console.error('Load selection error:', err);
      }
    };

    const renderLoadItem = ({ item: load }: { item: Load }) => {
      const isLoading = loadingLoadId === load.id;
      const isSelected = selectedLoads.has(load.id);

      return (
        <TouchableOpacity
          style={[
            styles.loadItem,
            { borderColor: colors.border },
            isSelected && { backgroundColor: Brand.primary + '08', borderColor: Brand.primary },
          ]}
          onPress={() => handleSelectLoad(load)}
          disabled={isLoading || isSelected}
          activeOpacity={0.7}
        >
          <View style={styles.loadInfo}>
            <Text style={[styles.loadNumber, { color: colors.text }]}>{load.load_number}</Text>
            <Text style={[styles.loadCargo, { color: colors.textSecondary }]} numberOfLines={1}>
              {load.cargo_name || '-'}
            </Text>
            {load.customer && (
              <Text style={[styles.loadCustomer, { color: colors.textMuted }]} numberOfLines={1}>
                {load.customer.name}
              </Text>
            )}
          </View>

          <View style={styles.loadActions}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(load.status) }]} />
            {isLoading ? (
              <ActivityIndicator size="small" color={Brand.primary} />
            ) : isSelected ? (
              <View style={[styles.checkIcon, { backgroundColor: Brand.primary }]}>
                <Check size={16} color="#FFFFFF" />
              </View>
            ) : (
              <View style={[styles.plusIcon, { borderColor: Brand.primary }]}>
                <Text style={[styles.plusText, { color: Brand.primary }]}>+</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    };

    const renderEmpty = () => (
      <View style={styles.emptyContainer}>
        <Package size={48} color={colors.textMuted} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Atanmamış yük yok</Text>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Tüm yükler pozisyonlara atanmış
        </Text>
      </View>
    );

    const renderHeader = () => (
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Yük Seç</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {loads.length} yük mevcut
          </Text>
        </View>
      </View>
    );

    return (
      <BottomSheetModal
        ref={bottomSheetRef}
        index={1}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        animateOnMount={true}
        animationConfigs={animationConfigs}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.background}
        handleIndicatorStyle={styles.handleIndicator}
        onDismiss={handleDismiss}
        style={styles.shadow}
      >
        {renderHeader()}
        <BottomSheetFlatList
          data={loads}
          renderItem={renderLoadItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      </BottomSheetModal>
    );
  }
);

LoadPickerModal.displayName = 'LoadPickerModal';

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  handleIndicator: {
    backgroundColor: '#D1D5DB',
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  shadow: {
    ...Shadows.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  title: {
    ...Typography.headingMD,
  },
  subtitle: {
    ...Typography.bodyXS,
    marginTop: 2,
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  loadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
    backgroundColor: '#FFFFFF',
  },
  loadInfo: {
    flex: 1,
  },
  loadNumber: {
    ...Typography.bodySM,
    fontWeight: '600',
  },
  loadCargo: {
    ...Typography.bodyXS,
    marginTop: 2,
  },
  loadCustomer: {
    ...Typography.bodyXS,
    marginTop: 2,
  },
  loadActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  plusIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusText: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 20,
  },
  checkIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: Spacing['2xl'],
    gap: Spacing.md,
    marginTop: Spacing['4xl'],
  },
  emptyTitle: {
    ...Typography.headingSM,
  },
  emptyText: {
    ...Typography.bodyMD,
    textAlign: 'center',
  },
});

export default LoadPickerModal;
