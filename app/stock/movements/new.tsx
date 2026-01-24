/**
 * New Stock Movement Screen
 *
 * Create new stock movement with product, warehouse, and type selection.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, Save, ArrowLeftRight } from 'lucide-react-native';
import { Input, Card, SelectInput } from '@/components/ui';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import { useToast } from '@/hooks/use-toast';
import {
  createStockMovement,
  StockMovementFormData,
  MANUAL_MOVEMENT_TYPES,
} from '@/services/endpoints/stock-movements';
import { getProducts, Product } from '@/services/endpoints/products';
import { getWarehouses, Warehouse } from '@/services/endpoints/warehouses';
import { getErrorMessage, getValidationErrors } from '@/services/api';

export default function NewMovementScreen() {
  const colors = Colors.light;
  const { success, error: showError } = useToast();

  // Products and warehouses for selection
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Form state
  const [formData, setFormData] = useState<Partial<StockMovementFormData>>({
    product_id: undefined,
    warehouse_id: undefined,
    movement_type: 'in',
    quantity: undefined,
    unit_cost: undefined,
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch products and warehouses
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, warehousesRes] = await Promise.all([
          getProducts({ is_active: true, per_page: 100 }),
          getWarehouses({ is_active: true, per_page: 100 }),
        ]);
        setProducts(productsRes.products);
        setWarehouses(warehousesRes.warehouses);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        showError('Hata', 'Ürün ve depo listesi yüklenemedi');
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchData();
  }, []);

  // Handle input change
  const handleInputChange = useCallback(
    (field: keyof StockMovementFormData, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      if (errors[field]) {
        setErrors((prevErrors) => {
          const newErrors = { ...prevErrors };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [errors]
  );

  // Validation function
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.product_id) {
      newErrors.product_id = 'Ürün seçimi zorunludur.';
    }
    if (!formData.warehouse_id) {
      newErrors.warehouse_id = 'Depo seçimi zorunludur.';
    }
    if (!formData.movement_type) {
      newErrors.movement_type = 'Hareket tipi zorunludur.';
    }
    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'Geçerli bir miktar giriniz.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Submit handler
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createStockMovement(formData as StockMovementFormData);

      success('Başarılı', 'Stok hareketi oluşturuldu.');
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error: any) {
      const validationErrors = getValidationErrors(error);
      if (validationErrors) {
        const flatErrors: Record<string, string> = {};
        Object.entries(validationErrors).forEach(([field, messages]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            flatErrors[field] = messages[0];
          }
        });
        setErrors(flatErrors);
      } else {
        showError('Hata', getErrorMessage(error));
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, success, showError]);

  // Options for select inputs
  const productOptions = products.map((p) => ({
    label: `${p.name}${p.code ? ` (${p.code})` : ''}`,
    value: String(p.id),
  }));

  const warehouseOptions = warehouses.map((w) => ({
    label: `${w.name}${w.code ? ` (${w.code})` : ''}`,
    value: String(w.id),
  }));

  const movementTypeOptions = MANUAL_MOVEMENT_TYPES.map((t) => ({
    label: t.label,
    value: t.value,
  }));

  if (isLoadingData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Yeni Stok Hareketi</Text>
        </View>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Veriler yükleniyor...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Yeni Stok Hareketi</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            style={styles.headerButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={Brand.primary} />
            ) : (
              <Save size={22} color={Brand.primary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Form Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <ArrowLeftRight size={20} color={Brand.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Hareket Bilgileri</Text>
            </View>

            {/* Movement Type */}
            <View style={styles.selectContainer}>
              <Text style={[styles.selectLabel, { color: colors.text }]}>Hareket Tipi *</Text>
              <SelectInput
                value={formData.movement_type || ''}
                onValueChange={(value) => handleInputChange('movement_type', value)}
                options={movementTypeOptions}
                placeholder="Hareket tipi seçin"
              />
              {errors.movement_type && (
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {errors.movement_type}
                </Text>
              )}
            </View>

            {/* Product */}
            <View style={styles.selectContainer}>
              <Text style={[styles.selectLabel, { color: colors.text }]}>Ürün *</Text>
              <SelectInput
                value={formData.product_id ? String(formData.product_id) : ''}
                onValueChange={(value) => handleInputChange('product_id', value ? Number(value) : undefined)}
                options={productOptions}
                placeholder="Ürün seçin"
              />
              {errors.product_id && (
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {errors.product_id}
                </Text>
              )}
            </View>

            {/* Warehouse */}
            <View style={styles.selectContainer}>
              <Text style={[styles.selectLabel, { color: colors.text }]}>Depo *</Text>
              <SelectInput
                value={formData.warehouse_id ? String(formData.warehouse_id) : ''}
                onValueChange={(value) => handleInputChange('warehouse_id', value ? Number(value) : undefined)}
                options={warehouseOptions}
                placeholder="Depo seçin"
              />
              {errors.warehouse_id && (
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {errors.warehouse_id}
                </Text>
              )}
            </View>

            {/* Quantity */}
            <Input
              label="Miktar *"
              placeholder="Örn: 100"
              value={formData.quantity ? String(formData.quantity) : ''}
              onChangeText={(text) => handleInputChange('quantity', text ? parseFloat(text) : undefined)}
              error={errors.quantity}
              keyboardType="decimal-pad"
            />

            {/* Unit Cost */}
            <Input
              label="Birim Maliyet"
              placeholder="Opsiyonel"
              value={formData.unit_cost ? String(formData.unit_cost) : ''}
              onChangeText={(text) => handleInputChange('unit_cost', text ? parseFloat(text) : undefined)}
              error={errors.unit_cost}
              keyboardType="decimal-pad"
            />

            {/* Notes */}
            <Input
              label="Notlar"
              placeholder="Opsiyonel"
              value={formData.notes}
              onChangeText={(text) => handleInputChange('notes', text)}
              error={errors.notes}
              multiline
              numberOfLines={3}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  headerTitle: {
    ...Typography.headingLG,
    flex: 1,
    marginLeft: Spacing.sm,
  },
  headerButton: {
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
  },
  card: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.headingMD,
  },
  selectContainer: {
    marginVertical: Spacing.xs,
  },
  selectLabel: {
    ...Typography.bodySM,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  errorText: {
    ...Typography.bodyXS,
    marginTop: Spacing.xs,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...Typography.bodyMD,
    marginTop: Spacing.md,
  },
});
