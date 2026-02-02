/**
 * Cari Detay Sayfası
 *
 * Modern tasarım - CLAUDE.md ilkelerine uygun
 * Referans: accounting/bank/[id]/index.tsx
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import * as Haptics from 'expo-haptics'
import Toast from 'react-native-toast-message'
import type { Contact } from '@/types/contact'
import { getContact, deleteContact } from '@/services/endpoints/contacts'
import { StatusBadge } from '@/components/contacts/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import ConfirmDialog from '@/components/modals/ConfirmDialog'
import { getContactTypeLabel, getLegalTypeLabel, getSegmentLabel, getCreditRatingLabel } from '@/utils/contacts/labels'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius,
  DashboardShadows
} from '@/constants/dashboard-theme'

// Tarih formatlama
const formatDate = (dateString?: string): string => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return dateString
  }
}

// Bölüm başlığı
interface SectionHeaderProps {
  title: string
  icon: keyof typeof Ionicons.glyphMap
  count?: number
  isExpanded?: boolean
  onToggle?: () => void
}

function SectionHeader({ title, icon, count, isExpanded, onToggle }: SectionHeaderProps) {
  return (
    <TouchableOpacity
      style={styles.sectionHeader}
      onPress={onToggle}
      disabled={!onToggle}
      activeOpacity={onToggle ? 0.7 : 1}
    >
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
      {onToggle && (
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={DashboardColors.textMuted}
        />
      )}
    </TouchableOpacity>
  )
}

// Bilgi satırı
interface InfoRowProps {
  label: string
  value: string
  icon?: keyof typeof Ionicons.glyphMap
  highlight?: boolean
}

function InfoRow({ label, value, icon, highlight }: InfoRowProps) {
  return (
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
}

export default function ContactDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const contactId = id ? parseInt(id, 10) : null

  // State
  const [contact, setContact] = useState<Contact | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Expand states
  const [expandedAddresses, setExpandedAddresses] = useState(false)
  const [expandedAuthorities, setExpandedAuthorities] = useState(false)

  // Refs
  const isMountedRef = useRef(true)
  const deleteDialogRef = useRef<BottomSheetModal>(null)

  // Veri çekme
  const fetchContact = useCallback(async (showLoading = true) => {
    if (!contactId) {
      setError('Geçersiz cari ID')
      setIsLoading(false)
      return
    }

    try {
      if (showLoading) {
        setIsLoading(true)
        setError(null)
      }

      const data = await getContact(contactId)

      if (isMountedRef.current) {
        setContact(data)
        setError(null)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Cari bilgileri yüklenemedi')
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
        setRefreshing(false)
      }
    }
  }, [contactId])

  useEffect(() => {
    isMountedRef.current = true
    fetchContact()

    return () => {
      isMountedRef.current = false
    }
  }, [fetchContact])

  // Edit sayfasından dönüşte yenile
  useFocusEffect(
    useCallback(() => {
      fetchContact(false)
    }, [fetchContact])
  )

  // Yenileme
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchContact(false)
  }, [fetchContact])

  // Düzenleme
  const handleEdit = () => {
    if (!contactId) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/contacts/${contactId}/edit`)
  }

  // Silme dialogunu aç
  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    deleteDialogRef.current?.present()
  }

  // Silme işlemini gerçekleştir
  const confirmDelete = async () => {
    if (!contactId) return

    setIsDeleting(true)
    try {
      await deleteContact(contactId)
      deleteDialogRef.current?.dismiss()
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Toast.show({
        type: 'success',
        text1: 'Cari başarıyla silindi',
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
        text1: err instanceof Error ? err.message : 'Cari silinemedi',
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
        {/* Statik glow orbs - detay sayfası */}
        <View style={styles.glowOrb1} />
        <View style={styles.glowOrb2} />

        <View style={[styles.headerContent, { paddingTop: insets.top + 16 }]}>
          {/* Üst Bar: Geri + Başlık + Aksiyonlar */}
          <View style={styles.headerBar}>
            <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>

            {/* Başlık - Orta */}
            {isLoading ? (
              <View style={styles.headerTitleSection}>
                <Skeleton width={140} height={22} />
              </View>
            ) : contact ? (
              <View style={styles.headerTitleSection}>
                <Text style={styles.headerName} numberOfLines={1}>
                  {contact.name}
                </Text>
              </View>
            ) : (
              <View style={styles.headerTitleSection} />
            )}

            {/* Aksiyonlar - Sağ */}
            {!isLoading && contact ? (
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

          {/* Cari Özeti + Status */}
          {isLoading ? (
            <View style={styles.summaryRow}>
              <View style={styles.summaryInfo}>
                <Skeleton width={100} height={14} style={{ marginBottom: DashboardSpacing.xs }} />
                <Skeleton width={80} height={20} />
              </View>
              <Skeleton width={70} height={32} borderRadius={16} />
            </View>
          ) : contact ? (
            <View style={styles.summaryRow}>
              <View style={styles.summaryInfo}>
                <Text style={styles.summaryLabel}>Cari Kodu</Text>
                <Text style={styles.summaryCode}>{contact.code}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: contact.is_active
                      ? 'rgba(16, 185, 129, 0.2)'
                      : 'rgba(239, 68, 68, 0.2)'
                  }
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: contact.is_active
                        ? DashboardColors.success
                        : DashboardColors.danger
                    }
                  ]}
                />
                <Text
                  style={[
                    styles.statusBadgeText,
                    {
                      color: contact.is_active
                        ? DashboardColors.success
                        : DashboardColors.danger
                    }
                  ]}
                >
                  {contact.is_active ? 'Aktif' : 'Pasif'}
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
            {[1, 2, 3, 4].map(i => (
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
        {!isLoading && (error || !contact) && (
          <View style={styles.errorState}>
            <View style={styles.errorIcon}>
              <Ionicons name="alert-circle" size={48} color={DashboardColors.danger} />
            </View>
            <Text style={styles.errorTitle}>Bir hata oluştu</Text>
            <Text style={styles.errorText}>{error || 'Cari bulunamadı'}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchContact()}>
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Normal içerik */}
        {!isLoading && contact && (
          <>
            {/* Temel Bilgiler */}
            <View style={styles.card}>
              <SectionHeader title="Temel Bilgiler" icon="information-circle-outline" />
              <View style={styles.cardContent}>
                <InfoRow
                  label="Cari Adı"
                  value={contact.name}
                  icon="text-outline"
                  highlight
                />
                <InfoRow
                  label="Cari Tipi"
                  value={getContactTypeLabel(contact.type)}
                  icon="people-outline"
                />
                <InfoRow
                  label="Yasal Tip"
                  value={getLegalTypeLabel(contact.legal_type)}
                  icon="business-outline"
                />
                {contact.category && (
                  <InfoRow
                    label="Kategori"
                    value={contact.category}
                    icon="pricetag-outline"
                  />
                )}
                {contact.customer_segment && (
                  <InfoRow
                    label="Segment"
                    value={getSegmentLabel(contact.customer_segment)}
                    icon="analytics-outline"
                  />
                )}
                {contact.credit_rating && (
                  <InfoRow
                    label="Kredi Notu"
                    value={getCreditRatingLabel(contact.credit_rating)}
                    icon="star-outline"
                  />
                )}
              </View>
            </View>

            {/* İletişim Bilgileri */}
            <View style={styles.card}>
              <SectionHeader title="İletişim Bilgileri" icon="call-outline" />
              <View style={styles.cardContent}>
                <InfoRow
                  label="E-posta"
                  value={contact.email || '-'}
                  icon="mail-outline"
                />
                <InfoRow
                  label="Telefon"
                  value={contact.phone || '-'}
                  icon="call-outline"
                />
                {contact.fax && (
                  <InfoRow
                    label="Faks"
                    value={contact.fax}
                    icon="print-outline"
                  />
                )}
              </View>
            </View>

            {/* Adres Bilgileri */}
            <View style={styles.card}>
              <SectionHeader
                title="Adres Bilgileri"
                icon="location-outline"
                count={contact.addresses?.length}
                isExpanded={expandedAddresses}
                onToggle={contact.addresses && contact.addresses.length > 0 ? () => {
                  Haptics.selectionAsync()
                  setExpandedAddresses(!expandedAddresses)
                } : undefined}
              />
              <View style={styles.cardContent}>
                <InfoRow
                  label="Ana Adres"
                  value={contact.main_address || '-'}
                  icon="home-outline"
                />

                {contact.addresses && contact.addresses.length > 0 && expandedAddresses && (
                  <View style={styles.expandedContent}>
                    {contact.addresses.map((address) => (
                      <View key={address.id} style={styles.addressCard}>
                        <Text style={styles.addressTitle}>{address.title}</Text>
                        <Text style={styles.addressText}>{address.address}</Text>
                        {address.phone && (
                          <Text style={styles.addressContact}>Tel: {address.phone}</Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Mali Bilgiler */}
            <View style={styles.card}>
              <SectionHeader title="Mali Bilgiler" icon="cash-outline" />
              <View style={styles.cardContent}>
                <InfoRow
                  label="Vergi No"
                  value={contact.tax_number || '-'}
                  icon="document-text-outline"
                />
                {contact.tax_office && (
                  <InfoRow
                    label="Vergi Dairesi"
                    value={contact.tax_office.name}
                    icon="business-outline"
                  />
                )}
                <InfoRow
                  label="Para Birimi"
                  value={contact.currency_type}
                  icon="globe-outline"
                />
                <InfoRow
                  label="Ödeme Vadesi"
                  value={contact.default_payment_terms ? `${contact.default_payment_terms} gün` : '-'}
                  icon="calendar-outline"
                />
                <InfoRow
                  label="Risk Limiti"
                  value={contact.risk_limit ? `${contact.risk_limit.toLocaleString('tr-TR')} ${contact.currency_type}` : 'Limitsiz'}
                  icon="shield-outline"
                  highlight
                />
              </View>
            </View>

            {/* Yetkili Kişiler */}
            {contact.authorities && contact.authorities.length > 0 && (
              <View style={styles.card}>
                <SectionHeader
                  title="Yetkili Kişiler"
                  icon="people-outline"
                  count={contact.authorities.length}
                  isExpanded={expandedAuthorities}
                  onToggle={() => {
                    Haptics.selectionAsync()
                    setExpandedAuthorities(!expandedAuthorities)
                  }}
                />
                {expandedAuthorities && (
                  <View style={styles.cardContent}>
                    {contact.authorities.map((auth) => (
                      <View key={auth.id} style={styles.authorityCard}>
                        <Text style={styles.authorityName}>{auth.name}</Text>
                        {auth.title && <Text style={styles.authorityTitle}>{auth.title}</Text>}
                        {auth.department && <Text style={styles.authorityDepartment}>{auth.department}</Text>}
                        {auth.email && <Text style={styles.authorityContact}>{auth.email}</Text>}
                        {auth.phone && <Text style={styles.authorityContact}>{auth.phone}</Text>}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Sistem Bilgileri */}
            <View style={styles.card}>
              <SectionHeader title="Sistem Bilgileri" icon="time-outline" />
              <View style={styles.cardContent}>
                <InfoRow
                  label="Oluşturulma"
                  value={formatDate(contact.created_at)}
                  icon="add-circle-outline"
                />
                <InfoRow
                  label="Son Güncelleme"
                  value={formatDate(contact.updated_at)}
                  icon="refresh-outline"
                />
                <InfoRow
                  label="Durum"
                  value={contact.is_active ? 'Aktif' : 'Pasif'}
                  icon={contact.is_active ? 'checkmark-circle-outline' : 'close-circle-outline'}
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
        title="Cariyi Sil"
        message="Bu cariyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
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
    flex: 1
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: DashboardSpacing.md
  },
  summaryInfo: {
    flex: 1
  },
  summaryLabel: {
    fontSize: DashboardFontSizes.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: DashboardSpacing.xs
  },
  summaryCode: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5
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

  // Genişletilebilir içerik
  expandedContent: {
    gap: DashboardSpacing.md,
    marginTop: DashboardSpacing.md
  },
  addressCard: {
    backgroundColor: DashboardColors.background,
    borderRadius: DashboardBorderRadius.lg,
    padding: DashboardSpacing.md
  },
  addressTitle: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.xs
  },
  addressText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    lineHeight: 20
  },
  addressContact: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    marginTop: DashboardSpacing.xs
  },
  authorityCard: {
    backgroundColor: DashboardColors.background,
    borderRadius: DashboardBorderRadius.lg,
    padding: DashboardSpacing.md,
    marginTop: DashboardSpacing.sm
  },
  authorityName: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.xs
  },
  authorityTitle: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textPrimary
  },
  authorityDepartment: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary
  },
  authorityContact: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    marginTop: DashboardSpacing.xs
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
    backgroundColor: DashboardColors.primary,
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
