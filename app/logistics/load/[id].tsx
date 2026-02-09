/**
 * Yük Detay Sayfası
 *
 * Tab-tabanlı detay görünümü - Genel, Kalemler, Adresler, Belgeler & Finans
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
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
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
  LoadStatusColors,
  LoadStatusBgColors,
  LoadStatusLabels,
  LoadDirectionColors,
  LoadDirectionBgColors,
  LoadDirectionLabels,
  VehicleTypeLabels,
  LoadingTypeLabels,
  TransportSpeedLabels,
  CargoClassLabels,
  DocumentStatusLabels
} from '@/constants/load-theme'
import { getLoad, deleteLoad } from '@/services/endpoints/loads'
import type { LoadDetail, LoadItem } from '@/types/load'
import { formatCurrency, formatNumber as formatNum } from '@/utils/currency'

// Tab tipleri
type TabType = 'general' | 'items' | 'addresses' | 'documents'

const TABS: { key: TabType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'general', label: 'Genel', icon: 'information-circle-outline' },
  { key: 'items', label: 'Kalemler', icon: 'cube-outline' },
  { key: 'addresses', label: 'Adresler', icon: 'location-outline' },
  { key: 'documents', label: 'Belgeler', icon: 'document-text-outline' },
]

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

// Sayı formatlama
const formatNumber = (value?: number, unit?: string): string => {
  if (value === undefined || value === null) return '-'
  const formatted = formatNum(value, 2)
  return unit ? `${formatted} ${unit}` : formatted
}

// Fiyat formatlama
const formatPrice = (amount?: number, currency?: string): string => {
  if (amount === undefined || amount === null) return '-'
  return formatCurrency(amount, currency || 'TRY', { symbolPosition: 'after' })
}

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

export default function LoadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const loadId = id ? parseInt(id, 10) : null

  // State
  const [load, setLoad] = useState<LoadDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('general')

  // Refs
  const isMountedRef = useRef(true)
  const deleteDialogRef = useRef<BottomSheetModal>(null)

  // Veri çekme
  const fetchLoad = useCallback(async (showLoading = true) => {
    if (!loadId) {
      setError('Geçersiz yük ID')
      setIsLoading(false)
      return
    }

    try {
      if (showLoading) {
        setIsLoading(true)
        setError(null)
      }

      const data = await getLoad(loadId)

      if (isMountedRef.current) {
        setLoad(data)
        setError(null)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Yük yüklenemedi')
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
        setRefreshing(false)
      }
    }
  }, [loadId])

  useEffect(() => {
    isMountedRef.current = true
    fetchLoad()

    return () => {
      isMountedRef.current = false
    }
  }, [fetchLoad])

  // Edit sayfasından dönüşte yenile
  useFocusEffect(
    useCallback(() => {
      fetchLoad(false)
    }, [fetchLoad])
  )

  // Yenileme
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchLoad(false)
  }, [fetchLoad])

  // Düzenleme
  const handleEdit = () => {
    if (!loadId) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/logistics/load/${loadId}/edit`)
  }

  // Silme dialogunu aç
  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    deleteDialogRef.current?.present()
  }

  // Silme işlemini gerçekleştir
  const confirmDelete = async () => {
    if (!loadId) return

    setIsDeleting(true)
    try {
      await deleteLoad(loadId)
      deleteDialogRef.current?.dismiss()
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Toast.show({
        type: 'success',
        text1: 'Yük başarıyla silindi',
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
        text1: err instanceof Error ? err.message : 'Yük silinemedi',
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

  // Tab değiştir
  const handleTabChange = (tab: TabType) => {
    if (tab !== activeTab) {
      Haptics.selectionAsync()
      setActiveTab(tab)
    }
  }

  const pickupAddress = load?.addresses?.find(a => a.type === 'pickup')
  const deliveryAddress = load?.addresses?.find(a => a.type === 'delivery')

  // Header içeriği
  const renderHeaderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadInfo}>
          <Skeleton width={160} height={24} style={{ marginBottom: DashboardSpacing.sm }} />
          <View style={styles.badgeRow}>
            <Skeleton width={80} height={24} borderRadius={12} />
            <Skeleton width={80} height={24} borderRadius={12} />
          </View>
        </View>
      )
    }

    if (!load) return null

    return (
      <View style={styles.loadInfo}>
        <View style={styles.loadNumberRow}>
          <View style={styles.loadNumberIcon}>
            <Ionicons name="cube" size={16} color="#fff" />
          </View>
          <Text style={styles.loadNumber}>{load.load_number}</Text>
        </View>

        <View style={styles.badgeRow}>
          {load.direction && (
            <View
              style={[
                styles.headerBadge,
                { backgroundColor: LoadDirectionBgColors[load.direction] }
              ]}
            >
              <Ionicons
                name={load.direction === 'export' ? 'arrow-up-circle' : 'arrow-down-circle'}
                size={14}
                color={LoadDirectionColors[load.direction]}
              />
              <Text style={[styles.headerBadgeText, { color: LoadDirectionColors[load.direction] }]}>
                {LoadDirectionLabels[load.direction]}
              </Text>
            </View>
          )}

          <View
            style={[
              styles.headerBadge,
              { backgroundColor: LoadStatusBgColors[load.status] }
            ]}
          >
            <View
              style={[styles.statusDot, { backgroundColor: LoadStatusColors[load.status] }]}
            />
            <Text style={[styles.headerBadgeText, { color: LoadStatusColors[load.status] }]}>
              {LoadStatusLabels[load.status]}
            </Text>
          </View>
        </View>
      </View>
    )
  }

  // === TAB İÇERİKLERİ ===

  // Genel tab
  const renderGeneralTab = () => {
    if (!load) return null
    return (
      <>
        {/* Temel Bilgiler */}
        <View style={styles.card}>
          <SectionHeader title="Temel Bilgiler" icon="information-circle-outline" />
          <View style={styles.cardContent}>
            <InfoRow label="Kargo Adı" value={load.cargo_name || '-'} icon="cube-outline" />
            <InfoRow label="Araç Tipi" value={load.vehicle_type ? (VehicleTypeLabels[load.vehicle_type] || load.vehicle_type) : '-'} icon="car-outline" />
            <InfoRow label="Yükleme Tipi" value={load.loading_type ? (LoadingTypeLabels[load.loading_type] || load.loading_type) : '-'} icon="layers-outline" />
            <InfoRow label="Taşıma Hızı" value={load.transport_speed ? (TransportSpeedLabels[load.transport_speed] || load.transport_speed) : '-'} icon="speedometer-outline" />
            <InfoRow label="Kargo Sınıfı" value={load.cargo_class ? (CargoClassLabels[load.cargo_class] || load.cargo_class) : '-'} icon="pricetag-outline" />
            <InfoRow
              label="Yük Tipi"
              value={load.load_type === 'full' ? 'Komple' : load.load_type === 'partial' ? 'Parsiyel' : '-'}
              icon="resize-outline"
            />
          </View>
        </View>

        {/* Firmalar */}
        <View style={styles.card}>
          <SectionHeader title="Firmalar" icon="business-outline" />
          <View style={styles.cardContent}>
            <InfoRow
              label="Müşteri"
              value={load.customer?.name || '-'}
              icon="person-outline"
              highlight
            />
            <InfoRow
              label="Gönderici"
              value={load.sender_company?.name || '-'}
              icon="arrow-up-outline"
            />
            <InfoRow
              label="Üretici"
              value={load.manufacturer_company?.name || '-'}
              icon="construct-outline"
            />
            <InfoRow
              label="Alıcı"
              value={load.receiver_company?.name || '-'}
              icon="arrow-down-outline"
            />
          </View>
        </View>

        {/* Finansal Bilgiler */}
        <View style={styles.card}>
          <SectionHeader title="Finansal Bilgiler" icon="cash-outline" />
          <View style={styles.cardContent}>
            <InfoRow
              label="Navlun Ücreti"
              value={formatPrice(load.freight_fee, load.freight_fee_currency)}
              icon="cash-outline"
              highlight
            />
            <InfoRow
              label="Mal Bedeli"
              value={formatPrice(load.estimated_cargo_value, load.estimated_value_currency)}
              icon="pricetag-outline"
            />
            {load.delivery_terms && (
              <InfoRow
                label="Teslim Şartı"
                value={load.delivery_terms}
                icon="document-text-outline"
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
              value={formatDate(load.created_at)}
              icon="add-circle-outline"
            />
            <InfoRow
              label="Son Güncelleme"
              value={formatDate(load.updated_at)}
              icon="refresh-outline"
            />
            <InfoRow
              label="Durum"
              value={load.is_active ? 'Aktif' : 'Pasif'}
              icon={load.is_active ? 'checkmark-circle-outline' : 'close-circle-outline'}
            />
          </View>
        </View>
      </>
    )
  }

  // Kalemler tab
  const renderItemsTab = () => {
    if (!load) return null
    const items = load.items || []

    if (items.length === 0) {
      return (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="cube-outline" size={32} color={DashboardColors.textMuted} />
          </View>
          <Text style={styles.emptyText}>Yük kalemi bulunmuyor</Text>
        </View>
      )
    }

    // Toplam hesapla
    let totalWeight = 0
    let totalVolume = 0
    let totalLDM = 0
    let totalPackages = 0
    items.forEach(item => {
      if (item.gross_weight) totalWeight += item.gross_weight
      if (item.volume) totalVolume += item.volume
      if (item.lademetre) totalLDM += item.lademetre
      if (item.package_count) totalPackages += item.package_count
    })

    return (
      <>
        {/* Toplam özet */}
        <View style={styles.card}>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCell}>
              <Ionicons name="layers-outline" size={18} color={DashboardColors.primary} />
              <Text style={styles.summaryCellValue}>{items.length}</Text>
              <Text style={styles.summaryCellLabel}>Kalem</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCell}>
              <Ionicons name="scale-outline" size={18} color={DashboardColors.primary} />
              <Text style={styles.summaryCellValue}>{formatNumber(totalWeight)}</Text>
              <Text style={styles.summaryCellLabel}>kg</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCell}>
              <Ionicons name="cube-outline" size={18} color={DashboardColors.primary} />
              <Text style={styles.summaryCellValue}>{formatNumber(totalVolume)}</Text>
              <Text style={styles.summaryCellLabel}>m³</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCell}>
              <Ionicons name="resize-outline" size={18} color={DashboardColors.primary} />
              <Text style={styles.summaryCellValue}>{formatNumber(totalLDM)}</Text>
              <Text style={styles.summaryCellLabel}>LDM</Text>
            </View>
          </View>
        </View>

        {/* Her bir kalem */}
        {items.map((item, index) => (
          <View key={item.id || index} style={styles.card}>
            <View style={styles.itemCardHeader}>
              <View style={styles.itemCardTitleRow}>
                <View style={styles.itemIndexBadge}>
                  <Text style={styles.itemIndexText}>{index + 1}</Text>
                </View>
                <Text style={styles.itemCardName} numberOfLines={1}>
                  {item.cargo_name || `Kalem #${index + 1}`}
                </Text>
              </View>
              <View style={styles.itemBadgeRow}>
                {item.is_stackable && (
                  <View style={[styles.itemSmallBadge, { backgroundColor: DashboardColors.successBg }]}>
                    <Text style={[styles.itemSmallBadgeText, { color: DashboardColors.success }]}>İstiflenebilir</Text>
                  </View>
                )}
                {item.is_hazardous && (
                  <View style={[styles.itemSmallBadge, { backgroundColor: DashboardColors.dangerBg }]}>
                    <Ionicons name="warning" size={10} color={DashboardColors.danger} />
                    <Text style={[styles.itemSmallBadgeText, { color: DashboardColors.danger }]}>ADR</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.cardContent}>
              {item.package_type && (
                <InfoRow label="Ambalaj" value={`${item.package_count || 0} ${item.package_type}`} icon="archive-outline" />
              )}
              {item.piece_count !== undefined && item.piece_count !== null && (
                <InfoRow label="Adet" value={String(item.piece_count)} icon="apps-outline" />
              )}
              {item.gross_weight !== undefined && item.gross_weight !== null && (
                <InfoRow label="Brüt Ağırlık" value={formatNumber(item.gross_weight, 'kg')} icon="scale-outline" />
              )}
              {item.net_weight !== undefined && item.net_weight !== null && (
                <InfoRow label="Net Ağırlık" value={formatNumber(item.net_weight, 'kg')} icon="scale-outline" />
              )}
              {item.volume !== undefined && item.volume !== null && (
                <InfoRow label="Hacim" value={formatNumber(item.volume, 'm³')} icon="cube-outline" />
              )}
              {item.lademetre !== undefined && item.lademetre !== null && (
                <InfoRow label="Lademetre" value={formatNumber(item.lademetre, 'LDM')} icon="resize-outline" />
              )}
              {(item.width || item.height || item.length) && (
                <InfoRow
                  label="Boyutlar (G×Y×U)"
                  value={`${item.width || '-'} × ${item.height || '-'} × ${item.length || '-'} cm`}
                  icon="expand-outline"
                />
              )}
              {item.is_hazardous && (
                <>
                  {item.hazmat_un_no && (
                    <InfoRow label="UN No" value={item.hazmat_un_no} icon="alert-circle-outline" />
                  )}
                  {item.hazmat_class && (
                    <InfoRow label="Tehlike Sınıfı" value={item.hazmat_class} icon="flame-outline" />
                  )}
                  {item.hazmat_packing_group && (
                    <InfoRow label="Ambalaj Grubu" value={item.hazmat_packing_group} icon="briefcase-outline" />
                  )}
                </>
              )}
            </View>
          </View>
        ))}
      </>
    )
  }

  // Adresler tab
  const renderAddressesTab = () => {
    if (!load) return null
    const addresses = load.addresses || []

    if (addresses.length === 0) {
      return (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="location-outline" size={32} color={DashboardColors.textMuted} />
          </View>
          <Text style={styles.emptyText}>Adres bilgisi bulunmuyor</Text>
        </View>
      )
    }

    return (
      <>
        {/* Yükleme Noktası */}
        {pickupAddress && (
          <View style={styles.card}>
            <View style={styles.addressCardHeader}>
              <View style={[styles.addressTypeIcon, { backgroundColor: DashboardColors.successBg }]}>
                <Ionicons name="arrow-up" size={18} color={DashboardColors.success} />
              </View>
              <View style={styles.addressTypeInfo}>
                <Text style={styles.addressTypeTitle}>Yükleme Noktası</Text>
                {pickupAddress.loadingCompany && (
                  <Text style={styles.addressCompanyName}>{pickupAddress.loadingCompany.name}</Text>
                )}
              </View>
            </View>
            <View style={styles.cardContent}>
              {pickupAddress.loadingLocation && (
                <InfoRow label="Lokasyon" value={pickupAddress.loadingLocation.title || '-'} icon="pin-outline" />
              )}
              {pickupAddress.loadingLocation?.city && (
                <InfoRow label="Şehir" value={pickupAddress.loadingLocation.city.name} icon="map-outline" />
              )}
              {pickupAddress.loadingLocation?.country && (
                <InfoRow label="Ülke" value={pickupAddress.loadingLocation.country.name} icon="globe-outline" />
              )}
              {pickupAddress.expected_loading_entry_date && (
                <InfoRow label="Beklenen Tarih" value={formatDate(pickupAddress.expected_loading_entry_date)} icon="calendar-outline" />
              )}
              {pickupAddress.loading_entry_date && (
                <InfoRow label="Giriş Tarihi" value={formatDate(pickupAddress.loading_entry_date)} icon="enter-outline" />
              )}
              {pickupAddress.loading_exit_date && (
                <InfoRow label="Çıkış Tarihi" value={formatDate(pickupAddress.loading_exit_date)} icon="exit-outline" />
              )}
              {/* Yurt içi depo */}
              {pickupAddress.domesticWarehouse && (
                <>
                  <View style={styles.subSectionDivider} />
                  <View style={styles.subSectionHeader}>
                    <Ionicons name="home-outline" size={14} color={DashboardColors.textSecondary} />
                    <Text style={styles.subSectionTitle}>Yurt İçi Depo</Text>
                  </View>
                  <InfoRow label="Depo" value={pickupAddress.domesticWarehouse.name || '-'} icon="business-outline" />
                  {pickupAddress.domestic_warehouse_expected_entry_date && (
                    <InfoRow label="Beklenen Giriş" value={formatDate(pickupAddress.domestic_warehouse_expected_entry_date)} icon="calendar-outline" />
                  )}
                  {pickupAddress.domestic_warehouse_entry_date && (
                    <InfoRow label="Giriş" value={formatDate(pickupAddress.domestic_warehouse_entry_date)} icon="enter-outline" />
                  )}
                  {pickupAddress.domestic_warehouse_exit_date && (
                    <InfoRow label="Çıkış" value={formatDate(pickupAddress.domestic_warehouse_exit_date)} icon="exit-outline" />
                  )}
                </>
              )}
              {/* Yurt içi gümrük */}
              {pickupAddress.domesticCustomsCompany && (
                <>
                  <View style={styles.subSectionDivider} />
                  <View style={styles.subSectionHeader}>
                    <Ionicons name="shield-outline" size={14} color={DashboardColors.textSecondary} />
                    <Text style={styles.subSectionTitle}>Yurt İçi Gümrük</Text>
                  </View>
                  <InfoRow label="Firma" value={pickupAddress.domesticCustomsCompany.name} icon="business-outline" />
                  {pickupAddress.domesticCustomsLocation && (
                    <InfoRow label="Lokasyon" value={pickupAddress.domesticCustomsLocation.title || '-'} icon="pin-outline" />
                  )}
                  {pickupAddress.expected_domestic_customs_entry_date && (
                    <InfoRow label="Beklenen Giriş" value={formatDate(pickupAddress.expected_domestic_customs_entry_date)} icon="calendar-outline" />
                  )}
                </>
              )}
            </View>
          </View>
        )}

        {/* Boşaltma Noktası */}
        {deliveryAddress && (
          <View style={styles.card}>
            <View style={styles.addressCardHeader}>
              <View style={[styles.addressTypeIcon, { backgroundColor: DashboardColors.infoBg }]}>
                <Ionicons name="arrow-down" size={18} color={DashboardColors.info} />
              </View>
              <View style={styles.addressTypeInfo}>
                <Text style={styles.addressTypeTitle}>Boşaltma Noktası</Text>
                {deliveryAddress.unloadingCompany && (
                  <Text style={styles.addressCompanyName}>{deliveryAddress.unloadingCompany.name}</Text>
                )}
              </View>
            </View>
            <View style={styles.cardContent}>
              {deliveryAddress.unloadingLocation && (
                <InfoRow label="Lokasyon" value={deliveryAddress.unloadingLocation.title || '-'} icon="pin-outline" />
              )}
              {deliveryAddress.unloadingLocation?.city && (
                <InfoRow label="Şehir" value={deliveryAddress.unloadingLocation.city.name} icon="map-outline" />
              )}
              {deliveryAddress.unloadingLocation?.country && (
                <InfoRow label="Ülke" value={deliveryAddress.unloadingLocation.country.name} icon="globe-outline" />
              )}
              {deliveryAddress.destinationCountry && (
                <InfoRow label="Varış Ülkesi" value={deliveryAddress.destinationCountry.name} icon="flag-outline" />
              )}
              {deliveryAddress.expected_unloading_entry_date && (
                <InfoRow label="Beklenen Tarih" value={formatDate(deliveryAddress.expected_unloading_entry_date)} icon="calendar-outline" />
              )}
              {deliveryAddress.unloading_arrival_date && (
                <InfoRow label="Varış Tarihi" value={formatDate(deliveryAddress.unloading_arrival_date)} icon="navigate-outline" />
              )}
              {deliveryAddress.unloading_entry_date && (
                <InfoRow label="Giriş Tarihi" value={formatDate(deliveryAddress.unloading_entry_date)} icon="enter-outline" />
              )}
              {deliveryAddress.unloading_exit_date && (
                <InfoRow label="Çıkış Tarihi" value={formatDate(deliveryAddress.unloading_exit_date)} icon="exit-outline" />
              )}
              {/* Yurt dışı gümrük */}
              {deliveryAddress.intlCustomsCompany && (
                <>
                  <View style={styles.subSectionDivider} />
                  <View style={styles.subSectionHeader}>
                    <Ionicons name="shield-outline" size={14} color={DashboardColors.textSecondary} />
                    <Text style={styles.subSectionTitle}>Yurt Dışı Gümrük</Text>
                  </View>
                  <InfoRow label="Firma" value={deliveryAddress.intlCustomsCompany.name} icon="business-outline" />
                  {deliveryAddress.intlCustomsLocation && (
                    <InfoRow label="Lokasyon" value={deliveryAddress.intlCustomsLocation.title || '-'} icon="pin-outline" />
                  )}
                  {deliveryAddress.t1_number && (
                    <InfoRow label="T1 Numarası" value={deliveryAddress.t1_number} icon="document-outline" />
                  )}
                </>
              )}
              {/* Yurt dışı depo */}
              {deliveryAddress.intlWarehouse && (
                <>
                  <View style={styles.subSectionDivider} />
                  <View style={styles.subSectionHeader}>
                    <Ionicons name="home-outline" size={14} color={DashboardColors.textSecondary} />
                    <Text style={styles.subSectionTitle}>Yurt Dışı Depo</Text>
                  </View>
                  <InfoRow label="Depo" value={deliveryAddress.intlWarehouse.name || '-'} icon="business-outline" />
                  {deliveryAddress.intl_warehouse_entry_date && (
                    <InfoRow label="Giriş" value={formatDate(deliveryAddress.intl_warehouse_entry_date)} icon="enter-outline" />
                  )}
                  {deliveryAddress.intl_warehouse_exit_date && (
                    <InfoRow label="Çıkış" value={formatDate(deliveryAddress.intl_warehouse_exit_date)} icon="exit-outline" />
                  )}
                </>
              )}
            </View>
          </View>
        )}
      </>
    )
  }

  // Belgeler & Gümrük tab
  const renderDocumentsTab = () => {
    if (!load) return null

    const hasDeclaration = load.direction && (
      load.declaration_no ||
      load.declaration_submission_date ||
      load.declaration_ready_date ||
      load.declaration_inspection_date ||
      load.declaration_clearance_date
    )

    const hasInvoice = load.direction && (load.cargo_invoice_no || load.cargo_invoice_date)

    const hasCustoms = load.direction && (load.gtip_hs_code || load.atr_no || load.regime_no)

    const hasDocumentStatuses = load.direction && (
      load.invoice_document ||
      load.atr_document ||
      load.packing_list_document ||
      load.origin_certificate_document ||
      load.health_certificate_document ||
      load.eur1_document ||
      load.t1_t2_document
    )

    if (!hasDeclaration && !hasInvoice && !hasCustoms && !hasDocumentStatuses) {
      return (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="document-text-outline" size={32} color={DashboardColors.textMuted} />
          </View>
          <Text style={styles.emptyText}>Belge bilgisi bulunmuyor</Text>
          <Text style={styles.emptySubtext}>İhracat/ithalat yüklerinde görüntülenir</Text>
        </View>
      )
    }

    return (
      <>
        {/* Beyanname Bilgileri */}
        {hasDeclaration && (
          <View style={styles.card}>
            <SectionHeader title="Beyanname Bilgileri" icon="document-text-outline" />
            <View style={styles.cardContent}>
              <InfoRow
                label="Beyanname No"
                value={load.declaration_no || '-'}
                icon="barcode-outline"
              />
              <InfoRow
                label="Sunulma Tarihi"
                value={formatDate(load.declaration_submission_date)}
                icon="calendar-outline"
              />
              <InfoRow
                label="Hazır Bildirim Tarihi"
                value={formatDate(load.declaration_ready_date)}
                icon="checkmark-done-outline"
              />
              <InfoRow
                label="Fiziki Muayene Tarihi"
                value={formatDate(load.declaration_inspection_date)}
                icon="search-outline"
              />
              <InfoRow
                label="Araç Çıkabilir Tarihi"
                value={formatDate(load.declaration_clearance_date)}
                icon="car-outline"
              />
            </View>
          </View>
        )}

        {/* Fatura Bilgileri */}
        {hasInvoice && (
          <View style={styles.card}>
            <SectionHeader title="Mal Fatura Bilgileri" icon="receipt-outline" />
            <View style={styles.cardContent}>
              <InfoRow
                label="Fatura No"
                value={load.cargo_invoice_no || '-'}
                icon="document-outline"
              />
              <InfoRow
                label="Fatura Tarihi"
                value={formatDate(load.cargo_invoice_date)}
                icon="calendar-outline"
              />
            </View>
          </View>
        )}

        {/* Gümrük Bilgileri */}
        {hasCustoms && (
          <View style={styles.card}>
            <SectionHeader title="Gümrük Bilgileri" icon="globe-outline" />
            <View style={styles.cardContent}>
              <InfoRow
                label="GTIP - HS Kodu"
                value={load.gtip_hs_code || '-'}
                icon="code-outline"
              />
              <InfoRow
                label="ATR No"
                value={load.atr_no || '-'}
                icon="document-text-outline"
              />
              <InfoRow
                label="Rejim No"
                value={load.regime_no || '-'}
                icon="key-outline"
              />
            </View>
          </View>
        )}

        {/* Belge Durumları */}
        {hasDocumentStatuses && (
          <View style={styles.card}>
            <SectionHeader title="Belge Durumları" icon="folder-outline" />
            <View style={styles.cardContent}>
              {load.invoice_document && (
                <InfoRow
                  label="Fatura"
                  value={DocumentStatusLabels[load.invoice_document as keyof typeof DocumentStatusLabels] || load.invoice_document}
                  icon="receipt-outline"
                />
              )}
              {load.atr_document && (
                <InfoRow
                  label="ATR"
                  value={DocumentStatusLabels[load.atr_document as keyof typeof DocumentStatusLabels] || load.atr_document}
                  icon="document-text-outline"
                />
              )}
              {load.packing_list_document && (
                <InfoRow
                  label="Çeki Listesi"
                  value={DocumentStatusLabels[load.packing_list_document as keyof typeof DocumentStatusLabels] || load.packing_list_document}
                  icon="list-outline"
                />
              )}
              {load.origin_certificate_document && (
                <InfoRow
                  label="Menşei Belgesi"
                  value={DocumentStatusLabels[load.origin_certificate_document as keyof typeof DocumentStatusLabels] || load.origin_certificate_document}
                  icon="flag-outline"
                />
              )}
              {load.health_certificate_document && (
                <InfoRow
                  label="Sağlık Sertifikası"
                  value={DocumentStatusLabels[load.health_certificate_document as keyof typeof DocumentStatusLabels] || load.health_certificate_document}
                  icon="medkit-outline"
                />
              )}
              {load.eur1_document && (
                <InfoRow
                  label="EUR-1"
                  value={DocumentStatusLabels[load.eur1_document as keyof typeof DocumentStatusLabels] || load.eur1_document}
                  icon="document-outline"
                />
              )}
              {load.t1_t2_document && (
                <InfoRow
                  label="T1/T2"
                  value={DocumentStatusLabels[load.t1_t2_document as keyof typeof DocumentStatusLabels] || load.t1_t2_document}
                  icon="document-attach-outline"
                />
              )}
            </View>
          </View>
        )}
      </>
    )
  }

  // Aktif tab içeriğini render et
  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralTab()
      case 'items':
        return renderItemsTab()
      case 'addresses':
        return renderAddressesTab()
      case 'documents':
        return renderDocumentsTab()
      default:
        return null
    }
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
        <View style={styles.glowOrb1} />
        <View style={styles.glowOrb2} />

        <View style={[styles.headerContent, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerBar}>
            <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>

            {!isLoading && load && (
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
            )}
          </View>

          {renderHeaderContent()}
        </View>
        <View style={styles.bottomCurve} />
      </View>

      <View style={styles.contentWrapper}>
      {/* Tabs */}
      {!isLoading && load && (
        <View style={styles.tabsContainer}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.key
            const count = tab.key === 'items' ? (load.items?.length || 0) : 0

            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => handleTabChange(tab.key)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={tab.icon}
                  size={16}
                  color={isActive ? DashboardColors.primary : DashboardColors.textMuted}
                />
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab.label}
                </Text>
                {count > 0 && (
                  <View style={[
                    styles.tabBadge,
                    isActive && styles.tabBadgeActive
                  ]}>
                    <Text style={[
                      styles.tabBadgeText,
                      isActive && styles.tabBadgeTextActive
                    ]}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
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
        {!isLoading && (error || !load) && (
          <View style={styles.errorState}>
            <View style={styles.errorIcon}>
              <Ionicons name="alert-circle" size={48} color={DashboardColors.danger} />
            </View>
            <Text style={styles.errorTitle}>Bir hata oluştu</Text>
            <Text style={styles.errorText}>{error || 'Yük bulunamadı'}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchLoad()}>
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tab içeriği */}
        {!isLoading && load && renderTabContent()}

        {/* Alt boşluk */}
        <View style={{ height: insets.bottom + DashboardSpacing['3xl'] }} />
      </ScrollView>
      </View>

      {/* Silme Onay Dialogu */}
      <ConfirmDialog
        ref={deleteDialogRef}
        title="Yükü Sil"
        message="Bu yükü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
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
  contentWrapper: {
    flex: 1,
    backgroundColor: DashboardColors.background,
    overflow: 'hidden'
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
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 70,
    paddingBottom: DashboardSpacing.lg
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)'
  },
  loadInfo: {
    gap: DashboardSpacing.sm
  },
  loadNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm
  },
  loadNumberIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadNumber: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5
  },
  badgeRow: {
    flexDirection: 'row',
    gap: DashboardSpacing.sm
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 6,
    borderRadius: DashboardBorderRadius.full,
    gap: 4
  },
  headerBadgeText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600'
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: DashboardColors.surface,
    marginHorizontal: DashboardSpacing.lg,
    marginTop: DashboardSpacing.md,
    marginBottom: DashboardSpacing.xs,
    padding: 4,
    borderRadius: DashboardBorderRadius.xl,
    ...DashboardShadows.sm
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.lg,
    gap: 4
  },
  tabActive: {
    backgroundColor: DashboardColors.primaryGlow
  },
  tabText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600',
    color: DashboardColors.textMuted
  },
  tabTextActive: {
    color: DashboardColors.primary
  },
  tabBadge: {
    backgroundColor: DashboardColors.borderLight,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    marginLeft: 2
  },
  tabBadgeActive: {
    backgroundColor: DashboardColors.primaryGlow
  },
  tabBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: DashboardColors.textMuted
  },
  tabBadgeTextActive: {
    color: DashboardColors.primary
  },

  // İçerik
  content: {
    flex: 1,
    backgroundColor: DashboardColors.background
  },
  contentContainer: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingBottom: DashboardSpacing['3xl']
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
    paddingBottom: DashboardSpacing.xs
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

  // Özet grid (kalemler tabı)
  summaryGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DashboardSpacing.lg,
    paddingHorizontal: DashboardSpacing.md
  },
  summaryCell: {
    flex: 1,
    alignItems: 'center',
    gap: 4
  },
  summaryCellValue: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '700',
    color: DashboardColors.textPrimary
  },
  summaryCellLabel: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textMuted,
    fontWeight: '500'
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: DashboardColors.borderLight
  },

  // Kalem kartı
  itemCardHeader: {
    padding: DashboardSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight
  },
  itemCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm
  },
  itemIndexBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: DashboardColors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center'
  },
  itemIndexText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '700',
    color: DashboardColors.primary
  },
  itemCardName: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    flex: 1
  },
  itemBadgeRow: {
    flexDirection: 'row',
    gap: DashboardSpacing.sm,
    marginTop: DashboardSpacing.sm
  },
  itemSmallBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 3,
    borderRadius: DashboardBorderRadius.sm
  },
  itemSmallBadgeText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600'
  },

  // Adres kartları
  addressCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.md,
    padding: DashboardSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight
  },
  addressTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  addressTypeInfo: {
    flex: 1,
    gap: 2
  },
  addressTypeTitle: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textPrimary
  },
  addressCompanyName: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary
  },

  // Alt bölüm ayırıcı
  subSectionDivider: {
    height: 1,
    backgroundColor: DashboardColors.borderLight,
    marginVertical: DashboardSpacing.sm,
    marginHorizontal: -DashboardSpacing.lg
  },
  subSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.xs,
    paddingVertical: DashboardSpacing.xs
  },
  subSectionTitle: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: DashboardColors.textSecondary
  },

  // Boş durum
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DashboardSpacing['5xl'],
    paddingHorizontal: DashboardSpacing['2xl']
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: DashboardColors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.lg
  },
  emptyText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textSecondary,
    textAlign: 'center'
  },
  emptySubtext: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textMuted,
    textAlign: 'center',
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
