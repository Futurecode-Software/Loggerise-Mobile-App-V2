import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  FileText,
  Edit,
  Trash2,
  Mail,
  Download,
  Calendar,
  User,
  Building,
  CreditCard,
  Package,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react-native';
import { FullScreenHeader } from '@/components/header';
import { Badge, ConfirmDialog } from '@/components/ui';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import { showToast } from '@/utils/toast';
import {
  getInvoice,
  deleteInvoice,
  getInvoicePdf,
  Invoice,
  InvoiceItem,
  getInvoiceTypeLabel,
  getInvoiceStatusLabel,
  getPaymentStatusLabel,
  formatInvoiceTotal,
} from '@/services/endpoints/invoices';
import { formatDate, formatCurrency } from '@/utils/formatters';
import { documentDirectory, writeAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { isAvailableAsync, shareAsync } from 'expo-sharing';

export default function InvoiceDetailScreen() {
  const colors = Colors.light;
  const params = useLocalSearchParams();
  const invoiceId = Number(params.id);

  // State
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // PDF download state
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Fetch invoice data
  useEffect(() => {
    fetchInvoice();
  }, [invoiceId]);

  const fetchInvoice = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getInvoice(invoiceId);
      setInvoice(data);
    } catch (err) {
      console.error('Invoice fetch error:', err);
      setError(err instanceof Error ? err.message : 'Fatura yüklenemedi');
      showToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Fatura yüklenemedi',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!invoice) return;

    try {
      setIsDeleting(true);
      await deleteInvoice(invoice.id);
      showToast({
        type: 'success',
        message: 'Fatura başarıyla silindi',
      });
      router.back();
    } catch (err) {
      console.error('Invoice delete error:', err);
      showToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Fatura silinemedi',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!invoice) return;

    try {
      setIsDownloadingPdf(true);
      const { pdfBase64, fileName } = await getInvoicePdf(invoice.id);

      // Save to file system
      const fileUri = `${documentDirectory}${fileName}`;
      await writeAsStringAsync(fileUri, pdfBase64, {
        encoding: EncodingType.Base64,
      });

      // Share the file
      if (await isAvailableAsync()) {
        await shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Fatura PDF',
          UTI: 'com.adobe.pdf',
        });
      } else {
        showToast({
          type: 'info',
          message: 'PDF başarıyla indirildi',
        });
      }
    } catch (err) {
      console.error('PDF download error:', err);
      showToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'PDF indirilemedi',
      });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleSendEmail = () => {
    if (!invoice) return;
    // Navigate to email sending screen (to be implemented)
    router.push(`/finance/invoices/${invoice.id}/send` as any);
  };

  const handleEdit = () => {
    if (!invoice) return;
    router.push(`/finance/invoices/${invoice.id}/edit` as any);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <FullScreenHeader title="Fatura Detayı" showBackButton />
        <View style={styles.content}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Brand.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Yükleniyor...</Text>
          </View>
        </View>
      </View>
    );
  }

  if (error || !invoice) {
    return (
      <View style={styles.container}>
        <FullScreenHeader title="Fatura Detayı" showBackButton />
        <View style={styles.content}>
          <View style={styles.errorContainer}>
          <AlertCircle size={48} color={colors.danger} />
          <Text style={[styles.errorText, { color: colors.text }]}>
            {error || 'Fatura bulunamadı'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Brand.primary }]}
            onPress={fetchInvoice}
          >
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FullScreenHeader
        title="Fatura Detayı"
        subtitle={invoice.invoice_no || `#${invoice.id}`}
        showBackButton
        rightIcons={
          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            <TouchableOpacity
              onPress={handleEdit}
              disabled={invoice.is_cancelled}
              style={{ opacity: invoice.is_cancelled ? 0.5 : 1 }}
            >
              <Edit size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSendEmail}>
              <Mail size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDownloadPdf} disabled={isDownloadingPdf}>
              {isDownloadingPdf ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Download size={22} color="#FFFFFF" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowDeleteDialog(true)}
              disabled={invoice.is_cancelled}
              style={{ opacity: invoice.is_cancelled ? 0.5 : 1 }}
            >
              <Trash2 size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        {/* Header Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <FileText size={32} color={Brand.primary} />
              <View style={styles.headerInfo}>
                <Text style={[styles.invoiceNo, { color: colors.text }]}>
                  {invoice.invoice_no || `Fatura #${invoice.id}`}
                </Text>
                <Text style={[styles.invoiceType, { color: colors.textSecondary }]}>
                  {getInvoiceTypeLabel(invoice.type)}
                </Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <Badge
                label={getInvoiceStatusLabel(invoice.status)}
                variant={invoice.status === 'approved' ? 'success' : invoice.status === 'cancelled' ? 'danger' : 'default'}
              />
              <Badge
                label={getPaymentStatusLabel(invoice.payment_status)}
                variant={invoice.payment_status === 'paid' ? 'success' : invoice.payment_status === 'overdue' ? 'danger' : invoice.payment_status === 'partial' ? 'info' : 'warning'}
              />
            </View>
          </View>

          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Toplam Tutar</Text>
            <Text style={[styles.totalAmount, { color: Brand.primary }]}>
              {formatInvoiceTotal(invoice)}
            </Text>
          </View>
        </View>

        {/* Customer & Dates */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Genel Bilgiler</Text>

          <View style={styles.infoRow}>
            <User size={20} color={colors.textMuted} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Cari</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {invoice.contact?.name}
              </Text>
              {invoice.contact?.code && (
                <Text style={[styles.infoSubValue, { color: colors.textSecondary }]}>
                  Kod: {invoice.contact.code}
                </Text>
              )}
            </View>
          </View>

          {invoice.contact_address && (
            <View style={styles.infoRow}>
              <Building size={20} color={colors.textMuted} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Adres</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {invoice.contact_address.title}
                </Text>
                {invoice.contact_address.address && (
                  <Text style={[styles.infoSubValue, { color: colors.textSecondary }]}>
                    {invoice.contact_address.address}
                  </Text>
                )}
              </View>
            </View>
          )}

          <View style={styles.infoRow}>
            <Calendar size={20} color={colors.textMuted} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Tarihler</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                Fatura: {formatDate(invoice.invoice_date)}
              </Text>
              {invoice.due_date && (
                <Text style={[styles.infoSubValue, { color: colors.textSecondary }]}>
                  Vade: {formatDate(invoice.due_date)}
                </Text>
              )}
              {invoice.delivery_date && (
                <Text style={[styles.infoSubValue, { color: colors.textSecondary }]}>
                  Teslim: {formatDate(invoice.delivery_date)}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.infoRow}>
            <CreditCard size={20} color={colors.textMuted} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Ödeme</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {invoice.payment_method || 'Belirtilmemiş'}
              </Text>
            </View>
          </View>

          {invoice.warehouse && (
            <View style={styles.infoRow}>
              <Package size={20} color={colors.textMuted} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Depo</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {invoice.warehouse.name}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Invoice Items */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Fatura Kalemleri</Text>

          {invoice.items && invoice.items.length > 0 ? (
            invoice.items.map((item, index) => (
              <View
                key={item.id || index}
                style={[
                  styles.itemRow,
                  {
                    backgroundColor: index % 2 === 0 ? colors.background : 'transparent',
                    borderBottomWidth: index < invoice.items!.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <View style={styles.itemHeader}>
                  <Text style={[styles.itemName, { color: colors.text }]}>
                    {item.product?.name || item.description || 'Ürün/Hizmet'}
                  </Text>
                  {item.product?.code && (
                    <Text style={[styles.itemCode, { color: colors.textMuted }]}>
                      {item.product.code}
                    </Text>
                  )}
                </View>

                <View style={styles.itemDetails}>
                  <View style={styles.itemDetailRow}>
                    <Text style={[styles.itemDetailLabel, { color: colors.textMuted }]}>
                      Miktar:
                    </Text>
                    <Text style={[styles.itemDetailValue, { color: colors.text }]}>
                      {item.quantity} {item.unit}
                    </Text>
                  </View>
                  <View style={styles.itemDetailRow}>
                    <Text style={[styles.itemDetailLabel, { color: colors.textMuted }]}>
                      Birim Fiyat:
                    </Text>
                    <Text style={[styles.itemDetailValue, { color: colors.text }]}>
                      {formatCurrency(item.unit_price, invoice.currency_type)}
                    </Text>
                  </View>
                  <View style={styles.itemDetailRow}>
                    <Text style={[styles.itemDetailLabel, { color: colors.textMuted }]}>
                      KDV (%{item.vat_rate}):
                    </Text>
                    <Text style={[styles.itemDetailValue, { color: colors.text }]}>
                      {formatCurrency(item.vat_amount, invoice.currency_type)}
                    </Text>
                  </View>
                  <View style={styles.itemDetailRow}>
                    <Text
                      style={[
                        styles.itemDetailLabel,
                        { color: colors.text, fontWeight: Typography.fontWeights.semibold },
                      ]}
                    >
                      Toplam:
                    </Text>
                    <Text
                      style={[
                        styles.itemDetailValue,
                        { color: Brand.primary, fontWeight: Typography.fontWeights.semibold },
                      ]}
                    >
                      {formatCurrency(item.total, invoice.currency_type)}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Fatura kalemi bulunmuyor
            </Text>
          )}
        </View>

        {/* Totals */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Tutar Özeti</Text>

          <View style={styles.totalRow}>
            <Text style={[styles.totalRowLabel, { color: colors.textMuted }]}>Ara Toplam</Text>
            <Text style={[styles.totalRowValue, { color: colors.text }]}>
              {formatCurrency(invoice.sub_total, invoice.currency_type)}
            </Text>
          </View>

          {invoice.discount_amount && invoice.discount_amount > 0 && (
            <View style={styles.totalRow}>
              <Text style={[styles.totalRowLabel, { color: colors.textMuted }]}>
                İndirim {invoice.discount_rate ? `(%${invoice.discount_rate})` : ''}
              </Text>
              <Text style={[styles.totalRowValue, { color: colors.danger }]}>
                -{formatCurrency(invoice.discount_amount, invoice.currency_type)}
              </Text>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={[styles.totalRowLabel, { color: colors.textMuted }]}>KDV</Text>
            <Text style={[styles.totalRowValue, { color: colors.text }]}>
              {formatCurrency(invoice.vat_amount, invoice.currency_type)}
            </Text>
          </View>

          {invoice.has_withholding && invoice.withholding_amount && (
            <View style={styles.totalRow}>
              <Text style={[styles.totalRowLabel, { color: colors.textMuted }]}>Tevkifat</Text>
              <Text style={[styles.totalRowValue, { color: colors.warning }]}>
                -{formatCurrency(invoice.withholding_amount, invoice.currency_type)}
              </Text>
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.totalRow}>
            <Text
              style={[
                styles.totalRowLabel,
                { color: colors.text, fontWeight: Typography.fontWeights.bold, fontSize: Typography.sizes.lg },
              ]}
            >
              Genel Toplam
            </Text>
            <Text
              style={[
                styles.totalRowValue,
                { color: Brand.primary, fontWeight: Typography.fontWeights.bold, fontSize: Typography.sizes.xl },
              ]}
            >
              {formatInvoiceTotal(invoice)}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Notlar</Text>
            <Text style={[styles.notesText, { color: colors.textSecondary }]}>
              {invoice.notes}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={showDeleteDialog}
        title="Fatura Sil"
        message={`${invoice.invoice_no || `#${invoice.id}`} numaralı faturayı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
        isLoading={isDeleting}
        isDangerous={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.primary,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    ...Shadows.lg,
  },
  contentContainer: {
    padding: Spacing.md,
    paddingBottom: Spacing['3xl'],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
    paddingBottom: 100,
  },
  loadingText: {
    fontSize: Typography.sizes.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
    paddingBottom: 100,
  },
  errorText: {
    fontSize: Typography.sizes.md,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.md,
    fontWeight: Typography.fontWeights.semibold,
  },
  card: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  headerInfo: {
    flex: 1,
  },
  invoiceNo: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.fontWeights.bold,
  },
  invoiceType: {
    fontSize: Typography.sizes.sm,
    marginTop: 2,
  },
  headerRight: {
    gap: Spacing.xs,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  totalLabel: {
    fontSize: Typography.sizes.md,
  },
  totalAmount: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.fontWeights.bold,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.fontWeights.semibold,
    marginBottom: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: Typography.sizes.xs,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.fontWeights.medium,
  },
  infoSubValue: {
    fontSize: Typography.sizes.sm,
    marginTop: 2,
  },
  itemRow: {
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  itemHeader: {
    marginBottom: Spacing.xs,
  },
  itemName: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.fontWeights.medium,
  },
  itemCode: {
    fontSize: Typography.sizes.xs,
    marginTop: 2,
  },
  itemDetails: {
    gap: 4,
  },
  itemDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemDetailLabel: {
    fontSize: Typography.sizes.sm,
  },
  itemDetailValue: {
    fontSize: Typography.sizes.sm,
  },
  emptyText: {
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
  totalRowLabel: {
    fontSize: Typography.sizes.md,
  },
  totalRowValue: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.fontWeights.medium,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.sm,
  },
  notesText: {
    fontSize: Typography.sizes.sm,
    lineHeight: 20,
  },
});
