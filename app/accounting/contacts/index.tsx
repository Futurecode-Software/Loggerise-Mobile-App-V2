/**
 * Accounting Cariler Liste Sayfası
 *
 * CLAUDE.md tasarım ilkelerine uygun modern liste sayfası
 * Referans: app/crm/customers/index.tsx
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Pressable,
  ScrollView
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { BottomSheetModal, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import * as Haptics from 'expo-haptics'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring
} from 'react-native-reanimated'
import { PageHeader } from '@/components/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardBorderRadius,
  DashboardFontSizes,
  DashboardShadows,
  DashboardAnimations
} from '@/constants/dashboard-theme'
import {
  getContacts,
  Contact,
  ContactFilters,
  ContactType,
  ContactStatus,
  Pagination
} from '@/services/endpoints/contacts'
import { getContactTypeLabel } from '@/utils/contacts/labels'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// Tip filtreleri
const TYPE_FILTERS: { id: 'all' | ContactType; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { id: 'all', label: 'Tümü', icon: 'layers-outline', color: '#6B7280' },
  { id: 'customer', label: 'Müşteri', icon: 'people-outline', color: '#10B981' },
  { id: 'supplier', label: 'Tedarikçi', icon: 'cube-outline', color: '#3B82F6' },
  { id: 'both', label: 'Her İkisi', icon: 'swap-horizontal-outline', color: '#8B5CF6' },
  { id: 'potential', label: 'Potansiyel', icon: 'star-outline', color: '#F59E0B' },
  { id: 'other', label: 'Diğer', icon: 'ellipsis-horizontal-outline', color: '#6B7280' }
]

// Durum filtreleri
const STATUS_FILTERS: { id: 'all' | ContactStatus; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { id: 'all', label: 'Tümü', icon: 'layers-outline', color: '#6B7280' },
  { id: 'active', label: 'Aktif', icon: 'checkmark-circle-outline', color: '#10B981' },
  { id: 'passive', label: 'Pasif', icon: 'pause-circle-outline', color: '#F59E0B' },
  { id: 'blacklist', label: 'Kara Liste', icon: 'close-circle-outline', color: '#EF4444' }
]

// Para birimi filtreleri
const CURRENCY_FILTERS: { id: 'all' | 'TRY' | 'USD' | 'EUR' | 'GBP'; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { id: 'all', label: 'Tümü', icon: 'layers-outline', color: '#6B7280' },
  { id: 'TRY', label: 'TRY (₺)', icon: 'cash-outline', color: '#10B981' },
  { id: 'USD', label: 'USD ($)', icon: 'logo-usd', color: '#3B82F6' },
  { id: 'EUR', label: 'EUR (€)', icon: 'cash-outline', color: '#8B5CF6' },
  { id: 'GBP', label: 'GBP (£)', icon: 'cash-outline', color: '#F59E0B' }
]

// Status renkleri
const STATUS_COLORS: Record<string, { primary: string; bg: string }> = {
  active: { primary: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
  passive: { primary: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
  blacklist: { primary: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' }
}

// Skeleton Component
function ContactCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Skeleton width={48} height={48} borderRadius={12} />
        <View style={{ flex: 1, marginLeft: DashboardSpacing.sm }}>
          <Skeleton width={140} height={18} />
          <Skeleton width={100} height={14} style={{ marginTop: 4 }} />
        </View>
        <Skeleton width={60} height={24} borderRadius={12} />
      </View>
      <View style={styles.cardInfo}>
        <Skeleton width={120} height={14} />
        <Skeleton width={100} height={14} />
      </View>
      <View style={styles.cardFooter}>
        <Skeleton width={80} height={14} />
        <Skeleton width={80} height={14} />
      </View>
    </View>
  )
}

// Card Component
interface ContactCardProps {
  item: Contact
  onPress: () => void
}

function ContactCard({ item, onPress }: ContactCardProps) {
  const scale = useSharedValue(1)
  const statusColors = STATUS_COLORS[item.status] || STATUS_COLORS.active

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }))

  const handlePressIn = () => {
    scale.value = withSpring(0.98, DashboardAnimations.springBouncy)
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, DashboardAnimations.springBouncy)
  }

  // İkon seçimi (tip bazlı)
  const getTypeIcon = (type: ContactType): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'customer':
        return 'people-outline'
      case 'supplier':
        return 'cube-outline'
      case 'both':
        return 'swap-horizontal-outline'
      case 'potential':
        return 'star-outline'
      case 'self':
        return 'business-outline'
      default:
        return 'person-outline'
    }
  }

  return (
    <AnimatedPressable
      style={[styles.card, animStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={[styles.cardIcon, { backgroundColor: DashboardColors.primaryGlow }]}>
          <Ionicons name={getTypeIcon(item.type)} size={20} color={DashboardColors.primary} />
        </View>
        <View style={styles.cardHeaderContent}>
          <Text style={styles.cardName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.cardCode} numberOfLines={1}>
            {item.code}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
          <Text style={[styles.statusBadgeText, { color: statusColors.primary }]}>
            {item.status === 'active' ? 'Aktif' : item.status === 'passive' ? 'Pasif' : 'Kara Liste'}
          </Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        <View style={styles.infoRow}>
          <Ionicons name="layers-outline" size={14} color={DashboardColors.textMuted} />
          <Text style={styles.infoText}>{getContactTypeLabel(item.type)}</Text>
        </View>
        {item.phone && (
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={14} color={DashboardColors.textMuted} />
            <Text style={styles.infoText}>{item.phone}</Text>
          </View>
        )}
        {item.email && (
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={14} color={DashboardColors.textMuted} />
            <Text style={styles.infoText} numberOfLines={1}>{item.email}</Text>
          </View>
        )}
      </View>

      {/* Footer */}
      {(item.customer_segment || item.business_type) && (
        <View style={styles.cardFooter}>
          {item.customer_segment && (
            <View style={styles.statItem}>
              <Ionicons name="analytics-outline" size={14} color={DashboardColors.textMuted} />
              <Text style={styles.statText}>
                {item.customer_segment === 'enterprise' ? 'Kurumsal' :
                 item.customer_segment === 'mid_market' ? 'Orta Ölçek' :
                 item.customer_segment === 'small_business' ? 'Küçük İşletme' : 'Bireysel'}
              </Text>
            </View>
          )}
          {item.business_type && (
            <View style={styles.statItem}>
              <Ionicons name="briefcase-outline" size={14} color={DashboardColors.textMuted} />
              <Text style={styles.statText}>
                {item.business_type === 'customs_agent' ? 'Gümrük' :
                 item.business_type === 'logistics_partner' ? 'Lojistik' :
                 item.business_type === 'bank' ? 'Banka' :
                 item.business_type === 'insurance' ? 'Sigorta' : 'Diğer'}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Arrow */}
      <View style={styles.cardArrow}>
        <Ionicons name="chevron-forward" size={20} color={DashboardColors.textMuted} />
      </View>
    </AnimatedPressable>
  )
}

// Empty State
function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="people-outline" size={64} color={DashboardColors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>
        {hasSearch ? 'Cari bulunamadı' : 'Henüz cari yok'}
      </Text>
      <Text style={styles.emptyText}>
        {hasSearch
          ? 'Arama kriterlerinize uygun cari bulunamadı'
          : 'Yeni cari eklemek için sağ üstteki + butonuna tıklayın'}
      </Text>
    </View>
  )
}

export default function ContactsListScreen() {
  const [refreshing, setRefreshing] = useState(false)

  // Filter states
  const [activeTypeFilter, setActiveTypeFilter] = useState<'all' | ContactType>('all')
  const [activeStatusFilter, setActiveStatusFilter] = useState<'all' | ContactStatus>('all')
  const [activeCurrencyFilter, setActiveCurrencyFilter] = useState<'all' | 'TRY' | 'USD' | 'EUR' | 'GBP'>('all')

  // Temp filter states (for modal)
  const [tempTypeFilter, setTempTypeFilter] = useState<'all' | ContactType>('all')
  const [tempStatusFilter, setTempStatusFilter] = useState<'all' | ContactStatus>('all')
  const [tempCurrencyFilter, setTempCurrencyFilter] = useState<'all' | 'TRY' | 'USD' | 'EUR' | 'GBP'>('all')

  // API state
  const [contacts, setContacts] = useState<Contact[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Refs
  const isMountedRef = useRef(true)
  const fetchIdRef = useRef(0)
  const hasInitialFetchRef = useRef(false)
  const filterModalRef = useRef<BottomSheetModal>(null)

  // Veri çekme fonksiyonu
  const executeFetch = useCallback(
    async (
      typeFilter: 'all' | ContactType,
      statusFilter: 'all' | ContactStatus,
      currencyFilter: 'all' | 'TRY' | 'USD' | 'EUR' | 'GBP',
      page: number = 1,
      append: boolean = false
    ) => {
      const currentFetchId = ++fetchIdRef.current

      try {
        setError(null)

        const filters: ContactFilters = {
          page,
          per_page: 20,
          is_active: true
        }

        if (typeFilter !== 'all') {
          filters.type = typeFilter
        }

        if (statusFilter !== 'all') {
          filters.status = statusFilter
        }

        if (currencyFilter !== 'all') {
          filters.currency_type = currencyFilter
        }

        const response = await getContacts(filters)

        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (append) {
            setContacts((prev) => [...prev, ...response.contacts])
          } else {
            setContacts(response.contacts)
          }
          setPagination(response.pagination)
          hasInitialFetchRef.current = true
        }
      } catch (err) {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (__DEV__) console.error('Contacts fetch error:', err)
          setError(err instanceof Error ? err.message : 'Cariler yüklenemedi')
        }
      } finally {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          setIsLoading(false)
          setIsLoadingMore(false)
          setRefreshing(false)
        }
      }
    },
    []
  )

  // İlk yükleme
  useEffect(() => {
    isMountedRef.current = true
    executeFetch(activeTypeFilter, activeStatusFilter, activeCurrencyFilter, 1, false)

    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Filtre değişimi
  useEffect(() => {
    if (!hasInitialFetchRef.current) return

    setIsLoading(true)
    executeFetch(activeTypeFilter, activeStatusFilter, activeCurrencyFilter, 1, false)
  }, [activeTypeFilter, activeStatusFilter, activeCurrencyFilter])

  // Ekran focus olduğunda yenile
  useFocusEffect(
    useCallback(() => {
      if (hasInitialFetchRef.current) {
        executeFetch(activeTypeFilter, activeStatusFilter, activeCurrencyFilter, 1, false)
      }
    }, [activeTypeFilter, activeStatusFilter, activeCurrencyFilter, executeFetch])
  )

  const onRefresh = async () => {
    setRefreshing(true)
    await executeFetch(activeTypeFilter, activeStatusFilter, activeCurrencyFilter, 1, false)
  }

  const loadMore = () => {
    if (
      !isLoadingMore &&
      pagination &&
      pagination.current_page < pagination.last_page
    ) {
      setIsLoadingMore(true)
      executeFetch(activeTypeFilter, activeStatusFilter, activeCurrencyFilter, pagination.current_page + 1, true)
    }
  }

  const handleCardPress = (item: Contact) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/accounting/contacts/${item.id}`)
  }

  const handleNewPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    router.push('/accounting/contacts/new')
  }

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.back()
  }

  // Filter Modal handlers
  const openFilterModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    // Sync temp filters with active filters
    setTempTypeFilter(activeTypeFilter)
    setTempStatusFilter(activeStatusFilter)
    setTempCurrencyFilter(activeCurrencyFilter)
    filterModalRef.current?.present()
  }

  const applyFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setActiveTypeFilter(tempTypeFilter)
    setActiveStatusFilter(tempStatusFilter)
    setActiveCurrencyFilter(tempCurrencyFilter)
    filterModalRef.current?.dismiss()
  }

  const clearFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setTempTypeFilter('all')
    setTempStatusFilter('all')
    setTempCurrencyFilter('all')
  }

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  )

  // Aktif filtre sayısı
  const activeFilterCount =
    (activeTypeFilter !== 'all' ? 1 : 0) +
    (activeStatusFilter !== 'all' ? 1 : 0) +
    (activeCurrencyFilter !== 'all' ? 1 : 0)

  return (
    <View style={styles.container}>
      <PageHeader
        title="Cariler"
        icon="people-outline"
        subtitle={pagination ? `${pagination.total} cari` : undefined}
        showBackButton
        onBackPress={handleBackPress}
        rightActions={[
          {
            icon: 'funnel',
            onPress: openFilterModal,
            badge: activeFilterCount > 0 ? activeFilterCount : undefined
          },
          {
            icon: 'add',
            onPress: handleNewPress
          }
        ]}
      />

      <View style={styles.content}>

        {/* List */}
        {isLoading ? (
          <View style={styles.listContent}>
            <ContactCardSkeleton />
            <ContactCardSkeleton />
            <ContactCardSkeleton />
          </View>
        ) : (
          <FlatList
            data={contacts}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <ContactCard
                item={item}
                onPress={() => handleCardPress(item)}
              />
            )}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<EmptyState hasSearch={activeFilterCount > 0} />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={DashboardColors.primary}
              />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Filter Modal */}
      <BottomSheetModal
        ref={filterModalRef}
        snapPoints={['92%']}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.modalBackground}
        handleIndicatorStyle={styles.modalIndicator}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtreler</Text>
            <TouchableOpacity onPress={clearFilters} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Temizle</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Cari Tipi */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Cari Tipi</Text>
              <View style={styles.filterGrid}>
                {TYPE_FILTERS.map((filter) => {
                  const isActive = tempTypeFilter === filter.id
                  return (
                    <TouchableOpacity
                      key={filter.id}
                      style={[
                        styles.filterGridItem,
                        isActive && styles.filterGridItemActive
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync()
                        setTempTypeFilter(filter.id)
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={filter.icon}
                        size={20}
                        color={isActive ? '#fff' : filter.color}
                      />
                      <Text style={[
                        styles.filterGridItemText,
                        isActive && styles.filterGridItemTextActive
                      ]}>
                        {filter.label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>

            {/* Durum */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Durum</Text>
              <View style={styles.filterGrid}>
                {STATUS_FILTERS.map((filter) => {
                  const isActive = tempStatusFilter === filter.id
                  return (
                    <TouchableOpacity
                      key={filter.id}
                      style={[
                        styles.filterGridItem,
                        isActive && styles.filterGridItemActive
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync()
                        setTempStatusFilter(filter.id)
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={filter.icon}
                        size={20}
                        color={isActive ? '#fff' : filter.color}
                      />
                      <Text style={[
                        styles.filterGridItemText,
                        isActive && styles.filterGridItemTextActive
                      ]}>
                        {filter.label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>

            {/* Para Birimi */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Para Birimi</Text>
              <View style={styles.filterGrid}>
                {CURRENCY_FILTERS.map((filter) => {
                  const isActive = tempCurrencyFilter === filter.id
                  return (
                    <TouchableOpacity
                      key={filter.id}
                      style={[
                        styles.filterGridItem,
                        isActive && styles.filterGridItemActive
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync()
                        setTempCurrencyFilter(filter.id)
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={filter.icon}
                        size={20}
                        color={isActive ? '#fff' : filter.color}
                      />
                      <Text style={[
                        styles.filterGridItemText,
                        isActive && styles.filterGridItemTextActive
                      ]}>
                        {filter.label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          </ScrollView>

          {/* Apply Button */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={applyFilters}
              activeOpacity={0.8}
            >
              <Text style={styles.applyButtonText}>Uygula</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheetModal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DashboardColors.primary
  },
  content: {
    flex: 1,
    backgroundColor: DashboardColors.background
  },

  // List
  listContent: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: 0,
    paddingBottom: DashboardSpacing.xl
  },

  // Card
  card: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.lg,
    marginBottom: DashboardSpacing.md,
    position: 'relative',
    ...DashboardShadows.md
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DashboardSpacing.md
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardHeaderContent: {
    flex: 1,
    marginLeft: DashboardSpacing.sm,
    marginRight: DashboardSpacing.md
  },
  cardName: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
    letterSpacing: 0.3,
    marginBottom: 2
  },
  cardCode: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textMuted,
    fontWeight: '500'
  },
  statusBadge: {
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 4,
    borderRadius: DashboardBorderRadius.md
  },
  statusBadgeText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '700'
  },
  cardInfo: {
    gap: DashboardSpacing.xs,
    paddingBottom: DashboardSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm
  },
  infoText: {
    flex: 1,
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textMuted
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 0,
    gap: DashboardSpacing.lg
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.xs
  },
  statText: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textMuted
  },
  cardArrow: {
    position: 'absolute',
    right: DashboardSpacing.md,
    bottom: DashboardSpacing.lg + 4
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DashboardSpacing['3xl'],
    paddingHorizontal: DashboardSpacing.xl
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: DashboardColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.xl
  },
  emptyTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.sm,
    textAlign: 'center'
  },
  emptyText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textMuted,
    textAlign: 'center',
    lineHeight: 24
  },

  // Filter Modal
  modalBackground: {
    backgroundColor: DashboardColors.surface
  },
  modalIndicator: {
    backgroundColor: DashboardColors.borderLight
  },
  modalContent: {
    flex: 1,
    backgroundColor: DashboardColors.surface
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: DashboardSpacing.xl,
    paddingVertical: DashboardSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight
  },
  modalTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '700',
    color: DashboardColors.textPrimary
  },
  clearButton: {
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.xs
  },
  clearButtonText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: DashboardColors.primary
  },
  modalScroll: {
    flex: 1
  },
  modalScrollContent: {
    paddingHorizontal: DashboardSpacing.xl,
    paddingTop: DashboardSpacing.lg,
    paddingBottom: DashboardSpacing['3xl']
  },
  filterSection: {
    marginBottom: DashboardSpacing.xl
  },
  filterSectionTitle: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: DashboardColors.textSecondary,
    marginBottom: DashboardSpacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DashboardSpacing.sm
  },
  filterGridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    paddingVertical: DashboardSpacing.md,
    paddingHorizontal: DashboardSpacing.lg,
    borderRadius: DashboardBorderRadius.lg,
    backgroundColor: DashboardColors.background,
    borderWidth: 2,
    borderColor: DashboardColors.borderLight,
    minWidth: '47%'
  },
  filterGridItemActive: {
    backgroundColor: DashboardColors.primary,
    borderColor: DashboardColors.primary
  },
  filterGridItemText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    flex: 1
  },
  filterGridItemTextActive: {
    color: '#fff'
  },
  modalFooter: {
    padding: DashboardSpacing.xl,
    borderTopWidth: 1,
    borderTopColor: DashboardColors.borderLight,
    backgroundColor: DashboardColors.surface
  },
  applyButton: {
    backgroundColor: DashboardColors.primary,
    borderRadius: DashboardBorderRadius.lg,
    paddingVertical: DashboardSpacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...DashboardShadows.md
  },
  applyButtonText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '700',
    color: '#fff'
  }
})
