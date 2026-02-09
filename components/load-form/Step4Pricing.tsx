/**
 * Step4Pricing - Navlun Fiyatlandırması
 *
 * Web versiyonu ile %100 uyumlu - Ürün bazlı fiyatlandırma sistemi
 */

import React, { SetStateAction, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Card, Input, SearchableSelect } from '@/components/ui'
import { SelectInput } from '@/components/ui/select-input'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius
} from '@/constants/dashboard-theme'
import { CURRENCY_OPTIONS } from '@/constants/currencies'
import { formatNumber } from '@/utils/currency'
import api from '@/services/api'

// Web ile aynı LoadPricingItem tipi
export interface LoadPricingItem {
  id?: number
  load_id?: number
  product_id?: number | null
  product?: {
    id: number
    code: string
    name: string
    unit: string
    vat_rate: string
  } | null
  description: string
  quantity: string | number
  unit: string
  unit_price: string | number
  currency: string
  exchange_rate: string | number
  vat_rate: string | number
  vat_amount: string | number
  discount_rate: string | number
  discount_amount: string | number
  sub_total: string | number
  total: string | number
  sort_order?: number
  is_active?: boolean
}

interface SelectOption {
  label: string
  value: number | string
  subtitle?: string
}

interface Step4PricingProps {
  items: LoadPricingItem[]
  setItems: (value: SetStateAction<LoadPricingItem[]>) => void
}

// Web ile aynı birim seçenekleri
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
]

// KDV oranları
const VAT_RATE_OPTIONS: SelectOption[] = [
  { label: '%0', value: '0' },
  { label: '%1', value: '1' },
  { label: '%10', value: '10' },
  { label: '%20', value: '20' },
]

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
})

// Ürün seçeneği (loadProducts'tan dönen ekstra alanlar)
interface ProductOption extends SelectOption {
  unit?: string
  vat_rate?: string | number
  price?: string | number
}

// Ürün arama API fonksiyonu
const loadProducts = async (searchQuery: string): Promise<ProductOption[]> => {
  try {
    const response = await api.get('/products', {
      params: { search: searchQuery, per_page: 20 },
    })
    const products = response.data.data?.products || response.data.data || []
    return products.map((product: any) => ({
      value: product.id,
      label: product.name,
      subtitle: product.code,
      unit: product.unit,
      vat_rate: product.vat_rate,
      price: product.price,
    }))
  } catch (error) {
    if (__DEV__) console.error('Error loading products:', error)
    return []
  }
}

// Döviz kuru API fonksiyonu
const fetchExchangeRate = async (currency: string): Promise<string> => {
  if (currency === 'TRY') return '1'
  try {
    const response = await api.get(`/exchange-rates/current/${currency}`)
    return response.data.rate?.toString() || '1'
  } catch (error) {
    if (__DEV__) console.error('Error fetching exchange rate:', error)
    return '1'
  }
}

export default function Step4Pricing({ items, setItems }: Step4PricingProps) {
  // Edit modunda product_id var ama product null ise ürün verisini fetch et
  useEffect(() => {
    const missingProducts = items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.product_id && !item.product)

    if (missingProducts.length === 0) return

    const fetchMissingProducts = async () => {
      for (const { item, index } of missingProducts) {
        try {
          const response = await api.get(`/products/${item.product_id}`)
          const product = response.data.data?.product || response.data.data
          setItems(prev => {
            const updatedItems = [...prev]
            updatedItems[index] = {
              ...updatedItems[index],
              product: {
                id: product.id,
                code: product.code,
                name: product.name,
                unit: product.unit,
                vat_rate: product.vat_rate?.toString() || '0',
              },
            }
            return updatedItems
          })
        } catch (error) {
          if (__DEV__) console.error('Error fetching product:', error)
        }
      }
    }

    fetchMissingProducts()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const addItem = () => {
    const newItem = getDefaultPricingItem()
    newItem.sort_order = items.length
    setItems([...items, newItem])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof LoadPricingItem, value: any) => {
    const updatedItems = [...items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setItems(updatedItems)
  }

  // Ürün seçildiğinde - onSelect ile senkron güncelleme (API çağrısı yok)
  const handleProductSelect = (index: number, option: ProductOption | null) => {
    setItems(prev => {
      const updatedItems = [...prev]

      if (!option) {
        updatedItems[index] = { ...updatedItems[index], product_id: null, product: null }
        return updatedItems
      }

      const productId = option.value as number
      updatedItems[index] = {
        ...updatedItems[index],
        product_id: productId,
        product: {
          id: productId,
          code: option.subtitle || '',
          name: option.label,
          unit: option.unit || 'SET',
          vat_rate: option.vat_rate?.toString() || '0',
        },
        unit: option.unit || 'SET',
        vat_rate: option.vat_rate?.toString() || '0',
        description: option.label,
      }

      if (option.price) {
        updatedItems[index] = { ...updatedItems[index], unit_price: option.price.toString() }
      }

      const item = updatedItems[index]
      const quantity = parseFloat(item.quantity?.toString() || '0') || 0
      const unitPrice = parseFloat(item.unit_price?.toString() || '0') || 0
      const exchangeRate = parseFloat(item.exchange_rate?.toString() || '1') || 1
      const vatRate = parseFloat(item.vat_rate?.toString() || '0') || 0
      const discountRate = parseFloat(item.discount_rate?.toString() || '0') || 0
      const discountAmount = parseFloat(item.discount_amount?.toString() || '0') || 0
      const lineTotalInTry = quantity * unitPrice * exchangeRate
      let totalDiscount = 0
      if (discountRate > 0) {
        totalDiscount = lineTotalInTry * (discountRate / 100)
      } else if (discountAmount > 0) {
        totalDiscount = discountAmount * exchangeRate
      }
      const subTotal = lineTotalInTry - totalDiscount
      const vatAmount = subTotal * (vatRate / 100)
      const total = subTotal + vatAmount
      updatedItems[index] = {
        ...updatedItems[index],
        sub_total: subTotal.toFixed(2),
        vat_amount: vatAmount.toFixed(2),
        total: total.toFixed(2),
      }

      return updatedItems
    })
  }

  // Para birimi değiştiğinde kur çek
  const handleCurrencyChange = async (index: number, currency: string | number) => {
    const currencyStr = currency?.toString() || ''
    const rate = await fetchExchangeRate(currencyStr)

    setItems(prev => {
      const updatedItems = [...prev]
      updatedItems[index] = {
        ...updatedItems[index],
        currency: currencyStr,
        exchange_rate: rate,
      }

      const item = updatedItems[index]
      const quantity = parseFloat(item.quantity?.toString() || '0') || 0
      const unitPrice = parseFloat(item.unit_price?.toString() || '0') || 0
      const exchangeRate = parseFloat(rate) || 1
      const vatRate = parseFloat(item.vat_rate?.toString() || '0') || 0
      const discountRate = parseFloat(item.discount_rate?.toString() || '0') || 0
      const discountAmount = parseFloat(item.discount_amount?.toString() || '0') || 0
      const lineTotalInTry = quantity * unitPrice * exchangeRate
      let totalDiscount = 0
      if (discountRate > 0) {
        totalDiscount = lineTotalInTry * (discountRate / 100)
      } else if (discountAmount > 0) {
        totalDiscount = discountAmount * exchangeRate
      }
      const subTotal = lineTotalInTry - totalDiscount
      const vatAmount = subTotal * (vatRate / 100)
      const total = subTotal + vatAmount
      updatedItems[index] = {
        ...updatedItems[index],
        sub_total: subTotal.toFixed(2),
        vat_amount: vatAmount.toFixed(2),
        total: total.toFixed(2),
      }

      return updatedItems
    })
  }

  // Hesaplama gerektiren alan değişikliklerinde
  const handleCalculableFieldChange = (index: number, field: keyof LoadPricingItem, value: string | number) => {
    setItems(prev => {
      const updatedItems = [...prev]
      updatedItems[index] = { ...updatedItems[index], [field]: value?.toString() || '' }

      const item = updatedItems[index]
      const quantity = parseFloat(item.quantity?.toString() || '0') || 0
      const unitPrice = parseFloat(item.unit_price?.toString() || '0') || 0
      const exchangeRate = parseFloat(item.exchange_rate?.toString() || '1') || 1
      const vatRate = parseFloat(item.vat_rate?.toString() || '0') || 0
      const discountRate = parseFloat(item.discount_rate?.toString() || '0') || 0
      const discountAmount = parseFloat(item.discount_amount?.toString() || '0') || 0
      const lineTotalInTry = quantity * unitPrice * exchangeRate
      let totalDiscount = 0
      if (discountRate > 0) {
        totalDiscount = lineTotalInTry * (discountRate / 100)
      } else if (discountAmount > 0) {
        totalDiscount = discountAmount * exchangeRate
      }
      const subTotal = lineTotalInTry - totalDiscount
      const vatAmount = subTotal * (vatRate / 100)
      const total = subTotal + vatAmount
      updatedItems[index] = {
        ...updatedItems[index],
        sub_total: subTotal.toFixed(2),
        vat_amount: vatAmount.toFixed(2),
        total: total.toFixed(2),
      }

      return updatedItems
    })
  }

  // Toplamları hesapla
  const calculateTotals = () => {
    const totalSubtotal = items.reduce((sum, item) => sum + (parseFloat(item.sub_total?.toString() || '0') || 0), 0)
    const totalVat = items.reduce((sum, item) => sum + (parseFloat(item.vat_amount?.toString() || '0') || 0), 0)
    const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.total?.toString() || '0') || 0), 0)
    return { totalSubtotal, totalVat, totalAmount }
  }

  const totals = calculateTotals()

  const formatAmount = (amount: number) => {
    return formatNumber(amount, 2)
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.cardTitle}>Navlun Fiyatlandırması</Text>
            <Text style={styles.cardDescription}>
              Yük için navlun, sigorta, gümrük vb. maliyetleri ekleyin
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={addItem}
          >
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Kalem Ekle</Text>
          </TouchableOpacity>
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cash-outline" size={32} color={DashboardColors.textMuted} />
            <Text style={styles.emptyText}>
              Henüz fiyatlandırma kalemi eklenmemiş
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={addItem}
            >
              <Ionicons name="add" size={16} color={DashboardColors.text} />
              <Text style={styles.emptyButtonText}>İlk Kalemi Ekle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {items.map((item, index) => (
              <View
                key={index}
                style={styles.itemCard}
              >
                <View style={styles.itemHeader}>
                  <View style={styles.itemTitleRow}>
                    <Ionicons name="cube-outline" size={16} color={DashboardColors.primary} />
                    <Text style={styles.itemTitle}>Kalem #{index + 1}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeItem(index)}>
                    <Ionicons name="trash-outline" size={18} color={DashboardColors.danger} />
                  </TouchableOpacity>
                </View>

                {/* Ürün/Hizmet Seçimi */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Ürün/Hizmet</Text>
                  <SearchableSelect
                    placeholder="Ürün seçiniz veya arayınız..."
                    value={item.product_id || undefined}
                    selectedOption={item.product ? { value: item.product.id, label: item.product.name, subtitle: item.product.code } : undefined}
                    onValueChange={() => {}}
                    onSelect={(option) => handleProductSelect(index, option as ProductOption | null)}
                    loadOptions={loadProducts}
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
                <View style={styles.itemTotalRow}>
                  <Text style={styles.itemTotalLabel}>Toplam (TRY):</Text>
                  <Text style={styles.itemTotalAmount}>
                    {formatAmount(parseFloat(item.total?.toString() || '0') || 0)} ₺
                  </Text>
                </View>
              </View>
            ))}

            {/* Genel Toplam */}
            <View style={styles.totalsCard}>
              <Text style={styles.totalsTitle}>Genel Toplam</Text>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Ara Toplam (TRY)</Text>
                <Text style={styles.totalAmount}>
                  {formatAmount(totals.totalSubtotal)} ₺
                </Text>
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>KDV Toplamı (TRY)</Text>
                <Text style={styles.totalAmount}>
                  {formatAmount(totals.totalVat)} ₺
                </Text>
              </View>

              <View style={[styles.totalRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>Genel Toplam (TRY)</Text>
                <Text style={styles.grandTotalAmount}>
                  {formatAmount(totals.totalAmount)} ₺
                </Text>
              </View>
            </View>
          </>
        )}
      </Card>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: DashboardSpacing.sm,
  },
  card: {
    padding: DashboardSpacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: DashboardSpacing.md,
  },
  headerText: {
    flex: 1,
    marginRight: DashboardSpacing.sm,
  },
  cardTitle: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '600',
    color: DashboardColors.text,
    marginBottom: 2,
  },
  cardDescription: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textSecondary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.xs,
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: DashboardSpacing.xs,
    borderRadius: DashboardBorderRadius.lg,
    backgroundColor: DashboardColors.primary,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: DashboardSpacing.lg,
  },
  emptyText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    marginTop: DashboardSpacing.sm,
    marginBottom: DashboardSpacing.sm,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.xs,
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.sm,
    borderWidth: 1,
    borderColor: DashboardColors.border,
    borderRadius: DashboardBorderRadius.lg,
  },
  emptyButtonText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.text,
  },
  itemCard: {
    padding: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.lg,
    borderWidth: 1,
    borderColor: DashboardColors.border,
    backgroundColor: DashboardColors.surface,
    marginBottom: DashboardSpacing.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DashboardSpacing.sm,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.xs,
  },
  itemTitle: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.text,
  },
  fieldGroup: {
    marginBottom: DashboardSpacing.sm,
  },
  label: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: DashboardColors.text,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    gap: DashboardSpacing.sm,
  },
  flex1: {
    flex: 1,
  },
  itemTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.sm,
    borderWidth: 1,
    borderColor: DashboardColors.border,
    backgroundColor: DashboardColors.background,
    marginTop: DashboardSpacing.sm,
  },
  itemTotalLabel: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: DashboardColors.textSecondary,
  },
  itemTotalAmount: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: DashboardColors.primary,
  },
  totalsCard: {
    padding: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
    borderWidth: 1,
    marginTop: DashboardSpacing.sm,
    backgroundColor: DashboardColors.successBg,
    borderColor: '#86EFAC',
  },
  totalsTitle: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '700',
    color: '#166534',
    marginBottom: DashboardSpacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: DashboardFontSizes.sm,
    color: '#166534',
  },
  totalAmount: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    fontFamily: 'monospace',
    color: '#166534',
  },
  grandTotalRow: {
    marginTop: DashboardSpacing.xs,
    paddingTop: DashboardSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#86EFAC',
  },
  grandTotalLabel: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: '#166534',
  },
  grandTotalAmount: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#166534',
  },
})
