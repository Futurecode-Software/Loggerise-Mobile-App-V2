/**
 * Quote Create - Step 5: Önizleme
 *
 * Teklif özeti + Taslak Kaydet / Gönder butonları
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Eye } from 'lucide-react-native';
import { Card } from '@/components/ui';
import { Spacing, Brand } from '@/constants/theme';
import { NewQuoteFormData } from '@/services/endpoints/quotes-new-format';

// Araç tipi seçenekleri (web ile aynı)
const VEHICLE_TYPE_OPTIONS = [
  { label: 'Tenteli', value: 'tenteli' },
  { label: 'Mega Tenteli', value: 'mega_tenteli' },
  { label: 'Maxi Tenteli', value: 'maxi_tenteli' },
  { label: 'Optima Tenteli', value: 'optima_tenteli' },
  { label: 'Jumbo Tenteli', value: 'jumbo_tenteli' },
  { label: 'Jumbo Düz', value: 'jumbo_duz' },
  { label: 'Düz', value: 'duz' },
  { label: 'Kapalı Kasa', value: 'kapali_kasa' },
  { label: 'Açık Kasa', value: 'acik_kasa' },
  { label: 'Mega Askılı', value: 'mega_askili' },
  { label: 'Frigorifik', value: 'frigorifik' },
  { label: 'Lowbed', value: 'lowbed' },
  { label: 'Damper', value: 'damper' },
  { label: 'Tır', value: 'tir' },
  { label: 'Kamyon', value: 'kamyon' },
  { label: 'Kamyonet', value: 'kamyonet' },
];

interface QuoteCreatePreviewScreenProps {
  data: Partial<NewQuoteFormData>;
  onBack: () => void;
  onSaveDraft: () => void;
  onSend: () => void;
}

export function QuoteCreatePreviewScreen({
  data,
  onBack,
  onSaveDraft,
  onSend,
}: QuoteCreatePreviewScreenProps) {
  // Para formatlama fonksiyonu
  const formatCurrency = (amount: number, currency?: string): string => {
    const curr = currency || data.currency || 'TRY';
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Sayı formatlama (miktar için)
  const formatNumber = (value: number, decimals: number = 2): string => {
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  // Tarih formatlama fonksiyonu
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date);
    } catch {
      return dateString;
    }
  };

  // Calculate totals
  const totals = useMemo(() => {
    const pricingItems = data.pricing_items || [];
    const subtotal = pricingItems.reduce(
      (sum, item) => sum + (item.unit_price || 0) * (item.quantity || 1),
      0
    );

    const discountAmount =
      data.discount_amount ||
      subtotal * ((data.discount_percentage || 0) / 100);

    const afterDiscount = subtotal - discountAmount;

    const vatAmount = data.include_vat
      ? afterDiscount * ((data.vat_rate || 0) / 100)
      : 0;

    const total = afterDiscount + vatAmount;

    return {
      subtotal,
      discountAmount,
      afterDiscount,
      vatAmount,
      total,
    };
  }, [data]);

  return (
    <>
      {/* Header */}
        <View style={styles.header}>
          <Eye size={24} color={Brand.primary} />
          <Text style={styles.headerTitle}>Teklif Özeti</Text>
        </View>

        {/* Müşteri Bilgisi */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Müşteri</Text>
          <Text style={styles.infoText}>
            {data.customer
              ? data.customer.short_name || data.customer.name
              : data.customer_id
                ? `Müşteri ID: ${data.customer_id}`
                : 'Seçilmedi'}
          </Text>
        </Card>

        {/* Tarihler */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Tarihler</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Teklif Tarihi:</Text>
            <Text style={styles.infoValue}>{formatDate(data.quote_date)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Geçerlilik:</Text>
            <Text style={styles.infoValue}>{formatDate(data.valid_until)}</Text>
          </View>
        </Card>

        {/* Transport Bilgileri */}
        {(data.direction || data.vehicle_type || data.loading_type || data.load_type || data.transport_speed) && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Taşıma Bilgileri</Text>
            {data.direction ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Yön:</Text>
                <Text style={styles.infoValue}>
                  {data.direction === 'import' ? 'İthalat (ITH)' : 'İhracat (IHR)'}
                </Text>
              </View>
            ) : null}
            {data.vehicle_type ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Araç Tipi:</Text>
                <Text style={styles.infoValue}>
                  {VEHICLE_TYPE_OPTIONS.find(opt => opt.value === data.vehicle_type)?.label || data.vehicle_type || '-'}
                </Text>
              </View>
            ) : null}
            {data.loading_type ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Yükleme Tipi:</Text>
                <Text style={styles.infoValue}>
                  {data.loading_type === 'normal' ? 'Normal' : 'Karışık'}
                </Text>
              </View>
            ) : null}
            {data.load_type ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Yük Tipi:</Text>
                <Text style={styles.infoValue}>
                  {data.load_type === 'full' ? 'Komple' : 'Parsiyel'}
                </Text>
              </View>
            ) : null}
            {data.transport_speed ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Taşıma Hızı:</Text>
                <Text style={styles.infoValue}>
                  {data.transport_speed === 'expres' ? 'Expres' : 'Normal'}
                </Text>
              </View>
            ) : null}
          </Card>
        )}

        {/* Kargo Kalemleri */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>
            {`Kargo Kalemleri (${data.cargo_items?.length || 0})`}
          </Text>
          {(data.cargo_items || []).map((item, index) => (
            <View key={index} style={styles.cargoItem}>
              <Text style={styles.cargoItemName}>
                {`${index + 1}. ${item.cargo_name || 'Isimsiz'}`}
              </Text>
              {item.gross_weight ? (
                <Text style={styles.cargoItemDetail}>
                  {`Brüt Ağırlık: ${formatNumber(Number(item.gross_weight))} kg`}
                </Text>
              ) : null}
              {item.package_count ? (
                <Text style={styles.cargoItemDetail}>
                  {`Paket Sayısı: ${formatNumber(Number(item.package_count), 0)}${item.package_type ? ` ${item.package_type}` : ''}`}
                </Text>
              ) : null}
            </View>
          ))}
        </Card>

        {/* Fiyatlandırma */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Fiyatlandırma</Text>

          {/* Currency */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Para Birimi:</Text>
            <Text style={styles.infoValue}>
              {`${data.currency || 'TRY'} (Kur: ${data.exchange_rate || 1})`}
            </Text>
          </View>

          {/* Pricing Items */}
          {(data.pricing_items || []).map((item, index) => (
            <View key={index} style={styles.pricingItemRow}>
              <Text style={styles.pricingItemDesc}>
                {item.description || `Kalem ${index + 1}`}
              </Text>
              <Text style={styles.pricingItemPrice}>
                {`${formatCurrency(item.unit_price || 0)} x ${formatNumber(item.quantity || 1, 0)} = ${formatCurrency((item.unit_price || 0) * (item.quantity || 1))}`}
              </Text>
            </View>
          ))}

          {/* Totals */}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Ara Toplam:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(totals.subtotal)}
            </Text>
          </View>

          {totals.discountAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                {`İndirim (${data.discount_percentage || 0}%):`}
              </Text>
              <Text style={[styles.totalValue, styles.discountText]}>
                {`-${formatCurrency(totals.discountAmount)}`}
              </Text>
            </View>
          )}

          {data.include_vat && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                {`KDV (${data.vat_rate || 0}%):`}
              </Text>
              <Text style={styles.totalValue}>
                {formatCurrency(totals.vatAmount)}
              </Text>
            </View>
          )}

          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.grandTotalLabel}>TOPLAM:</Text>
            <Text style={styles.grandTotalValue}>
              {formatCurrency(totals.total)}
            </Text>
          </View>
        </Card>

        {/* Notlar */}
        {(data.terms_conditions || data.customer_notes || data.internal_notes) && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Notlar</Text>
            {data.terms_conditions && (
              <View style={styles.noteBlock}>
                <Text style={styles.noteTitle}>Şartlar ve Koşullar:</Text>
                <Text style={styles.noteText}>{data.terms_conditions}</Text>
              </View>
            )}
            {data.customer_notes && (
              <View style={styles.noteBlock}>
                <Text style={styles.noteTitle}>Müşteri Notları:</Text>
                <Text style={styles.noteText}>{data.customer_notes}</Text>
              </View>
            )}
            {data.internal_notes && (
              <View style={styles.noteBlock}>
                <Text style={styles.noteTitle}>Dahili Notlar:</Text>
                <Text style={styles.noteText}>{data.internal_notes}</Text>
              </View>
            )}
          </Card>
        )}

    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: Spacing.sm,
  },
  section: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs / 2,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
  },
  cargoItem: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  cargoItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: Spacing.xs / 2,
  },
  cargoItemDetail: {
    fontSize: 13,
    color: '#6B7280',
  },
  pricingItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  pricingItemDesc: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  pricingItemPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginLeft: Spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: Spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs / 2,
  },
  totalLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  discountText: {
    color: '#DC2626',
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Brand.primary,
  },
  noteBlock: {
    marginBottom: Spacing.md,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: Spacing.xs / 2,
  },
  noteText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
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
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  draftButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#6B7280',
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  draftButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sendButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Brand.primary,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  sendButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
