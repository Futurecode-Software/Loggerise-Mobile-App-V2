import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { Input, Card } from '@/components/ui';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import type { QuoteFormData } from '@/services/endpoints/quotes';

interface QuoteFormStep1Props {
  formData: Partial<QuoteFormData>;
  setFormData: (data: Partial<QuoteFormData>) => void;
  errors: Record<string, string>;
}

const CURRENCIES = [
  { value: 'TRY', label: '₺ TRY', symbol: '₺' },
  { value: 'USD', label: '$ USD', symbol: '$' },
  { value: 'EUR', label: '€ EUR', symbol: '€' },
  { value: 'GBP', label: '£ GBP', symbol: '£' },
];

export default function QuoteFormStep1({ formData, setFormData, errors }: QuoteFormStep1Props) {
  const colors = Colors.light;

  return (
    <View style={styles.container}>
      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Temel Bilgiler</Text>

        {/* Customer Selection - Note: In real implementation, this should be an AsyncSelect */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Müşteri <Text style={{ color: colors.danger }}>*</Text>
          </Text>
          <Input
            placeholder="Müşteri seçiniz"
            value={formData.customer_id?.toString() || ''}
            onChangeText={(value) =>
              setFormData({ ...formData, customer_id: parseInt(value, 10) || undefined })
            }
            error={errors.customer_id}
            keyboardType="numeric"
          />
          <Text style={[styles.helperText, { color: colors.textMuted }]}>
            * Müşteri seçimi için web uygulamasını kullanınız veya müşteri ID&apos;sini giriniz
          </Text>
        </View>

        <Input
          label="Teklif Açıklaması"
          placeholder="Örn: İstanbul - Ankara nakliye teklifi"
          value={formData.description || ''}
          onChangeText={(value) => setFormData({ ...formData, description: value })}
          error={errors.description}
          multiline
          numberOfLines={3}
        />
      </Card>

      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Tarihler</Text>

        <Input
          label="Teklif Tarihi"
          placeholder="YYYY-MM-DD"
          value={formData.quote_date || ''}
          onChangeText={(value) => setFormData({ ...formData, quote_date: value })}
          error={errors.quote_date}
          type="date"
        />

        <Input
          label="Geçerlilik Tarihi"
          placeholder="YYYY-MM-DD"
          value={formData.valid_until || ''}
          onChangeText={(value) => setFormData({ ...formData, valid_until: value })}
          error={errors.valid_until}
          type="date"
        />
      </Card>

      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Para Birimi</Text>

        <View style={styles.currencyGrid}>
          {CURRENCIES.map((currency) => {
            const isActive = formData.currency_type === currency.value;

            return (
              <TouchableOpacity
                key={currency.value}
                style={[
                  styles.currencyCard,
                  {
                    backgroundColor: isActive ? Brand.primary + '15' : colors.surface,
                    borderColor: isActive ? Brand.primary : colors.border,
                  },
                ]}
                onPress={() => setFormData({ ...formData, currency_type: currency.value as import('@/services/endpoints/quotes').CurrencyType })}
              >
                <Text
                  style={[
                    styles.currencySymbol,
                    { color: isActive ? Brand.primary : colors.text },
                  ]}
                >
                  {currency.symbol}
                </Text>
                <Text
                  style={[
                    styles.currencyLabel,
                    { color: isActive ? Brand.primary : colors.text },
                  ]}
                >
                  {currency.value}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {errors.currency_type && (
          <Text style={[styles.errorText, { color: colors.danger }]}>
            {errors.currency_type}
          </Text>
        )}
      </Card>

      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Adresler</Text>

        {/* Pickup Address - Note: Should be AsyncSelect in real implementation */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Yükleme Adresi
          </Text>
          <Input
            placeholder="Yükleme adresi seçiniz"
            value={formData.pickup_address_id?.toString() || ''}
            onChangeText={(value) =>
              setFormData({ ...formData, pickup_address_id: parseInt(value, 10) || undefined })
            }
            error={errors.pickup_address_id}
            keyboardType="numeric"
          />
          <Text style={[styles.helperText, { color: colors.textMuted }]}>
            * Adres seçimi için web uygulamasını kullanınız veya adres ID&apos;sini giriniz
          </Text>
        </View>

        {/* Delivery Address - Note: Should be AsyncSelect in real implementation */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Teslimat Adresi
          </Text>
          <Input
            placeholder="Teslimat adresi seçiniz"
            value={formData.delivery_address_id?.toString() || ''}
            onChangeText={(value) =>
              setFormData({ ...formData, delivery_address_id: parseInt(value, 10) || undefined })
            }
            error={errors.delivery_address_id}
            keyboardType="numeric"
          />
          <Text style={[styles.helperText, { color: colors.textMuted }]}>
            * Adres seçimi için web uygulamasını kullanınız veya adres ID&apos;sini giriniz
          </Text>
        </View>
      </Card>

      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Notlar (İsteğe Bağlı)</Text>

        <Input
          label="Dahili Notlar"
          placeholder="İç kullanım için notlar..."
          value={formData.notes || ''}
          onChangeText={(value) => setFormData({ ...formData, notes: value })}
          multiline
          numberOfLines={3}
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: Spacing.md,
  },
  section: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.headingMD,
    marginBottom: Spacing.lg,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.bodySM,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  helperText: {
    ...Typography.bodyXS,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
  },
  currencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  currencyCard: {
    flex: 1,
    minWidth: '45%',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  currencySymbol: {
    ...Typography.headingXL,
    fontWeight: '700',
  },
  currencyLabel: {
    ...Typography.bodySM,
    fontWeight: '600',
  },
  errorText: {
    ...Typography.bodyXS,
    marginTop: Spacing.sm,
  },
});
