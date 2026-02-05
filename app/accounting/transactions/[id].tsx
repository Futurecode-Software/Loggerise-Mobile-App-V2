/**
 * Mali İşlem Detay Sayfası
 *
 * Mali işlem bilgilerini detaylı görüntüleme - CLAUDE.md tasarım ilkeleri ile uyumlu
 * Sadece görüntüleme - düzenleme/silme yok
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { Skeleton } from '@/components/ui/skeleton'
import { SectionHeader, InfoRow } from '@/components/detail'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius,
  DashboardShadows
} from '@/constants/dashboard-theme'
import {
  getFinancialTransaction,
  FinancialTransaction,
  getTransactionTypeLabel,
  getTransactionStatusLabel,
  formatAmount,
  formatDate
} from '@/services/endpoints/financial-transactions'

// İşlem tipi renkleri
const TYPE_COLORS: Record<string, { primary: string; bg: string }> = {
  income: { primary: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
  expense: { primary: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
  transfer: { primary: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' }
}

// İşlem tipi ikonu
const getTypeIcon = (type: string): keyof typeof Ionicons.glyphMap => {
  switch (type) {
    case 'income':
      return 'arrow-down-outline'
    case 'expense':
      return 'arrow-up-outline'
    case 'transfer':
      return 'swap-horizontal-outline'
    default:
      return 'swap-horizontal-outline'
  }
}

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const transactionId = id ? parseInt(id, 10) : null

  // State
  const [transaction, setTransaction] = useState<FinancialTransaction | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Refs
  const isMountedRef = useRef(true)

  // Veri çekme
  const fetchTransaction = useCallback(async (showLoading = true) => {
    if (!transactionId) {
      setError('Geçersiz işlem ID')
      setIsLoading(false)
      return
    }

    try {
      if (showLoading) {
        setIsLoading(true)
        setError(null)
      }

      const data = await getFinancialTransaction(transactionId)

      if (isMountedRef.current) {
        setTransaction(data)
        setError(null)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'İşlem bilgileri yüklenemedi')
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
        setRefreshing(false)
      }
    }
  }, [transactionId])

  useEffect(() => {
    isMountedRef.current = true
    fetchTransaction()

    return () => {
      isMountedRef.current = false
    }
  }, [fetchTransaction])

  // Ekran focus olduğunda yenile
  useFocusEffect(
    useCallback(() => {
      fetchTransaction(false)
    }, [fetchTransaction])
  )

  // Yenileme
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchTransaction(false)
  }, [fetchTransaction])

  // Geri
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.back()
  }

  // İşlem tipi renklerini al
  const typeColors = transaction
    ? TYPE_COLORS[transaction.transaction_type] || TYPE_COLORS.transfer
    : TYPE_COLORS.transfer

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
          {/* Üst Bar: Geri + Başlık */}
          <View style={styles.headerBar}>
            <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>

            {/* Başlık - Orta */}
            <View style={styles.headerTitleSection}>
              <Text style={styles.headerTitle}>İşlem Detayı</Text>
            </View>

            {/* Placeholder - Sağ (buton yok) */}
            <View style={styles.headerButtonPlaceholder} />
          </View>

          {/* Tutar Özeti + İşlem Tipi */}
          {isLoading ? (
            <View style={styles.amountRow}>
              <View style={styles.amountSummary}>
                <Skeleton width={100} height={14} style={{ marginBottom: DashboardSpacing.xs }} />
                <Skeleton width={180} height={36} />
              </View>
              <Skeleton width={80} height={32} borderRadius={16} />
            </View>
          ) : transaction ? (
            <View style={styles.amountRow}>
              <View style={styles.amountSummary}>
                <Text style={styles.amountLabel}>
                  {getTransactionTypeLabel(transaction.transaction_type)}
                </Text>
                <Text
                  style={[
                    styles.amountValue,
                    { color: transaction.transaction_type === 'income' ? '#10B981' : '#FCA5A5' }
                  ]}
                >
                  {transaction.transaction_type === 'income' ? '+' : '-'}
                  {formatAmount(transaction.amount, transaction.currency_type)}
                </Text>
              </View>
              <View style={[styles.typeBadge, { backgroundColor: typeColors.bg }]}>
                <Ionicons
                  name={getTypeIcon(transaction.transaction_type)}
                  size={16}
                  color={typeColors.primary}
                />
                <Text style={[styles.typeBadgeText, { color: typeColors.primary }]}>
                  {getTransactionTypeLabel(transaction.transaction_type)}
                </Text>
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
                <View style={styles.skeletonHeader}>
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
        {!isLoading && (error || !transaction) && (
          <View style={styles.errorState}>
            <View style={styles.errorIcon}>
              <Ionicons name="alert-circle" size={48} color={DashboardColors.danger} />
            </View>
            <Text style={styles.errorTitle}>Bir hata oluştu</Text>
            <Text style={styles.errorText}>{error || 'İşlem bulunamadı'}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchTransaction()}>
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Normal içerik */}
        {!isLoading && transaction && (
          <>
            {/* İşlem Bilgileri */}
            <View style={styles.card}>
              <SectionHeader title="İşlem Bilgileri" icon="swap-horizontal-outline" />
              <View style={styles.cardContent}>
                <InfoRow
                  label="İşlem Tipi"
                  value={getTransactionTypeLabel(transaction.transaction_type)}
                  icon="git-compare-outline"
                  valueColor={typeColors.primary}
                />
                <InfoRow
                  label="Durum"
                  value={getTransactionStatusLabel(transaction.status)}
                  icon="flag-outline"
                  valueColor={
                    transaction.status === 'approved'
                      ? DashboardColors.success
                      : transaction.status === 'pending'
                        ? DashboardColors.warning
                        : DashboardColors.danger
                  }
                />
                <InfoRow
                  label="Tarih"
                  value={formatDate(transaction.transaction_date)}
                  icon="calendar-outline"
                />
                {transaction.reference_number && (
                  <InfoRow
                    label="Referans No"
                    value={transaction.reference_number}
                    icon="document-text-outline"
                  />
                )}
              </View>
            </View>

            {/* Tutar Bilgileri */}
            <View style={styles.card}>
              <SectionHeader title="Tutar Bilgileri" icon="cash-outline" />
              <View style={styles.cardContent}>
                <InfoRow
                  label="Tutar"
                  value={formatAmount(transaction.amount, transaction.currency_type)}
                  icon="wallet-outline"
                  highlight
                />
                <InfoRow
                  label="Para Birimi"
                  value={transaction.currency_type}
                  icon="globe-outline"
                />
                {transaction.exchange_rate != null && Number(transaction.exchange_rate) !== 1 && (
                  <InfoRow
                    label="Döviz Kuru"
                    value={Number(transaction.exchange_rate).toFixed(4)}
                    icon="trending-up-outline"
                  />
                )}
                {transaction.base_amount != null && Number(transaction.base_amount) !== Number(transaction.amount) && (
                  <InfoRow
                    label="TRY Karşılığı"
                    value={formatAmount(transaction.base_amount, 'TRY')}
                    icon="calculator-outline"
                  />
                )}
              </View>
            </View>

            {/* Kategori Bilgileri */}
            {(transaction.category || transaction.sub_category) && (
              <View style={styles.card}>
                <SectionHeader title="Kategori" icon="folder-outline" />
                <View style={styles.cardContent}>
                  {transaction.category && (
                    <InfoRow
                      label="Kategori"
                      value={transaction.category}
                      icon="pricetag-outline"
                    />
                  )}
                  {transaction.sub_category && (
                    <InfoRow
                      label="Alt Kategori"
                      value={transaction.sub_category}
                      icon="pricetags-outline"
                    />
                  )}
                </View>
              </View>
            )}

            {/* İlişkili Kayıtlar */}
            {(transaction.contact || transaction.source) && (
              <View style={styles.card}>
                <SectionHeader title="İlişkili Kayıtlar" icon="link-outline" />
                <View style={styles.cardContent}>
                  {transaction.contact && (
                    <InfoRow
                      label="Cari"
                      value={transaction.contact.name}
                      icon="person-outline"
                      highlight
                    />
                  )}
                  {transaction.source && (
                    <InfoRow
                      label="Kaynak"
                      value={transaction.source.name || `#${transaction.source.id}`}
                      icon="layers-outline"
                    />
                  )}
                </View>
              </View>
            )}

            {/* Açıklama */}
            {transaction.description && (
              <View style={styles.card}>
                <SectionHeader title="Açıklama" icon="document-text-outline" />
                <View style={styles.cardContent}>
                  <Text style={styles.descriptionText}>{transaction.description}</Text>
                </View>
              </View>
            )}

            {/* Ek Bilgiler */}
            <View style={styles.card}>
              <SectionHeader title="Ek Bilgiler" icon="information-circle-outline" />
              <View style={styles.cardContent}>
                <InfoRow
                  label="Mutabakat"
                  value={transaction.is_reconciled ? 'Evet' : 'Hayır'}
                  icon={transaction.is_reconciled ? 'checkmark-circle-outline' : 'close-circle-outline'}
                  valueColor={transaction.is_reconciled ? DashboardColors.success : DashboardColors.textMuted}
                />
                {transaction.user && (
                  <InfoRow
                    label="Oluşturan"
                    value={transaction.user.name}
                    icon="person-add-outline"
                  />
                )}
                {transaction.approver && (
                  <InfoRow
                    label="Onaylayan"
                    value={transaction.approver.name}
                    icon="shield-checkmark-outline"
                  />
                )}
              </View>
            </View>

            {/* Sistem Bilgileri */}
            <View style={styles.card}>
              <SectionHeader title="Sistem Bilgileri" icon="time-outline" />
              <View style={styles.cardContent}>
                <InfoRow
                  label="Oluşturulma"
                  value={formatDate(transaction.created_at)}
                  icon="add-circle-outline"
                />
                <InfoRow
                  label="Son Güncelleme"
                  value={formatDate(transaction.updated_at)}
                  icon="refresh-outline"
                />
                <InfoRow
                  label="Durum"
                  value={transaction.is_active ? 'Aktif' : 'Pasif'}
                  icon={transaction.is_active ? 'checkmark-circle-outline' : 'close-circle-outline'}
                />
              </View>
            </View>

            {/* Alt boşluk */}
            <View style={{ height: insets.bottom + DashboardSpacing['3xl'] }} />
          </>
        )}
      </ScrollView>
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
  headerButtonPlaceholder: {
    width: 44
  },
  headerTitleSection: {
    flex: 1,
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3
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
  amountLabel: {
    fontSize: DashboardFontSizes.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: DashboardSpacing.xs
  },
  amountValue: {
    fontSize: DashboardFontSizes['4xl'],
    fontWeight: '800',
    letterSpacing: 0.5
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.full,
    gap: 6
  },
  typeBadgeText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600'
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
    paddingTop: DashboardSpacing.md
  },

  // Kartlar
  card: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    marginBottom: DashboardSpacing.md,
    ...DashboardShadows.sm
  },
  cardContent: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingBottom: DashboardSpacing.lg
  },

  // Açıklama
  descriptionText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    lineHeight: 22
  },

  // Skeleton
  skeletonContainer: {
    gap: DashboardSpacing.md
  },
  skeletonHeader: {
    padding: DashboardSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight
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
