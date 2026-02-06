/**
 * Fatura Detay Sayfası
 *
 * CLAUDE.md tasarım ilkelerine uygun modern detay sayfası
 * Referans: app/cash-register/[id].tsx
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import * as Haptics from 'expo-haptics'
import Toast from 'react-native-toast-message'
import ConfirmDialog from '@/components/modals/ConfirmDialog'
import { Skeleton } from '@/components/ui/skeleton'
import { SectionHeader, InfoRow } from '@/components/detail'
import { getCurrencyLabel } from '@/constants/currencies'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius,
  DashboardShadows
} from '@/constants/dashboard-theme'
import {
  getInvoice,
  deleteInvoice,
  getInvoicePdf,
  Invoice,
  getInvoiceTypeLabel,
  getInvoiceStatusLabel,
  getPaymentStatusLabel,
  formatInvoiceTotal
} from '@/services/endpoints/invoices'
import { formatDate, formatCurrency } from '@/utils/formatters'
import { documentDirectory, writeAsStringAsync, EncodingType } from 'expo-file-system/legacy'
import { isAvailableAsync, shareAsync } from 'expo-sharing'

// Tip renkleri
const TYPE_COLORS: Record<string, { primary: string; bg: string }> = {
  sale: { primary: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
  purchase: { primary: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' },
  service: { primary: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)' }
}

// Ödeme durumu renkleri
const PAYMENT_COLORS: Record<string, { primary: string; bg: string }> = {
  pending: { primary: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
  paid: { primary: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
  partial: { primary: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' },
  overdue: { primary: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' }
}

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const invoiceId = id ? parseInt(id, 10) : null

  // State
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [showItems, setShowItems] = useState(true)

  // Refs
  const isMountedRef = useRef(true)
  const deleteDialogRef = useRef<BottomSheetModal>(null)

  // Veri çekme
  const fetchInvoice = useCallback(async (showLoading = true) => {
    if (!invoiceId) {
      setError('Geçersiz fatura ID')
      setIsLoading(false)
      return
    }

    try {
      if (showLoading) {
        setIsLoading(true)
        setError(null)
      }

      const data = await getInvoice(invoiceId)

      if (isMountedRef.current) {
        setInvoice(data)
        setError(null)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Fatura bilgileri yüklenemedi')
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
        setRefreshing(false)
      }
    }
  }, [invoiceId])

  useEffect(() => {
    isMountedRef.current = true
    fetchInvoice()

    return () => {
      isMountedRef.current = false
    }
  }, [fetchInvoice])

  // Edit sayfasından dönüşte yenile
  useFocusEffect(
    useCallback(() => {
      fetchInvoice(false)
    }, [fetchInvoice])
  )

  // Yenileme
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchInvoice(false)
  }, [fetchInvoice])

  // Düzenleme
  const handleEdit = () => {
    if (!invoiceId || invoice?.is_cancelled) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/accounting/invoices/${invoiceId}/edit`)
  }

  // PDF indirme
  const handleDownloadPdf = async () => {
    if (!invoice) return

    try {
      setIsDownloadingPdf(true)
      const { pdfBase64, fileName } = await getInvoicePdf(invoice.id)

      const fileUri = `${documentDirectory}${fileName}`
      await writeAsStringAsync(fileUri, pdfBase64, {
        encoding: EncodingType.Base64
      })

      if (await isAvailableAsync()) {
        await shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Fatura PDF',
          UTI: 'com.adobe.pdf'
        })
      } else {
        Toast.show({
          type: 'success',
          text1: 'PDF başarıyla indirildi',
          position: 'top',
          visibilityTime: 1500
        })
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: err instanceof Error ? err.message : 'PDF indirilemedi',
        position: 'top',
        visibilityTime: 1500
      })
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  // Silme dialogunu aç
  const handleDelete = () => {
    if (invoice?.is_cancelled) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    deleteDialogRef.current?.present()
  }

  // Silme işlemini gerçekleştir
  const confirmDelete = async () => {
    if (!invoiceId) return

    setIsDeleting(true)
    try {
      await deleteInvoice(invoiceId)
      deleteDialogRef.current?.dismiss()
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Toast.show({
        type: 'success',
        text1: 'Fatura başarıyla silindi',
        position: 'top',
        visibilityTime: 1500
      })

      setTimeout(() => {
        router.back()
      }, 300)
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Toast.show({
        type: 'error',
        text1: err instanceof Error ? err.message : 'Fatura silinemedi',
        position: 'top',
        visibilityTime: 1500
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Geri
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.back()
  }

  const typeColors = invoice ? (TYPE_COLORS[invoice.type] || TYPE_COLORS.sale) : TYPE_COLORS.sale
  const paymentColors = invoice ? (PAYMENT_COLORS[invoice.payment_status] || PAYMENT_COLORS.pending) : PAYMENT_COLORS.pending

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={['#022920', '#044134', '#065f4a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.glowOrb1} />
        <View style={styles.glowOrb2} />

        <View style={[styles.headerContent, { paddingTop: insets.top + 16 }]}>
          {/* Üst Bar */}
          <View style={styles.headerBar}>
            <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>

            {/* Başlık - Orta */}
            {isLoading ? (
              <View style={styles.headerTitleSection}>
                <Skeleton width={140} height={22} />
              </View>
            ) : invoice ? (
              <View style={styles.headerTitleSection}>
                <Text style={styles.headerName} numberOfLines={1}>
                  {invoice.invoice_no || `#${invoice.id}`}
                </Text>
              </View>
            ) : (
              <View style={styles.headerTitleSection} />
            )}

            {/* Aksiyonlar - Sağ */}
            {!isLoading && invoice ? (
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                >
                  {isDownloadingPdf ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="download-outline" size={22} color="#fff" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.headerButton, invoice.is_cancelled && styles.headerButtonDisabled]}
                  onPress={handleEdit}
                  disabled={invoice.is_cancelled}
                >
                  <Ionicons name="create-outline" size={22} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.headerButton, styles.deleteButton, invoice.is_cancelled && styles.headerButtonDisabled]}
                  onPress={handleDelete}
                  disabled={isDeleting || invoice.is_cancelled}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="trash-outline" size={22} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.headerActionsPlaceholder} />
            )}
          </View>

          {/* Tutar Özeti + Status */}
          {isLoading ? (
            <View style={styles.amountRow}>
              <View style={styles.amountSummary}>
                <Skeleton width={100} height={14} style={{ marginBottom: DashboardSpacing.xs }} />
                <Skeleton width={160} height={32} />
              </View>
              <Skeleton width={70} height={32} borderRadius={16} />
            </View>
          ) : invoice ? (
            <View style={styles.amountRow}>
              <View style={styles.amountSummary}>
                <Text style={styles.amountLabel}>Toplam Tutar</Text>
                <Text style={styles.amountValue}>
                  {formatInvoiceTotal(invoice)}
                </Text>
              </View>
              <View style={styles.statusBadges}>
                <View style={[styles.statusBadge, { backgroundColor: paymentColors.bg }]}>
                  <Text style={[styles.statusBadgeText, { color: paymentColors.primary }]}>
                    {getPaymentStatusLabel(invoice.payment_status)}
                  </Text>
                </View>
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.bottomCurve} />
      </View>

      {/* İçerik */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={DashboardColors.primary}
          />
        }
      >
        {/* Loading */}
        {isLoading && (
          <View style={styles.skeletonContainer}>
            {[1, 2, 3].map(i => (
              <View key={i} style={styles.card}>
                <View style={styles.sectionHeader}>
                  <Skeleton width={140} height={20} />
                </View>
                <View style={styles.cardContent}>
                  <Skeleton width="100%" height={16} style={{ marginBottom: 8 }} />
                  <Skeleton width="80%" height={16} style={{ marginBottom: 8 }} />
                  <Skeleton width="60%" height={16} />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Hata */}
        {!isLoading && (error || !invoice) && (
          <View style={styles.errorState}>
            <View style={styles.errorIcon}>
              <Ionicons name="alert-circle" size={48} color={DashboardColors.danger} />
            </View>
            <Text style={styles.errorTitle}>Bir hata oluştu</Text>
            <Text style={styles.errorText}>{error || 'Fatura bulunamadı'}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchInvoice()}>
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Normal içerik */}
        {!isLoading && invoice && (
          <>
            {/* Fatura Bilgileri */}
            <View style={styles.card}>
              <SectionHeader title="Fatura Bilgileri" icon="document-text-outline" />
              <View style={styles.cardContent}>
                <InfoRow
                  label="Fatura No"
                  value={invoice.invoice_no || `#${invoice.id}`}
                  icon="barcode-outline"
                  highlight
                />
                <InfoRow
                  label="Fatura Tipi"
                  value={getInvoiceTypeLabel(invoice.type)}
                  icon="pricetag-outline"
                  valueColor={typeColors.primary}
                />
                <InfoRow
                  label="Durum"
                  value={getInvoiceStatusLabel(invoice.status)}
                  icon={invoice.status === 'approved' ? 'checkmark-circle-outline' : 'time-outline'}
                />
                <InfoRow
                  label="Ödeme Durumu"
                  value={getPaymentStatusLabel(invoice.payment_status)}
                  icon="wallet-outline"
                  valueColor={paymentColors.primary}
                />
              </View>
            </View>

            {/* Cari Bilgileri */}
            <View style={styles.card}>
              <SectionHeader title="Cari Bilgileri" icon="person-outline" />
              <View style={styles.cardContent}>
                <InfoRow
                  label="Cari"
                  value={invoice.contact?.name || '-'}
                  icon="business-outline"
                  highlight
                />
                {invoice.contact?.code && (
                  <InfoRow
                    label="Cari Kodu"
                    value={invoice.contact.code}
                    icon="barcode-outline"
                  />
                )}
                {invoice.contact_address && (
                  <>
                    <InfoRow
                      label="Adres"
                      value={invoice.contact_address.title}
                      icon="location-outline"
                    />
                    {invoice.contact_address.address && (
                      <View style={styles.addressContainer}>
                        <Text style={styles.addressText}>
                          {invoice.contact_address.address}
                        </Text>
                      </View>
                    )}
                  </>
                )}
              </View>
            </View>

            {/* Tarih ve Para Birimi */}
            <View style={styles.card}>
              <SectionHeader title="Tarih ve Para Birimi" icon="calendar-outline" />
              <View style={styles.cardContent}>
                <InfoRow
                  label="Fatura Tarihi"
                  value={formatDate(invoice.invoice_date)}
                  icon="calendar-outline"
                />
                {invoice.due_date && (
                  <InfoRow
                    label="Vade Tarihi"
                    value={formatDate(invoice.due_date)}
                    icon="time-outline"
                  />
                )}
                {invoice.delivery_date && (
                  <InfoRow
                    label="Teslim Tarihi"
                    value={formatDate(invoice.delivery_date)}
                    icon="car-outline"
                  />
                )}
                <InfoRow
                  label="Para Birimi"
                  value={getCurrencyLabel(invoice.currency_type)}
                  icon="cash-outline"
                />
                {invoice.currency_rate && invoice.currency_rate !== 1 && (
                  <InfoRow
                    label="Kur"
                    value={String(invoice.currency_rate)}
                    icon="swap-horizontal-outline"
                  />
                )}
                {invoice.warehouse && (
                  <InfoRow
                    label="Depo"
                    value={invoice.warehouse.name}
                    icon="cube-outline"
                  />
                )}
              </View>
            </View>

            {/* Fatura Kalemleri */}
            <View style={styles.card}>
              <SectionHeader
                title="Fatura Kalemleri"
                icon="list-outline"
                count={invoice.items?.length}
                isExpanded={showItems}
                onToggle={() => setShowItems(!showItems)}
              />
              {showItems && (
                <View style={styles.cardContent}>
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((item, index) => (
                      <View
                        key={item.id || index}
                        style={[
                          styles.itemCard,
                          index < invoice.items!.length - 1 && styles.itemCardBorder
                        ]}
                      >
                        <View style={styles.itemHeader}>
                          <View style={styles.itemIconContainer}>
                            <Ionicons name="cube-outline" size={18} color={DashboardColors.primary} />
                          </View>
                          <View style={styles.itemInfo}>
                            <Text style={styles.itemName}>
                              {item.product?.name || item.description || 'Ürün/Hizmet'}
                            </Text>
                            {item.product?.code && (
                              <Text style={styles.itemCode}>{item.product.code}</Text>
                            )}
                          </View>
                        </View>

                        <View style={styles.itemDetails}>
                          <View style={styles.itemDetailRow}>
                            <Text style={styles.itemDetailLabel}>Miktar</Text>
                            <Text style={styles.itemDetailValue}>
                              {item.quantity} {item.unit}
                            </Text>
                          </View>
                          <View style={styles.itemDetailRow}>
                            <Text style={styles.itemDetailLabel}>Birim Fiyat</Text>
                            <Text style={styles.itemDetailValue}>
                              {formatCurrency(item.unit_price, invoice.currency_type)}
                            </Text>
                          </View>
                          <View style={styles.itemDetailRow}>
                            <Text style={styles.itemDetailLabel}>KDV (%{item.vat_rate})</Text>
                            <Text style={styles.itemDetailValue}>
                              {formatCurrency(item.vat_amount, invoice.currency_type)}
                            </Text>
                          </View>
                          <View style={styles.itemDetailRow}>
                            <Text style={[styles.itemDetailLabel, styles.itemTotalLabel]}>Toplam</Text>
                            <Text style={[styles.itemDetailValue, styles.itemTotalValue]}>
                              {formatCurrency(item.total, invoice.currency_type)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyText}>Fatura kalemi bulunmuyor</Text>
                  )}
                </View>
              )}
            </View>

            {/* Tutar Özeti */}
            <View style={[styles.card, styles.summaryCard]}>
              <SectionHeader title="Tutar Özeti" icon="calculator-outline" />
              <View style={styles.cardContent}>
                <InfoRow
                  label="Ara Toplam"
                  value={formatCurrency(invoice.sub_total, invoice.currency_type)}
                  icon="remove-outline"
                />
                {invoice.discount_amount && invoice.discount_amount > 0 && (
                  <InfoRow
                    label={`İndirim ${invoice.discount_rate ? `(%${invoice.discount_rate})` : ''}`}
                    value={`-${formatCurrency(invoice.discount_amount, invoice.currency_type)}`}
                    icon="pricetag-outline"
                    valueColor={DashboardColors.danger}
                  />
                )}
                <InfoRow
                  label="KDV"
                  value={formatCurrency(invoice.vat_amount, invoice.currency_type)}
                  icon="add-outline"
                />
                {invoice.has_withholding && invoice.withholding_amount && (
                  <InfoRow
                    label="Tevkifat"
                    value={`-${formatCurrency(invoice.withholding_amount, invoice.currency_type)}`}
                    icon="remove-circle-outline"
                    valueColor={DashboardColors.warning}
                  />
                )}
                <View style={styles.totalDivider} />
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Genel Toplam</Text>
                  <Text style={styles.totalValue}>
                    {formatInvoiceTotal(invoice)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Notlar */}
            {invoice.notes && (
              <View style={styles.card}>
                <SectionHeader title="Notlar" icon="document-text-outline" />
                <View style={styles.cardContent}>
                  <Text style={styles.notesText}>{invoice.notes}</Text>
                </View>
              </View>
            )}

            {/* Sistem Bilgileri */}
            <View style={styles.card}>
              <SectionHeader title="Sistem Bilgileri" icon="time-outline" />
              <View style={styles.cardContent}>
                <InfoRow
                  label="Oluşturulma"
                  value={formatDate(invoice.created_at)}
                  icon="add-circle-outline"
                />
                <InfoRow
                  label="Son Güncelleme"
                  value={formatDate(invoice.updated_at)}
                  icon="refresh-outline"
                />
              </View>
            </View>

            {/* Alt boşluk */}
            <View style={{ height: insets.bottom + DashboardSpacing['3xl'] }} />
          </>
        )}
      </ScrollView>

      {/* Silme Onay Dialogu */}
      <ConfirmDialog
        ref={deleteDialogRef}
        title="Faturayı Sil"
        message={`${invoice?.invoice_no || `#${invoice?.id}`} numaralı faturayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        type="danger"
        confirmText="Sil"
        cancelText="İptal"
        onConfirm={confirmDelete}
        isLoading={isDeleting}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DashboardColors.primary
  },

  // Header
  headerContainer: {
    position: 'relative',
    overflow: 'hidden',
    paddingBottom: 24
  },
  glowOrb1: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(16, 185, 129, 0.12)'
  },
  glowOrb2: {
    position: 'absolute',
    bottom: 30,
    left: -50,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.04)'
  },
  headerContent: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingBottom: DashboardSpacing.lg
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DashboardSpacing.md
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerButtonDisabled: {
    opacity: 0.5
  },
  headerTitleSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    marginHorizontal: DashboardSpacing.md
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm
  },
  headerActionsPlaceholder: {
    width: 144
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)'
  },
  headerName: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
    flex: 1
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: DashboardSpacing.md
  },
  amountSummary: {
    flex: 1
  },
  statusBadges: {
    flexDirection: 'row',
    gap: DashboardSpacing.xs
  },
  statusBadge: {
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.full
  },
  statusBadgeText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600'
  },
  amountLabel: {
    fontSize: DashboardFontSizes.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: DashboardSpacing.xs
  },
  amountValue: {
    fontSize: DashboardFontSizes['4xl'],
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5
  },
  bottomCurve: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 24,
    backgroundColor: DashboardColors.background,
    borderTopLeftRadius: DashboardBorderRadius['2xl'],
    borderTopRightRadius: DashboardBorderRadius['2xl']
  },

  // İçerik
  content: {
    flex: 1,
    backgroundColor: DashboardColors.background
  },
  contentContainer: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: 0,
  },

  // Kartlar
  card: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    marginBottom: DashboardSpacing.md,
    ...DashboardShadows.sm
  },
  summaryCard: {
    borderWidth: 1,
    borderColor: DashboardColors.primary
  },
  cardContent: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingBottom: DashboardSpacing.lg
  },

  // Adres
  addressContainer: {
    paddingVertical: DashboardSpacing.sm,
    paddingLeft: DashboardSpacing.xl
  },
  addressText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    lineHeight: 20
  },

  // Fatura Kalemi
  itemCard: {
    paddingVertical: DashboardSpacing.md
  },
  itemCardBorder: {
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DashboardSpacing.sm
  },
  itemIconContainer: {
    width: 36,
    height: 36,
    borderRadius: DashboardBorderRadius.md,
    backgroundColor: DashboardColors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center'
  },
  itemInfo: {
    flex: 1,
    marginLeft: DashboardSpacing.sm
  },
  itemName: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textPrimary
  },
  itemCode: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textMuted,
    marginTop: 2
  },
  itemDetails: {
    gap: DashboardSpacing.xs,
    paddingLeft: DashboardSpacing.xl + DashboardSpacing.sm
  },
  itemDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  itemDetailLabel: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textMuted
  },
  itemDetailValue: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: DashboardColors.textPrimary
  },
  itemTotalLabel: {
    fontWeight: '600',
    color: DashboardColors.textPrimary
  },
  itemTotalValue: {
    fontWeight: '700',
    color: DashboardColors.primary
  },

  // Toplam
  totalDivider: {
    height: 1,
    backgroundColor: DashboardColors.primary,
    marginVertical: DashboardSpacing.md
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  totalLabel: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: DashboardColors.textPrimary
  },
  totalValue: {
    fontSize: DashboardFontSizes['2xl'],
    fontWeight: '800',
    color: DashboardColors.primary
  },

  // Notlar
  notesText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    lineHeight: 22
  },

  // Empty
  emptyText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textMuted,
    textAlign: 'center',
    paddingVertical: DashboardSpacing.md
  },

  // Skeleton
  skeletonContainer: {
    gap: DashboardSpacing.md
  },

  // Hata durumu
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DashboardSpacing['2xl'],
    paddingVertical: DashboardSpacing['3xl']
  },
  errorIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: DashboardColors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.xl
  },
  errorTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.sm,
    textAlign: 'center'
  },
  errorText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    textAlign: 'center',
    marginBottom: DashboardSpacing.xl
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    backgroundColor: DashboardColors.danger,
    paddingHorizontal: DashboardSpacing.xl,
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg
  },
  retryButtonText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: '#fff'
  }
})
