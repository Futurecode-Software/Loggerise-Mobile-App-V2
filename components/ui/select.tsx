import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { Colors, Typography, Spacing, BorderRadius, Brand } from '@/constants/theme';

interface SelectItem {
  label: string;
  value: string;
}

interface SelectProps {
  label?: string;
  data: SelectItem[];
  value?: string | null;
  onValueChange: (value: string | undefined) => void;
  error?: string;
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  loading?: boolean;
  required?: boolean;
}

/**
 * Select component - wrapper for dropdown picker with consistent API
 *
 * Props:
 * - data: Array of {label, value} items
 * - value: Currently selected value
 * - onValueChange: Callback when selection changes
 * - loading: Show loading indicator
 * - disabled: Disable the select
 */
export function Select({
  label,
  data,
  value: valueProp,
  onValueChange,
  error,
  placeholder = 'Seçiniz...',
  searchable = true,
  disabled = false,
  loading = false,
  required = false,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string | null>(valueProp ?? null);
  const colors = Colors.light;

  // Memoize data to prevent infinite re-renders
  const dataKey = useMemo(
    () => JSON.stringify(data.map((item) => ({ label: item.label, value: item.value }))),
    [data]
  );
  const prevDataKeyRef = useRef(dataKey);

  const [items, setItems] = useState(data.map((item) => ({ label: item.label, value: item.value })));

  // Sync internal state with external value prop
  useEffect(() => {
    setValue(valueProp ?? null);
  }, [valueProp]);

  // Sync items when data content actually changes
  useEffect(() => {
    if (prevDataKeyRef.current !== dataKey) {
      prevDataKeyRef.current = dataKey;
      setItems(data.map((item) => ({ label: item.label, value: item.value })));
    }
  }, [dataKey, data]);

  const isDisabled = disabled || loading;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>
          {label}
          {required && <Text style={{ color: colors.danger }}> *</Text>}
        </Text>
      )}
      <View style={styles.dropdownWrapper}>
        <DropDownPicker
          open={open}
          setOpen={setOpen}
          value={value}
          setValue={setValue}
          items={items}
          setItems={setItems}
          onChangeValue={(val) => {
            if (val !== null && val !== undefined) {
              onValueChange(val);
            } else {
              onValueChange(undefined);
            }
          }}
          placeholder={loading ? 'Yükleniyor...' : placeholder}
          searchable={searchable && items.length > 5}
          searchPlaceholder="Ara..."
          listMode="MODAL"
          modalContentContainerStyle={{
            backgroundColor: colors.card,
            paddingBottom: 40,
          }}
          modalProps={{
            animationType: 'none',
            transparent: true,
          }}
          style={[
            styles.dropdownStyle,
            {
              borderColor: error ? colors.danger : colors.border,
              backgroundColor: isDisabled ? colors.background + '80' : colors.background,
            },
          ]}
          dropDownContainerStyle={[
            styles.dropDownContainerStyle,
            {
              borderColor: error ? colors.danger : colors.border,
              backgroundColor: colors.card,
            },
          ]}
          textStyle={[styles.textStyle, { color: isDisabled ? colors.textMuted : colors.text }]}
          labelStyle={[styles.labelStyle, { color: colors.text }]}
          placeholderStyle={[styles.placeholderStyle, { color: colors.textMuted }]}
          selectedItemContainerStyle={styles.selectedItemContainerStyle}
          selectedItemLabelStyle={[styles.selectedItemLabelStyle, { color: Brand.primary }]}
          itemSeparator={styles.itemSeparator}
          itemSeparatorStyle={[{ backgroundColor: colors.border }]}
          searchContainerStyle={[styles.searchContainerStyle, { backgroundColor: colors.background }]}
          searchTextInputStyle={[
            styles.searchTextInputStyle,
            {
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          searchPlaceholderTextColor={colors.textMuted}
          arrowIconStyle={styles.arrowIconStyle}
          showTickIcon={false}
          closeAfterSelecting={true}
          closeOnBackPressed={true}
          disabled={isDisabled}
        />
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={Brand.primary} />
          </View>
        )}
      </View>
      {error && <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
    zIndex: 1000,
  },
  label: {
    ...Typography.bodyMD,
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  dropdownWrapper: {
    position: 'relative',
  },
  dropdownStyle: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    minHeight: 48,
    justifyContent: 'center',
  },
  dropDownContainerStyle: {
    borderWidth: 1,
    borderBottomLeftRadius: BorderRadius.md,
    borderBottomRightRadius: BorderRadius.md,
    marginTop: -1,
  },
  textStyle: {
    ...Typography.bodyMD,
    fontSize: 15,
  },
  labelStyle: {
    ...Typography.bodyMD,
    fontSize: 15,
  },
  placeholderStyle: {
    ...Typography.bodyMD,
    fontSize: 15,
  },
  selectedItemContainerStyle: {
    backgroundColor: 'rgba(25, 118, 210, 0.1)',
  },
  selectedItemLabelStyle: {
    fontWeight: '600',
  },
  itemSeparator: true,
  itemSeparatorStyle: {
    height: 0.5,
  },
  searchContainerStyle: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  searchTextInputStyle: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 14,
    height: 40,
  },
  arrowIconStyle: {
    width: 20,
    height: 20,
  },
  errorText: {
    ...Typography.bodySM,
    marginTop: Spacing.sm,
  },
  loadingOverlay: {
    position: 'absolute',
    right: Spacing.xl,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
