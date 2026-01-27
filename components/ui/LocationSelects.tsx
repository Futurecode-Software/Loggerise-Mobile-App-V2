/**
 * Location Select Components
 *
 * Country, State, City selects with Bottom Sheet Modal
 * Follows DESIGN_STANDARDS.md - Full Screen Searchable Select Modal
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { ChevronDown, Search, X } from 'lucide-react-native';
import {
  BottomSheetModal,
  BottomSheetFlatList,
  BottomSheetBackdrop,
  BottomSheetTextInput,
  useBottomSheetSpringConfigs,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Colors, Typography, Spacing, BorderRadius, Brand } from '@/constants/theme';
import {
  searchCountries,
  searchStates,
  searchCities,
  LocationOption,
} from '@/services/endpoints/locations';

interface BaseLocationSelectProps {
  value?: number | string | null;
  onChange: (value: number | string | null) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
}

/**
 * Generic Bottom Sheet Select Modal Component
 */
interface SelectModalProps {
  bottomSheetRef: React.RefObject<BottomSheetModal>;
  options: LocationOption[];
  selectedValue?: number | string | null;
  onSelect: (value: number | string | null) => void;
  title: string;
  isLoading: boolean;
  searchValue: string;
  onSearchChange: (text: string) => void;
  emptyMessage?: string;
  resultCount?: number;
  onClose?: () => void;
}

function SelectModal({
  bottomSheetRef,
  options,
  selectedValue,
  onSelect,
  title,
  isLoading,
  searchValue,
  onSearchChange,
  emptyMessage = 'Sonuç bulunamadı',
  resultCount,
  onClose,
}: SelectModalProps) {
  const colors = Colors.light;

  // Snap points - Full screen modal (90%)
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

  const renderItem = useCallback(
    ({ item }: { item: LocationOption }): React.ReactElement => {
      const isSelected = String(selectedValue) === String(item.value);
      return (
        <TouchableOpacity
          style={[
            styles.optionItem,
            isSelected && { backgroundColor: colors.primaryLight },
          ]}
          onPress={() => {
            onSelect(item.value);
            bottomSheetRef.current?.dismiss();
          }}
        >
          <Text
            style={[
              styles.optionText,
              { color: isSelected ? Brand.primary : colors.text },
            ]}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      );
    },
    [selectedValue, onSelect, bottomSheetRef, colors]
  );

  const renderEmpty = useCallback(() => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={Brand.primary} />
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          {emptyMessage}
        </Text>
      </View>
    );
  }, [isLoading, emptyMessage, colors]);

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
      onDismiss={onClose}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {resultCount !== undefined && (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {resultCount} sonuç
            </Text>
          )}
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
      <View style={[styles.searchContainer, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Search size={20} color={colors.icon} />
        <BottomSheetTextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Ara..."
          placeholderTextColor={colors.textMuted}
          value={searchValue}
          onChangeText={onSearchChange}
        />
      </View>

      {/* List */}
      <BottomSheetFlatList
        data={options}
        renderItem={renderItem}
        keyExtractor={(item: LocationOption) => String(item.value)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </BottomSheetModal>
  );
}

/**
 * Country Select
 */
export function CountrySelect({
  value,
  onChange,
  error,
  placeholder = 'Ülke seçiniz...',
  disabled = false,
  label,
}: BaseLocationSelectProps) {
  const colors = Colors.light;
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [options, setOptions] = useState<LocationOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedLabel, setSelectedLabel] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);

  // Load options
  const loadOptions = useCallback(async (search: string) => {
    setIsLoading(true);
    try {
      const results = await searchCountries(search);
      setOptions(results);

      // Update selected label if value matches
      if (value) {
        const found = results.find((opt) => String(opt.value) === String(value));
        if (found) setSelectedLabel(found.label);
      }
    } catch (error) {
      console.error('Error loading countries:', error);
    } finally {
      setIsLoading(false);
    }
  }, [value]);

  // Initial load
  useEffect(() => {
    loadOptions('');
  }, []);

  // Search with debounce
  useEffect(() => {
    const timeout = setTimeout(() => loadOptions(searchText), 300);
    return () => clearTimeout(timeout);
  }, [searchText, loadOptions]);

  const getBorderColor = () => {
    if (error) return colors.danger;
    if (isOpen) return colors.primary;
    return colors.border;
  };

  const handleOpen = () => {
    if (!disabled) {
      setIsOpen(true);
      bottomSheetRef.current?.present();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      )}
      <TouchableOpacity
        style={[
          styles.selectButton,
          {
            borderColor: getBorderColor(),
            backgroundColor: colors.surface,
          },
          isOpen && styles.focused,
          error && styles.error,
          disabled && styles.disabled,
        ]}
        onPress={handleOpen}
        disabled={disabled}
      >
        <Text
          style={[
            styles.selectText,
            {
              color: selectedLabel ? colors.text : colors.placeholder,
            },
          ]}
        >
          {selectedLabel || placeholder}
        </Text>
        <ChevronDown size={20} color={colors.icon} />
      </TouchableOpacity>
      {error && <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>}

      <SelectModal
        bottomSheetRef={bottomSheetRef as React.RefObject<BottomSheetModal>}
        options={options}
        selectedValue={value}
        onSelect={(val) => {
          onChange(val);
          const found = options.find((opt) => String(opt.value) === String(val));
          if (found) setSelectedLabel(found.label);
        }}
        title="Ülke Seçin"
        isLoading={isLoading}
        searchValue={searchText}
        onSearchChange={setSearchText}
        emptyMessage="Ülke bulunamadı"
        resultCount={options.length}
        onClose={handleClose}
      />
    </View>
  );
}

/**
 * State Select (İl)
 */
interface StateSelectProps extends BaseLocationSelectProps {
  countryId?: number | string | null;
}

export function StateSelect({
  value,
  onChange,
  countryId,
  error,
  placeholder = 'İl seçiniz...',
  disabled = false,
  label,
}: StateSelectProps) {
  const colors = Colors.light;
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [options, setOptions] = useState<LocationOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedLabel, setSelectedLabel] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);

  const isDisabled = disabled || !countryId;

  // Load options
  const loadOptions = useCallback(
    async (search: string) => {
      if (!countryId) {
        setOptions([]);
        return;
      }

      setIsLoading(true);
      try {
        const results = await searchStates(countryId, search);
        setOptions(results);

        // Update selected label if value matches
        if (value) {
          const found = results.find((opt) => String(opt.value) === String(value));
          if (found) setSelectedLabel(found.label);
        }
      } catch (error) {
        console.error('Error loading states:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [countryId, value]
  );

  // Load when countryId changes
  useEffect(() => {
    if (countryId) {
      loadOptions('');
    } else {
      setOptions([]);
      setSelectedLabel('');
    }
  }, [countryId]);

  // Search with debounce
  useEffect(() => {
    if (!countryId) return;
    const timeout = setTimeout(() => loadOptions(searchText), 300);
    return () => clearTimeout(timeout);
  }, [searchText, loadOptions, countryId]);

  const getBorderColor = () => {
    if (error) return colors.danger;
    if (isOpen) return colors.primary;
    return colors.border;
  };

  const handleOpen = () => {
    if (!isDisabled) {
      setIsOpen(true);
      bottomSheetRef.current?.present();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      )}
      <TouchableOpacity
        style={[
          styles.selectButton,
          {
            borderColor: getBorderColor(),
            backgroundColor: colors.surface,
          },
          isOpen && styles.focused,
          error && styles.error,
          isDisabled && styles.disabled,
        ]}
        onPress={handleOpen}
        disabled={isDisabled}
      >
        <Text
          style={[
            styles.selectText,
            {
              color: selectedLabel ? colors.text : colors.placeholder,
            },
          ]}
        >
          {selectedLabel || placeholder}
        </Text>
        <ChevronDown size={20} color={colors.icon} />
      </TouchableOpacity>
      {error && <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>}

      <SelectModal
        bottomSheetRef={bottomSheetRef as React.RefObject<BottomSheetModal>}
        options={options}
        selectedValue={value}
        onSelect={(val) => {
          onChange(val);
          const found = options.find((opt) => String(opt.value) === String(val));
          if (found) setSelectedLabel(found.label);
        }}
        title="İl Seçin"
        isLoading={isLoading}
        searchValue={searchText}
        onSearchChange={setSearchText}
        emptyMessage={!countryId ? 'Önce ülke seçiniz' : 'İl bulunamadı'}
        resultCount={options.length}
        onClose={handleClose}
      />
    </View>
  );
}

/**
 * City Select (İlçe)
 */
interface CitySelectProps extends BaseLocationSelectProps {
  stateId?: number | string | null;
  countryId?: number | string | null;
}

export function CitySelect({
  value,
  onChange,
  stateId,
  countryId,
  error,
  placeholder = 'İlçe seçiniz...',
  disabled = false,
  label,
}: CitySelectProps) {
  const colors = Colors.light;
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [options, setOptions] = useState<LocationOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedLabel, setSelectedLabel] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);

  const isDisabled = disabled || !stateId;

  // Load options
  const loadOptions = useCallback(
    async (search: string) => {
      if (!stateId) {
        setOptions([]);
        return;
      }

      setIsLoading(true);
      try {
        const results = await searchCities(stateId, countryId ?? undefined, search);
        setOptions(results);

        // Update selected label if value matches
        if (value) {
          const found = results.find((opt) => String(opt.value) === String(value));
          if (found) setSelectedLabel(found.label);
        }
      } catch (error) {
        console.error('Error loading cities:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [stateId, countryId, value]
  );

  // Load when stateId changes
  useEffect(() => {
    if (stateId) {
      loadOptions('');
    } else {
      setOptions([]);
      setSelectedLabel('');
    }
  }, [stateId]);

  // Search with debounce
  useEffect(() => {
    if (!stateId) return;
    const timeout = setTimeout(() => loadOptions(searchText), 300);
    return () => clearTimeout(timeout);
  }, [searchText, loadOptions, stateId]);

  const getBorderColor = () => {
    if (error) return colors.danger;
    if (isOpen) return colors.primary;
    return colors.border;
  };

  const handleOpen = () => {
    if (!isDisabled) {
      setIsOpen(true);
      bottomSheetRef.current?.present();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      )}
      <TouchableOpacity
        style={[
          styles.selectButton,
          {
            borderColor: getBorderColor(),
            backgroundColor: colors.surface,
          },
          isOpen && styles.focused,
          error && styles.error,
          isDisabled && styles.disabled,
        ]}
        onPress={handleOpen}
        disabled={isDisabled}
      >
        <Text
          style={[
            styles.selectText,
            {
              color: selectedLabel ? colors.text : colors.placeholder,
            },
          ]}
        >
          {selectedLabel || placeholder}
        </Text>
        <ChevronDown size={20} color={colors.icon} />
      </TouchableOpacity>
      {error && <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>}

      <SelectModal
        bottomSheetRef={bottomSheetRef as React.RefObject<BottomSheetModal>}
        options={options}
        selectedValue={value}
        onSelect={(val) => {
          onChange(val);
          const found = options.find((opt) => String(opt.value) === String(val));
          if (found) setSelectedLabel(found.label);
        }}
        title="İlçe Seçin"
        isLoading={isLoading}
        searchValue={searchText}
        onSearchChange={setSearchText}
        emptyMessage={!stateId ? 'Önce il seçiniz' : 'İlçe bulunamadı'}
        resultCount={options.length}
        onClose={handleClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.bodySM,
    marginBottom: Spacing.xs,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    minHeight: 48,
  },
  focused: {
    borderWidth: 2,
  },
  error: {
    borderWidth: 1,
  },
  selectText: {
    ...Typography.bodyMD,
    flex: 1,
  },
  disabled: {
    opacity: 0.5,
  },
  errorText: {
    ...Typography.bodySM,
    marginTop: Spacing.xs,
  },
  // Bottom Sheet Modal styles
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
    paddingBottom: Spacing['2xl'],
  },
  optionItem: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionText: {
    ...Typography.bodyMD,
  },
  emptyContainer: {
    padding: Spacing['3xl'],
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.bodyMD,
  },
});
