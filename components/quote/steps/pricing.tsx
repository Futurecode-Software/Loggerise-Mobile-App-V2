/**
 * Quote Create - Step 4: Fiyatlandırma & Notlar
 *
 * Para birimi, döviz kuru, fiyatlandırma kalemleri, indirim, KDV, notlar
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { DollarSign, Plus, Trash2, FileText } from 'lucide-react-native';
import { Input, Card, Checkbox } from '@/components/ui';
import { SelectInput } from '@/components/ui/select-input';
import { Colors, Spacing, Brand } from '@/constants/theme';
import { NewQuoteFormData, PricingItem } from '@/services/endpoints/quotes-new-format';
import { getCurrentRate } from '@/services/endpoints/exchange-rates';
import { useToast } from '@/hooks/use-toast';

interface QuoteCreatePricingScreenProps {
  data: Partial<NewQuoteFormData>;
  onChange: (updates: Partial<NewQuoteFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const CURRENCY_OPTIONS = [
  { label: 'Türk Lirası (₺)', value: 'TRY' },
  { label: 'Amerikan Doları ($)', value: 'USD' },
  { label: 'Euro (€)', value: 'EUR' },
  { label: 'İngiliz Sterlini (£)', value: 'GBP' },
];

const EMPTY_PRICING_ITEM: PricingItem = {
  description: '',
  unit_price: 0,
  quantity: 1,
};

export function QuoteCreatePricingScreen({
  data,
  onChange,
  onNext,
  onBack,
}: QuoteCreatePricingScreenProps) {
  const colors = Colors.light;
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const pricingItems = data.pricing_items || [];
  const toast = useToast();

  // Fetch exchange rate when currency changes
  useEffect(() => {
    const fetchRate = async () => {
      if (data.currency === 'TRY') {
        onChange({ exchange_rate: 1 });
        return;
      }

      if (!data.currency) return;

      setIsLoadingRate(true);
      try {
        const rate = await getCurrentRate(data.currency);
        onChange({ exchange_rate: parseFloat(parseFloat(rate).toFixed(4)) });
      } catch (error) {
        console.error('[Pricing] Fetch rate error:', error);
      } finally {
        setIsLoadingRate(false);
      }
    };

    fetchRate();
  }, [data.currency]);

  // Add pricing item
  const addPricingItem = useCallback(() => {
    const newItems = [...pricingItems, { ...EMPTY_PRICING_ITEM }];
    onChange({ pricing_items: newItems });
  }, [pricingItems, onChange]);

  // Remove pricing item
  const removePricingItem = useCallback(
    (index: number) => {
      if (pricingItems.length === 1) {
        toast.warning('En az bir fiyatlandırma kalemi olmalıdır.');
        return;
      }

      const newItems = pricingItems.filter((_, i) => i !== index);
      onChange({ pricing_items: newItems });
    },
    [pricingItems, onChange, toast]
  );

  // Update pricing item
  const updatePricingItem = useCallback(
    (index: number, field: keyof PricingItem, value: any) => {
      const newItems = [...pricingItems];
      newItems[index] = {
        ...newItems[index],
        [field]: value,
      };
      onChange({ pricing_items: newItems });
    },
    [pricingItems, onChange]
  );

  return (
    <>
      {/* Para Birimi & Döviz Kuru */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <DollarSign size={20} color={Brand.primary} />
            <Text style={styles.sectionTitle}>Para Birimi</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <SelectInput
                label="Para Birimi *"
                placeholder="Seçiniz..."
                value={data.currency}
                onValueChange={(value) => onChange({ currency: (value as string) || 'TRY' })}
                options={CURRENCY_OPTIONS}
                required
              />
            </View>
            <View style={styles.halfWidth}>
              <Input
                label="Döviz Kuru *"
                placeholder="1.0000"
                value={data.exchange_rate?.toString() ?? ''}
                onChangeText={(value) =>
                  onChange({ exchange_rate: parseFloat(value || '0') || 1 })
                }
                keyboardType="decimal-pad"
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
        </Card>

        {/* Fiyatlandırma Kalemleri */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText size={20} color={Brand.primary} />
            <Text style={styles.sectionTitle}>Fiyatlandırma Kalemleri</Text>
          </View>

          {pricingItems.map((item, index) => (
            <View key={index} style={styles.pricingItem}>
              <View style={styles.pricingItemHeader}>
                <Text style={styles.pricingItemTitle}>Kalem #{index + 1}</Text>
                {pricingItems.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removePricingItem(index)}
                    style={styles.deleteButton}
                  >
                    <Trash2 size={18} color="#DC2626" />
                  </TouchableOpacity>
                )}
              </View>

              <Input
                label="Açıklama"
                placeholder="Örn: Navlun Ücreti"
                value={item.description}
                onChangeText={(value) =>
                  updatePricingItem(index, 'description', value)
                }
              />

              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Input
                    label="Birim Fiyat *"
                    placeholder="0"
                    value={item.unit_price?.toString() || ''}
                    onChangeText={(value) =>
                      updatePricingItem(index, 'unit_price', parseFloat(value) || 0)
                    }
                    keyboardType="decimal-pad"
                    required
                  />
                </View>
                <View style={styles.halfWidth}>
                  <Input
                    label="Miktar"
                    placeholder="1"
                    value={item.quantity?.toString() || '1'}
                    onChangeText={(value) =>
                      updatePricingItem(index, 'quantity', parseFloat(value) || 1)
                    }
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={styles.addButton}
            onPress={addPricingItem}
            activeOpacity={0.7}
          >
            <Plus size={20} color={Brand.primary} />
            <Text style={styles.addButtonText}>Kalem Ekle</Text>
          </TouchableOpacity>
        </Card>

        {/* İndirim & KDV */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>İndirim & KDV</Text>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Input
                label="İndirim %"
                placeholder="0"
                value={data.discount_percentage?.toString() ?? ''}
                onChangeText={(value) =>
                  onChange({ discount_percentage: parseFloat(value || '0') || 0 })
                }
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.halfWidth}>
              <Input
                label="İndirim Tutar"
                placeholder="0"
                value={data.discount_amount?.toString() ?? ''}
                onChangeText={(value) =>
                  onChange({ discount_amount: parseFloat(value || '0') || 0 })
                }
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.checkboxRow}>
            <Checkbox
              label="KDV Dahil"
              value={data.include_vat || false}
              onValueChange={(value) => onChange({ include_vat: value })}
            />
          </View>

          {data.include_vat && (
            <Input
              label="KDV Oranı %"
              placeholder="20"
              value={data.vat_rate?.toString() || '20'}
              onChangeText={(value) =>
                onChange({ vat_rate: parseFloat(value) || 20 })
              }
              keyboardType="decimal-pad"
            />
          )}

          <View style={styles.checkboxRow}>
            <Checkbox
              label="Sigorta"
              value={data.has_insurance || false}
              onValueChange={(value) => onChange({ has_insurance: value })}
            />
          </View>
        </Card>

        {/* Notlar */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Notlar</Text>

          <Input
            label="Şartlar ve Koşullar"
            placeholder="Ödeme şartları, teslimat koşulları vb."
            value={data.terms_conditions}
            onChangeText={(value) => onChange({ terms_conditions: value })}
            multiline
            numberOfLines={4}
          />

          <Input
            label="Müşteri Notları"
            placeholder="Müşteriye gösterilecek notlar..."
            value={data.customer_notes}
            onChangeText={(value) => onChange({ customer_notes: value })}
            multiline
            numberOfLines={4}
          />

          <Input
            label="Dahili Notlar"
            placeholder="Sadece sizin göreceğiniz notlar..."
            value={data.internal_notes}
            onChangeText={(value) => onChange({ internal_notes: value })}
            multiline
            numberOfLines={4}
          />
        </Card>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>Geri</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.nextButton}
          onPress={onNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>Önizleme</Text>
        </TouchableOpacity>
            </View>
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -Spacing.xs,
  },
  halfWidth: {
    flex: 1,
    paddingHorizontal: Spacing.xs,
  },
  pricingItem: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  pricingItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  pricingItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  deleteButton: {
    padding: Spacing.xs / 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Brand.primary,
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Brand.primary,
    marginLeft: Spacing.xs,
  },
  checkboxRow: {
    marginVertical: Spacing.sm,
  },
  bottomActions: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: 'transparent',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: Spacing.sm,
  },
  backButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  nextButton: {
    flex: 1,
    backgroundColor: Brand.primary,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
