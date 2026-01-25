/**
 * New Product Screen
 *
 * Create new product with all necessary fields.
 */

import React, { useState, useCallback, useEffect } from 'react';
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
import { ChevronLeft, Save, Package } from 'lucide-react-native';
import { Input, Card, Checkbox, SelectInput } from '@/components/ui';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import { useToast } from '@/hooks/use-toast';
import {
  createProduct,
  getProductBrands,
  getProductCategories,
  getProductModels,
  ProductFormData,
  ProductBrand,
  ProductCategory,
  ProductModel,
} from '@/services/endpoints/products';
import { getErrorMessage, getValidationErrors } from '@/services/api';

export default function NewProductScreen() {
  const colors = Colors.light;
  const { success, error: showError } = useToast();

  // Options state
  const [brands, setBrands] = useState<ProductBrand[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [models, setModels] = useState<ProductModel[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  // Form state
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    code: '',
    description: '',
    product_type: 'goods',
    unit: 'NIU',
    product_brand_id: undefined,
    product_model_id: undefined,
    product_category_id: undefined,
    purchase_price: undefined,
    sale_price: undefined,
    vat_rate: undefined,
    min_stock_level: undefined,
    max_stock_level: undefined,
    barcode: '',
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch options (brands, categories, models)
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setIsLoadingOptions(true);
        const [brandsRes, categoriesRes, modelsRes] = await Promise.all([
          getProductBrands({ is_active: true, per_page: 100 }),
          getProductCategories({ is_active: true, per_page: 100 }),
          getProductModels({ is_active: true, per_page: 100 }),
        ]);
        setBrands(brandsRes.brands);
        setCategories(categoriesRes.categories);
        setModels(modelsRes.models);
      } catch (err) {
        console.error('Failed to fetch options:', err);
      } finally {
        setIsLoadingOptions(false);
      }
    };
    fetchOptions();
  }, []);

  // Handle input change
  const handleInputChange = useCallback(
    (field: keyof ProductFormData, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Clear error for this field if exists (using functional update to avoid dependency)
      setErrors((prevErrors) => {
        if (prevErrors[field]) {
          const newErrors = { ...prevErrors };
          delete newErrors[field];
          return newErrors;
        }
        return prevErrors;
      });
    },
    []
  );

  // Validation function
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Ürün adı zorunludur.';
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
      await createProduct(formData);

      success('Başarılı', 'Ürün başarıyla oluşturuldu.');
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

  // Options for selects
  const brandOptions = [
    { label: 'Marka seçin', value: '' },
    ...brands.map((brand) => ({
      label: brand.name,
      value: String(brand.id),
    })),
  ];

  const categoryOptions = [
    { label: 'Kategori seçin', value: '' },
    ...categories.map((cat) => ({
      label: cat.name,
      value: String(cat.id),
    })),
  ];

  const modelOptions = [
    { label: 'Model seçin', value: '' },
    ...models.map((model) => ({
      label: model.name,
      value: String(model.id),
    })),
  ];

  const productTypeOptions = [
    { label: 'Mal', value: 'goods' },
    { label: 'Hizmet', value: 'service' },
  ];

  const unitOptions = [
    { label: 'Adet (NIU)', value: 'NIU' },
    { label: 'Kilogram (KGM)', value: 'KGM' },
    { label: 'Ton (TNE)', value: 'TNE' },
    { label: 'Litre (LTR)', value: 'LTR' },
    { label: 'Metre (MTR)', value: 'MTR' },
    { label: 'Metrekare (MTK)', value: 'MTK' },
    { label: 'Metreküp (MTQ)', value: 'MTQ' },
    { label: 'Kutu (BX)', value: 'BX' },
    { label: 'Takım (SET)', value: 'SET' },
    { label: 'Gün (DAY)', value: 'DAY' },
    { label: 'Ay (MON)', value: 'MON' },
    { label: 'Yıl (ANN)', value: 'ANN' },
    { label: 'Saat (HUR)', value: 'HUR' },
  ];

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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Yeni Ürün Ekle</Text>
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
          {/* Product Icon */}
          <View style={styles.productIconContainer}>
            <View style={[styles.productIcon, { backgroundColor: `${Brand.primary}15` }]}>
              <Package size={32} color={Brand.primary} />
            </View>
          </View>

          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Temel Bilgiler</Text>

            <Input
              label="Ürün Adı *"
              placeholder="Örn: iPhone 15 Pro"
              value={formData.name}
              onChangeText={(text) => handleInputChange('name', text)}
              error={errors.name}
            />

            <Input
              label="Ürün Kodu"
              placeholder="Opsiyonel"
              value={formData.code}
              onChangeText={(text) => handleInputChange('code', text)}
              error={errors.code}
            />

            <Input
              label="Açıklama"
              placeholder="Opsiyonel"
              value={formData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              error={errors.description}
              multiline
              numberOfLines={3}
            />

            <View style={styles.selectContainer}>
              <Text style={[styles.selectLabel, { color: colors.text }]}>Ürün Tipi *</Text>
              <SelectInput
                value={formData.product_type}
                onValueChange={(value) => handleInputChange('product_type', value as any)}
                options={productTypeOptions}
                placeholder="Ürün tipi seçin"
              />
            </View>

            <View style={styles.selectContainer}>
              <Text style={[styles.selectLabel, { color: colors.text }]}>Birim *</Text>
              <SelectInput
                value={formData.unit}
                onValueChange={(value) => handleInputChange('unit', value as any)}
                options={unitOptions}
                placeholder="Birim seçin"
              />
            </View>
          </Card>

          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Kategorilendirme</Text>

            {isLoadingOptions ? (
              <View style={styles.loadingOptions}>
                <ActivityIndicator size="small" color={Brand.primary} />
                <Text style={[styles.loadingTextSmall, { color: colors.textSecondary }]}>
                  Seçenekler yükleniyor...
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.selectContainer}>
                  <Text style={[styles.selectLabel, { color: colors.text }]}>Marka</Text>
                  <SelectInput
                    value={formData.product_brand_id ? String(formData.product_brand_id) : ''}
                    onValueChange={(value) =>
                      handleInputChange('product_brand_id', value ? Number(value) : undefined)
                    }
                    options={brandOptions}
                    placeholder="Marka seçin (opsiyonel)"
                  />
                </View>

                <View style={styles.selectContainer}>
                  <Text style={[styles.selectLabel, { color: colors.text }]}>Kategori</Text>
                  <SelectInput
                    value={formData.product_category_id ? String(formData.product_category_id) : ''}
                    onValueChange={(value) =>
                      handleInputChange('product_category_id', value ? Number(value) : undefined)
                    }
                    options={categoryOptions}
                    placeholder="Kategori seçin (opsiyonel)"
                  />
                </View>

                <View style={styles.selectContainer}>
                  <Text style={[styles.selectLabel, { color: colors.text }]}>Model</Text>
                  <SelectInput
                    value={formData.product_model_id ? String(formData.product_model_id) : ''}
                    onValueChange={(value) =>
                      handleInputChange('product_model_id', value ? Number(value) : undefined)
                    }
                    options={modelOptions}
                    placeholder="Model seçin (opsiyonel)"
                  />
                </View>
              </>
            )}
          </Card>

          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Fiyatlandırma</Text>

            <Input
              label="Alış Fiyatı"
              placeholder="0.00"
              value={formData.purchase_price?.toString() || ''}
              onChangeText={(text) =>
                handleInputChange('purchase_price', text ? parseFloat(text) : undefined)
              }
              error={errors.purchase_price}
              keyboardType="numeric"
            />

            <Input
              label="Satış Fiyatı"
              placeholder="0.00"
              value={formData.sale_price?.toString() || ''}
              onChangeText={(text) =>
                handleInputChange('sale_price', text ? parseFloat(text) : undefined)
              }
              error={errors.sale_price}
              keyboardType="numeric"
            />

            <Input
              label="KDV Oranı (%)"
              placeholder="0"
              value={formData.vat_rate?.toString() || ''}
              onChangeText={(text) =>
                handleInputChange('vat_rate', text ? parseFloat(text) : undefined)
              }
              error={errors.vat_rate}
              keyboardType="numeric"
            />
          </Card>

          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Stok Bilgileri</Text>

            <Input
              label="Minimum Stok Seviyesi"
              placeholder="0"
              value={formData.min_stock_level?.toString() || ''}
              onChangeText={(text) =>
                handleInputChange('min_stock_level', text ? parseInt(text, 10) : undefined)
              }
              error={errors.min_stock_level}
              keyboardType="numeric"
            />

            <Input
              label="Maksimum Stok Seviyesi"
              placeholder="0"
              value={formData.max_stock_level?.toString() || ''}
              onChangeText={(text) =>
                handleInputChange('max_stock_level', text ? parseInt(text, 10) : undefined)
              }
              error={errors.max_stock_level}
              keyboardType="numeric"
            />

            <Input
              label="Barkod"
              placeholder="Opsiyonel"
              value={formData.barcode}
              onChangeText={(text) => handleInputChange('barcode', text)}
              error={errors.barcode}
            />
          </Card>

          <Card style={styles.card}>
            <View
              style={[styles.switchRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.switchContent}>
                <Text style={[styles.switchLabel, { color: colors.text }]}>Aktif Ürün</Text>
                <Text style={[styles.switchDescription, { color: colors.textSecondary }]}>
                  Bu ürün kullanıma açık olacak
                </Text>
              </View>
              <Checkbox
                value={formData.is_active ?? true}
                onValueChange={(val) => handleInputChange('is_active', val)}
              />
            </View>
          </Card>

          <View style={styles.bottomSpacer} />
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
  productIconContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  productIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    padding: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.headingMD,
    marginBottom: Spacing.sm,
  },
  selectContainer: {
    marginVertical: Spacing.xs,
  },
  selectLabel: {
    ...Typography.bodySM,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  loadingOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  loadingTextSmall: {
    ...Typography.bodySM,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  switchContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  switchLabel: {
    ...Typography.bodyMD,
    fontWeight: '500',
  },
  switchDescription: {
    ...Typography.bodySM,
    marginTop: Spacing.xs,
  },
  bottomSpacer: {
    height: Spacing['2xl'],
  },
});
