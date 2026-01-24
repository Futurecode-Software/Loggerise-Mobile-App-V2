import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft,
  Edit,
  Send,
  Copy,
  FileText,
  Trash2,
  MoreVertical,
  User,
  Mail,
  Phone,
  Calendar,
  Package,
  DollarSign,
  AlertCircle,
} from 'lucide-react-native';
import { Card, Badge } from '@/components/ui';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import {
  getQuote,
  deleteQuote,
  sendQuote,
  duplicateQuote,
  exportQuotePdf,
  getQuoteStatusLabel,
  getQuoteStatusVariant,
  formatAmount,
  formatDate,
} from '@/services/endpoints/quotes';
import type { Quote } from '@/services/endpoints/quotes';

export default function QuoteDetailScreen() {
  const colors = Colors.light;
  const { id } = useLocalSearchParams<{ id: string }>();
  const quoteId = parseInt(id, 10);

  const [isLoading, setIsLoading] = useState(true);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  useEffect(() => {
    fetchQuote();
  }, [quoteId]);

  const fetchQuote = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getQuote(quoteId);
      setQuote(data);
    } catch (err) {
      console.error('Fetch quote error:', err);
      setError(err instanceof Error ? err.message : 'Teklif bilgileri yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!quote) return;

    Alert.alert(
      'Teklifi Gönder',
      'Bu teklifi müşteriye e-posta ile göndermek istiyor musunuz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Gönder',
          onPress: async () => {
            try {
              await sendQuote(quoteId);
              Alert.alert('Başarılı', 'Teklif müşteriye gönderildi');
              fetchQuote(); // Refresh to get updated status
            } catch (err) {
              Alert.alert('Hata', err instanceof Error ? err.message : 'Teklif gönderilemedi');
            }
          },
        },
      ]
    );
  };

  const handleDuplicate = async () => {
    if (!quote) return;

    Alert.alert('Teklifi Kopyala', 'Bu teklifin bir kopyasını oluşturmak istiyor musunuz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Kopyala',
        onPress: async () => {
          try {
            const newQuote = await duplicateQuote(quoteId);
            Alert.alert('Başarılı', 'Teklif kopyalandı', [
              {
                text: 'Tamam',
                onPress: () => router.push(`/quotes/${newQuote.id}` as any),
              },
            ]);
          } catch (err) {
            Alert.alert('Hata', err instanceof Error ? err.message : 'Teklif kopyalanamadı');
          }
        },
      },
    ]);
  };

  const handleExportPdf = async () => {
    if (!quote) return;

    try {
      const message = await exportQuotePdf(quoteId);
      Alert.alert('PDF Oluşturuldu', message, [
        {
          text: 'Tamam',
        },
      ]);
      // Note: In a real implementation, the backend would return a download URL
      // and we could use Share API or open the URL
    } catch (err) {
      Alert.alert('Hata', err instanceof Error ? err.message : 'PDF oluşturulamadı');
    }
  };

  const handleDelete = async () => {
    if (!quote) return;

    Alert.alert('Teklifi Sil', 'Bu teklifi silmek istediğinizden emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteQuote(quoteId);
            Alert.alert('Başarılı', 'Teklif silindi');
            router.back();
          } catch (err) {
            Alert.alert('Hata', err instanceof Error ? err.message : 'Teklif silinemedi');
          }
        },
      },
    ]);
  };

  const handleConvert = () => {
    router.push(`/quotes/${quoteId}/convert` as any);
  };

  const handleEdit = () => {
    router.push(`/quotes/${quoteId}/edit` as any);
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Teklif Detayı</Text>
        </View>
        <View style={styles.loadingState}>
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
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Teklif Detayı</Text>
        </View>
        <View style={styles.errorState}>
          <View style={[styles.errorIcon, { backgroundColor: colors.danger + '15' }]}>
            <AlertCircle size={64} color={colors.danger} />
          </View>
          <Text style={[styles.errorTitle, { color: colors.text }]}>Bir hata oluştu</Text>
          <Text style={[styles.errorSubtitle, { color: colors.textSecondary }]}>
            {error || 'Teklif bulunamadı'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Brand.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Geri Dön</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {quote.quote_number}
        </Text>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setShowActionsMenu(!showActionsMenu)}
        >
          <MoreVertical size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Actions Menu */}
      {showActionsMenu && (
        <View style={[styles.actionsMenu, { backgroundColor: colors.surface }]}>
          <TouchableOpacity style={styles.actionMenuItem} onPress={handleEdit}>
            <Edit size={20} color={colors.text} />
            <Text style={[styles.actionMenuText, { color: colors.text }]}>Düzenle</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionMenuItem} onPress={handleSend}>
            <Send size={20} color={colors.text} />
            <Text style={[styles.actionMenuText, { color: colors.text }]}>Gönder</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionMenuItem} onPress={handleConvert}>
            <Package size={20} color={colors.text} />
            <Text style={[styles.actionMenuText, { color: colors.text }]}>Yüklemeye Dönüştür</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionMenuItem} onPress={handleDuplicate}>
            <Copy size={20} color={colors.text} />
            <Text style={[styles.actionMenuText, { color: colors.text }]}>Kopyala</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionMenuItem} onPress={handleExportPdf}>
            <FileText size={20} color={colors.text} />
            <Text style={[styles.actionMenuText, { color: colors.text }]}>PDF İndir</Text>
          </TouchableOpacity>
          <View style={[styles.actionMenuDivider, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={styles.actionMenuItem} onPress={handleDelete}>
            <Trash2 size={20} color={colors.danger} />
            <Text style={[styles.actionMenuText, { color: colors.danger }]}>Sil</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Quote Header */}
        <Card style={styles.section}>
          <View style={styles.quoteHeader}>
            <View style={styles.quoteHeaderLeft}>
              <Text style={[styles.quoteNumber, { color: colors.text }]}>
                {quote.quote_number}
              </Text>
              <Badge
                label={getQuoteStatusLabel(quote.status)}
                variant={getQuoteStatusVariant(quote.status)}
                size="md"
              />
            </View>
            <View style={styles.quoteHeaderRight}>
              <View style={styles.infoRow}>
                <Calendar size={14} color={colors.textMuted} />
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  Oluşturulma: {formatDate(quote.created_at)}
                </Text>
              </View>
              {quote.valid_until && (
                <View style={styles.infoRow}>
                  <Calendar size={14} color={colors.textMuted} />
                  <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                    Geçerlilik: {formatDate(quote.valid_until)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Card>

        {/* Customer Info */}
        {quote.customer && (
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Müşteri Bilgileri</Text>
            <View style={styles.customerInfo}>
              <View style={[styles.customerAvatar, { backgroundColor: Brand.primary + '15' }]}>
                <User size={24} color={Brand.primary} />
              </View>
              <View style={styles.customerDetails}>
                <Text style={[styles.customerName, { color: colors.text }]}>
                  {quote.customer.name}
                </Text>
                {quote.customer.code && (
                  <Text style={[styles.customerCode, { color: colors.textSecondary }]}>
                    {quote.customer.code}
                  </Text>
                )}
              </View>
            </View>
          </Card>
        )}

        {/* Prepared By */}
        {quote.preparedBy && (
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Hazırlayan</Text>
            <View style={styles.userInfo}>
              <User size={18} color={colors.textMuted} />
              <View style={styles.userDetails}>
                <Text style={[styles.userName, { color: colors.text }]}>
                  {quote.preparedBy.name}
                </Text>
                <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                  {quote.preparedBy.email}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Pricing Summary */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Fiyat Özeti</Text>

          <View style={styles.pricingRow}>
            <Text style={[styles.pricingLabel, { color: colors.textSecondary }]}>Ara Toplam</Text>
            <Text style={[styles.pricingValue, { color: colors.text }]}>
              {formatAmount(quote.subtotal, quote.currency_type)}
            </Text>
          </View>

          <View style={styles.pricingRow}>
            <Text style={[styles.pricingLabel, { color: colors.textSecondary }]}>KDV</Text>
            <Text style={[styles.pricingValue, { color: colors.text }]}>
              {formatAmount(quote.vat_total, quote.currency_type)}
            </Text>
          </View>

          <View style={styles.pricingRow}>
            <Text style={[styles.pricingLabel, { color: colors.textSecondary }]}>İndirim</Text>
            <Text style={[styles.pricingValue, { color: colors.danger }]}>
              -{formatAmount(quote.discount_total, quote.currency_type)}
            </Text>
          </View>

          <View style={[styles.pricingDivider, { backgroundColor: colors.border }]} />

          <View style={styles.pricingRow}>
            <Text style={[styles.pricingLabelTotal, { color: colors.text }]}>Genel Toplam</Text>
            <Text style={[styles.pricingValueTotal, { color: Brand.primary }]}>
              {formatAmount(quote.grand_total, quote.currency_type)}
            </Text>
          </View>
        </Card>

        {/* Notes */}
        {quote.notes && (
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Notlar</Text>
            <Text style={[styles.notesText, { color: colors.textSecondary }]}>{quote.notes}</Text>
          </Card>
        )}

        {/* Terms and Conditions */}
        {quote.terms_and_conditions && (
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Şartlar ve Koşullar</Text>
            <Text style={[styles.notesText, { color: colors.textSecondary }]}>
              {quote.terms_and_conditions}
            </Text>
          </Card>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: Brand.primary }]}
            onPress={handleEdit}
          >
            <Edit size={20} color="#FFFFFF" />
            <Text style={styles.quickActionText}>Düzenle</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: colors.success }]}
            onPress={handleSend}
          >
            <Send size={20} color="#FFFFFF" />
            <Text style={styles.quickActionText}>Gönder</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  menuButton: {
    padding: Spacing.sm,
  },
  actionsMenu: {
    position: 'absolute',
    top: 60,
    right: Spacing.lg,
    borderRadius: BorderRadius.md,
    ...Shadows.lg,
    zIndex: 1000,
    minWidth: 220,
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  actionMenuText: {
    ...Typography.bodyMD,
    fontWeight: '500',
  },
  actionMenuDivider: {
    height: 1,
    marginVertical: Spacing.xs,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing['4xl'],
  },
  section: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.headingMD,
    marginBottom: Spacing.md,
  },
  quoteHeader: {
    gap: Spacing.md,
  },
  quoteHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quoteNumber: {
    ...Typography.headingXL,
    fontWeight: '700',
  },
  quoteHeaderRight: {
    gap: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  infoText: {
    ...Typography.bodySM,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    ...Typography.bodyLG,
    fontWeight: '600',
    marginBottom: 2,
  },
  customerCode: {
    ...Typography.bodySM,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    ...Typography.bodyMD,
    fontWeight: '600',
    marginBottom: 2,
  },
  userEmail: {
    ...Typography.bodySM,
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
    fontWeight: '500',
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
  notesText: {
    ...Typography.bodyMD,
    lineHeight: 20,
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  quickActionText: {
    color: '#FFFFFF',
    ...Typography.bodyMD,
    fontWeight: '600',
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
  errorIcon: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  errorTitle: {
    ...Typography.headingMD,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  errorSubtitle: {
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
