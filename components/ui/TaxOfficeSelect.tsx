import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { ChevronDown, X, Search } from 'lucide-react-native';
import {
  BottomSheetModal,
  BottomSheetFlatList,
  BottomSheetBackdrop,
  BottomSheetTextInput,
  useBottomSheetSpringConfigs,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { searchTaxOffices, TaxOffice } from '@/services/endpoints/tax-offices';

interface TaxOfficeSelectProps {
  label?: string;
  value?: number | null;
  onChange: (value: number | null) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
}

export function TaxOfficeSelect({
  label,
  value,
  onChange,
  error,
  placeholder = 'Vergi dairesi seçiniz',
  required = false,
}: TaxOfficeSelectProps) {
  const colors = Colors.light;
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [options, setOptions] = useState<TaxOffice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOffice, setSelectedOffice] = useState<TaxOffice | null>(null);

  // Snap points - Full screen modal (90%)
  const snapPoints = useMemo(() => ['90%'], []);

  // iOS-like spring animation
  const animationConfigs = useBottomSheetSpringConfigs({
    damping: 80,
    overshootClamping: true,
    stiffness: 500,
  });

  // Load selected tax office when value changes
  useEffect(() => {
    if (value && !selectedOffice) {
      // Load from options if already fetched
      const office = options.find(o => o.id === value);
      if (office) {
        setSelectedOffice(office);
      }
    } else if (!value) {
      setSelectedOffice(null);
    }
  }, [value, options]);

  const loadOptions = useCallback(async (search: string) => {
    setIsLoading(true);
    try {
      const results = await searchTaxOffices({ search, limit: 100 });
      setOptions(results);
    } catch (err) {
      if (__DEV__) console.error('Tax office search error:', err);
      setOptions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadOptions('');
  }, [loadOptions]);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadOptions(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, loadOptions]);

  const handleOpen = useCallback(() => {
    if (isOpen) return;
    setIsOpen(true);
    bottomSheetRef.current?.present();
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');
  }, []);

  const handleSelect = useCallback((office: TaxOffice) => {
    setSelectedOffice(office);
    onChange(office.id);
    bottomSheetRef.current?.dismiss();
  }, [onChange]);

  const handleClear = useCallback(() => {
    setSelectedOffice(null);
    onChange(null);
  }, [onChange]);

  const getBorderColor = () => {
    if (error) return colors.danger;
    if (isOpen) return colors.primary;
    return colors.border;
  };

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

  const renderItem = useCallback(({ item }: { item: TaxOffice }) => {
    const isSelected = selectedOffice?.id === item.id;

    return (
      <TouchableOpacity
        style={[
          styles.option,
          { borderBottomColor: colors.border },
          isSelected && { backgroundColor: colors.primaryLight + '10' },
        ]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.optionContent}>
          <Text
            style={[
              styles.optionText,
              { color: isSelected ? colors.primary : colors.text }
            ]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          {item.city && (
            <Text style={[styles.optionSubtext, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.city}
            </Text>
          )}
        </View>
        {isSelected && (
          <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
        )}
      </TouchableOpacity>
    );
  }, [colors, handleSelect, selectedOffice]);

  const renderHeader = useCallback(() => (
    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
      <View style={styles.modalTitleContainer}>
        <Text style={[styles.modalTitle, { color: colors.text }]}>
          {label || 'Vergi Dairesi Seç'}
        </Text>
        {options.length > 0 && (
          <Text style={[styles.resultCount, { color: colors.textMuted }]}>
            {options.length} sonuç
          </Text>
        )}
      </View>

      <View style={[styles.searchContainer, {
        backgroundColor: colors.surface,
        borderColor: colors.border
      }]}>
        <Search size={20} color={colors.icon} style={styles.searchIcon} />
        <BottomSheetTextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Vergi dairesi ara..."
          placeholderTextColor={colors.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.searchClearButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={16} color={colors.icon} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  ), [colors, label, options.length, searchQuery]);

  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: colors.textMuted }]}>
        {searchQuery ? 'Sonuç bulunamadı' : 'Vergi dairesi bulunamadı'}
      </Text>
    </View>
  ), [colors, searchQuery]);

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {label} {required && <Text style={{ color: colors.danger }}>*</Text>}
        </Text>
      )}

      <TouchableOpacity
        style={[
          styles.selectButton,
          {
            borderColor: getBorderColor(),
            backgroundColor: colors.surface,
          },
          isOpen && styles.focused,
        ]}
        onPress={handleOpen}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.selectText,
            { color: selectedOffice ? colors.text : colors.placeholder },
          ]}
          numberOfLines={1}
        >
          {selectedOffice ? selectedOffice.name : placeholder}
        </Text>
        <View style={styles.iconContainer}>
          {selectedOffice && (
            <TouchableOpacity
              onPress={handleClear}
              style={styles.clearButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={16} color={colors.icon} />
            </TouchableOpacity>
          )}
          <ChevronDown size={20} color={colors.icon} />
        </View>
      </TouchableOpacity>

      {error && (
        <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
      )}

      <BottomSheetModal
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        enableContentPanningGesture={false}
        enableDynamicSizing={false}
        animateOnMount={true}
        backdropComponent={renderBackdrop}
        onDismiss={handleClose}
        backgroundStyle={{ backgroundColor: colors.surface }}
        handleIndicatorStyle={{ backgroundColor: colors.border }}
        animationConfigs={animationConfigs}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
      >
        {renderHeader()}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <BottomSheetFlatList
            data={options}
            renderItem={renderItem}
            keyExtractor={(item: TaxOffice) => item.id.toString()}
            ListEmptyComponent={renderEmpty}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.bodySM,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
  },
  focused: {
    borderWidth: 2,
  },
  selectText: {
    ...Typography.bodyMD,
    flex: 1,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  clearButton: {
    padding: Spacing.xs,
  },
  errorText: {
    ...Typography.bodySM,
    marginTop: Spacing.xs,
  },
  modalHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    ...Typography.headingMD,
  },
  resultCount: {
    ...Typography.bodySM,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    minHeight: 44,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.bodyMD,
    paddingVertical: Spacing.sm,
  },
  searchClearButton: {
    padding: Spacing.xs,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: Spacing.xl,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
  },
  optionContent: {
    flex: 1,
    gap: 4,
  },
  optionText: {
    ...Typography.bodyMD,
    fontWeight: '500',
  },
  optionSubtext: {
    ...Typography.bodySM,
  },
  checkmark: {
    ...Typography.headingLG,
    marginLeft: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
  },
  emptyText: {
    ...Typography.bodyMD,
  },
});
