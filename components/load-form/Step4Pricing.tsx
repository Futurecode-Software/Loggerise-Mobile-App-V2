/**
 * Step4Pricing - Navlun Fiyatlandırması
 *
 * Web versiyonu ile %100 uyumlu - Ürün bazlı fiyatlandırma sistemi
 * - Ürünler DB'den aranıyor
 * - Miktar, birim, birim fiyat, para birimi, kur, KDV hesaplamaları
 * - Döviz kuru otomatik çekiliyor
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Plus, Trash2, Package, DollarSign } from 'lucide-react-native';
import { Card, Input, SearchableSelect } from '@/components/ui';
import { SelectInput } from '@/components/ui/select-input';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import api from '@/services/api';

// Web ile aynı LoadPricingItem tipi
export interface LoadPricingItem {
  id?: number;
  load_id?: number;
  product_id?: number | null;
  product?: {
    id: number;
    code: string;
    name: string;
    unit: string;
    vat_rate: string;
  } | null;
  description: string;
  quantity: string | number;
  unit: string;
  unit_price: string | number;
  currency: string;
  exchange_rate: string | number;
  vat_rate: string | number;
  vat_amount: string | number;
  discount_rate: string | number;
  discount_amount: string | number;
  sub_total: string | number;
  total: string | number;
  sort_order?: number;
  is_active?: boolean;
}

interface SelectOption {
  label: string;
  value: number | string;
  subtitle?: string;
}

interface Step4PricingProps {
  items: LoadPricingItem[];
  setItems: (items: LoadPricingItem[]) => void;
}

// Web ile aynı para birimi seçenekleri
const CURRENCY_OPTIONS: SelectOption[] = [
  { label: 'TRY - Türk Lirası (₺)', value: 'TRY' },
  { label: 'USD - ABD Doları ($)', value: 'USD' },
  { label: 'EUR - Euro (€)', value: 'EUR' },
  { label: 'GBP - İngiliz Sterlini (£)', value: 'GBP' },
  { label: 'AUD - Avustralya Doları', value: 'AUD' },
  { label: 'CHF - İsviçre Frangı', value: 'CHF' },
  { label: 'CAD - Kanada Doları', value: 'CAD' },
  { label: 'JPY - Japon Yeni', value: 'JPY' },
  { label: 'CNY - Çin Yuanı', value: 'CNY' },
  { label: 'AED - BAE Dirhemi', value: 'AED' },
  { label: 'SAR - Suudi Riyali', value: 'SAR' },
  { label: 'RUB - Rus Rublesi', value: 'RUB' },
];

// Web ile aynı birim seçenekleri (en çok kullanılanlar)
const UNIT_OPTIONS: SelectOption[] = [
  { label: 'NIU - Adet', value: 'NIU' },
  { label: 'SET - Set', value: 'SET' },
  { label: 'KGM - Kilogram', value: 'KGM' },
  { label: 'TNE - Ton', value: 'TNE' },
  { label: 'LTR - Litre', value: 'LTR' },
  { label: 'MTR - Metre', value: 'MTR' },
  { label: 'MTK - Metrekare', value: 'MTK' },
  { label: 'MTQ - Metreküp', value: 'MTQ' },
  { label: 'PA - Paket', value: 'PA' },
  { label: 'BX - Kutu', value: 'BX' },
  { label: 'DAY - Gün', value: 'DAY' },
  { label: 'HUR - Saat', value: 'HUR' },
  { label: 'KTM - Kilometre', value: 'KTM' },
  { label: 'PR - Çift', value: 'PR' },
  { label: 'DZN - Düzine', value: 'DZN' },
];

// KDV oranları
const VAT_RATE_OPTIONS: SelectOption[] = [
  { label: '%0', value: '0' },
  { label: '%1', value: '1' },
  { label: '%10', value: '10' },
  { label: '%20', value: '20' },
];

const getDefaultPricingItem = (): LoadPricingItem => ({
  product_id: null,
  product: null,
  description: '',
  quantity: '1',
  unit: 'SET',
  unit_price: '0',
  currency: 'TRY',
  exchange_rate: '1',
  vat_rate: '0',
  vat_amount: '0',
  discount_rate: '0',
  discount_amount: '0',
  sub_total: '0',
  total: '0',
  sort_order: 0,
  is_active: true,
});

// Ürün arama API fonksiyonu
const loadProducts = async (searchQuery: string): Promise<SelectOption[]> => {
  try {
    const response = await api.get('/products', {
      params: { search: searchQuery, per_page: 20 },
    });
    const products = response.data.data?.products || response.data.data || [];
    return products.map((product: any) => ({
      value: product.id,
      label: product.name,
      subtitle: product.code,
      // Extra fields for product selection
      unit: product.unit,
      vat_rate: product.vat_rate,
      price: product.price,
    }));
  } catch (error) {
    console.error('Error loading products:', error);
    return [];
  }
};

// Döviz kuru API fonksiyonu
const fetchExchangeRate = async (currency: string): Promise<string> => {
  if (currency === 'TRY') return '1';
  try {
    const response = await api.get(`/exchange-rates/current/${currency}`);
    return response.data.rate?.toString() || '1';
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    return '1';
  }
};

export default function Step4Pricing({ items, setItems }: Step4PricingProps) {
  const colors = Colors.light;

  const addItem = () => {
    const newItem = getDefaultPricingItem();
    newItem.sort_order = items.length;
    setItems([...items, newItem]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof LoadPricingItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  // Kalem toplamlarını hesapla
  const calculateItemTotals = useCallback((index: number, updatedItems: LoadPricingItem[]) => {
    const item = updatedItems[index];

    const quantity = parseFloat(item.quantity?.toString() || '0') || 0;
    const unitPrice = parseFloat(item.unit_price?.toString() || '0') || 0;
    const exchangeRate = parseFloat(item.exchange_rate?.toString() || '1') || 1;
    const vatRate = parseFloat(item.vat_rate?.toString() || '0') || 0;
    const discountRate = parseFloat(item.discount_rate?.toString() || '0') || 0;
    const discountAmount = parseFloat(item.discount_amount?.toString() || '0') || 0;

    // TRY karşılığı (birim fiyat × miktar × kur)
    const lineTotalInTry = quantity * unitPrice * exchangeRate;

    // İndirim hesapla (yüzde veya tutara göre)
    let totalDiscount = 0;
    if (discountRate > 0) {
      totalDiscount = lineTotalInTry * (discountRate / 100);
    } else if (discountAmount > 0) {
      totalDiscount = discountAmount * exchangeRate;
    }

    const subTotal = lineTotalInTry - totalDiscount;
    const vatAmount = subTotal * (vatRate / 100);
    const total = subTotal + vatAmount;

    updatedItems[index] = {
      ...item,
      sub_total: subTotal.toFixed(2),
      vat_amount: vatAmount.toFixed(2),
      total: total.toFixed(2),
    };

    setItems([...updatedItems]);
  }, [setItems]);

  // Ürün seçildiğinde
  const handleProductSelect = async (index: number, productId: number | undefined) => {
    const updatedItems = [...items];

    if (!productId) {
      updatedItems[index].product_id = null;
      updatedItems[index].product = null;
      setItems(updatedItems);
      return;
    }

    try {
      const response = await api.get(`/products/${productId}`);
      const product = response.data.data;

      updatedItems[index].product_id = product.id;
      updatedItems[index].product = {
        id: product.id,
        code: product.code,
        name: product.name,
        unit: product.unit,
        vat_rate: product.vat_rate?.toString() || '0',
      };
      updatedItems[index].unit = product.unit || 'SET';
      updatedItems[index].vat_rate = product.vat_rate?.toString() || '0';
      updatedItems[index].description = product.name;

      // Fiyat varsa ekle
      if (product.price) {
        updatedItems[index].unit_price = product.price.toString();
      }

      setItems(updatedItems);
      calculateItemTotals(index, updatedItems);
    } catch (error) {
      console.error('Error fetching product:', error);
    }
  };

  // Para birimi değiştiğinde kur çek
  const handleCurrencyChange = async (index: number, currency: string | number) => {
    const updatedItems = [...items];
    updatedItems[index].currency = currency?.toString() || '';

    const rate = await fetchExchangeRate(currency?.toString() || '');
    updatedItems[index].exchange_rate = rate;

    setItems(updatedItems);
    calculateItemTotals(index, updatedItems);
  };

  // Hesaplama gerektiren alan değişikliklerinde
  const handleCalculableFieldChange = (index: number, field: keyof LoadPricingItem, value: string | number) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value?.toString() || '' };
    calculateItemTotals(index, updatedItems);
  };

  // Toplamları hesapla
  const calculateTotals = () => {
    const totalSubtotal = items.reduce((sum, item) => sum + (parseFloat(item.sub_total?.toString() || '0') || 0), 0);
    const totalVat = items.reduce((sum, item) => sum + (parseFloat(item.vat_amount?.toString() || '0') || 0), 0);
    const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.total?.toString() || '0') || 0), 0);
    return { totalSubtotal, totalVat, totalAmount };
  };

  const totals = calculateTotals();

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Navlun Fiyatlandırması</Text>
            <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
              Yük için navlun, sigorta, gümrük vb. maliyetleri ekleyin
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: Brand.primary }]}
            onPress={addItem}
          >
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Kalem Ekle</Text>
          </TouchableOpacity>
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <DollarSign size={32} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Henüz fiyatlandırma kalemi eklenmemiş
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { borderColor: colors.border }]}
              onPress={addItem}
            >
              <Plus size={16} color={colors.text} />
              <Text style={[styles.emptyButtonText, { color: colors.text }]}>İlk Kalemi Ekle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {items.map((item, index) => (
              <View
                key={index}
                style={[styles.itemCard, { borderColor: colors.border, backgroundColor: colors.surface }]}
              >
                <View style={styles.itemHeader}>
                  <View style={styles.itemTitleRow}>
                    <Package size={16} color={Brand.primary} />
                    <Text style={[styles.itemTitle, { color: colors.text }]}>Kalem #{index + 1}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeItem(index)}>
                    <Trash2 size={18} color={colors.danger} />
                  </TouchableOpacity>
                </View>

                {/* Ürün/Hizmet Seçimi */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Ürün/Hizmet</Text>
                  <SearchableSelect
                    placeholder="Ürün seçiniz veya arayınız..."
                    value={item.product_id || undefined}
                    onValueChange={(value) => handleProductSelect(index, value as number | undefined)}
                    loadOptions={loadProducts}
                    displayValue={item.product?.name}
                  />
                </View>

                {/* Açıklama */}
                <Input
                  label="Açıklama"
                  placeholder="Hizmet/ürün açıklaması..."
                  value={item.description}
                  onChangeText={(value) => updateItem(index, 'description', value)}
                />

                {/* Miktar ve Birim */}
                <View style={styles.row}>
                  <View style={styles.flex1}>
                    <Input
                      label="Miktar *"
                      placeholder="1"
                      value={item.quantity?.toString()}
                      onChangeText={(value) => handleCalculableFieldChange(index, 'quantity', value)}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={styles.flex1}>
                    <SelectInput
                      label="Birim *"
                      placeholder="Seçiniz"
                      value={item.unit}
                      onValueChange={(value) => updateItem(index, 'unit', value)}
                      options={UNIT_OPTIONS}
                    />
                  </View>
                </View>

                {/* Birim Fiyat ve Para Birimi */}
                <View style={styles.row}>
                  <View style={styles.flex1}>
                    <Input
                      label="Birim Fiyat *"
                      placeholder="0.00"
                      value={item.unit_price?.toString()}
                      onChangeText={(value) => handleCalculableFieldChange(index, 'unit_price', value)}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={styles.flex1}>
                    <SelectInput
                      label="Para Birimi *"
                      placeholder="Seçiniz"
                      value={item.currency}
                      onValueChange={(value) => handleCurrencyChange(index, value?.toString() || '')}
                      options={CURRENCY_OPTIONS}
                    />
                  </View>
                </View>

                {/* Kur ve KDV */}
                <View style={styles.row}>
                  <View style={styles.flex1}>
                    <Input
                      label="Kur"
                      placeholder="1.00"
                      value={item.exchange_rate?.toString()}
                      onChangeText={(value) => handleCalculableFieldChange(index, 'exchange_rate', value)}
                      keyboardType="decimal-pad"
                      editable={item.currency !== 'TRY'}
                    />
                  </View>
                  <View style={styles.flex1}>
                    <SelectInput
                      label="KDV %"
                      placeholder="Seçiniz"
                      value={item.vat_rate}
                      onValueChange={(value) => handleCalculableFieldChange(index, 'vat_rate', value?.toString() || '')}
                      options={VAT_RATE_OPTIONS}
                    />
                  </View>
                </View>

                {/* Kalem Toplamı */}
                <View style={[styles.itemTotalRow, { backgroundColor: '#F8FAFC', borderColor: colors.border }]}>
                  <Text style={[styles.itemTotalLabel, { color: colors.textSecondary }]}>Toplam (TRY):</Text>
                  <Text style={[styles.itemTotalAmount, { color: Brand.primary }]}>
                    {formatAmount(parseFloat(item.total?.toString() || '0') || 0)} ₺
                  </Text>
                </View>
              </View>
            ))}

            {/* Genel Toplam */}
            <View style={[styles.totalsCard, { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' }]}>
              <Text style={[styles.totalsTitle, { color: '#166534' }]}>Genel Toplam</Text>

              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: '#166534' }]}>Ara Toplam (TRY)</Text>
                <Text style={[styles.totalAmount, { color: '#166534' }]}>
                  {formatAmount(totals.totalSubtotal)} ₺
                </Text>
              </View>

              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: '#166534' }]}>KDV Toplamı (TRY)</Text>
                <Text style={[styles.totalAmount, { color: '#166534' }]}>
                  {formatAmount(totals.totalVat)} ₺
                </Text>
              </View>

              <View style={[styles.totalRow, styles.grandTotalRow]}>
                <Text style={[styles.grandTotalLabel, { color: '#166534' }]}>Genel Toplam (TRY)</Text>
                <Text style={[styles.grandTotalAmount, { color: '#166534' }]}>
                  {formatAmount(totals.totalAmount)} ₺
                </Text>
              </View>
            </View>
          </>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  card: {
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  headerText: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardDescription: {
    fontSize: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  emptyText: {
    fontSize: 14,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
  },
  emptyButtonText: {
    fontSize: 14,
  },
  itemCard: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  fieldGroup: {
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  flex1: {
    flex: 1,
  },
  itemTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginTop: Spacing.sm,
  },
  itemTotalLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  itemTotalAmount: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  totalsCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.sm,
  },
  totalsTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 13,
  },
  totalAmount: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  grandTotalRow: {
    marginTop: Spacing.xs,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#86EFAC',
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  grandTotalAmount: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
});
