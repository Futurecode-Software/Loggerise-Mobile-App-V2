/**
 * İhracat Planlama - Detay & Atama Sayfası
 *
 * Pozisyon detaylarını gösterir ve sürücü/araç ataması yapılmasını sağlar.
 * Tüm atamalar tamamlandığında "Depoya Gönder" butonu aktif olur.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  FlatList
} from 'react-native'
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetView
} from '@gorhom/bottom-sheet'
import * as Haptics from 'expo-haptics'
import Toast from 'react-native-toast-message'
import ConfirmDialog from '@/components/modals/ConfirmDialog'
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
  getExportPlanningPositions,
  assignResource,
  unassignResource,
  sendToWarehouse,
  searchDrivers,
  searchVehicles,
  getDriverFullName,
  getAssignmentStatus,
  PlanningPosition,
  PlanningDriver,
  PlanningVehicle,
  ResourceType
} from '@/services/endpoints/export-planning'

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

// BottomSheet Backdrop
const renderBackdrop = (props: BottomSheetBackdropProps) => (
  <BottomSheetBackdrop
    {...props}
    disappearsOnIndex={-1}
    appearsOnIndex={0}
    opacity={0.5}
  />
)

// =====================================================
// Assignment Card Component
// =====================================================

interface AssignmentCardProps {
  label: string
  icon: string
  resourceType: ResourceType
  assignedDriver?: PlanningDriver
  assignedVehicle?: PlanningVehicle
  onAssign: () => void
  onUnassign: () => void
  isLoading?: boolean
}

function AssignmentCard({
  label,
  icon,
  resourceType,
  assignedDriver,
  assignedVehicle,
  onAssign,
  onUnassign,
  isLoading
}: AssignmentCardProps) {
  const isDriver = resourceType === 'driver' || resourceType === 'second_driver'
  const hasAssignment = isDriver ? !!assignedDriver : !!assignedVehicle

  return (
    <View style={[
      assignStyles.card,
      hasAssignment && assignStyles.cardAssigned
    ]}>
      <View style={assignStyles.cardHeader}>
        <View style={[
          assignStyles.iconContainer,
          { backgroundColor: hasAssignment ? 'rgba(16, 185, 129, 0.12)' : DashboardColors.primaryGlow }
        ]}>
          <Ionicons
            name={hasAssignment ? 'checkmark-circle' : (icon as keyof typeof Ionicons.glyphMap)}
            size={18}
            color={hasAssignment ? DashboardColors.success : DashboardColors.primary}
          />
        </View>
        <Text style={assignStyles.label}>{label}</Text>
        {hasAssignment && (
          <TouchableOpacity
            style={assignStyles.removeButton}
            onPress={onUnassign}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={DashboardColors.danger} />
            ) : (
              <Ionicons name="close-circle" size={20} color={DashboardColors.danger} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {hasAssignment ? (
        <View style={assignStyles.assignedContent}>
          {isDriver && assignedDriver ? (
            <>
              <Text style={assignStyles.assignedName} numberOfLines={1}>
                {getDriverFullName(assignedDriver)}
              </Text>
              {assignedDriver.phone_1 ? (
                <Text style={assignStyles.assignedDetail} numberOfLines={1}>
                  {assignedDriver.phone_1}
                </Text>
              ) : null}
            </>
          ) : !isDriver && assignedVehicle ? (
            <>
              <Text style={assignStyles.assignedName} numberOfLines={1}>
                {assignedVehicle.plate}
              </Text>
              <Text style={assignStyles.assignedDetail} numberOfLines={1}>
                {[assignedVehicle.brand, assignedVehicle.model].filter(Boolean).join(' ')}
              </Text>
            </>
          ) : null}
        </View>
      ) : (
        <TouchableOpacity
          style={assignStyles.assignButton}
          onPress={onAssign}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle-outline" size={18} color={DashboardColors.primary} />
          <Text style={assignStyles.assignButtonText}>Seç</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const assignStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.lg,
    padding: DashboardSpacing.md,
    borderWidth: 1.5,
    borderColor: DashboardColors.borderLight,
    borderStyle: 'dashed'
  },
  cardAssigned: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderStyle: 'solid'
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DashboardSpacing.sm
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  label: {
    flex: 1,
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600',
    color: DashboardColors.textMuted,
    marginLeft: DashboardSpacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  removeButton: {
    padding: 2
  },
  assignedContent: {
    gap: 2
  },
  assignedName: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '700',
    color: DashboardColors.textPrimary
  },
  assignedDetail: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textMuted
  },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.md,
    backgroundColor: DashboardColors.primaryGlow
  },
  assignButtonText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: DashboardColors.primary
  }
})

// =====================================================
// Main Screen
// =====================================================

export default function ExportPlanningDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const positionId = id ? parseInt(id, 10) : null

  // State
  const [position, setPosition] = useState<PlanningPosition | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAssigning, setIsAssigning] = useState<ResourceType | null>(null)
  const [isSending, setIsSending] = useState(false)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<(PlanningDriver | PlanningVehicle)[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [activeResourceType, setActiveResourceType] = useState<ResourceType | null>(null)

  // Refs
  const isMountedRef = useRef(true)
  const searchBottomSheetRef = useRef<BottomSheetModal>(null)
  const sendDialogRef = useRef<BottomSheetModal>(null)
  const searchSnapPoints = useMemo(() => ['92%'], [])
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Assignment status
  const assignmentStatus = position ? getAssignmentStatus(position) : null

  // =====================================================
  // Data Fetching
  // =====================================================

  const fetchPosition = useCallback(async (showLoading = true) => {
    if (!positionId) {
      setError('Geçersiz pozisyon ID')
      setIsLoading(false)
      return
    }

    try {
      if (showLoading) {
        setIsLoading(true)
        setError(null)
      }

      // index endpoint'inden tüm pozisyonları çekip ID ile buluyoruz
      // (Tek pozisyon endpoint'i yok, index'ten alınıyor)
      const response = await getExportPlanningPositions(1, 100)
      const found = response.positions.find(p => p.id === positionId)

      if (isMountedRef.current) {
        if (found) {
          setPosition(found)
          setError(null)
        } else {
          setError('Pozisyon bulunamadı veya depoya gönderilmiş olabilir.')
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Pozisyon bilgileri yüklenemedi')
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
        setRefreshing(false)
      }
    }
  }, [positionId])

  useEffect(() => {
    isMountedRef.current = true
    fetchPosition()

    return () => {
      isMountedRef.current = false
    }
  }, [fetchPosition])

  // Ref pattern - useFocusEffect'in her focus'ta stable kalması için
  const fetchPositionRef = useRef(fetchPosition)
  useEffect(() => {
    fetchPositionRef.current = fetchPosition
  }, [fetchPosition])

  useFocusEffect(
    useCallback(() => {
      fetchPositionRef.current(false)
    }, [])
  )

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchPosition(false)
  }, [fetchPosition])

  // =====================================================
  // Search
  // =====================================================

  const performSearch = useCallback(async (query: string, resourceType: ResourceType) => {
    setIsSearching(true)
    try {
      const isDriver = resourceType === 'driver' || resourceType === 'second_driver'
      if (isDriver) {
        const drivers = await searchDrivers(query)
        if (isMountedRef.current) setSearchResults(drivers)
      } else {
        const vehicleType = resourceType === 'truck_tractor' ? 'truck_tractor' : 'trailer'
        const vehicles = await searchVehicles(query, vehicleType)
        if (isMountedRef.current) setSearchResults(vehicles)
      }
    } catch {
      if (isMountedRef.current) setSearchResults([])
    } finally {
      if (isMountedRef.current) setIsSearching(false)
    }
  }, [])

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text)
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    if (activeResourceType) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(text, activeResourceType)
      }, 300)
    }
  }, [activeResourceType, performSearch])

  // =====================================================
  // Assignment Actions
  // =====================================================

  const openSearchSheet = useCallback((resourceType: ResourceType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setActiveResourceType(resourceType)
    setSearchQuery('')
    setSearchResults([])
    searchBottomSheetRef.current?.present()
    // İlk yükleme - boş arama
    setTimeout(() => performSearch('', resourceType), 100)
  }, [performSearch])

  const handleAssign = useCallback(async (resourceId: number) => {
    if (!positionId || !activeResourceType) return

    setIsAssigning(activeResourceType)
    try {
      const updated = await assignResource(positionId, activeResourceType, resourceId)
      if (isMountedRef.current) {
        setPosition(updated)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        Toast.show({
          type: 'success',
          text1: 'Atama başarıyla yapıldı',
          position: 'top',
          visibilityTime: 1500
        })
        searchBottomSheetRef.current?.dismiss()
      }
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Toast.show({
        type: 'error',
        text1: err instanceof Error ? err.message : 'Atama yapılamadı',
        position: 'top',
        visibilityTime: 1500
      })
    } finally {
      if (isMountedRef.current) setIsAssigning(null)
    }
  }, [positionId, activeResourceType])

  const handleUnassign = useCallback(async (resourceType: ResourceType) => {
    if (!positionId) return

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setIsAssigning(resourceType)
    try {
      const updated = await unassignResource(positionId, resourceType)
      if (isMountedRef.current) {
        setPosition(updated)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        Toast.show({
          type: 'success',
          text1: 'Atama kaldırıldı',
          position: 'top',
          visibilityTime: 1500
        })
      }
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Toast.show({
        type: 'error',
        text1: err instanceof Error ? err.message : 'Atama kaldırılamadı',
        position: 'top',
        visibilityTime: 1500
      })
    } finally {
      if (isMountedRef.current) setIsAssigning(null)
    }
  }, [positionId])

  // =====================================================
  // Send to Warehouse
  // =====================================================

  const handleSendToWarehouse = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    sendDialogRef.current?.present()
  }, [])

  const confirmSendToWarehouse = useCallback(async () => {
    if (!positionId) return

    setIsSending(true)
    try {
      await sendToWarehouse(positionId)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Toast.show({
        type: 'success',
        text1: 'Pozisyon depoya gönderildi',
        position: 'top',
        visibilityTime: 1500
      })
      sendDialogRef.current?.dismiss()
      router.back()
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Toast.show({
        type: 'error',
        text1: err instanceof Error ? err.message : 'Depoya gönderilemedi',
        position: 'top',
        visibilityTime: 1500
      })
    } finally {
      if (isMountedRef.current) setIsSending(false)
    }
  }, [positionId, router])

  // =====================================================
  // Navigation
  // =====================================================

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.back()
  }

  // =====================================================
  // Search Sheet Title
  // =====================================================

  const getSearchTitle = () => {
    switch (activeResourceType) {
      case 'driver': return 'Sürücü 1 Seç'
      case 'second_driver': return 'Sürücü 2 Seç'
      case 'truck_tractor': return 'Çekici Seç'
      case 'trailer': return 'Römork Seç'
      default: return 'Seç'
    }
  }

  const getSearchPlaceholder = () => {
    switch (activeResourceType) {
      case 'driver':
      case 'second_driver':
        return 'İsim, telefon veya sicil no ile ara...'
      case 'truck_tractor':
      case 'trailer':
        return 'Plaka, marka veya model ile ara...'
      default: return 'Ara...'
    }
  }

  const getSearchIcon = () => {
    switch (activeResourceType) {
      case 'driver':
      case 'second_driver':
        return 'person-outline'
      case 'truck_tractor':
        return 'bus-outline'
      case 'trailer':
        return 'trail-sign-outline'
      default: return 'search-outline'
    }
  }

  // =====================================================
  // Load Summary
  // =====================================================

  const loadSummary = useMemo(() => {
    if (!position?.loads) return null
    const loads = position.loads
    const totalPackages = loads.reduce((sum, load) => {
      return sum + (load.items?.reduce((s, item) => s + (Number(item.package_count) || 0), 0) || 0)
    }, 0)
    const totalWeight = loads.reduce((sum, load) => {
      return sum + (load.items?.reduce((s, item) => s + (Number(item.gross_weight) || 0), 0) || 0)
    }, 0)
    const totalVolume = loads.reduce((sum, load) => {
      return sum + (load.items?.reduce((s, item) => s + (Number(item.volume) || 0), 0) || 0)
    }, 0)
    return {
      count: loads.length,
      packages: totalPackages,
      weight: totalWeight,
      volume: totalVolume,
      customer: loads[0]?.customer?.name
    }
  }, [position])

  // =====================================================
  // Render
  // =====================================================

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
          <View style={styles.headerBar}>
            <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>

            {isLoading ? (
              <View style={styles.headerTitleSection}>
                <Skeleton width={140} height={22} />
              </View>
            ) : position ? (
              <View style={styles.headerTitleSection}>
                <Text style={styles.headerName} numberOfLines={1}>
                  {position.position_number}
                </Text>
              </View>
            ) : (
              <View style={styles.headerTitleSection} />
            )}

            <View style={styles.headerActionsPlaceholder} />
          </View>

          {/* Assignment Progress */}
          {!isLoading && position && assignmentStatus ? (
            <View style={styles.progressRow}>
              <View style={styles.progressInfo}>
                <Text style={styles.progressLabel}>Atama Durumu</Text>
                <Text style={styles.progressValue}>
                  {assignmentStatus.assignedCount}/3
                </Text>
              </View>
              <View style={[
                styles.progressBadge,
                {
                  backgroundColor: assignmentStatus.allAssigned
                    ? 'rgba(16, 185, 129, 0.2)'
                    : 'rgba(245, 158, 11, 0.2)'
                }
              ]}>
                <Ionicons
                  name={assignmentStatus.allAssigned ? 'checkmark-circle' : 'time-outline'}
                  size={16}
                  color={assignmentStatus.allAssigned ? DashboardColors.success : '#F59E0B'}
                />
                <Text style={[
                  styles.progressBadgeText,
                  { color: assignmentStatus.allAssigned ? DashboardColors.success : '#F59E0B' }
                ]}>
                  {assignmentStatus.allAssigned ? 'Hazır' : 'Bekliyor'}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.bottomCurve} />
      </View>

      {/* Content */}
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
          <View>
            {[1, 2, 3].map(i => (
              <View key={i} style={styles.card}>
                <View style={{ padding: DashboardSpacing.lg }}>
                  <Skeleton width={140} height={20} />
                  <Skeleton width="100%" height={16} style={{ marginTop: 12 }} />
                  <Skeleton width="80%" height={16} style={{ marginTop: 8 }} />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Error */}
        {!isLoading && (error || !position) && (
          <View style={styles.errorState}>
            <View style={styles.errorIcon}>
              <Ionicons name="alert-circle" size={48} color={DashboardColors.danger} />
            </View>
            <Text style={styles.errorTitle}>Bir hata oluştu</Text>
            <Text style={styles.errorText}>{error || 'Pozisyon bulunamadı'}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchPosition()}>
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Content */}
        {!isLoading && position && (
          <>
            {/* Kaynak Atama */}
            <View style={styles.card}>
              <SectionHeader title="Kaynak Atama" icon="people-outline" />
              <View style={styles.cardContent}>
                <View style={styles.assignmentGrid}>
                  <AssignmentCard
                    label="Sürücü 1"
                    icon="person-outline"
                    resourceType="driver"
                    assignedDriver={position.driver}
                    onAssign={() => openSearchSheet('driver')}
                    onUnassign={() => handleUnassign('driver')}
                    isLoading={isAssigning === 'driver'}
                  />
                  <AssignmentCard
                    label="Sürücü 2"
                    icon="person-outline"
                    resourceType="second_driver"
                    assignedDriver={position.second_driver}
                    onAssign={() => openSearchSheet('second_driver')}
                    onUnassign={() => handleUnassign('second_driver')}
                    isLoading={isAssigning === 'second_driver'}
                  />
                </View>
                <View style={styles.assignmentGrid}>
                  <AssignmentCard
                    label="Çekici"
                    icon="bus-outline"
                    resourceType="truck_tractor"
                    assignedVehicle={position.truck_tractor}
                    onAssign={() => openSearchSheet('truck_tractor')}
                    onUnassign={() => handleUnassign('truck_tractor')}
                    isLoading={isAssigning === 'truck_tractor'}
                  />
                  <AssignmentCard
                    label="Römork"
                    icon="trail-sign-outline"
                    resourceType="trailer"
                    assignedVehicle={position.trailer}
                    onAssign={() => openSearchSheet('trailer')}
                    onUnassign={() => handleUnassign('trailer')}
                    isLoading={isAssigning === 'trailer'}
                  />
                </View>
              </View>
            </View>

            {/* Depoya Gönder */}
            {assignmentStatus?.allAssigned && (
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSendToWarehouse}
                activeOpacity={0.8}
                disabled={isSending}
              >
                <LinearGradient
                  colors={[DashboardColors.primary, DashboardColors.primaryLight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                {isSending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="arrow-forward-circle" size={22} color="#fff" />
                    <Text style={styles.sendButtonText}>Depoya Gönder</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Pozisyon Bilgileri */}
            <View style={styles.card}>
              <SectionHeader title="Pozisyon Bilgileri" icon="airplane-outline" />
              <View style={styles.cardContent}>
                <InfoRow
                  label="Pozisyon No"
                  value={position.position_number}
                  icon="barcode-outline"
                  highlight
                />
                {position.name ? (
                  <InfoRow
                    label="Pozisyon Adı"
                    value={position.name}
                    icon="text-outline"
                  />
                ) : null}
                {position.route ? (
                  <InfoRow
                    label="Güzergah"
                    value={position.route}
                    icon="navigate-outline"
                  />
                ) : null}
                {position.garage_location ? (
                  <InfoRow
                    label="Garaj Lokasyonu"
                    value={position.garage_location}
                    icon="location-outline"
                  />
                ) : null}
                {position.estimated_arrival_date ? (
                  <InfoRow
                    label="Tahmini Varış"
                    value={formatDate(position.estimated_arrival_date)}
                    icon="calendar-outline"
                  />
                ) : null}
              </View>
            </View>

            {/* Sınır Kapıları */}
            {(position.border_exit_gate || position.border_entry_gate) && (
              <View style={styles.card}>
                <SectionHeader title="Sınır Kapıları" icon="flag-outline" />
                <View style={styles.cardContent}>
                  {position.border_exit_gate ? (
                    <InfoRow
                      label="Çıkış Kapısı"
                      value={position.border_exit_gate}
                      icon="log-out-outline"
                    />
                  ) : null}
                  {position.border_entry_gate ? (
                    <InfoRow
                      label="Giriş Kapısı"
                      value={position.border_entry_gate}
                      icon="log-in-outline"
                    />
                  ) : null}
                </View>
              </View>
            )}

            {/* Yük Özeti */}
            {loadSummary && loadSummary.count > 0 && (
              <View style={styles.card}>
                <SectionHeader title="Yük Özeti" icon="cube-outline" />
                <View style={styles.cardContent}>
                  <InfoRow
                    label="Yük Adedi"
                    value={`${loadSummary.count} yük`}
                    icon="layers-outline"
                    highlight
                  />
                  {loadSummary.customer ? (
                    <InfoRow
                      label="Müşteri"
                      value={loadSummary.customer}
                      icon="business-outline"
                    />
                  ) : null}
                  {loadSummary.packages > 0 && (
                    <InfoRow
                      label="Toplam Paket"
                      value={`${loadSummary.packages} paket`}
                      icon="archive-outline"
                    />
                  )}
                  {loadSummary.weight > 0 && (
                    <InfoRow
                      label="Toplam Ağırlık"
                      value={`${loadSummary.weight.toFixed(0)} kg`}
                      icon="barbell-outline"
                    />
                  )}
                  {loadSummary.volume > 0 && (
                    <InfoRow
                      label="Toplam Hacim"
                      value={`${loadSummary.volume.toFixed(2)} m³`}
                      icon="resize-outline"
                    />
                  )}
                </View>
              </View>
            )}

            {/* Notlar */}
            {position.notes ? (
              <View style={styles.card}>
                <SectionHeader title="Notlar" icon="document-text-outline" />
                <View style={styles.cardContent}>
                  <Text style={styles.notesText}>{position.notes}</Text>
                </View>
              </View>
            ) : null}

            {/* Alt boşluk */}
            <View style={{ height: insets.bottom + DashboardSpacing['3xl'] }} />
          </>
        )}
      </ScrollView>

      {/* Search BottomSheet */}
      <BottomSheetModal
        ref={searchBottomSheetRef}
        snapPoints={searchSnapPoints}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.sheetIndicator}
        backgroundStyle={styles.sheetBackground}
        enablePanDownToClose={true}
        enableDynamicSizing={false}
      >
        <BottomSheetView style={styles.sheetContent}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderIcon}>
              <Ionicons
                name={getSearchIcon() as keyof typeof Ionicons.glyphMap}
                size={20}
                color={DashboardColors.primary}
              />
            </View>
            <Text style={styles.sheetTitle}>{getSearchTitle()}</Text>
            <TouchableOpacity
              onPress={() => searchBottomSheetRef.current?.dismiss()}
              style={styles.sheetCloseButton}
            >
              <Ionicons name="close" size={24} color={DashboardColors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={styles.searchInputContainer}>
            <Ionicons name="search-outline" size={18} color={DashboardColors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder={getSearchPlaceholder()}
              placeholderTextColor={DashboardColors.textMuted}
              value={searchQuery}
              onChangeText={handleSearchChange}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {isSearching && (
              <ActivityIndicator size="small" color={DashboardColors.primary} />
            )}
          </View>

          {/* Results */}
          <FlatList
            data={searchResults}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => {
              const isDriver = activeResourceType === 'driver' || activeResourceType === 'second_driver'
              const driver = isDriver ? (item as PlanningDriver) : null
              const vehicle = !isDriver ? (item as PlanningVehicle) : null

              // Zaten atanmış mı kontrol et
              const isCurrentlyAssigned = position && (
                (activeResourceType === 'driver' && position.driver_id === item.id) ||
                (activeResourceType === 'second_driver' && position.second_driver_id === item.id) ||
                (activeResourceType === 'truck_tractor' && position.truck_tractor_id === item.id) ||
                (activeResourceType === 'trailer' && position.trailer_id === item.id)
              )

              return (
                <TouchableOpacity
                  style={[
                    styles.resultItem,
                    isCurrentlyAssigned && styles.resultItemAssigned
                  ]}
                  onPress={() => handleAssign(item.id)}
                  activeOpacity={0.7}
                  disabled={!!isAssigning || !!isCurrentlyAssigned}
                >
                  <View style={[
                    styles.resultIcon,
                    {
                      backgroundColor: isCurrentlyAssigned
                        ? 'rgba(16, 185, 129, 0.12)'
                        : DashboardColors.primaryGlow
                    }
                  ]}>
                    <Ionicons
                      name={isCurrentlyAssigned
                        ? 'checkmark-circle'
                        : (isDriver ? 'person-outline' : 'bus-outline') as keyof typeof Ionicons.glyphMap}
                      size={18}
                      color={isCurrentlyAssigned ? DashboardColors.success : DashboardColors.primary}
                    />
                  </View>
                  <View style={styles.resultContent}>
                    <Text style={styles.resultName} numberOfLines={1}>
                      {driver ? getDriverFullName(driver) : vehicle?.plate}
                    </Text>
                    <Text style={styles.resultDetail} numberOfLines={1}>
                      {driver
                        ? (driver.phone_1 || driver.employee_code || '')
                        : [vehicle?.brand, vehicle?.model].filter(Boolean).join(' ')}
                    </Text>
                  </View>
                  {isCurrentlyAssigned && (
                    <View style={styles.assignedBadge}>
                      <Text style={styles.assignedBadgeText}>Atanmış</Text>
                    </View>
                  )}
                  {isAssigning === activeResourceType && (
                    <ActivityIndicator size="small" color={DashboardColors.primary} />
                  )}
                </TouchableOpacity>
              )
            }}
            contentContainerStyle={styles.resultsList}
            ListEmptyComponent={
              !isSearching ? (
                <View style={styles.emptyResults}>
                  <Ionicons name="search-outline" size={48} color={DashboardColors.textMuted} />
                  <Text style={styles.emptyResultsText}>
                    {searchQuery ? 'Sonuç bulunamadı' : 'Arama yapın'}
                  </Text>
                </View>
              ) : null
            }
          />
        </BottomSheetView>
      </BottomSheetModal>

      {/* Depoya Gönder Onay */}
      <ConfirmDialog
        ref={sendDialogRef}
        title="Depoya Gönder"
        message={`${position?.position_number || ''} pozisyonunu depoya göndermek istediğinizden emin misiniz? Pozisyon artık planlama sayfasında görünmeyecektir.`}
        type="info"
        confirmText="Gönder"
        cancelText="İptal"
        onConfirm={confirmSendToWarehouse}
        isLoading={isSending}
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
    minHeight: 70
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
    marginHorizontal: DashboardSpacing.md
  },
  headerActionsPlaceholder: {
    width: 44
  },
  headerName: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: DashboardSpacing.md
  },
  progressInfo: {},
  progressLabel: {
    fontSize: DashboardFontSizes.xs,
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2
  },
  progressValue: {
    fontSize: DashboardFontSizes['2xl'],
    fontWeight: '800',
    color: '#fff'
  },
  progressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.full,
    gap: 6
  },
  progressBadgeText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600'
  },
  bottomCurve: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 24,
    backgroundColor: DashboardColors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24
  },

  // Content
  content: {
    flex: 1,
    backgroundColor: DashboardColors.background
  },
  contentContainer: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingBottom: DashboardSpacing.xl
  },

  // Card
  card: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    marginBottom: DashboardSpacing.lg,
    overflow: 'hidden',
    ...DashboardShadows.sm
  },
  cardContent: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingBottom: DashboardSpacing.lg
  },

  // Assignment Grid
  assignmentGrid: {
    flexDirection: 'row',
    gap: DashboardSpacing.md,
    marginBottom: DashboardSpacing.md
  },

  // Send to Warehouse Button
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DashboardSpacing.sm,
    height: 52,
    borderRadius: DashboardBorderRadius.xl,
    marginBottom: DashboardSpacing.lg,
    overflow: 'hidden'
  },
  sendButtonText: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: '#fff'
  },

  // Notes
  notesText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    lineHeight: 22
  },

  // Error State
  errorState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DashboardSpacing['3xl'],
    paddingHorizontal: DashboardSpacing.xl
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.lg
  },
  errorTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
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
    borderRadius: DashboardBorderRadius.lg,
    backgroundColor: DashboardColors.primary
  },
  retryButtonText: {
    fontSize: DashboardFontSizes.md,
    fontWeight: '600',
    color: '#fff'
  },

  // BottomSheet
  sheetIndicator: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    width: 36,
    height: 5,
    borderRadius: 3
  },
  sheetBackground: {
    backgroundColor: DashboardColors.surface,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12
  },
  sheetContent: {
    flex: 1
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DashboardSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight
  },
  sheetHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: DashboardBorderRadius.lg,
    backgroundColor: DashboardColors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sheetTitle: {
    flex: 1,
    fontSize: DashboardFontSizes.xl,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
    marginLeft: DashboardSpacing.md
  },
  sheetCloseButton: {
    padding: DashboardSpacing.xs
  },

  // Search Input
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    margin: DashboardSpacing.lg,
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
    backgroundColor: DashboardColors.background,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight
  },
  searchInput: {
    flex: 1,
    fontSize: DashboardFontSizes.md,
    color: DashboardColors.textPrimary,
    padding: 0
  },

  // Results
  resultsList: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingBottom: DashboardSpacing['3xl']
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
    backgroundColor: DashboardColors.background,
    marginBottom: DashboardSpacing.sm,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight
  },
  resultItemAssigned: {
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
    borderColor: 'rgba(16, 185, 129, 0.3)'
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: DashboardBorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center'
  },
  resultContent: {
    flex: 1,
    marginLeft: DashboardSpacing.md
  },
  resultName: {
    fontSize: DashboardFontSizes.md,
    fontWeight: '600',
    color: DashboardColors.textPrimary
  },
  resultDetail: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textMuted,
    marginTop: 2
  },
  assignedBadge: {
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 2,
    borderRadius: DashboardBorderRadius.md,
    backgroundColor: 'rgba(16, 185, 129, 0.12)'
  },
  assignedBadgeText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600',
    color: DashboardColors.success
  },
  emptyResults: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DashboardSpacing['3xl']
  },
  emptyResultsText: {
    fontSize: DashboardFontSizes.md,
    color: DashboardColors.textMuted,
    marginTop: DashboardSpacing.md
  }
})
