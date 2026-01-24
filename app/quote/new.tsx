/**
 * New Quote Screen
 *
 * Create new quote (teklif) with load items.
 * Matches backend MobileStoreQuoteRequest validation 100%.
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
import {
  ChevronLeft,
  Save,
  Plus,
  Trash2,
  User,
  Calendar,
  DollarSign,
  Package,
} from 'lucide-react-native';
import { Input, Card, Checkbox, AutocompleteInput, DateInput } from '@/components/ui';
import type { AutocompleteOption } from '@/components/ui';
import { SelectInput } from '@/components/ui/select-input';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import { useToast } from '@/hooks/use-toast';
import {
  createQuote,
  QuoteFormData,
  LoadItem,
  CurrencyType,
} from '@/services/endpoints/quotes';
import { getContacts } from '@/services/endpoints/contacts';
import { getCurrentRate } from '@/services/endpoints/exchange-rates';
import { getErrorMessage, getValidationErrors } from '@/services/api';

// Currency options
const CURRENCY_OPTIONS = [
  { label: 'Türk Lirası (₺)', value: 'TRY' },
  { label: 'Amerikan Doları ($)', value: 'USD' },
  { label: 'Euro (€)', value: 'EUR' },
  { label: 'İngiliz Sterlini (£)', value: 'GBP' },
];

export default function NewQuoteScreen() {
  const colors = Colors.light;
  const { success, error: showError } = useToast();

  // Basic info state
  const [customerId, setCustomerId] = useState<number | string>('');
  const [quoteDate, setQuoteDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [currency, setCurrency] = useState<CurrencyType>('TRY');
  const [exchangeRate, setExchangeRate] = useState('1');
  const [includeVat, setIncludeVat] = useState(true);
  const [vatRate, setVatRate] = useState('20');

  // Discount state
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');

  // Notes state
  const [termsConditions, setTermsConditions] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');

  // Load items state
  const [loadItems, setLoadItems] = useState<LoadItem[]>([
    {
      cargo_name: '',
      freight_price: 0,
    },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRate, setIsLoadingRate] = useState(false);

  // Fetch exchange rate when currency changes
  useEffect(() => {
    const fetchRate = async () => {
      if (currency === 'TRY') {
        setExchangeRate('1');
        return;
      }

      if (!currency) {
        return;
      }

      setIsLoadingRate(true);
      try {
        const rate = await getCurrentRate(currency);
        setExchangeRate(rate.toString());
      } catch (error) {
        console.error('Error fetching exchange rate:', error);
        // Set error in form errors instead of showing alert to avoid re-render loop
        setErrors((prev) => ({
          ...prev,
          exchange_rate: 'Kur bilgisi alınamadı. Lütfen manuel girin.',
        }));
      } finally {
        setIsLoadingRate(false);
      }
    };

    fetchRate();
  }, [currency]);

  // Load customer options
  const loadCustomerOptions = useCallback(
    async (searchQuery: string): Promise<AutocompleteOption[]> => {
      try {
        const { contacts } = await getContacts({
          search: searchQuery,
          is_active: true,
          per_page: 20,
        });

        return contacts.map((contact) => ({
          label: contact.name,
          value: contact.id,
          subtitle: contact.code ? `Kod: ${contact.code}` : undefined,
        }));
      } catch (error) {
        console.error('Error loading customers:', error);
        return [];
      }
    },
    []
  );

  // Handle load item change
  const handleLoadItemChange = useCallback(
    (index: number, field: keyof LoadItem, value: any) => {
      setLoadItems((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
      });

      // Clear errors for this field
      const errorKey = `load_items.${index}.${field}`;
      if (errors[errorKey]) {
        setErrors((prevErrors) => {
          const newErrors = { ...prevErrors };
          delete newErrors[errorKey];
          return newErrors;
        });
      }
    },
    [errors]
  );

  // Add load item
  const handleAddLoadItem = useCallback(() => {
    setLoadItems((prev) => [
      ...prev,
      {
        cargo_name: '',
        freight_price: 0,
      },
    ]);
  }, []);

  // Remove load item
  const handleRemoveLoadItem = useCallback((index: number) => {
    setLoadItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Clear field error
  const clearError = useCallback((field: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  // Validation
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!customerId || customerId === '') {
      newErrors.customer_id = 'Müşteri zorunludur.';
    }
    if (!quoteDate) {
      newErrors.quote_date = 'Teklif tarihi zorunludur.';
    }
    if (!validUntil) {
      newErrors.valid_until = 'Geçerlilik tarihi zorunludur.';
    }
    if (!currency) {
      newErrors.currency = 'Para birimi zorunludur.';
    }
    if (!exchangeRate || parseFloat(exchangeRate) <= 0) {
      newErrors.exchange_rate = 'Geçerli bir kur giriniz.';
    }

    // Date validation
    if (quoteDate && validUntil && new Date(validUntil) <= new Date(quoteDate)) {
      newErrors.valid_until = 'Geçerlilik tarihi, teklif tarihinden sonra olmalıdır.';
    }

    // Load items validation
    if (loadItems.length === 0) {
      newErrors.load_items = 'En az bir yük kalemi eklenmelidir.';
    }

    loadItems.forEach((item, index) => {
      if (!item.cargo_name?.trim()) {
        newErrors[`load_items.${index}.cargo_name`] = 'Mal adı zorunludur.';
      }
      if (
        !item.freight_price ||
        isNaN(item.freight_price) ||
        item.freight_price < 0
      ) {
        newErrors[`load_items.${index}.freight_price`] =
          'Geçerli bir navlun ücreti giriniz.';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [customerId, quoteDate, validUntil, currency, exchangeRate, loadItems]);

  // Submit handler
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      showError('Hata', 'Lütfen tüm zorunlu alanları doldurun.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData: QuoteFormData = {
        customer_id: typeof customerId === 'number' ? customerId : parseInt(String(customerId), 10),
        quote_date: quoteDate,
        valid_until: validUntil,
        currency,
        exchange_rate: parseFloat(exchangeRate),
        include_vat: includeVat,
        vat_rate: includeVat ? parseFloat(vatRate || '0') : undefined,
        discount_percentage: discountPercentage
          ? parseFloat(discountPercentage)
          : undefined,
        discount_amount: discountAmount ? parseFloat(discountAmount) : undefined,
        terms_conditions: termsConditions || undefined,
        internal_notes: internalNotes || undefined,
        customer_notes: customerNotes || undefined,
        load_items: loadItems,
      };

      const quote = await createQuote(formData);

      success('Başarılı', 'Teklif başarıyla oluşturuldu.');
      setTimeout(() => {
        router.replace(`/quote/${quote.id}` as any);
      }, 1500);
    } catch (error: any) {
      const validationErrors = getValidationErrors(error);
      if (validationErrors) {
        // Convert Laravel errors to flat object
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
  }, [
    validateForm,
    customerId,
    quoteDate,
    validUntil,
    currency,
    exchangeRate,
    includeVat,
    vatRate,
    discountPercentage,
    discountAmount,
    termsConditions,
    internalNotes,
    customerNotes,
    loadItems,
    success,
    showError,
  ]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Yeni Teklif</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
        >
          {/* Basic Information */}
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <User size={20} color={Brand.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Temel Bilgiler
              </Text>
            </View>

            <AutocompleteInput
              label="Müşteri"
              placeholder="Müşteri ara..."
              value={customerId}
              onValueChange={(value) => {
                setCustomerId(value);
                clearError('customer_id');
              }}
              loadOptions={loadCustomerOptions}
              error={errors.customer_id}
              required
              minSearchLength={0}
              debounceMs={300}
            />

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <DateInput
                  label="Teklif Tarihi"
                  value={quoteDate}
                  onChangeDate={(date) => {
                    setQuoteDate(date);
                    clearError('quote_date');
                  }}
                  error={errors.quote_date}
                  required
                />
              </View>
              <View style={styles.halfWidth}>
                <DateInput
                  label="Geçerlilik Tarihi"
                  value={validUntil}
                  onChangeDate={(date) => {
                    setValidUntil(date);
                    clearError('valid_until');
                  }}
                  error={errors.valid_until}
                  required
                  minimumDate={quoteDate}
                />
              </View>
            </View>
          </Card>

          {/* Pricing */}
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <DollarSign size={20} color={Brand.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Fiyatlandırma
              </Text>
            </View>

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <SelectInput
                  label="Para Birimi"
                  value={currency}
                  onValueChange={(value) => {
                    setCurrency(value as CurrencyType);
                    clearError('currency');
                  }}
                  options={CURRENCY_OPTIONS}
                  error={errors.currency}
                  required
                />
              </View>
              <View style={styles.halfWidth}>
                <Input
                  label="Kur"
                  placeholder="Kur"
                  value={exchangeRate}
                  onChangeText={(text) => {
                    setExchangeRate(text);
                    clearError('exchange_rate');
                  }}
                  keyboardType="decimal-pad"
                  error={errors.exchange_rate}
                  required
                  editable={!isLoadingRate}
                  rightIcon={
                    isLoadingRate ? (
                      <ActivityIndicator size="small" color={Brand.primary} />
                    ) : undefined
                  }
                />
              </View>
            </View>

            <View style={styles.checkboxRow}>
              <Checkbox
                checked={includeVat}
                onCheckedChange={setIncludeVat}
                label="KDV Dahil"
              />
            </View>

            {includeVat && (
              <Input
                label="KDV Oranı (%)"
                placeholder="KDV oranı"
                value={vatRate}
                onChangeText={setVatRate}
                keyboardType="decimal-pad"
              />
            )}

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Input
                  label="İndirim (%)"
                  placeholder="İndirim yüzdesi"
                  value={discountPercentage}
                  onChangeText={setDiscountPercentage}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.halfWidth}>
                <Input
                  label="İndirim Tutarı"
                  placeholder="İndirim tutarı"
                  value={discountAmount}
                  onChangeText={setDiscountAmount}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </Card>

          {/* Load Items */}
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <Package size={20} color={Brand.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Yük Kalemleri
              </Text>
              <TouchableOpacity
                onPress={handleAddLoadItem}
                style={[styles.addButton, { backgroundColor: Brand.primary }]}
              >
                <Plus size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {errors.load_items && (
              <Text style={[styles.errorText, { color: colors.danger }]}>
                {errors.load_items}
              </Text>
            )}

            {loadItems.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.loadItem,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <View style={styles.loadItemHeader}>
                  <Text style={[styles.loadItemTitle, { color: colors.text }]}>
                    Yük #{index + 1}
                  </Text>
                  {loadItems.length > 1 && (
                    <TouchableOpacity
                      onPress={() => handleRemoveLoadItem(index)}
                      style={styles.removeButton}
                    >
                      <Trash2 size={16} color={colors.danger} />
                    </TouchableOpacity>
                  )}
                </View>

                <Input
                  label="Mal Adı"
                  placeholder="Mal adı"
                  value={item.cargo_name}
                  onChangeText={(text) =>
                    handleLoadItemChange(index, 'cargo_name', text)
                  }
                  error={errors[`load_items.${index}.cargo_name`]}
                  required
                />

                <Input
                  label="Navlun Ücreti"
                  placeholder="Navlun ücreti"
                  value={item.freight_price?.toString() || ''}
                  onChangeText={(text) =>
                    handleLoadItemChange(
                      index,
                      'freight_price',
                      parseFloat(text) || 0
                    )
                  }
                  keyboardType="decimal-pad"
                  error={errors[`load_items.${index}.freight_price`]}
                  required
                />
              </View>
            ))}
          </Card>

          {/* Notes */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Notlar</Text>

            <Input
              label="Şartlar ve Koşullar"
              placeholder="Şartlar ve koşullar..."
              value={termsConditions}
              onChangeText={setTermsConditions}
              multiline
              numberOfLines={3}
            />

            <Input
              label="Dahili Notlar"
              placeholder="Dahili notlar..."
              value={internalNotes}
              onChangeText={setInternalNotes}
              multiline
              numberOfLines={3}
            />

            <Input
              label="Müşteri Notları"
              placeholder="Müşteri notları..."
              value={customerNotes}
              onChangeText={setCustomerNotes}
              multiline
              numberOfLines={3}
            />
          </Card>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: Brand.primary },
                isSubmitting && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Save size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Teklif Oluştur</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  section: {
    marginBottom: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.headingMD,
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  checkboxRow: {
    marginVertical: Spacing.sm,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadItem: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  loadItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  loadItemTitle: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  removeButton: {
    padding: Spacing.xs,
  },
  errorText: {
    ...Typography.bodySM,
    marginBottom: Spacing.sm,
  },
  buttonContainer: {
    marginTop: Spacing.lg,
    marginBottom: Spacing['2xl'],
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    ...Typography.bodyMD,
    fontWeight: '600',
  },
});
