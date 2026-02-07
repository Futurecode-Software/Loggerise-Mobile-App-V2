/**
 * CRM Müşteri Detay Sayfası
 *
 * Modern tasarım - CLAUDE.md ilkelerine uygun
 * Referans: accounting/bank/[id]/index.tsx
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking
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
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius,
  DashboardShadows
} from '@/constants/dashboard-theme'
import {
  getCrmCustomer,
  deleteCrmCustomer,
  CrmCustomer,
  getCrmCustomerStatusLabel,
  getCustomerSegmentLabel,
  formatDate
} from '@/services/endpoints/crm-customers'

type TabType = 'general' | 'interactions' | 'quotes'

// Bölüm başlığı
interface SectionHeaderProps {
  title: string
  icon: keyof typeof Ionicons.glyphMap
  count?: number
}

function SectionHeader({ title, icon, count }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        <View style={styles.sectionIcon}>
          <Ionicons name={icon} size={16} color={DashboardColors.primary} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
        {count !== undefined && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{count}</Text>
          </View>
        )}
      </View>
    </View>
  )
}

// Bilgi satırı
interface InfoRowProps {
  label: string
  value: string
  icon?: keyof typeof Ionicons.glyphMap
  highlight?: boolean
  onPress?: () => void
}

function InfoRow({ label, value, icon, highlight, onPress }: InfoRowProps) {
  const content = (
    <View style={styles.infoRow}>
      <View style={styles.infoLabel}>
        {icon && (
          <Ionicons
            name={icon}
            size={14}
            color={DashboardColors.textMuted}
            style={styles.infoIcon}
          />
        )}
        <Text style={styles.infoLabelText}>{label}</Text>
      </View>
      <Text style={[styles.infoValue, highlight && styles.infoValueHighlight]}>
        {value}
      </Text>
    </View>
  )

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    )
  }

  return content
}

export default function CrmCustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const customerId = id ? parseInt(id, 10) : null

  // State
  const [customer, setCustomer] = useState<CrmCustomer | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('general')
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Refs
  const isMountedRef = useRef(true)
  const deleteDialogRef = useRef<BottomSheetModal>(null)

  // Veri çekme
  const fetchCustomer = useCallback(async (showLoading = true) => {
    if (!customerId) {
      setError('Geçersiz müşteri ID')
      setIsLoading(false)
      return
    }

    try {
      if (showLoading) {
        setIsLoading(true)
        setError(null)
      }

      const data = await getCrmCustomer(customerId)

      if (isMountedRef.current) {
        setCustomer(data)
        setError(null)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Müşteri bilgileri yüklenemedi')
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
        setRefreshing(false)
      }
    }
  }, [customerId])

  useEffect(() => {
    isMountedRef.current = true
    fetchCustomer()

    return () => {
      isMountedRef.current = false
    }
  }, [fetchCustomer])

  // Edit sayfasından dönüşte yenile
  useFocusEffect(
    useCallback(() => {
      fetchCustomer(false)
    }, [fetchCustomer])
  )

  // Yenileme
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchCustomer(false)
  }, [fetchCustomer])

  // Düzenleme
  const handleEdit = () => {
    if (!customerId) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/crm/customers/${customerId}/edit`)
  }

  // Silme dialogunu aç
  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    deleteDialogRef.current?.present()
  }

  // Silme işlemini gerçekleştir
  const confirmDelete = async () => {
    if (!customerId) return

    setIsDeleting(true)
    try {
      await deleteCrmCustomer(customerId)
      deleteDialogRef.current?.dismiss()
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Toast.show({
        type: 'success',
        text1: 'Müşteri başarıyla silindi',
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
        text1: err instanceof Error ? err.message : 'Müşteri silinemedi',
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

  // Telefon ara
  const handleCall = (phone: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    Linking.openURL(`tel:${phone}`)
  }

  // E-posta gönder
  const handleEmail = (email: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    Linking.openURL(`mailto:${email}`)
  }

  // Tab değiştir
  const handleTabChange = (tab: TabType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setActiveTab(tab)
  }

  // Yeni görüşme
  const handleNewInteraction = () => {
    if (!customerId) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/crm/customers/${customerId}/interactions/new`)
  }

  // Teklifler
  const handleGoToQuotes = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push('/crm/quotes')
  }

  // Genel tab içeriği
  const renderGeneralTab = () => (
    <>
      {/* İletişim Bilgileri */}
      <View style={styles.card}>
        <SectionHeader title="İletişim Bilgileri" icon="call-outline" />
        <View style={styles.cardContent}>
          {customer?.phone && (
            <InfoRow
              label="Telefon"
              value={customer.phone}
              icon="call-outline"
              highlight
              onPress={() => handleCall(customer.phone!)}
            />
          )}
          {customer?.email && (
            <InfoRow
              label="E-posta"
              value={customer.email}
              icon="mail-outline"
              highlight
              onPress={() => handleEmail(customer.email!)}
            />
          )}
          {customer?.fax && (
            <InfoRow
              label="Faks"
              value={customer.fax}
              icon="print-outline"
            />
          )}
          {!customer?.phone && !customer?.email && !customer?.fax && (
            <Text style={styles.emptyFieldText}>İletişim bilgisi bulunmuyor</Text>
          )}
        </View>
      </View>

      {/* Firma Bilgileri */}
      <View style={styles.card}>
        <SectionHeader title="Firma Bilgileri" icon="business-outline" />
        <View style={styles.cardContent}>
          <InfoRow
            label="Tip"
            value={customer?.legal_type === 'company' ? 'Şirket' : 'Bireysel'}
            icon="briefcase-outline"
          />
          {customer?.tax_number && (
            <InfoRow
              label="Vergi No"
              value={customer.tax_number}
              icon="document-text-outline"
            />
          )}
          {customer?.tax_office && (
            <InfoRow
              label="Vergi Dairesi"
              value={customer.tax_office.name}
              icon="location-outline"
            />
          )}
          {customer?.category && (
            <InfoRow
              label="Kategori"
              value={customer.category}
              icon="pricetag-outline"
            />
          )}
          {customer?.customer_segment && (
            <InfoRow
              label="Segment"
              value={getCustomerSegmentLabel(customer.customer_segment)}
              icon="people-outline"
            />
          )}
        </View>
      </View>

      {/* İstatistikler */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={styles.statIconWrapper}>
            <Ionicons name="chatbubbles-outline" size={24} color={DashboardColors.primary} />
          </View>
          <Text style={styles.statValue}>{customer?.interactions_count || 0}</Text>
          <Text style={styles.statLabel}>Görüşme</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statIconWrapper}>
            <Ionicons name="document-text-outline" size={24} color={DashboardColors.primary} />
          </View>
          <Text style={styles.statValue}>{customer?.quotes_count || 0}</Text>
          <Text style={styles.statLabel}>Teklif</Text>
        </View>
      </View>

      {/* Son Görüşme */}
      {customer?.last_interaction && (
        <View style={styles.card}>
          <SectionHeader title="Son Görüşme" icon="chatbubble-outline" />
          <View style={styles.cardContent}>
            <View style={styles.lastInteractionRow}>
              <Ionicons name="chatbubble" size={16} color={DashboardColors.primary} />
              <Text style={styles.lastInteractionSubject}>
                {customer.last_interaction.subject || 'Görüşme'}
              </Text>
            </View>
            <Text style={styles.lastInteractionDate}>
              {formatDate(customer.last_interaction.interaction_date)}
            </Text>
          </View>
        </View>
      )}

      {/* Sistem Bilgileri */}
      <View style={styles.card}>
        <SectionHeader title="Sistem Bilgileri" icon="time-outline" />
        <View style={styles.cardContent}>
          <InfoRow
            label="Oluşturulma"
            value={formatDate(customer?.created_at)}
            icon="add-circle-outline"
          />
          <InfoRow
            label="Son Güncelleme"
            value={formatDate(customer?.updated_at)}
            icon="refresh-outline"
          />
        </View>
      </View>
    </>
  )

  // Görüşmeler tab içeriği
  const renderInteractionsTab = () => (
    <View style={styles.emptyTabCard}>
      <View style={styles.emptyTabIcon}>
        <Ionicons name="chatbubbles-outline" size={48} color={DashboardColors.textMuted} />
      </View>
      <Text style={styles.emptyTabTitle}>Görüşme Yönetimi</Text>
      <Text style={styles.emptyTabSubtitle}>
        Bu müşteriyle yapılan görüşmeleri burada görebilirsiniz
      </Text>
      <TouchableOpacity style={styles.emptyTabButton} onPress={handleNewInteraction}>
        <Ionicons name="add" size={18} color="#fff" />
        <Text style={styles.emptyTabButtonText}>Yeni Görüşme Ekle</Text>
      </TouchableOpacity>
    </View>
  )

  // Teklifler tab içeriği
  const renderQuotesTab = () => (
    <View style={styles.emptyTabCard}>
      <View style={styles.emptyTabIcon}>
        <Ionicons name="document-text-outline" size={48} color={DashboardColors.textMuted} />
      </View>
      <Text style={styles.emptyTabTitle}>Teklifler</Text>
      <Text style={styles.emptyTabSubtitle}>
        Bu müşteriye ait teklifleri burada görebilirsiniz
      </Text>
      <TouchableOpacity
        style={[styles.emptyTabButton, styles.emptyTabButtonOutline]}
        onPress={handleGoToQuotes}
      >
        <Ionicons name="arrow-forward" size={18} color={DashboardColors.primary} />
        <Text style={[styles.emptyTabButtonText, styles.emptyTabButtonTextOutline]}>
          Teklif Listesine Git
        </Text>
      </TouchableOpacity>
    </View>
  )

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
            ) : customer ? (
              <View style={styles.headerTitleSection}>
                <Text style={styles.headerName} numberOfLines={1}>
                  {customer.name}
                </Text>
              </View>
            ) : (
              <View style={styles.headerTitleSection} />
            )}

            {/* Aksiyonlar - Sağ */}
            {!isLoading && customer ? (
              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.headerButton} onPress={handleEdit}>
                  <Ionicons name="create-outline" size={22} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.headerButton, styles.deleteButton]}
                  onPress={handleDelete}
                  disabled={isDeleting}
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

          {/* Müşteri Özeti */}
          {isLoading ? (
            <View style={styles.summaryRow}>
              <Skeleton width={60} height={60} borderRadius={30} />
              <View style={styles.summaryInfo}>
                <Skeleton width={100} height={14} style={{ marginBottom: DashboardSpacing.xs }} />
                <Skeleton width={160} height={20} />
              </View>
              <Skeleton width={70} height={32} borderRadius={16} />
            </View>
          ) : customer ? (
            <View style={styles.summaryRow}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={28} color="#fff" />
              </View>
              <View style={styles.summaryInfo}>
                <Text style={styles.summaryCode}>{customer.code}</Text>
                <Text style={styles.summarySegment}>
                  {customer.customer_segment
                    ? getCustomerSegmentLabel(customer.customer_segment)
                    : customer.legal_type === 'company' ? 'Şirket' : 'Bireysel'
                  }
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: customer.status === 'active'
                      ? 'rgba(16, 185, 129, 0.2)'
                      : customer.status === 'passive'
                        ? 'rgba(251, 191, 36, 0.2)'
                        : 'rgba(239, 68, 68, 0.2)'
                  }
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: customer.status === 'active'
                        ? DashboardColors.success
                        : customer.status === 'passive'
                          ? DashboardColors.warning
                          : DashboardColors.danger
                    }
                  ]}
                />
                <Text
                  style={[
                    styles.statusBadgeText,
                    {
                      color: customer.status === 'active'
                        ? DashboardColors.success
                        : customer.status === 'passive'
                          ? DashboardColors.warning
                          : DashboardColors.danger
                    }
                  ]}
                >
                  {getCrmCustomerStatusLabel(customer.status)}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.bottomCurve} />
      </View>

      {/* Tabs */}
      {!isLoading && customer && (
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'general' && styles.tabActive]}
            onPress={() => handleTabChange('general')}
          >
            <Text style={[styles.tabText, activeTab === 'general' && styles.tabTextActive]}>
              Genel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'interactions' && styles.tabActive]}
            onPress={() => handleTabChange('interactions')}
          >
            <Text style={[styles.tabText, activeTab === 'interactions' && styles.tabTextActive]}>
              Görüşmeler
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'quotes' && styles.tabActive]}
            onPress={() => handleTabChange('quotes')}
          >
            <Text style={[styles.tabText, activeTab === 'quotes' && styles.tabTextActive]}>
              Teklifler
            </Text>
          </TouchableOpacity>
        </View>
      )}

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
        {!isLoading && (error || !customer) && (
          <View style={styles.errorState}>
            <View style={styles.errorIcon}>
              <Ionicons name="alert-circle" size={48} color={DashboardColors.danger} />
            </View>
            <Text style={styles.errorTitle}>Bir hata oluştu</Text>
            <Text style={styles.errorText}>{error || 'Müşteri bulunamadı'}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchCustomer()}>
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Normal içerik */}
        {!isLoading && customer && (
          <>
            {activeTab === 'general' && renderGeneralTab()}
            {activeTab === 'interactions' && renderInteractionsTab()}
            {activeTab === 'quotes' && renderQuotesTab()}

            {/* Alt boşluk */}
            <View style={{ height: insets.bottom + DashboardSpacing['3xl'] + 80 }} />
          </>
        )}
      </ScrollView>

      {/* Quick Actions */}
      {!isLoading && customer && (customer.phone || customer.email) && (
        <View style={[styles.quickActions, { paddingBottom: insets.bottom + DashboardSpacing.md }]}>
          {customer.phone && (
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleCall(customer.phone!)}
            >
              <Ionicons name="call" size={20} color="#fff" />
              <Text style={styles.quickActionText}>Ara</Text>
            </TouchableOpacity>
          )}
          {customer.email && (
            <TouchableOpacity
              style={[styles.quickActionButton, styles.quickActionEmail]}
              onPress={() => handleEmail(customer.email!)}
            >
              <Ionicons name="send" size={20} color="#fff" />
              <Text style={styles.quickActionText}>E-posta</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Silme Onay Dialogu */}
      <ConfirmDialog
        ref={deleteDialogRef}
        title="Müşteriyi Sil"
        message="Bu müşteriyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
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
    paddingBottom: 32
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
    paddingHorizontal: DashboardSpacing.lg
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
    width: 96
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)'
  },
  headerName: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
    flex: 1,
    textAlign: 'center'
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: DashboardSpacing.md,
    gap: DashboardSpacing.md
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  summaryInfo: {
    flex: 1
  },
  summaryCode: {
    fontSize: DashboardFontSizes.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 2
  },
  summarySegment: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: '#fff'
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.full,
    gap: 6
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  statusBadgeText: {
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

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: DashboardColors.background,
    paddingHorizontal: DashboardSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight
  },
  tab: {
    flex: 1,
    paddingVertical: DashboardSpacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  tabActive: {
    borderBottomColor: DashboardColors.primary
  },
  tabText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: DashboardColors.textMuted
  },
  tabTextActive: {
    color: DashboardColors.primary
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
  cardContent: {
    paddingHorizontal: DashboardSpacing.lg
  },

  // Bölüm Başlığı
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: DashboardSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: DashboardColors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sectionTitle: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textPrimary
  },
  countBadge: {
    backgroundColor: DashboardColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10
  },
  countText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600',
    color: '#fff'
  },

  // Bilgi Satırı
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DashboardSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight
  },
  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  infoIcon: {
    marginRight: DashboardSpacing.sm
  },
  infoLabelText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary
  },
  infoValue: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: DashboardColors.textPrimary,
    maxWidth: '50%',
    textAlign: 'right'
  },
  infoValueHighlight: {
    color: DashboardColors.primary,
    fontWeight: '600'
  },
  emptyFieldText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textMuted,
    fontStyle: 'italic',
    paddingVertical: DashboardSpacing.md
  },

  // İstatistikler
  statsRow: {
    flexDirection: 'row',
    gap: DashboardSpacing.md,
    marginBottom: DashboardSpacing.md
  },
  statCard: {
    flex: 1,
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.lg,
    alignItems: 'center',
    ...DashboardShadows.sm
  },
  statIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: DashboardColors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.sm
  },
  statValue: {
    fontSize: DashboardFontSizes['2xl'],
    fontWeight: '700',
    color: DashboardColors.textPrimary
  },
  statLabel: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textMuted,
    marginTop: 2
  },

  // Son görüşme
  lastInteractionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    marginBottom: DashboardSpacing.xs
  },
  lastInteractionSubject: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '500',
    color: DashboardColors.textPrimary
  },
  lastInteractionDate: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary
  },

  // Empty tab
  emptyTabCard: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing['2xl'],
    alignItems: 'center',
    ...DashboardShadows.sm
  },
  emptyTabIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: DashboardColors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.lg
  },
  emptyTabTitle: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.sm
  },
  emptyTabSubtitle: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    textAlign: 'center',
    marginBottom: DashboardSpacing.xl
  },
  emptyTabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    backgroundColor: DashboardColors.primary,
    paddingHorizontal: DashboardSpacing.xl,
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg
  },
  emptyTabButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: DashboardColors.primary
  },
  emptyTabButtonText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: '#fff'
  },
  emptyTabButtonTextOutline: {
    color: DashboardColors.primary
  },

  // Quick Actions
  quickActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: DashboardSpacing.md,
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: DashboardSpacing.md,
    backgroundColor: DashboardColors.surface,
    borderTopWidth: 1,
    borderTopColor: DashboardColors.borderLight,
    ...DashboardShadows.lg
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DashboardSpacing.sm,
    backgroundColor: DashboardColors.primary,
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg
  },
  quickActionEmail: {
    backgroundColor: DashboardColors.info
  },
  quickActionText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: '#fff'
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
