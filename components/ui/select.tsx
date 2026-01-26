import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  Platform,
  StatusBar as RNStatusBar,
  Dimensions,
  KeyboardAvoidingView,
} from 'react-native';
import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown, ChevronLeft, Search, X, Check } from 'lucide-react-native';
import { Colors, Typography, Spacing, BorderRadius, Brand } from '@/constants/theme';

// Status bar yüksekliği hesaplama
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const getStatusBarHeight = (): number => {
  if (Platform.OS === 'android') {
    return Constants.statusBarHeight || 24;
  }
  // iOS için - notch'lu cihazlar için daha yüksek değer
  if (SCREEN_HEIGHT >= 812) {
    return 47; // iPhone X, 11, 12, 13, 14, 15 serisi (notch'lu)
  }
  return 20; // Eski iPhone modelleri
};

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
  /** API-based search function - when provided, search will call API instead of client-side filtering */
  onSearch?: (query: string) => Promise<SelectItem[]>;
}

/**
 * Select component - Custom modal-based dropdown with green header
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
  onSearch,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string | null>(valueProp ?? null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SelectItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SelectItem | null>(null); // Seçilen item'ı sakla
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const colors = Colors.light;
  const insets = useSafeAreaInsets();

  // Sync internal state with external value prop
  useEffect(() => {
    setValue(valueProp ?? null);
    // Eğer value temizlendiyse, selectedItem'ı da temizle
    if (!valueProp) {
      setSelectedItem(null);
    } else {
      // Value değiştiyse ve data'da varsa, selectedItem'ı güncelle
      const item = data.find((item) => item.value === valueProp);
      if (item) {
        setSelectedItem(item);
      }
    }
  }, [valueProp, data]);

  // Reset search when modal closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [open]);

  // Store onSearch in ref to avoid dependency issues
  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;

  // Debounced API search - only triggers when searchQuery changes and has content
  useEffect(() => {
    // Modal kapalıysa veya onSearch yoksa çık
    if (!open || !onSearchRef.current) return;

    // Önceki timeout'u temizle
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Boş arama için API çağırma - sadece data prop'unu kullan
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    // 500ms debounce - kullanıcı yazmayı bitirene kadar bekle
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await onSearchRef.current!(searchQuery);
        setSearchResults(results);
      } catch (err) {
        console.error('Search error:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, open]); // onSearch artık dependency değil

  const isDisabled = disabled || loading;

  // Find selected item label - önce selectedItem'a bak (API'den seçilmiş olabilir)
  const selectedLabel = useMemo(() => {
    if (!value) return null;
    // Önce saklanan selectedItem'a bak
    if (selectedItem && selectedItem.value === value) {
      return selectedItem.label;
    }
    // data'da ara
    const item = data.find((item) => item.value === value);
    return item?.label || null;
  }, [value, data, selectedItem]);

  // Get items to display - use searchResults if onSearch is provided and user is searching
  const displayItems = useMemo(() => {
    if (onSearch) {
      // API-based search mode
      if (searchQuery.trim() && searchResults.length > 0) {
        // Arama yapıldı ve sonuç var - API sonuçlarını göster
        return searchResults;
      }
      // Arama yok veya sonuç yok - başlangıç verisini göster
      return data;
    }
    // Client-side filtering (onSearch yok)
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase();
    return data.filter((item) => item.label.toLowerCase().includes(query));
  }, [data, searchQuery, searchResults, onSearch]);

  // Show search if enabled and (items > 5 OR onSearch is provided)
  const showSearch = searchable && (data.length > 5 || onSearch);

  const handleSelect = (item: SelectItem) => {
    setValue(item.value);
    setSelectedItem(item); // Seçilen item'ı sakla (label kaybolmasın)
    onValueChange(item.value);
    setOpen(false);
  };

  const renderItem = ({ item }: { item: SelectItem }) => {
    const isSelected = item.value === value;
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
        <Text
          style={[
            styles.optionLabel,
            { color: colors.text },
            isSelected && { color: Brand.primary, fontWeight: '600' },
          ]}
          numberOfLines={2}
        >
          {item.label}
        </Text>
        {isSelected && <Check size={20} color={Brand.primary} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>
          {label}
          {required && <Text style={{ color: colors.danger }}> *</Text>}
        </Text>
      )}

      {/* Trigger Button */}
      <TouchableOpacity
        style={[
          styles.triggerButton,
          {
            borderColor: error ? colors.danger : colors.border,
            backgroundColor: isDisabled ? colors.background + '80' : colors.background,
          },
        ]}
        onPress={() => !isDisabled && setOpen(true)}
        disabled={isDisabled}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.triggerText,
            { color: selectedLabel ? colors.text : colors.textMuted },
            isDisabled && { color: colors.textMuted },
          ]}
          numberOfLines={1}
        >
          {loading ? 'Yükleniyor...' : selectedLabel || placeholder}
        </Text>
        {loading ? (
          <ActivityIndicator size="small" color={Brand.primary} />
        ) : (
          <ChevronDown size={20} color={colors.icon} />
        )}
      </TouchableOpacity>

      {error && <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>}

      {/* Full Screen Modal with Green Header */}
      <Modal
        visible={open}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setOpen(false)}
        presentationStyle="fullScreen"
        statusBarTranslucent={true}
      >
        {/* StatusBar - Transparent, yeşil View arkasından görünür */}
        <StatusBar style="light" />
        {Platform.OS === 'android' && (
          <RNStatusBar
            barStyle="light-content"
            backgroundColor="transparent"
            translucent={true}
          />
        )}

        {/* Status bar yüksekliği - FullScreenHeader ile aynı yaklaşım */}
        {(() => {
          const statusBarHeight = Platform.OS === 'ios' ? insets.top : insets.top || 24;
          const extraTopPadding = Platform.OS === 'ios' ? 0 : 0;
          const totalTopPadding = statusBarHeight + extraTopPadding;

          return (
            <View style={[styles.modalWrapper, { paddingTop: totalTopPadding }]}>
              {/* Yeşil Header */}
              <View style={styles.greenHeader}>
            <View style={styles.greenHeaderContent}>
              <TouchableOpacity
                onPress={() => setOpen(false)}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <ChevronLeft size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.greenHeaderTitle} numberOfLines={1}>
                {label || 'Seçim Yap'}
              </Text>
              <View style={styles.headerRightPlaceholder} />
            </View>
          </View>

          {/* İçerik alanı */}
          <KeyboardAvoidingView
            style={[styles.modalContent, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {/* Search Input */}
            {showSearch && (
              <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Search size={20} color={colors.icon} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Ara..."
                  placeholderTextColor={colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <X size={18} color={colors.icon} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Options List */}
            {isSearching ? (
              <View style={styles.emptyContainer}>
                <ActivityIndicator size="large" color={Brand.primary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary, marginTop: Spacing.md }]}>
                  Aranıyor...
                </Text>
              </View>
            ) : displayItems.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {searchQuery ? 'Sonuç bulunamadı' : 'Seçenek bulunamadı'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={displayItems}
                keyExtractor={(item) => item.value}
                renderItem={renderItem}
                style={styles.optionsList}
                contentContainerStyle={styles.optionsListContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              />
            )}
          </KeyboardAvoidingView>
            </View>
          );
        })()}
      </Modal>
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
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    minHeight: 48,
  },
  triggerText: {
    ...Typography.bodyMD,
    flex: 1,
    marginRight: Spacing.sm,
  },
  errorText: {
    ...Typography.bodySM,
    marginTop: Spacing.sm,
  },
  // Modal styles
  modalWrapper: {
    flex: 1,
    backgroundColor: Brand.primary,
    width: '100%',
    height: '100%',
  },
  greenHeader: {
    backgroundColor: Brand.primary,
    width: '100%',
    paddingTop: 0,
  },
  greenHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    minHeight: 56,
    backgroundColor: Brand.primary,
  },
  backButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  greenHeaderTitle: {
    ...Typography.headingMD,
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Spacing.md,
  },
  headerRightPlaceholder: {
    width: 40,
  },
  modalContent: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    margin: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    ...Typography.bodyMD,
    paddingVertical: Spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['4xl'],
  },
  emptyText: {
    ...Typography.bodyMD,
  },
  optionsList: {
    flex: 1,
  },
  optionsListContent: {
    paddingBottom: Spacing.lg,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  optionLabel: {
    ...Typography.bodyMD,
    flex: 1,
    marginRight: Spacing.sm,
  },
});
