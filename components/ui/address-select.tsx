/**
 * AddressSelect Component
 *
 * Firma seçildikten sonra o firmanın adreslerini gösteren select component.
 * Web'deki LoadAddressSelect ile aynı mantıkta çalışır.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { MapPin, X, ChevronDown, Check } from 'lucide-react-native';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import api from '@/services/api';

export interface AddressOption {
  value: number;
  label: string;
  title?: string;
  address?: string;
}

interface AddressSelectProps {
  label?: string;
  placeholder?: string;
  contactId?: number | null;
  value?: number | null;
  selectedOption?: AddressOption | null;
  onValueChange: (value: number | null) => void;
  onSelect?: (option: AddressOption | null) => void;
  addressType?: 'pickup' | 'delivery';
  error?: string;
  disabled?: boolean;
}

export function AddressSelect({
  label,
  placeholder = 'Adres seçiniz...',
  contactId,
  value,
  selectedOption: selectedOptionProp,
  onValueChange,
  onSelect,
  addressType,
  error,
  disabled = false,
}: AddressSelectProps) {
  const colors = Colors.light;

  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<AddressOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<AddressOption | null>(
    selectedOptionProp || null
  );

  // Sync with external selectedOption prop
  useEffect(() => {
    if (selectedOptionProp !== undefined) {
      setSelectedOption(selectedOptionProp);
    }
  }, [selectedOptionProp]);

  // Load addresses when contactId changes
  const loadAddresses = useCallback(async () => {
    if (!contactId) {
      setOptions([]);
      setSelectedOption(null);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get(`/contacts/${contactId}/addresses`, {
        params: addressType ? { address_type: addressType } : {},
      });

      const addresses = response.data.data || [];
      const mappedAddresses: AddressOption[] = addresses.map((addr: any) => ({
        value: addr.id,
        label: addr.title || addr.address,
        title: addr.title,
        address: addr.address,
      }));

      setOptions(mappedAddresses);

      // If there's a value prop, try to find and set the selected option
      if (value) {
        const selected = mappedAddresses.find((opt) => opt.value === value);
        if (selected) {
          setSelectedOption(selected);
        }
      }
    } catch (error) {
      if (__DEV__) console.error('Error loading addresses:', error);
      setOptions([]);
    } finally {
      setIsLoading(false);
    }
  }, [contactId, addressType, value]);

  // Load addresses when contactId changes or modal opens
  useEffect(() => {
    if (contactId) {
      loadAddresses();
    } else {
      setOptions([]);
      setSelectedOption(null);
    }
  }, [contactId]);

  // Handle option selection
  const handleSelect = useCallback(
    (option: AddressOption) => {
      setSelectedOption(option);
      onValueChange(option.value);
      onSelect?.(option);
      setIsOpen(false);
    },
    [onValueChange, onSelect]
  );

  // Handle clear
  const handleClear = useCallback(() => {
    setSelectedOption(null);
    onValueChange(null);
    onSelect?.(null);
  }, [onValueChange, onSelect]);

  const isDisabled = disabled || !contactId;

  // Render option item
  const renderOption = ({ item }: { item: AddressOption }) => {
    const isSelected = selectedOption?.value === item.value;

    return (
      <TouchableOpacity
        style={[
          styles.optionItem,
          { borderBottomColor: colors.border },
          isSelected && { backgroundColor: colors.surface },
        ]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.optionContent}>
          <MapPin size={16} color={colors.icon} style={styles.optionIcon} />
          <View style={styles.optionTextContainer}>
            <Text style={[styles.optionTitle, { color: colors.text }]} numberOfLines={1}>
              {item.title || item.label}
            </Text>
            {item.address && (
              <Text style={[styles.optionAddress, { color: colors.textMuted }]} numberOfLines={2}>
                {item.address}
              </Text>
            )}
          </View>
        </View>
        {isSelected && <Check size={18} color={Brand.primary} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      )}

      {/* Select Button */}
      <TouchableOpacity
        style={[
          styles.selectButton,
          {
            borderColor: error ? colors.danger : colors.border,
            backgroundColor: isDisabled ? colors.surface : colors.background,
          },
        ]}
        onPress={() => !isDisabled && setIsOpen(true)}
        disabled={isDisabled}
        activeOpacity={0.7}
      >
        <View style={styles.selectContent}>
          {selectedOption ? (
            <>
              <MapPin size={16} color={Brand.primary} />
              <View style={styles.selectedTextContainer}>
                <Text style={[styles.selectedText, { color: colors.text }]} numberOfLines={1}>
                  {selectedOption.title || selectedOption.label}
                </Text>
              </View>
            </>
          ) : (
            <Text style={[styles.placeholder, { color: colors.textMuted }]}>
              {!contactId ? 'Önce firma seçiniz' : placeholder}
            </Text>
          )}
        </View>

        <View style={styles.selectActions}>
          {selectedOption && !isDisabled && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={16} color={colors.icon} />
            </TouchableOpacity>
          )}
          <ChevronDown size={18} color={colors.icon} />
        </View>
      </TouchableOpacity>

      {/* Error message */}
      {error && <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>}

      {/* Address Selection Modal */}
      <Modal
        visible={isOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsOpen(false)}
      >
        <KeyboardAvoidingView
          style={[styles.modalContainer, { backgroundColor: colors.background }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Adres Seçin</Text>
              <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                Firmanın kayıtlı adreslerinden birini seçin
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.surface }]}
              onPress={() => setIsOpen(false)}
            >
              <X size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Address List */}
          <View style={styles.listContainer}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Brand.primary} />
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                  Adresler yükleniyor...
                </Text>
              </View>
            ) : options.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MapPin size={48} color={colors.border} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  Bu firmaya ait adres bulunamadı
                </Text>
              </View>
            ) : (
              <FlatList
                data={options}
                renderItem={renderOption}
                keyExtractor={(item) => item.value.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    minHeight: 44,
  },
  selectContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  selectedTextContainer: {
    flex: 1,
  },
  selectedText: {
    fontSize: 13,
    fontWeight: '500',
  },
  placeholder: {
    fontSize: 13,
  },
  selectActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  errorText: {
    fontSize: 11,
    marginTop: 4,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeButton: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
  // Option styles
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  optionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  optionIcon: {
    marginTop: 2,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  optionAddress: {
    fontSize: 11,
    marginTop: 2,
  },
});
