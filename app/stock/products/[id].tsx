/**
 * Product Detail Screen
 *
 * View and edit product details.
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
import { router, useLocalSearchParams } from 'expo-router';
import { Save, Trash2, Package } from 'lucide-react-native';
import { Input, Card, Badge, Checkbox, SelectInput, ConfirmDialog } from '@/components/ui';
import { FullScreenHeader } from '@/components/header/FullScreenHeader';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import { useToast } from '@/hooks/use-toast';
import {
  getProduct,
  updateProduct,
  deleteProduct,
  getProductBrands,
  getProductCategories,
  getProductModels,
  Product,
  ProductFormData,
  ProductBrand,
  ProductCategory,
  ProductModel,
  getProductTypeLabel,
  getProductUnitLabel,
  formatPrice,
} from '@/services/endpoints/products';
import { getErrorMessage, getValidationErrors } from '@/services/api';

export default function ProductDetailScreen() {
  const colors = Colors.light;
  const { id } = useLocalSearchParams<{ id: string }>();
  const { success, error: showError } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [brands, setBrands] = useState<ProductBrand[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [models, setModels] = useState<ProductModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  // Delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch product data
  const fetchProduct = useCallback(async () => {
    if (!id) return;

    try {
      setError(null);
      setIsLoading(true);
      const data = await getProduct(Number(id));
      setProduct(data);
      setFormData({
        name: data.name,
        code: data.code || '',
        description: data.description || '',
        product_type: data.product_type,
        unit: data.unit,
        product_brand_id: data.product_brand_id,
        product_model_id: data.product_model_id,
        product_category_id: data.product_category_id,
        purchase_price: data.purchase_price,
        sale_price: data.sale_price,
        vat_rate: data.vat_rate,
        min_stock_level: data.min_stock_level,
        max_stock_level: data.max_stock_level,
        barcode: data.barcode || '',
        is_active: data.is_active,
      });
    } catch (err) {
      console.error('Product fetch error:', err);
      setError(err instanceof Error ? err.message : 'Ürün yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

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

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  // Handle input change
  const handleInputChange = useCallback(
    (field: keyof ProductFormData, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      if (formErrors[field]) {
        setFormErrors((prevErrors) => {
          const newErrors = { ...prevErrors };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [formErrors]
  );

  // Validation
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Ürün adı zorunludur.';
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Submit handler
  const handleSubmit = useCallback(async () => {
    if (!validateForm() || !product) return;

    setIsSubmitting(true);
    try {
      const updated = await updateProduct(product.id, formData);
      setProduct(updated);
      setIsEditing(false);
      success('Başarılı', 'Ürün güncellendi.');
    } catch (error: any) {
      const validationErrors = getValidationErrors(error);
      if (validationErrors) {
        const flatErrors: Record<string, string> = {};
        Object.entries(validationErrors).forEach(([field, messages]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            flatErrors[field] = messages[0];
          }
        });
        setFormErrors(flatErrors);
      } else {
        showError('Hata', getErrorMessage(error));
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, product, success, showError]);

  // Delete handler - opens dialog
  const handleDelete = useCallback(() => {
    if (!product) return;
    setShowDeleteDialog(true);
  }, [product]);

  // Confirm delete
  const confirmDelete = useCallback(async () => {
    if (!product) return;

    setIsDeleting(true);
    try {
      await deleteProduct(product.id);
      setShowDeleteDialog(false);
      success('Başarılı', 'Ürün silindi.');
      setTimeout(() => {
        router.back();
      }, 1000);
    } catch (err) {
      showError('Hata', err instanceof Error ? err.message : 'Ürün silinemedi');
    } finally {
      setIsDeleting(false);
    }
  }, [product, success, showError]);

  // Cancel editing
  const handleCancelEdit = useCallback(() => {
    if (product) {
      setFormData({
        name: product.name,
        code: product.code || '',
        description: product.description || '',
        product_type: product.product_type,
        unit: product.unit,
        product_brand_id: product.product_brand_id,
        product_model_id: product.product_model_id,
        product_category_id: product.product_category_id,
        purchase_price: product.purchase_price,
        sale_price: product.sale_price,
        vat_rate: product.vat_rate,
        min_stock_level: product.min_stock_level,
        max_stock_level: product.max_stock_level,
        barcode: product.barcode || '',
        is_active: product.is_active,
      });
    }
    setFormErrors({});
    setIsEditing(false);
  }, [product]);

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

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <FullScreenHeader title="Ürün Detayı" showBackButton />
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Yükleniyor...</Text>
        </View>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <FullScreenHeader title="Ürün Detayı" showBackButton />
        <View style={styles.errorState}>
          <Text style={[styles.errorText, { color: colors.danger }]}>
            {error || 'Ürün bulunamadı'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Brand.primary }]}
            onPress={fetchProduct}
          >
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FullScreenHeader
        title={isEditing ? 'Ürünü Düzenle' : 'Ürün Detayı'}
        showBackButton
        onBackPress={isEditing ? handleCancelEdit : undefined}
        rightIcons={
          <View style={styles.headerActions}>
            {!isEditing && (
              <TouchableOpacity style={styles.headerButton} onPress={handleDelete}>
                <Trash2 size={22} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={isEditing ? handleSubmit : () => setIsEditing(true)}
              style={styles.headerButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Save size={22} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        }
      />

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Product Info Header */}
          <View style={styles.productInfoHeader}>
            <View style={[styles.productIcon, { backgroundColor: `${Brand.primary}15` }]}>
              <Package size={32} color={Brand.primary} />
            </View>
            <Badge
              label={product.is_active ? 'Aktif' : 'Pasif'}
              variant={product.is_active ? 'success' : 'default'}
              size="md"
            />
          </View>

          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Ürün Bilgileri</Text>

            {isEditing ? (
              <>
                <Input
                  label="Ürün Adı *"
                  placeholder="Örn: iPhone 15 Pro"
                  value={formData.name}
                  onChangeText={(text) => handleInputChange('name', text)}
                  error={formErrors.name}
                />

                <Input
                  label="Ürün Kodu"
                  placeholder="Opsiyonel"
                  value={formData.code}
                  onChangeText={(text) => handleInputChange('code', text)}
                  error={formErrors.code}
                />

                <Input
                  label="Açıklama"
                  placeholder="Opsiyonel"
                  value={formData.description}
                  onChangeText={(text) => handleInputChange('description', text)}
                  error={formErrors.description}
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
                        value={
                          formData.product_category_id ? String(formData.product_category_id) : ''
                        }
                        onValueChange={(value) =>
                          handleInputChange(
                            'product_category_id',
                            value ? Number(value) : undefined
                          )
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

                <Input
                  label="Alış Fiyatı"
                  placeholder="0.00"
                  value={formData.purchase_price?.toString() || ''}
                  onChangeText={(text) =>
                    handleInputChange('purchase_price', text ? parseFloat(text) : undefined)
                  }
                  error={formErrors.purchase_price}
                  keyboardType="numeric"
                />

                <Input
                  label="Satış Fiyatı"
                  placeholder="0.00"
                  value={formData.sale_price?.toString() || ''}
                  onChangeText={(text) =>
                    handleInputChange('sale_price', text ? parseFloat(text) : undefined)
                  }
                  error={formErrors.sale_price}
                  keyboardType="numeric"
                />

                <Input
                  label="KDV Oranı (%)"
                  placeholder="0"
                  value={formData.vat_rate?.toString() || ''}
                  onChangeText={(text) =>
                    handleInputChange('vat_rate', text ? parseFloat(text) : undefined)
                  }
                  error={formErrors.vat_rate}
                  keyboardType="numeric"
                />

                <Input
                  label="Minimum Stok Seviyesi"
                  placeholder="0"
                  value={formData.min_stock_level?.toString() || ''}
                  onChangeText={(text) =>
                    handleInputChange('min_stock_level', text ? parseInt(text, 10) : undefined)
                  }
                  error={formErrors.min_stock_level}
                  keyboardType="numeric"
                />

                <Input
                  label="Maksimum Stok Seviyesi"
                  placeholder="0"
                  value={formData.max_stock_level?.toString() || ''}
                  onChangeText={(text) =>
                    handleInputChange('max_stock_level', text ? parseInt(text, 10) : undefined)
                  }
                  error={formErrors.max_stock_level}
                  keyboardType="numeric"
                />

                <Input
                  label="Barkod"
                  placeholder="Opsiyonel"
                  value={formData.barcode}
                  onChangeText={(text) => handleInputChange('barcode', text)}
                  error={formErrors.barcode}
                />

                <View
                  style={[
                    styles.switchRow,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
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
              </>
            ) : (
              <>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Ürün Adı</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{product.name}</Text>
                </View>

                {product.code && (
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                      Ürün Kodu
                    </Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>{product.code}</Text>
                  </View>
                )}

                {product.description && (
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                      Açıklama
                    </Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {product.description}
                    </Text>
                  </View>
                )}

                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Ürün Tipi</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {getProductTypeLabel(product.product_type)}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Birim</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {getProductUnitLabel(product.unit)}
                  </Text>
                </View>

                {product.brand && (
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Marka</Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {product.brand.name}
                    </Text>
                  </View>
                )}

                {product.category && (
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Kategori</Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {product.category.name}
                    </Text>
                  </View>
                )}

                {product.model && (
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Model</Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {product.model.name}
                    </Text>
                  </View>
                )}

                {product.purchase_price !== undefined && product.purchase_price !== null && (
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                      Alış Fiyatı
                    </Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {formatPrice(product.purchase_price)}
                    </Text>
                  </View>
                )}

                {product.sale_price !== undefined && product.sale_price !== null && (
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                      Satış Fiyatı
                    </Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {formatPrice(product.sale_price)}
                    </Text>
                  </View>
                )}

                {product.vat_rate !== undefined && product.vat_rate !== null && (
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                      KDV Oranı
                    </Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      %{product.vat_rate}
                    </Text>
                  </View>
                )}

                {product.min_stock_level !== undefined && product.min_stock_level !== null && (
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                      Minimum Stok Seviyesi
                    </Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {product.min_stock_level}
                    </Text>
                  </View>
                )}

                {product.max_stock_level !== undefined && product.max_stock_level !== null && (
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                      Maksimum Stok Seviyesi
                    </Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {product.max_stock_level}
                    </Text>
                  </View>
                )}

                {product.barcode && (
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Barkod</Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {product.barcode}
                    </Text>
                  </View>
                )}

                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    Oluşturulma Tarihi
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {new Date(product.created_at).toLocaleDateString('tr-TR')}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    Son Güncelleme
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {new Date(product.updated_at).toLocaleDateString('tr-TR')}
                  </Text>
                </View>
              </>
            )}
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={showDeleteDialog}
        title="Ürün Sil"
        message={`"${product?.name}" ürününü silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        isDangerous={true}
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
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
  productInfoHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  productIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  card: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  sectionTitle: {
    ...Typography.headingMD,
    marginTop: Spacing.sm,
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
  infoRow: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  infoLabel: {
    ...Typography.bodySM,
    marginBottom: 4,
  },
  infoValue: {
    ...Typography.bodyMD,
    fontWeight: '500',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginVertical: Spacing.xs,
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
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...Typography.bodyMD,
    marginTop: Spacing.md,
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  errorText: {
    ...Typography.bodyMD,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: '#FFFFFF',
    ...Typography.bodyMD,
    fontWeight: '600',
  },
});
