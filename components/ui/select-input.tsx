import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { Colors, Typography, Spacing, BorderRadius, Brand } from '@/constants/theme';

interface Option {
  label: string;
  value: string;
}

interface SelectInputProps {
  label: string;
  options: Option[];
  selectedValue?: string | null;
  onValueChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  searchable?: boolean;
}

export function SelectInput({
  label,
  options,
  selectedValue,
  onValueChange,
  error,
  placeholder = 'Seçiniz...',
  searchable = true,
}: SelectInputProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string | null>(selectedValue || null);
  const [items, setItems] = useState(options.map((opt) => ({ label: opt.label, value: opt.value })));
  const colors = Colors.light;

  // Sync internal state with external selectedValue
  useEffect(() => {
    setValue(selectedValue || null);
  }, [selectedValue]);

  // Sync items when options change
  useEffect(() => {
    setItems(options.map((opt) => ({ label: opt.label, value: opt.value })));
  }, [options]);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
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
          }
        }}
        placeholder={placeholder}
        searchable={searchable}
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
            backgroundColor: colors.background,
          },
        ]}
        dropDownContainerStyle={[
          styles.dropDownContainerStyle,
          {
            borderColor: error ? colors.danger : colors.border,
            backgroundColor: colors.card,
          },
        ]}
        textStyle={[styles.textStyle, { color: colors.text }]}
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
      />
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
});
