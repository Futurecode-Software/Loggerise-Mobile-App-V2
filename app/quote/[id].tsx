/**
 * Quote Detail Screen
 *
 * Shows quote details with load items, pricing, and actions.
 * 100% compatible with backend QuoteResource.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft,
  Edit,
  Trash2,
  FileText,
  User,
  Calendar,
  DollarSign,
  Package,
  Send,
  Copy,
  FileDown,
  AlertCircle,
} from 'lucide-react-native';
import { Card, Badge } from '@/components/ui';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import { useToast } from '@/hooks/use-toast';
import {
  getQuote,
  deleteQuote,
  sendQuote,
  duplicateQuote,
  exportQuotePdf,
  Quote,
  formatAmount,
  formatDate,
  getQuoteStatusLabel,
  getQuoteStatusVariant,
} from '@/services/endpoints/quotes';

export default function QuoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = Colors.light;
  const { success, error: showError } = useToast();

  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch quote data
  const fetchQuote = useCallback(async () => {
    if (!id) return;

    try {
      setError(null);
      const data = await getQuote(parseInt(id, 10));
      setQuote(data);
    } catch (err) {
      console.error('Quote fetch error:', err);
      setError(err instanceof Error ? err.message : 'Teklif bilgileri yüklenemedi');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchQuote();
  };

  // Delete quote
  const handleDelete = () => {
    if (quote && !quote.can_delete) {
      Alert.alert(
        'Silinemez',
        'Bu teklif silinemez. Yüklere dönüştürülmüş teklifler silinemez.',
        [{ text: 'Tamam' }]
      );
      return;
    }
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await deleteQuote(parseInt(id, 10));
      success('Başarılı', 'Teklif silindi.');
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (err) {
      showError('Hata', err instanceof Error ? err.message : 'Teklif silinemedi.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Send quote
  const handleSend = async () => {
    if (!quote || !id) return;

    if (!quote.can_convert_to_loads) {
      Alert.alert(
        'Gönderilemez',
        'Bu teklif gönderilemez. Teklifin taslak durumunda olması ve yük kalemi içermesi gerekir.',
        [{ text: 'Tamam' }]
      );
      return;
    }

    setIsSending(true);
    try {
      const updated = await sendQuote(parseInt(id, 10));
      setQuote(updated);
      success('Başarılı', 'Teklif müşteriye gönderildi.');
    } catch (err) {
      showError('Hata', err instanceof Error ? err.message : 'Teklif gönderilemedi.');
    } finally {
      setIsSending(false);
    }
  };

  // Duplicate quote
  const handleDuplicate = async () => {
    if (!id) return;
    setIsDuplicating(true);
    try {
      const duplicated = await duplicateQuote(parseInt(id, 10));
      success('Başarılı', 'Teklif kopyalandı.');
      setTimeout(() => {
        router.replace(`/quote/${duplicated.id}` as any);
      }, 1500);
    } catch (err) {
      showError('Hata', err instanceof Error ? err.message : 'Teklif kopyalanamadı.');
    } finally {
      setIsDuplicating(false);
    }
  };

  // Export PDF
  const handleExportPdf = async () => {
    if (!id) return;
    try {
      const message = await exportQuotePdf(parseInt(id, 10));
      success('Başarılı', message);
    } catch (err) {
      showError('Hata', err instanceof Error ? err.message : 'PDF oluşturulamadı.');
    }
  };

  // Render info row
  const renderInfoRow = (
    label: string,
    value?: string | number | boolean,
    icon?: any
  ) => {
    if (value === undefined || value === null || value === '') return null;
    const Icon = icon;
    const displayValue = typeof value === 'boolean' ? (value ? 'Evet' : 'Hayır') : String(value);

    return (
      <View style={styles.infoRow}>
        <View style={styles.infoRowLeft}>
          {Icon && <Icon size={16} color={colors.textMuted} />}
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}:</Text>
        </View>
        <Text style={[styles.infoValue, { color: colors.text }]}>{displayValue}</Text>
      </View>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Teklif yükleniyor...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !quote) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <AlertCircle size={64} color={colors.danger} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Bir hata oluştu</Text>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {error || 'Teklif bulunamadı'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Brand.primary }]}
            onPress={() => {
              setIsLoading(true);
              fetchQuote();
            }}
          >
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Teklif Detayı</Text>
        <View style={styles.headerActions}>
          {quote.can_edit && (
            <TouchableOpacity style={styles.headerButton}>
              <Edit size={22} color={colors.icon} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.headerButton} onPress={handleDelete}>
            <Trash2 size={22} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Brand.primary}
          />
        }
      >
        {/* Header Card */}
        <Card style={styles.headerCard}>
          <View style={styles.headerCardTop}>
            <View style={[styles.quoteIcon, { backgroundColor: colors.surface }]}>
              <FileText size={32} color={Brand.primary} />
            </View>
            <View style={styles.headerCardInfo}>
              <Text style={[styles.quoteNumber, { color: colors.text }]}>
                {quote.quote_number}
              </Text>
              <Badge
                label={getQuoteStatusLabel(quote.status)}
                variant={getQuoteStatusVariant(quote.status)}
                size="sm"
              />
            </View>
          </View>

          {quote.customer && (
            <View style={styles.customerRow}>
              <User size={16} color={colors.textMuted} />
              <Text style={[styles.customerText, { color: colors.textSecondary }]}>
                {quote.customer.name}
              </Text>
            </View>
          )}
        </Card>

        {/* Pricing Card */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <DollarSign size={20} color={Brand.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Fiyatlandırma</Text>
          </View>

          <View style={styles.pricingRow}>
            <Text style={[styles.pricingLabel, { color: colors.textSecondary }]}>
              Ara Toplam:
            </Text>
            <Text style={[styles.pricingValue, { color: colors.text }]}>
              {formatAmount(quote.subtotal, quote.currency)}
            </Text>
          </View>

          {quote.discount_amount && quote.discount_amount > 0 && (
            <View style={styles.pricingRow}>
              <Text style={[styles.pricingLabel, { color: colors.textSecondary }]}>
                İndirim:
              </Text>
              <Text style={[styles.pricingValue, { color: colors.danger }]}>
                -{formatAmount(quote.discount_amount, quote.currency)}
              </Text>
            </View>
          )}

          <View style={styles.pricingRow}>
            <Text style={[styles.pricingLabel, { color: colors.textSecondary }]}>KDV:</Text>
            <Text style={[styles.pricingValue, { color: colors.text }]}>
              {formatAmount(quote.vat_amount, quote.currency)}
            </Text>
          </View>

          <View style={[styles.pricingRow, styles.grandTotalRow]}>
            <Text style={[styles.grandTotalLabel, { color: colors.text }]}>
              Genel Toplam:
            </Text>
            <Text style={[styles.grandTotalValue, { color: Brand.primary }]}>
              {formatAmount(quote.total_amount, quote.currency)}
            </Text>
          </View>

          {renderInfoRow('Para Birimi', quote.currency)}
          {renderInfoRow('Kur', quote.exchange_rate)}
          {quote.include_vat !== undefined &&
            renderInfoRow('KDV Dahil', quote.include_vat)}
          {quote.vat_rate !== undefined && renderInfoRow('KDV Oranı', `${quote.vat_rate}%`)}
        </Card>

        {/* Dates Card */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color={Brand.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Tarihler</Text>
          </View>

          {renderInfoRow('Teklif Tarihi', formatDate(quote.quote_date), Calendar)}
          {renderInfoRow('Geçerlilik Tarihi', formatDate(quote.valid_until), Calendar)}
          {renderInfoRow('Oluşturulma', formatDate(quote.created_at), Calendar)}
          {quote.sent_at && renderInfoRow('Gönderim', formatDate(quote.sent_at), Send)}
        </Card>

        {/* Load Items */}
        {quote.load_items && quote.load_items.length > 0 && (
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <Package size={20} color={Brand.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Yük Kalemleri</Text>
            </View>

            {quote.load_items.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.loadItem,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.loadItemTitle, { color: colors.text }]}>
                  {item.cargo_name}
                </Text>
                <View style={styles.loadItemRow}>
                  <Text style={[styles.loadItemLabel, { color: colors.textMuted }]}>
                    Navlun:
                  </Text>
                  <Text style={[styles.loadItemValue, { color: colors.text }]}>
                    {formatAmount(item.freight_price, quote.currency)}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* Notes */}
        {(quote.terms_conditions || quote.internal_notes || quote.customer_notes) && (
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Notlar</Text>

            {quote.terms_conditions && (
              <View style={styles.noteSection}>
                <Text style={[styles.noteLabel, { color: colors.textSecondary }]}>
                  Şartlar ve Koşullar:
                </Text>
                <Text style={[styles.noteText, { color: colors.text }]}>
                  {quote.terms_conditions}
                </Text>
              </View>
            )}

            {quote.internal_notes && (
              <View style={styles.noteSection}>
                <Text style={[styles.noteLabel, { color: colors.textSecondary }]}>
                  Dahili Notlar:
                </Text>
                <Text style={[styles.noteText, { color: colors.text }]}>
                  {quote.internal_notes}
                </Text>
              </View>
            )}

            {quote.customer_notes && (
              <View style={styles.noteSection}>
                <Text style={[styles.noteLabel, { color: colors.textSecondary }]}>
                  Müşteri Notları:
                </Text>
                <Text style={[styles.noteText, { color: colors.text }]}>
                  {quote.customer_notes}
                </Text>
              </View>
            )}
          </Card>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {quote.status === 'draft' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: Brand.primary }]}
              onPress={handleSend}
              disabled={isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Send size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Gönder</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
            ]}
            onPress={handleDuplicate}
            disabled={isDuplicating}
          >
            {isDuplicating ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <>
                <Copy size={20} color={colors.text} />
                <Text style={[styles.actionButtonTextSecondary, { color: colors.text }]}>
                  Kopyala
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
            ]}
            onPress={handleExportPdf}
          >
            <FileDown size={20} color={colors.text} />
            <Text style={[styles.actionButtonTextSecondary, { color: colors.text }]}>
              PDF İndir
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Teklifi Sil"
        message="Bu teklifi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmText="Sil"
        cancelText="İptal"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        variant="danger"
        loading={isDeleting}
      />
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
    flex: 1,
    marginLeft: Spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerButton: {
    padding: Spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  headerCard: {
    marginBottom: 0,
  },
  headerCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  quoteIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  headerCardInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  quoteNumber: {
    ...Typography.headingMD,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  customerText: {
    ...Typography.bodyMD,
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
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  pricingLabel: {
    ...Typography.bodyMD,
  },
  pricingValue: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
  },
  grandTotalLabel: {
    ...Typography.bodyLG,
    fontWeight: '700',
  },
  grandTotalValue: {
    ...Typography.bodyLG,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  infoRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  infoLabel: {
    ...Typography.bodyMD,
  },
  infoValue: {
    ...Typography.bodyMD,
    fontWeight: '500',
  },
  loadItem: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  loadItemTitle: {
    ...Typography.bodyMD,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  loadItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loadItemLabel: {
    ...Typography.bodySM,
  },
  loadItemValue: {
    ...Typography.bodySM,
    fontWeight: '500',
  },
  noteSection: {
    marginBottom: Spacing.md,
  },
  noteLabel: {
    ...Typography.bodySM,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  noteText: {
    ...Typography.bodySM,
    lineHeight: 20,
  },
  actionButtons: {
    gap: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  actionButtonText: {
    color: '#FFFFFF',
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  actionButtonTextSecondary: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...Typography.bodyMD,
    marginTop: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  errorTitle: {
    ...Typography.headingMD,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  errorText: {
    ...Typography.bodyMD,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Spacing.xl,
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
