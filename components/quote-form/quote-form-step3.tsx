import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { DollarSign, FileText, AlertCircle } from 'lucide-react-native';
import { Input, Card, Badge } from '@/components/ui';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import type { QuoteFormData } from '@/services/endpoints/quotes';
import type { CargoItem } from './cargo-item-form';
import { getCurrencySymbol } from '@/services/endpoints/quotes';

interface QuoteFormStep3Props {
  formData: Partial<QuoteFormData>;
  setFormData: (data: Partial<QuoteFormData>) => void;
  cargoItems: CargoItem[];
  errors: Record<string, string>;
}

export default function QuoteFormStep3({
  formData,
  setFormData,
  cargoItems,
  errors,
}: QuoteFormStep3Props) {
  const colors = Colors.light;
  const currencySymbol = getCurrencySymbol(formData.currency_type || 'TRY');

  // Calculate pricing
  const calculatePricing = () => {
    // Calculate subtotal from cargo items
    const subtotal = cargoItems.reduce((sum, item) => {
      return sum + (item.unit_price || 0) * item.quantity;
    }, 0);

    // VAT calculation
    const vatRate = formData.vat_rate || 20; // Default 20% VAT
    const vatTotal = (subtotal * vatRate) / 100;

    // Discount
    const discountTotal = formData.discount_total || 0;

    // Grand total
    const grandTotal = subtotal + vatTotal - discountTotal;

    return {
      subtotal,
      vatTotal,
      discountTotal,
      grandTotal,
    };
  };

  const pricing = calculatePricing();

  // Update form data with calculated values
  React.useEffect(() => {
    setFormData({
      ...formData,
      subtotal: pricing.subtotal,
      vat_total: pricing.vatTotal,
      grand_total: pricing.grandTotal,
    });
  }, [pricing.subtotal, pricing.vatTotal, pricing.grandTotal]);

  const formatAmount = (amount: number): string => {
    return `${amount.toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${currencySymbol}`;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Pricing Card */}
      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <DollarSign size={24} color={Brand.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Fiyatlandırma</Text>
        </View>

        <View style={styles.pricingRow}>
          <Text style={[styles.pricingLabel, { color: colors.textSecondary }]}>Ara Toplam</Text>
          <Text style={[styles.pricingValue, { color: colors.text }]}>
            {formatAmount(pricing.subtotal)}
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Input
            label="KDV Oranı (%)"
            placeholder="20"
            value={formData.vat_rate?.toString() || '20'}
            onChangeText={(value) =>
              setFormData({ ...formData, vat_rate: parseFloat(value) || 20 })
            }
            keyboardType="numeric"
            error={errors.vat_rate}
          />
        </View>

        <View style={styles.pricingRow}>
          <Text style={[styles.pricingLabel, { color: colors.textSecondary }]}>KDV Tutarı</Text>
          <Text style={[styles.pricingValue, { color: colors.text }]}>
            {formatAmount(pricing.vatTotal)}
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Input
            label="İndirim Tutarı"
            placeholder="0.00"
            value={formData.discount_total?.toString() || ''}
            onChangeText={(value) =>
              setFormData({ ...formData, discount_total: parseFloat(value) || 0 })
            }
            keyboardType="numeric"
            error={errors.discount_total}
          />
        </View>

        <View style={[styles.pricingDivider, { backgroundColor: colors.border }]} />

        <View style={styles.pricingRow}>
          <Text style={[styles.pricingLabelTotal, { color: colors.text }]}>Genel Toplam</Text>
          <Text style={[styles.pricingValueTotal, { color: Brand.primary }]}>
            {formatAmount(pricing.grandTotal)}
          </Text>
        </View>
      </Card>

      {/* Additional Terms */}
      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <FileText size={24} color={Brand.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Ek Bilgiler</Text>
        </View>

        <Input
          label="Ödeme Koşulları"
          placeholder="Örn: 30 gün vadeli"
          value={formData.payment_terms || ''}
          onChangeText={(value) => setFormData({ ...formData, payment_terms: value })}
          multiline
          numberOfLines={2}
        />

        <Input
          label="Teslimat Koşulları"
          placeholder="Örn: Ex-Works, FOB, CIF"
          value={formData.delivery_terms || ''}
          onChangeText={(value) => setFormData({ ...formData, delivery_terms: value })}
          multiline
          numberOfLines={2}
        />

        <Input
          label="Özel Talimatlar"
          placeholder="Ekstra notlar ve talimatlar..."
          value={formData.special_instructions || ''}
          onChangeText={(value) => setFormData({ ...formData, special_instructions: value })}
          multiline
          numberOfLines={3}
        />

        <Input
          label="Şartlar ve Koşullar"
          placeholder="Teklif şartları ve koşulları..."
          value={formData.terms_and_conditions || ''}
          onChangeText={(value) => setFormData({ ...formData, terms_and_conditions: value })}
          multiline
          numberOfLines={4}
        />
      </Card>

      {/* Review Summary */}
      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Özet</Text>

        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Para Birimi</Text>
          <Badge label={formData.currency_type || 'TRY'} variant="info" size="sm" />
        </View>

        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Yük Kalemleri</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {cargoItems.length} adet
          </Text>
        </View>

        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
            Toplam Ağırlık
          </Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {cargoItems
              .reduce((sum, item) => sum + (item.weight || 0) * item.quantity, 0)
              .toFixed(2)}{' '}
            kg
          </Text>
        </View>

        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Toplam Hacim</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {cargoItems
              .reduce((sum, item) => sum + (item.volume || 0) * item.quantity, 0)
              .toFixed(2)}{' '}
            m³
          </Text>
        </View>

        {formData.valid_until && (
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              Geçerlilik Tarihi
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {formData.valid_until}
            </Text>
          </View>
        )}
      </Card>

      {/* Warning */}
      {pricing.subtotal === 0 && (
        <Card style={[styles.warningCard, { backgroundColor: colors.warning + '10' }]}>
          <AlertCircle size={20} color={colors.warning} />
          <Text style={[styles.warningText, { color: colors.warning }]}>
            Yük kalemlerine birim fiyat eklemeyi unutmayın
          </Text>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.headingMD,
  },
  formGroup: {
    marginBottom: Spacing.md,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  pricingLabel: {
    ...Typography.bodyMD,
  },
  pricingValue: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  pricingDivider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  pricingLabelTotal: {
    ...Typography.bodyLG,
    fontWeight: '700',
  },
  pricingValueTotal: {
    ...Typography.headingMD,
    fontWeight: '700',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  summaryLabel: {
    ...Typography.bodyMD,
  },
  summaryValue: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  warningText: {
    ...Typography.bodySM,
    flex: 1,
  },
});
