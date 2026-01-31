import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useState, useCallback, useRef, useEffect } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import * as Haptics from 'expo-haptics'
import Toast from 'react-native-toast-message'
import type { Contact } from '@/types/contact'
import { getContact, deleteContact } from '@/services/endpoints/contacts'
import { StatusBadge } from '@/components/contacts/StatusBadge'
import { ContactDetailSkeleton } from '@/components/contacts/ContactDetailSkeleton'
import { Skeleton } from '@/components/ui/skeleton'
import ConfirmDialog from '@/components/modals/ConfirmDialog'
import { getContactTypeLabel, getLegalTypeLabel, getSegmentLabel, getCreditRatingLabel } from '@/utils/contacts/labels'
import { DashboardColors, DashboardSpacing, DashboardFontSizes, DashboardBorderRadius } from '@/constants/dashboard-theme'

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

interface InfoRowProps {
  label: string
  value: string
  icon?: keyof typeof Ionicons.glyphMap
}

function InfoRow({ label, value, icon }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLabel}>
        {icon && <Ionicons name={icon} size={14} color={DashboardColors.textMuted} />}
        <Text style={styles.infoLabelText}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  )
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <View style={styles.errorContainer}>
      <View style={styles.errorIcon}>
        <Ionicons name="alert-circle" size={48} color={DashboardColors.danger} />
      </View>
      <Text style={styles.errorTitle}>Bir hata oluştu</Text>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Ionicons name="refresh" size={18} color="#fff" />
        <Text style={styles.retryButtonText}>Tekrar Dene</Text>
      </TouchableOpacity>
    </View>
  )
}

export default function ContactDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [contact, setContact] = useState<Contact | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [expandedAddresses, setExpandedAddresses] = useState(false)
  const [expandedAuthorities, setExpandedAuthorities] = useState(false)

  const deleteDialogRef = useRef<BottomSheetModal>(null)
  const isMountedRef = useRef(true)

  const fetchContact = useCallback(async () => {
    if (!id) {
      setError('Geçersiz cari ID')
      setIsLoading(false)
      return
    }

    try {
      setError(null)
      const data = await getContact(parseInt(id, 10))
      if (isMountedRef.current) {
        setContact(data)
        setIsLoading(false)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Cari bilgileri yüklenemedi')
        setIsLoading(false)
      }
    }
  }, [id])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchContact()
    setRefreshing(false)
  }, [fetchContact])

  const handleDelete = async () => {
    if (!id) return

    setIsDeleting(true)
    try {
      await deleteContact(parseInt(id, 10))

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

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
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)

      Toast.show({
        type: 'error',
        text1: err instanceof Error ? err.message : 'Silme işlemi başarısız',
        position: 'top',
        visibilityTime: 1500
      })
    } finally {
      setIsDeleting(false)
      deleteDialogRef.current?.dismiss()
    }
  }

  useEffect(() => {
    isMountedRef.current = true
    fetchContact()

    return () => {
      isMountedRef.current = false
    }
  }, [fetchContact])

  const renderHeaderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.contactInfo}>
          <Skeleton width={180} height={28} />
          <Skeleton width={100} height={24} borderRadius={12} style={{ marginTop: 8 }} />
        </View>
      )
    }

    if (contact) {
      return (
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{contact.name}</Text>
          <View style={styles.badgeRow}>
            <StatusBadge status={contact.status} />
            <Text style={styles.contactCode}>{contact.code}</Text>
          </View>
        </View>
      )
    }

    return null
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
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
          <View style={styles.headerBar}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                router.back()
              }}
            >
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>

            {!isLoading && contact && (
              <View style={styles.headerActions}>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    router.push(`/contacts/${id}/edit`)
                  }}
                >
                  <Ionicons name="create-outline" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                    deleteDialogRef.current?.present()
                  }}
                >
                  <Ionicons name="trash-outline" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {renderHeaderContent()}
        </View>

        <View style={styles.bottomCurve} />
      </View>

      {/* CONTENT */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={DashboardColors.primary}
          />
        }
      >
        {isLoading && <ContactDetailSkeleton />}

        {!isLoading && (error || !contact) && (
          <ErrorState error={error || 'Cari bulunamadı'} onRetry={fetchContact} />
        )}

        {!isLoading && contact && (
          <>
            <View style={styles.card}>
              <SectionHeader title="Temel Bilgiler" icon="information-circle" />
              <View style={styles.cardContent}>
                <InfoRow label="Cari Tipi" value={getContactTypeLabel(contact.type)} />
                <InfoRow label="Yasal Tip" value={getLegalTypeLabel(contact.legal_type)} />
                {contact.category && <InfoRow label="Kategori" value={contact.category} />}
                {contact.customer_segment && (
                  <InfoRow label="Segment" value={getSegmentLabel(contact.customer_segment)} />
                )}
                {contact.credit_rating && (
                  <InfoRow label="Kredi Notu" value={getCreditRatingLabel(contact.credit_rating)} />
                )}
                <InfoRow label="Durum" value={contact.is_active ? 'Aktif' : 'Pasif'} />
              </View>
            </View>

            <View style={styles.card}>
              <SectionHeader title="İletişim Bilgileri" icon="call" />
              <View style={styles.cardContent}>
                <InfoRow label="Email" value={contact.email || '-'} icon="mail" />
                <InfoRow label="Telefon" value={contact.phone || '-'} icon="call" />
                {contact.fax && <InfoRow label="Faks" value={contact.fax} icon="print" />}
              </View>
            </View>

            <View style={styles.card}>
              <SectionHeader
                title="Adres Bilgileri"
                icon="location"
                count={contact.addresses?.length}
                isExpanded={expandedAddresses}
                onToggle={contact.addresses && contact.addresses.length > 0 ? () => {
                  Haptics.selectionAsync()
                  setExpandedAddresses(!expandedAddresses)
                } : undefined}
              />
              <View style={styles.cardContent}>
                <InfoRow label="Ana Adres" value={contact.main_address || '-'} />

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

            <View style={styles.card}>
              <SectionHeader title="Mali Bilgiler" icon="cash" />
              <View style={styles.cardContent}>
                <InfoRow label="Vergi No" value={contact.tax_number || '-'} />
                {contact.tax_office && <InfoRow label="Vergi Dairesi" value={contact.tax_office.name} />}
                <InfoRow label="Para Birimi" value={contact.currency_type} />
                <InfoRow
                  label="Ödeme Vadesi"
                  value={contact.default_payment_terms ? `${contact.default_payment_terms} gün` : '-'}
                />
                <InfoRow
                  label="Risk Limiti"
                  value={contact.risk_limit ? `${contact.risk_limit} ${contact.currency_type}` : 'Limitsiz'}
                />
              </View>
            </View>

            {contact.authorities && contact.authorities.length > 0 && (
              <View style={styles.card}>
                <SectionHeader
                  title="Yetkili Kişiler"
                  icon="people"
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

            <View style={styles.card}>
              <SectionHeader title="Sistem Bilgileri" icon="time" />
              <View style={styles.cardContent}>
                <InfoRow label="Oluşturulma" value={formatDate(contact.created_at)} />
                <InfoRow label="Son Güncelleme" value={formatDate(contact.updated_at)} />
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <ConfirmDialog
        ref={deleteDialogRef}
        title="Cari Sil"
        message="Bu cariyi silmek istediğinizden emin misiniz?"
        type="danger"
        confirmText="Sil"
        cancelText="İptal"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DashboardColors.background
  },
  headerContainer: {
    position: 'relative',
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
    top: 80,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(16, 185, 129, 0.08)'
  },
  headerContent: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingBottom: DashboardSpacing.lg,
    zIndex: 1
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: DashboardSpacing.lg
  },
  headerActions: {
    flexDirection: 'row',
    gap: DashboardSpacing.md
  },
  contactInfo: {
    gap: DashboardSpacing.sm
  },
  contactName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff'
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm
  },
  contactCode: {
    fontSize: DashboardFontSizes.sm,
    color: 'rgba(255, 255, 255, 0.8)'
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
  scrollView: {
    flex: 1
  },
  scrollContent: {
    padding: DashboardSpacing.lg
  },
  card: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    marginBottom: DashboardSpacing.md,
    overflow: 'hidden'
  },
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
    color: DashboardColors.text
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
  cardContent: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingBottom: DashboardSpacing.lg
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DashboardSpacing.xs
  },
  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.xs,
    flex: 1
  },
  infoLabelText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textMuted
  },
  infoValue: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.text,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1
  },
  expandedContent: {
    gap: DashboardSpacing.md,
    marginTop: DashboardSpacing.md
  },
  addressCard: {
    padding: DashboardSpacing.md,
    backgroundColor: DashboardColors.inputBackground,
    borderRadius: DashboardBorderRadius.lg,
    gap: DashboardSpacing.xs
  },
  addressTitle: {
    fontSize: DashboardFontSizes.md,
    fontWeight: '600',
    color: DashboardColors.text
  },
  addressText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textMuted,
    lineHeight: 20
  },
  addressContact: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textMuted
  },
  authorityCard: {
    padding: DashboardSpacing.md,
    backgroundColor: DashboardColors.inputBackground,
    borderRadius: DashboardBorderRadius.lg,
    gap: DashboardSpacing.xs
  },
  authorityName: {
    fontSize: DashboardFontSizes.md,
    fontWeight: '600',
    color: DashboardColors.text
  },
  authorityTitle: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.text
  },
  authorityDepartment: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textMuted
  },
  authorityContact: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textMuted
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: DashboardSpacing.xl
  },
  errorIcon: {
    marginBottom: DashboardSpacing.lg
  },
  errorTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '700',
    color: DashboardColors.text,
    marginBottom: DashboardSpacing.sm
  },
  errorText: {
    fontSize: DashboardFontSizes.md,
    color: DashboardColors.textMuted,
    textAlign: 'center',
    marginBottom: DashboardSpacing.xl
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    paddingHorizontal: DashboardSpacing.xl,
    paddingVertical: DashboardSpacing.md,
    backgroundColor: DashboardColors.primary,
    borderRadius: DashboardBorderRadius.lg
  },
  retryButtonText: {
    fontSize: DashboardFontSizes.md,
    fontWeight: '600',
    color: '#fff'
  }
})
