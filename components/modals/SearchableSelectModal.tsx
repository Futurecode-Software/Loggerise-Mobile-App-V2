import React, { useState, useCallback, useMemo, forwardRef, useImperativeHandle, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetFlatList,
  BottomSheetBackdrop,
  BottomSheetTextInput,
  useBottomSheetSpringConfigs,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Search, Check, X } from 'lucide-react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

export interface SelectOption<T = any> {
  value: string | number;
  label: string;
  subtitle?: string;
  data?: T;
}

export interface SearchableSelectModalRef {
  present: () => void;
  dismiss: () => void;
}

interface SearchableSelectModalProps<T = any> {
  title: string;
  options: SelectOption<T>[];
  selectedValue?: string | number | null;
  onSelect: (option: SelectOption<T>) => void;
  onDismiss?: () => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  loading?: boolean;
}

function SearchableSelectModalComponent<T = any>(
  {
    title,
    options,
    selectedValue,
    onSelect,
    onDismiss,
    placeholder = 'Seçiniz',
    searchPlaceholder = 'Ara...',
    emptyMessage = 'Sonuç bulunamadı',
    loading = false,
  }: SearchableSelectModalProps<T>,
  ref: React.Ref<SearchableSelectModalRef>
) {
  const colors = Colors.light;
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    present: () => bottomSheetRef.current?.present(),
    dismiss: () => bottomSheetRef.current?.dismiss(),
  }));

  // Tek snap point - direkt %90'da açılır
  const snapPoints = useMemo(() => ['90%'], []);

  // iOS-like spring animation
  const animationConfigs = useBottomSheetSpringConfigs({
    damping: 80,
    overshootClamping: true,
    stiffness: 500,
  });

  // Backdrop - arka plana tıklayınca kapatır
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

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;

    const query = searchQuery.toLowerCase();
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(query) ||
        (option.subtitle && option.subtitle.toLowerCase().includes(query))
    );
  }, [options, searchQuery]);

  const handleSelect = useCallback(
    (option: SelectOption<T>) => {
      onSelect(option);
      bottomSheetRef.current?.dismiss();
    },
    [onSelect]
  );

  const handleDismiss = useCallback(() => {
    setSearchQuery('');
    onDismiss?.();
  }, [onDismiss]);

  const renderItem = useCallback(
    ({ item }: { item: SelectOption<T> }) => {
      const isSelected = item.value === selectedValue;

      return (
        <TouchableOpacity
          style={[
            styles.item,
            { backgroundColor: isSelected ? colors.surface : colors.background },
          ]}
          onPress={() => handleSelect(item)}
          activeOpacity={0.7}
        >
          <View style={styles.itemContent}>
            <View style={styles.itemTextContainer}>
              <Text style={[styles.itemLabel, { color: colors.text }]} numberOfLines={1}>
                {item.label}
              </Text>
              {item.subtitle && (
                <Text style={[styles.itemSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
                  {item.subtitle}
                </Text>
              )}
            </View>
            {isSelected && (
              <View style={styles.checkIcon}>
                <Check size={20} color={colors.success} strokeWidth={2.5} />
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [selectedValue, colors, handleSelect]
  );

  const renderEmpty = useCallback(() => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>Yükleniyor...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Search size={48} color={colors.textMuted} strokeWidth={1.5} />
        <Text style={[styles.emptyText, { color: colors.text }]}>{emptyMessage}</Text>
        {searchQuery.trim() && (
          <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
            &quot;{searchQuery}&quot; için sonuç bulunamadı
          </Text>
        )}
      </View>
    );
  }, [loading, searchQuery, emptyMessage, colors]);

  const renderHeader = useCallback(() => (
    <>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {filteredOptions.length} sonuç
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => bottomSheetRef.current?.dismiss()}
          style={styles.closeButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={24} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={[styles.searchContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <Search size={20} color={colors.icon} />
        <BottomSheetTextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={searchPlaceholder}
          placeholderTextColor={colors.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </>
  ), [title, filteredOptions.length, searchQuery, searchPlaceholder, colors]);

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      enableContentPanningGesture={false}
      enableDynamicSizing={false}
      animateOnMount={true}
      animationConfigs={animationConfigs}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handleIndicator}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      onDismiss={handleDismiss}
    >
      {renderHeader()}

      <BottomSheetFlatList
        data={filteredOptions}
        renderItem={renderItem}
        keyExtractor={(item: SelectOption<T>) => String(item.value)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </BottomSheetModal>
  );
}

// Type-safe forwardRef wrapper
export const SearchableSelectModal = forwardRef(SearchableSelectModalComponent) as <T = any>(
  props: SearchableSelectModalProps<T> & { ref?: React.Ref<SearchableSelectModalRef> }
) => ReturnType<typeof SearchableSelectModalComponent>;

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  handleIndicator: {
    backgroundColor: '#9CA3AF',
    width: 48,
    height: 5,
    borderRadius: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    ...Typography.headingLG,
    marginBottom: 2,
  },
  subtitle: {
    ...Typography.bodySM,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    ...Typography.bodyMD,
    paddingVertical: Spacing.xs,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  item: {
    marginBottom: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  itemTextContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  itemLabel: {
    ...Typography.bodyMD,
    fontWeight: '500',
    marginBottom: 2,
  },
  itemSubtitle: {
    ...Typography.bodySM,
  },
  checkIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['5xl'],
    paddingHorizontal: Spacing['2xl'],
  },
  emptyText: {
    ...Typography.bodyLG,
    fontWeight: '500',
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  emptySubtext: {
    ...Typography.bodySM,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
});
