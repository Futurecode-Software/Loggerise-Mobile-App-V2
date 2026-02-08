/**
 * AutocompleteInput Component
 *
 * Inline autocomplete with dropdown suggestions.
 * Much more user-friendly than modal approach.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Platform,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { Search, X, ChevronDown, Check } from 'lucide-react-native';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';

export interface AutocompleteOption {
  label: string;
  value: string | number;
  subtitle?: string;
}

export interface AutocompleteInputProps {
  label?: string;
  placeholder?: string;
  value?: string | number;
  onValueChange: (value: string | number, option?: AutocompleteOption) => void;
  loadOptions: (searchQuery: string) => Promise<AutocompleteOption[]>;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  minSearchLength?: number;
  debounceMs?: number;
  maxDropdownHeight?: number;
}

export function AutocompleteInput({
  label,
  placeholder = 'Ara ve seç...',
  value,
  onValueChange,
  loadOptions,
  error,
  required,
  disabled,
  minSearchLength = 0,
  debounceMs = 300,
  maxDropdownHeight = 300,
}: AutocompleteInputProps) {
  const colors = Colors.light;

  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<AutocompleteOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<AutocompleteOption | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [dropdownLayout, setDropdownLayout] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);
  const containerRef = useRef<View>(null);

  // Ref to track if initial options have been loaded
  const hasLoadedInitialRef = useRef(false);
  const loadOptionsRef = useRef(loadOptions);
  loadOptionsRef.current = loadOptions;

  // Load initial options or find selected option - only once when value changes
  useEffect(() => {
    if (value && !selectedOption && !hasLoadedInitialRef.current) {
      hasLoadedInitialRef.current = true;
      // Try to load and find the selected option
      loadOptionsRef.current('').then((opts) => {
        const found = opts.find((opt) => opt.value === value);
        if (found) {
          setSelectedOption(found);
          setInputValue(found.label);
        }
      });
    } else if (!value) {
      // Reset when value is cleared
      hasLoadedInitialRef.current = false;
    }
  }, [value, selectedOption]);

  // Debounced search
  useEffect(() => {
    if (!isFocused) return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (inputValue.length < minSearchLength) {
      setOptions([]);
      setIsOpen(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchOptions(inputValue);
    }, debounceMs);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [inputValue, isFocused, minSearchLength, debounceMs]);

  // Fetch options from API
  const fetchOptions = useCallback(
    async (query: string) => {
      setIsLoading(true);
      try {
        const results = await loadOptions(query);
        setOptions(results);
        setIsOpen(results.length > 0);
      } catch (error) {
        if (__DEV__) console.error('Error loading options:', error);
        setOptions([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    },
    [loadOptions]
  );

  // Handle option selection
  const handleSelect = useCallback(
    (option: AutocompleteOption) => {
      setSelectedOption(option);
      setInputValue(option.label);
      onValueChange(option.value, option);
      setIsOpen(false);
      inputRef.current?.blur();
    },
    [onValueChange]
  );

  // Handle input change
  const handleInputChange = useCallback((text: string) => {
    setInputValue(text);
    if (!text) {
      setSelectedOption(null);
      onValueChange('');
    }
  }, [onValueChange]);

  // Handle clear
  const handleClear = useCallback(() => {
    setInputValue('');
    setSelectedOption(null);
    onValueChange('');
    setOptions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  }, [onValueChange]);

  // Handle focus
  const handleFocus = useCallback(() => {
    setIsFocused(true);

    // Measure input position for dropdown placement
    containerRef.current?.measureInWindow((x, y, width, height) => {
      setDropdownLayout({
        top: y + height,
        left: x,
        width: width,
      });
    });

    // Show recent/all options if input is empty
    if (!inputValue || inputValue.length < minSearchLength) {
      fetchOptions('');
    }
  }, [inputValue, minSearchLength, fetchOptions]);

  // Handle blur
  const handleBlur = useCallback(() => {
    // Delay to allow option selection
    setTimeout(() => {
      setIsFocused(false);
      setIsOpen(false);

      // Restore selected option text if user didn't select anything new
      if (selectedOption && inputValue !== selectedOption.label) {
        setInputValue(selectedOption.label);
      }
    }, 200);
  }, [selectedOption, inputValue]);

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>
          {label}
          {required && <Text style={{ color: colors.danger }}> *</Text>}
        </Text>
      )}

      <View ref={containerRef} style={styles.inputWrapper}>
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.card,
              borderColor: error
                ? colors.danger
                : isFocused
                ? Brand.primary
                : colors.border,
            },
            disabled && { opacity: 0.5 },
          ]}
        >
          <Search size={20} color={colors.icon} style={styles.searchIcon} />

          <TextInput
            ref={inputRef}
            style={[styles.input, { color: colors.text }]}
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
            value={inputValue}
            onChangeText={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            editable={!disabled}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {isLoading && (
            <ActivityIndicator
              size="small"
              color={Brand.primary}
              style={styles.loadingIndicator}
            />
          )}

          {inputValue.length > 0 && !isLoading && (
            <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
              <X size={18} color={colors.icon} />
            </TouchableOpacity>
          )}

          {!isFocused && !inputValue && (
            <ChevronDown size={20} color={colors.icon} />
          )}
        </View>

      </View>

      {/* Dropdown Modal */}
      <Modal
        visible={isOpen && isFocused && dropdownLayout !== null}
        transparent
        animationType="none"
        onRequestClose={() => {
          setIsOpen(false);
          setIsFocused(false);
        }}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            setIsOpen(false);
            setIsFocused(false);
            inputRef.current?.blur();
          }}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.dropdown,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    maxHeight: maxDropdownHeight,
                    top: dropdownLayout?.top,
                    left: dropdownLayout?.left,
                    width: dropdownLayout?.width,
                  },
                  Platform.OS === 'ios' && Shadows.lg,
                ]}
              >
                {options.length === 0 && !isLoading ? (
                  <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                      Sonuç bulunamadı
                    </Text>
                  </View>
                ) : (
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                  >
                    {options.map((item) => {
                      const isSelected = item.value === value;

                      return (
                        <TouchableOpacity
                          key={String(item.value)}
                          style={[
                            styles.optionItem,
                            { borderBottomColor: colors.border },
                            isSelected && { backgroundColor: colors.surface },
                          ]}
                          onPress={() => handleSelect(item)}
                        >
                          <View style={styles.optionContent}>
                            <Text
                              style={[
                                styles.optionLabel,
                                { color: colors.text },
                                isSelected && { fontWeight: '600' },
                              ]}
                              numberOfLines={1}
                            >
                              {item.label}
                            </Text>
                            {item.subtitle && (
                              <Text
                                style={[styles.optionSubtitle, { color: colors.textMuted }]}
                                numberOfLines={1}
                              >
                                {item.subtitle}
                              </Text>
                            )}
                          </View>
                          {isSelected && <Check size={16} color={Brand.primary} />}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {error && <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.bodySM,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    position: 'relative',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    minHeight: 48,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    ...Typography.bodyMD,
    paddingVertical: Spacing.sm,
  },
  loadingIndicator: {
    marginLeft: Spacing.sm,
  },
  clearButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  modalOverlay: {
    flex: 1,
  },
  dropdown: {
    position: 'absolute',
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    ...Platform.select({
      android: {
        elevation: 3,
      },
    }),
  },
  emptyContainer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.bodySM,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  optionContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  optionLabel: {
    ...Typography.bodyMD,
  },
  optionSubtitle: {
    ...Typography.bodySM,
    marginTop: Spacing.xs,
  },
  errorText: {
    ...Typography.bodyXS,
    marginTop: Spacing.xs,
  },
});
