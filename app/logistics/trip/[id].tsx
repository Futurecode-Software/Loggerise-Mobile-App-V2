/**
 * Sefer Detay Sayfası
 *
 * CLAUDE.md tasarım ilkelerine uygun detay sayfası
 * - useFocusEffect ile edit'ten dönüşte yenileme
 * - isMountedRef ile memory leak önleme
 * - ConfirmDialog ile silme onayı
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import Toast from 'react-native-toast-message'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import { PageHeader } from '@/components/navigation'
import ConfirmDialog from '@/components/modals/ConfirmDialog'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardBorderRadius,
  DashboardFontSizes,
  DashboardShadows
} from '@/constants/dashboard-theme'
import { formatCurrency } from '@/utils/currency'
import {
  getTrip,
  deleteTrip,
  Trip,
  getTripStatusLabel,
  getTripStatusVariant,
  getVehicleOwnerTypeLabel,
  getDriverFullName,
  getTripTypeLabel,
} from '@/services/endpoints/trips'
import {
  getPositions,
  Position,
  getPositionTypeLabel,
} from '@/services/endpoints/positions'

// Tab types
type TabId = 'info' | 'loads' | 'positions'

const TABS: { id: TabId; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'info', label: 'Bilgiler', icon: 'document-text-outline' },
  { id: 'loads', label: 'Yükler', icon: 'cube-outline' },
  { id: 'positions', label: 'Pozisyonlar', icon: 'location-outline' },
]

// Status renkleri
const STATUS_COLORS: Record<string, { primary: string; bg: string }> = {
  planning: { primary: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
  active: { primary: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' },
  completed: { primary: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
  cancelled: { primary: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' }
}

// SectionHeader Component
function SectionHeader({ title, icon }: { title: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={18} color={DashboardColors.primary} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  )
}

// InfoRow Component
function InfoRow({ label, value, icon }: { label: string; value?: string | number | boolean; icon?: keyof typeof Ionicons.glyphMap }) {
  if (value === undefined || value === null || value === '' || value === false || value === '-') return null
  const displayValue = typeof value === 'boolean' ? 'Evet' : String(value)
  if (!displayValue || displayValue.trim() === '') return null

  return (
    <View style={styles.infoRow}>
      {icon && <Ionicons name={icon} size={16} color={DashboardColors.textMuted} />}
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue}>{displayValue}</Text>
    </View>
  )
}

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()

  const [trip, setTrip] = useState<Trip | null>(null)
  const [positions, setPositions] = useState<Position[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingPositions, setIsLoadingPositions] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('info')
  const [isDeleting, setIsDeleting] = useState(false)
  const deleteDialogRef = useRef<BottomSheetModal>(null)

  // Memory leak koruması
  const isMountedRef = useRef(true)

  // Sefer verilerini çek
  const fetchTrip = useCallback(async (showLoading = true) => {
    if (!id) return

    try {
      if (showLoading) setError(null)
      const data = await getTrip(parseInt(id, 10))
      if (isMountedRef.current) {
        setTrip(data)
      }
    } catch (err) {
      if (isMountedRef.current) {
        if (__DEV__) console.error('Trip fetch error:', err)
        let errorMessage = 'Sefer bilgileri yüklenemedi'
        if (err instanceof Error) {
          if (err.message.includes('status code 500')) {
            errorMessage = 'Sunucu hatası: Sefer kaydı alınamadı. Lütfen daha sonra tekrar deneyin.'
          } else if (err.message.includes('status code 404')) {
            errorMessage = 'Sefer bulunamadı. Silinmiş veya mevcut olmayan bir sefer olabilir.'
          } else {
            errorMessage = err.message
          }
        }
        setError(errorMessage)
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
        setRefreshing(false)
      }
    }
  }, [id])

  // Pozisyonları çek
  const fetchPositions = useCallback(async () => {
    if (!id) return

    try {
      setIsLoadingPositions(true)
      const response = await getPositions({
        trip_id: parseInt(id, 10),
        per_page: 100,
      })
      if (isMountedRef.current) {
        setPositions(response.positions)
      }
    } catch (err) {
      if (__DEV__) console.error('Positions fetch error:', err)
    } finally {
      if (isMountedRef.current) {
        setIsLoadingPositions(false)
      }
    }
  }, [id])

  // İlk yükleme
  useEffect(() => {
    isMountedRef.current = true
    fetchTrip()
    fetchPositions()

    return () => {
      isMountedRef.current = false
    }
  }, [fetchTrip, fetchPositions])

  // Edit'ten dönüşte yenileme
  useFocusEffect(
    useCallback(() => {
      fetchTrip(false)
      fetchPositions()
    }, [fetchTrip, fetchPositions])
  )

  const onRefresh = () => {
    setRefreshing(true)
    fetchTrip()
    fetchPositions()
  }

  // Silme dialog'unu aç
  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    deleteDialogRef.current?.present()
  }

  // Silme işlemini gerçekleştir
  const handleConfirmDelete = async () => {
    if (!id) return
    setIsDeleting(true)
    try {
      await deleteTrip(parseInt(id, 10))
      deleteDialogRef.current?.dismiss()
      Toast.show({ type: 'success', text1: 'Başarılı', text2: 'Sefer silindi', position: 'top', visibilityTime: 1500 })
      router.back()
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Hata', text2: err instanceof Error ? err.message : 'Sefer silinemedi', position: 'top', visibilityTime: 1500 })
    } finally {
      setIsDeleting(false)
    }
  }

  // Tarih formatlama
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-'
    try {
      return new Date(dateString).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  // Geri butonu
  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.back()
  }

  // Düzenle butonu
  const handleEditPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/logistics/trip/${trip?.id}/edit`)
  }

  // Bilgiler tab'ı
  const renderInfoTab = () => {
    if (!trip) return null

    return (
      <View style={styles.tabContent}>
        {/* Genel Bilgiler */}
        <View style={styles.sectionCard}>
          <SectionHeader title="Genel Bilgiler" icon="information-circle-outline" />
          <InfoRow label="Sefer No" value={trip.trip_number} />
          <InfoRow label="Sefer Tipi" value={getTripTypeLabel(trip.trip_type)} />
          <InfoRow label="Güzergah" value={trip.route} icon="navigate-outline" />
          <InfoRow label="Tahmini Varış" value={formatDate(trip.estimated_arrival_date)} icon="calendar-outline" />
          <InfoRow label="Gerçek Varış" value={formatDate(trip.actual_arrival_date)} icon="checkmark-circle-outline" />
          <InfoRow label="Notlar" value={trip.notes} icon="document-text-outline" />
        </View>

        {/* Taşıma Tipi */}
        {!!(trip.is_roro || trip.is_train || trip.is_mafi) && (
          <View style={styles.sectionCard}>
            <SectionHeader title="Taşıma Tipi" icon="swap-horizontal-outline" />
            <InfoRow label="RoRo" value={trip.is_roro} icon="boat-outline" />
            <InfoRow label="Tren" value={trip.is_train} icon="train-outline" />
            <InfoRow label="Mafi" value={trip.is_mafi} icon="cube-outline" />
          </View>
        )}

        {/* Araç Bilgileri */}
        <View style={styles.sectionCard}>
          <SectionHeader title="Araç Bilgileri" icon="car-outline" />
          <InfoRow label="Araç Durumu" value={getVehicleOwnerTypeLabel(trip.vehicle_owner_type)} />
          {trip.vehicle_owner_contact && <InfoRow label="Araç Sahibi" value={trip.vehicle_owner_contact.name} icon="business-outline" />}
          {trip.truck_tractor && <InfoRow label="Çekici" value={trip.truck_tractor.plate} icon="car-sport-outline" />}
          {trip.trailer && <InfoRow label="Römork" value={trip.trailer.plate} icon="trail-sign-outline" />}
          <InfoRow label="Konum" value={trip.manual_location} icon="location-outline" />
        </View>

        {/* Sürücü Bilgileri */}
        <View style={styles.sectionCard}>
          <SectionHeader title="Sürücü Bilgileri" icon="person-outline" />
          {trip.driver && <InfoRow label="1. Sürücü" value={getDriverFullName(trip.driver)} icon="person-outline" />}
          {trip.second_driver && <InfoRow label="2. Sürücü" value={getDriverFullName(trip.second_driver)} icon="people-outline" />}
        </View>

        {/* Garaj Bilgileri */}
        {!!(trip.garage_location || trip.garage_entry_date || trip.garage_exit_date) && (
          <View style={styles.sectionCard}>
            <SectionHeader title="Garaj Bilgileri" icon="home-outline" />
            <InfoRow label="Garaj Konumu" value={trip.garage_location} />
            <InfoRow label="Giriş Tarihi" value={formatDate(trip.garage_entry_date)} icon="enter-outline" />
            <InfoRow label="Çıkış Tarihi" value={formatDate(trip.garage_exit_date)} icon="exit-outline" />
          </View>
        )}

        {/* Sınır Kapısı - Çıkış */}
        {!!(trip.border_exit_gate || trip.border_exit_date) && (
          <View style={styles.sectionCard}>
            <SectionHeader title="Sınır Kapısı - Çıkış" icon="arrow-forward-circle-outline" />
            <InfoRow label="Çıkış Kapısı" value={trip.border_exit_gate} />
            <InfoRow label="Çıkış Tarihi" value={formatDate(trip.border_exit_date)} icon="calendar-outline" />
            <InfoRow label="Manifest No" value={trip.border_exit_manifest_no} />
            <InfoRow label="Manifest Tarihi" value={formatDate(trip.border_exit_manifest_date)} />
          </View>
        )}

        {/* Sınır Kapısı - Giriş */}
        {!!(trip.border_entry_gate || trip.border_entry_date) && (
          <View style={styles.sectionCard}>
            <SectionHeader title="Sınır Kapısı - Giriş" icon="arrow-back-circle-outline" />
            <InfoRow label="Giriş Kapısı" value={trip.border_entry_gate} />
            <InfoRow label="Giriş Tarihi" value={formatDate(trip.border_entry_date)} icon="calendar-outline" />
            <InfoRow label="Manifest No" value={trip.border_entry_manifest_no} />
            <InfoRow label="Manifest Tarihi" value={formatDate(trip.border_entry_manifest_date)} />
          </View>
        )}

        {/* Mühür Bilgileri */}
        {!!(trip.seal_no || trip.sealing_person) && (
          <View style={styles.sectionCard}>
            <SectionHeader title="Mühür Bilgileri" icon="lock-closed-outline" />
            <InfoRow label="Mühür No" value={trip.seal_no} />
            <InfoRow label="Mühürleyen Kişi" value={trip.sealing_person} icon="person-outline" />
          </View>
        )}

        {/* Sigorta Bilgileri */}
        {!!(trip.insurance_status || trip.insurance_date || trip.insurance_amount) && (
          <View style={styles.sectionCard}>
            <SectionHeader title="Sigorta Bilgileri" icon="shield-checkmark-outline" />
            <InfoRow label="Sigorta Durumu" value={trip.insurance_status} />
            <InfoRow label="Sigorta Tarihi" value={formatDate(trip.insurance_date)} icon="calendar-outline" />
            <InfoRow label="Sigorta Tutarı" value={formatCurrency(trip.insurance_amount, trip.insurance_currency)} icon="cash-outline" />
          </View>
        )}

        {/* Yakıt Bilgileri */}
        {!!(trip.current_fuel_liters || trip.fuel_added_liters || trip.remaining_fuel_liters) && (
          <View style={styles.sectionCard}>
            <SectionHeader title="Yakıt Bilgileri" icon="flash-outline" />
            <InfoRow label="Mevcut Yakıt" value={trip.current_fuel_liters ? `${trip.current_fuel_liters} L` : undefined} />
            <InfoRow label="Eklenen Yakıt" value={trip.fuel_added_liters ? `${trip.fuel_added_liters} L` : undefined} />
            <InfoRow label="Kalan Yakıt" value={trip.remaining_fuel_liters ? `${trip.remaining_fuel_liters} L` : undefined} />
            <InfoRow label="Tüketim Yüzdesi" value={trip.fuel_consumption_percentage ? `%${trip.fuel_consumption_percentage}` : undefined} />
          </View>
        )}

        {/* Kiralama Bilgileri */}
        {trip.vehicle_owner_type === 'rental' && !!trip.rental_fee && (
          <View style={styles.sectionCard}>
            <SectionHeader title="Kiralama Bilgileri" icon="receipt-outline" />
            <InfoRow label="Kiralama Ücreti" value={formatCurrency(trip.rental_fee, trip.rental_currency)} icon="cash-outline" />
          </View>
        )}
      </View>
    )
  }

  // Yükler tab'ı
  const renderLoadsTab = () => {
    const loads = trip?.loads || []

    if (loads.length === 0) {
      return (
        <View style={styles.emptyTab}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="cube-outline" size={48} color={DashboardColors.textMuted} />
          </View>
          <Text style={styles.emptyText}>Bu sefere henüz yük eklenmemiş</Text>
        </View>
      )
    }

    const getLoadStatusColor = (status?: string) => {
      switch (status) {
        case 'delivered': return { primary: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' }
        case 'in_transit': return { primary: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' }
        case 'cancelled': return { primary: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' }
        default: return { primary: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' }
      }
    }

    return (
      <View style={styles.tabContent}>
        {loads.map((load) => {
          const statusColor = getLoadStatusColor(load.status)
          return (
            <View key={load.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={styles.itemTitleRow}>
                  <View style={[styles.itemIcon, { backgroundColor: DashboardColors.primaryGlow }]}>
                    <Ionicons name="cube-outline" size={18} color={DashboardColors.primary} />
                  </View>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {load.load_number}
                  </Text>
                </View>
                {load.status && (
                  <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: statusColor.primary }]}>
                      {load.status}
                    </Text>
                  </View>
                )}
              </View>
              {(load.cargo_name || load.load_type) && (
                <View style={styles.itemDetails}>
                  {load.cargo_name && (
                    <Text style={styles.loadCargo}>{load.cargo_name}</Text>
                  )}
                  {load.load_type && (
                    <Text style={styles.loadType}>Tip: {load.load_type}</Text>
                  )}
                </View>
              )}
            </View>
          )
        })}
      </View>
    )
  }

  // Pozisyon detayına git
  const navigateToPosition = (position: Position) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const basePath = position.position_type === 'export'
      ? '/logistics/exports/positions'
      : '/logistics/imports/positions'
    router.push(`${basePath}/${position.id}`)
  }

  // Pozisyon status rengi
  const getPositionStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return { primary: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' }
      case 'completed': return { primary: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' }
      case 'cancelled': return { primary: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' }
      case 'draft': return { primary: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' }
      default: return { primary: '#6B7280', bg: 'rgba(107, 114, 128, 0.12)' }
    }
  }

  // Pozisyon status etiketi
  const getPositionStatusLabel = (status?: string): string => {
    const labels: Record<string, string> = {
      active: 'Aktif',
      completed: 'Tamamlandı',
      cancelled: 'İptal',
      draft: 'Taslak',
    }
    return status ? labels[status] || status : 'Aktif'
  }

  // Pozisyonlar tab'ı
  const renderPositionsTab = () => {
    if (isLoadingPositions) {
      return (
        <View style={styles.emptyTab}>
          <ActivityIndicator size="large" color={DashboardColors.primary} />
          <Text style={styles.emptyText}>Pozisyonlar yükleniyor...</Text>
        </View>
      )
    }

    if (positions.length === 0) {
      return (
        <View style={styles.emptyTab}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="location-outline" size={48} color={DashboardColors.textMuted} />
          </View>
          <Text style={styles.emptyText}>Bu sefere henüz pozisyon eklenmemiş</Text>
        </View>
      )
    }

    return (
      <View style={styles.tabContent}>
        {positions.map((position) => {
          const driverName = position.driver
            ? `${position.driver.first_name} ${position.driver.last_name}`.trim()
            : null
          const vehiclePlate = position.truck_tractor?.plate || position.trailer?.plate
          const statusColor = getPositionStatusColor(position.status)

          return (
            <TouchableOpacity
              key={position.id}
              activeOpacity={0.7}
              onPress={() => navigateToPosition(position)}
              style={styles.positionCard}
            >
              <View style={styles.positionHeader}>
                <View style={styles.positionTitleRow}>
                  <View style={[styles.positionIcon, { backgroundColor: DashboardColors.primaryGlow }]}>
                    <Ionicons name="location-outline" size={18} color={DashboardColors.primary} />
                  </View>
                  <View style={styles.positionInfo}>
                    <Text style={styles.positionNumber}>
                      {position.position_number || 'Taslak'}
                    </Text>
                    <Text style={[styles.positionTypeText, {
                      color: position.position_type === 'export' ? '#3B82F6' : '#8B5CF6'
                    }]}>
                      {getPositionTypeLabel(position.position_type)}
                    </Text>
                  </View>
                </View>
                <View style={styles.positionRight}>
                  <View style={[styles.statusDot, { backgroundColor: statusColor.primary }]} />
                  <Ionicons name="chevron-forward" size={20} color={DashboardColors.textMuted} />
                </View>
              </View>

              {/* Position Details */}
              <View style={styles.positionDetails}>
                {position.route && (
                  <View style={styles.positionDetailRow}>
                    <Ionicons name="navigate-outline" size={14} color={DashboardColors.textMuted} />
                    <Text style={styles.positionDetailText} numberOfLines={1}>
                      {position.route}
                    </Text>
                  </View>
                )}
                {vehiclePlate && (
                  <View style={styles.positionDetailRow}>
                    <Ionicons name="car-sport-outline" size={14} color={DashboardColors.textMuted} />
                    <Text style={styles.positionDetailText}>
                      {vehiclePlate}
                      {(position.trailer?.plate && position.truck_tractor?.plate) && ` / ${position.trailer.plate}`}
                    </Text>
                  </View>
                )}
                {driverName && (
                  <View style={styles.positionDetailRow}>
                    <Ionicons name="person-outline" size={14} color={DashboardColors.textMuted} />
                    <Text style={styles.positionDetailText}>{driverName}</Text>
                  </View>
                )}
                {!!(position.loads_count !== undefined && position.loads_count > 0) && (
                  <View style={styles.positionDetailRow}>
                    <Ionicons name="cube-outline" size={14} color={DashboardColors.textMuted} />
                    <Text style={styles.positionDetailText}>{position.loads_count} yük</Text>
                  </View>
                )}
              </View>

              {/* Status Badge */}
              <View style={styles.positionFooter}>
                <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                  <Text style={[styles.statusBadgeText, { color: statusColor.primary }]}>
                    {getPositionStatusLabel(position.status)}
                  </Text>
                </View>
                {!!(position.is_roro || position.is_train) && (
                  <View style={styles.transportBadges}>
                    {position.is_roro && (
                      <View style={[styles.miniTransportBadge, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
                        <Ionicons name="boat-outline" size={12} color="#3B82F6" />
                      </View>
                    )}
                    {position.is_train && (
                      <View style={[styles.miniTransportBadge, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
                        <Ionicons name="train-outline" size={12} color="#8B5CF6" />
                      </View>
                    )}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )
        })}
      </View>
    )
  }

  // Tab içeriğini render et
  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':
        return renderInfoTab()
      case 'loads':
        return renderLoadsTab()
      case 'positions':
        return renderPositionsTab()
      default:
        return null
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <PageHeader
          title="Sefer Detayı"
          icon="car-outline"
          showBackButton
          onBackPress={handleBackPress}
        />
        <View style={styles.content}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={DashboardColors.primary} />
            <Text style={styles.loadingText}>Sefer bilgileri yükleniyor...</Text>
          </View>
        </View>
      </View>
    )
  }

  // Error state
  if (error || !trip) {
    return (
      <View style={styles.container}>
        <PageHeader
          title="Sefer Detayı"
          icon="car-outline"
          showBackButton
          onBackPress={handleBackPress}
        />
        <View style={styles.content}>
          <View style={styles.errorContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
              <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
            </View>
            <Text style={styles.errorTitle}>Bir hata oluştu</Text>
            <Text style={styles.errorText}>{error || 'Sefer bulunamadı'}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchTrip()}>
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
              <Text style={styles.backButtonText}>Geri Dön</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  const statusColors = STATUS_COLORS[trip.status || 'active'] || STATUS_COLORS.active

  return (
    <View style={styles.container}>
      <PageHeader
        title={trip.trip_number}
        icon="car-outline"
        showBackButton
        onBackPress={handleBackPress}
        rightActions={[
          {
            icon: 'create-outline',
            onPress: handleEditPress
          },
          {
            icon: 'trash-outline',
            onPress: handleDelete,
            color: '#EF4444'
          }
        ]}
      />

      <View style={styles.content}>
        {/* Trip Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={[styles.summaryIcon, { backgroundColor: DashboardColors.primaryGlow }]}>
              <Ionicons name="car-outline" size={32} color={DashboardColors.primary} />
            </View>
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryNumber}>{trip.trip_number}</Text>
              {trip.route && (
                <View style={styles.routeRow}>
                  <Ionicons name="navigate-outline" size={14} color={DashboardColors.textMuted} />
                  <Text style={styles.summaryRoute} numberOfLines={1}>{trip.route}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Transport Type Badges */}
          {!!(trip.is_roro || trip.is_train || trip.is_mafi) && (
            <View style={styles.transportBadges}>
              {trip.is_roro && (
                <View style={[styles.transportBadge, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
                  <Ionicons name="boat-outline" size={14} color="#3B82F6" />
                  <Text style={[styles.transportText, { color: '#3B82F6' }]}>RoRo</Text>
                </View>
              )}
              {trip.is_train && (
                <View style={[styles.transportBadge, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
                  <Ionicons name="train-outline" size={14} color="#8B5CF6" />
                  <Text style={[styles.transportText, { color: '#8B5CF6' }]}>Tren</Text>
                </View>
              )}
              {trip.is_mafi && (
                <View style={[styles.transportBadge, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                  <Ionicons name="cube-outline" size={14} color="#F59E0B" />
                  <Text style={[styles.transportText, { color: '#F59E0B' }]}>Mafi</Text>
                </View>
              )}
            </View>
          )}

          {/* Status and Type Badges */}
          <View style={styles.badgeRow}>
            <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
              <Text style={[styles.statusBadgeText, { color: statusColors.primary }]}>
                {getTripStatusLabel(trip.status)}
              </Text>
            </View>
            {trip.trip_type && (
              <View style={[styles.statusBadge, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
                <Text style={[styles.statusBadgeText, { color: '#3B82F6' }]}>
                  {getTripTypeLabel(trip.trip_type)}
                </Text>
              </View>
            )}
            <View style={[styles.statusBadge, {
              backgroundColor: trip.vehicle_owner_type === 'own' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)'
            }]}>
              <Text style={[styles.statusBadgeText, {
                color: trip.vehicle_owner_type === 'own' ? '#10B981' : '#F59E0B'
              }]}>
                {getVehicleOwnerTypeLabel(trip.vehicle_owner_type)}
              </Text>
            </View>
          </View>

          {/* Vehicle Info */}
          {((trip.truck_tractor?.plate) || (trip.trailer?.plate)) && (
            <View style={styles.vehicleRow}>
              {trip.truck_tractor?.plate && (
                <View style={styles.vehicleItem}>
                  <Ionicons name="car-sport-outline" size={14} color={DashboardColors.textMuted} />
                  <Text style={styles.vehicleText}>{trip.truck_tractor.plate}</Text>
                </View>
              )}
              {trip.truck_tractor?.plate && trip.trailer?.plate && (
                <Ionicons name="arrow-forward" size={12} color={DashboardColors.textMuted} />
              )}
              {trip.trailer?.plate && (
                <View style={styles.vehicleItem}>
                  <Text style={styles.vehicleText}>{trip.trailer.plate}</Text>
                </View>
              )}
            </View>
          )}

          {/* Driver Info */}
          {trip.driver && (
            <View style={styles.driverRow}>
              <Ionicons name="person-outline" size={14} color={DashboardColors.textMuted} />
              <Text style={styles.driverText}>
                {getDriverFullName(trip.driver)}
                {trip.second_driver && ` + ${getDriverFullName(trip.second_driver)}`}
              </Text>
            </View>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id
              let count = 0
              if (tab.id === 'loads') count = trip.loads?.length || 0
              if (tab.id === 'positions') count = positions.length

              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tab, isActive && styles.tabActive]}
                  onPress={() => {
                    Haptics.selectionAsync()
                    setActiveTab(tab.id)
                  }}
                >
                  <View style={styles.tabIconRow}>
                    <Ionicons
                      name={tab.icon}
                      size={18}
                      color={isActive ? DashboardColors.primary : DashboardColors.textMuted}
                    />
                    {count > 0 && (
                      <View style={[styles.tabBadge, {
                        backgroundColor: isActive ? DashboardColors.primary : DashboardColors.textMuted
                      }]}>
                        <Text style={styles.tabBadgeText}>{count}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </View>

        {/* Tab Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={DashboardColors.primary}
            />
          }
        >
          {renderTabContent()}
        </ScrollView>
      </View>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        ref={deleteDialogRef}
        title="Seferi Sil"
        message="Bu seferi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmText="Sil"
        cancelText="İptal"
        type="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
      />
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

  // Loading & Error
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: DashboardSpacing.md
  },
  loadingText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: DashboardSpacing['2xl'],
    gap: DashboardSpacing.md
  },
  errorTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '700',
    color: DashboardColors.textPrimary
  },
  errorText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    textAlign: 'center'
  },
  retryButton: {
    marginTop: DashboardSpacing.md,
    paddingHorizontal: DashboardSpacing.xl,
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.md,
    backgroundColor: DashboardColors.primary
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: DashboardFontSizes.base,
    fontWeight: '600'
  },
  backButton: {
    marginTop: DashboardSpacing.sm,
    paddingHorizontal: DashboardSpacing.xl,
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.md,
    backgroundColor: DashboardColors.surface,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight
  },
  backButtonText: {
    color: DashboardColors.textPrimary,
    fontSize: DashboardFontSizes.base,
    fontWeight: '600'
  },

  // Summary Card
  summaryCard: {
    margin: DashboardSpacing.lg,
    padding: DashboardSpacing.lg,
    borderRadius: DashboardBorderRadius.xl,
    backgroundColor: DashboardColors.surface,
    gap: DashboardSpacing.md,
    ...DashboardShadows.md
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.md
  },
  summaryIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },
  summaryInfo: {
    flex: 1
  },
  summaryNumber: {
    fontSize: DashboardFontSizes['2xl'],
    fontWeight: '700',
    color: DashboardColors.textPrimary
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.xs,
    marginTop: DashboardSpacing.xs
  },
  summaryRoute: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    flex: 1
  },
  transportBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DashboardSpacing.xs
  },
  transportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 2,
    borderRadius: DashboardBorderRadius.sm
  },
  transportText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '500'
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DashboardSpacing.sm
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
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm
  },
  vehicleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.xs
  },
  vehicleText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: DashboardColors.textPrimary
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.xs
  },
  driverText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary
  },

  // Tabs
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight
  },
  tabsContent: {
    paddingHorizontal: DashboardSpacing.md,
    gap: DashboardSpacing.xs
  },
  tab: {
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    alignItems: 'center',
    minWidth: 80
  },
  tabActive: {
    borderBottomColor: DashboardColors.primary
  },
  tabIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DashboardSpacing.xs
  },
  tabBadge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 4
  },
  tabText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '500',
    color: DashboardColors.textSecondary
  },
  tabTextActive: {
    color: DashboardColors.primary
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: DashboardSpacing['2xl']
  },
  tabContent: {
    padding: DashboardSpacing.lg,
    gap: DashboardSpacing.md
  },

  // Section Card
  sectionCard: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.lg,
    ...DashboardShadows.sm
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    marginBottom: DashboardSpacing.md,
    paddingBottom: DashboardSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight
  },
  sectionTitle: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: DashboardColors.textPrimary
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DashboardSpacing.xs,
    gap: DashboardSpacing.sm
  },
  infoLabel: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    minWidth: 120
  },
  infoValue: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textPrimary,
    flex: 1,
    fontWeight: '500'
  },

  // Empty Tab
  emptyTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DashboardSpacing['3xl'],
    gap: DashboardSpacing.md
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: DashboardColors.surface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: DashboardSpacing.xl
  },

  // Item Card (Loads)
  itemCard: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.lg,
    ...DashboardShadows.sm
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: DashboardSpacing.sm
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    flex: 1,
    marginRight: DashboardSpacing.sm
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  itemTitle: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    flex: 1
  },
  itemDetails: {
    gap: DashboardSpacing.xs
  },
  loadCargo: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary
  },
  loadType: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textMuted
  },

  // Position Card
  positionCard: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.lg,
    marginBottom: DashboardSpacing.md,
    ...DashboardShadows.sm
  },
  positionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  positionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: DashboardSpacing.sm
  },
  positionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  positionInfo: {
    flex: 1
  },
  positionNumber: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textPrimary
  },
  positionTypeText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '500',
    marginTop: 2
  },
  positionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  positionDetails: {
    marginTop: DashboardSpacing.sm,
    marginLeft: 44,
    gap: DashboardSpacing.xs
  },
  positionDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm
  },
  positionDetailText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    flex: 1
  },
  positionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: DashboardSpacing.md,
    marginLeft: 44
  },
  miniTransportBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  }
})
