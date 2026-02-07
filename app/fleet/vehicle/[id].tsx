/**
 * Araç Detay Sayfası
 *
 * CLAUDE.md tasarım ilkelerine uygun modern detay sayfası
 * SectionHeader ve InfoRow component'leri kullanır
 * Statik glow orbs, useFocusEffect ile yenileme, ConfirmDialog ile silme
 */

import React, { useState, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator
} from 'react-native'
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import Toast from 'react-native-toast-message'
import ConfirmDialog from '@/components/modals/ConfirmDialog'
import { SectionHeader, InfoRow as InfoRowBase } from '@/components/detail'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardBorderRadius,
  DashboardFontSizes,
  DashboardShadows
} from '@/constants/dashboard-theme'
import { formatCurrency, formatNumber } from '@/utils/formatters'
import {
  getVehicle,
  deleteVehicle,
  Vehicle,
} from '@/services/endpoints/vehicles'

// Tab types
type TabId = 'info' | 'insurance' | 'maintenance' | 'inspection' | 'faults'

const TABS: { id: TabId; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'info', label: 'Bilgiler', icon: 'document-text-outline' },
  { id: 'insurance', label: 'Sigortalar', icon: 'shield-outline' },
  { id: 'maintenance', label: 'Bakımlar', icon: 'construct-outline' },
  { id: 'inspection', label: 'Muayeneler', icon: 'clipboard-outline' },
  { id: 'faults', label: 'Arızalar', icon: 'warning-outline' },
]

// Label maps
const vehicleTypeLabels: Record<string, string> = {
  trailer: 'Römork',
  car: 'Otomobil',
  minibus: 'Minibüs',
  bus: 'Otobüs',
  light_truck: 'Hafif Kamyon',
  truck: 'Kamyon',
  truck_tractor: 'Çekici',
  tractor: 'Traktör',
  motorcycle: 'Motosiklet',
  construction_machine: 'İş Makinesi',
  van: 'Panelvan',
  pickup: 'Pikap',
}

const statusLabels: Record<string, string> = {
  available: 'Uygun',
  in_use: 'Kullanımda',
  in_maintenance: 'Bakımda',
  maintenance: 'Bakımda',
  out_of_service: 'Hizmet Dışı',
}

const ownershipLabels: Record<string, string> = {
  owned: 'Özmal',
  rented: 'Kiralık',
  leased: 'Kiralama',
  subcontractor: 'Taşeron',
}

const gearTypeLabels: Record<string, string> = {
  manual: 'Manuel',
  automatic: 'Otomatik',
  semi_automatic: 'Yarı Otomatik',
}

const euroNormLabels: Record<string, string> = {
  euro_3: 'Euro 3',
  euro_4: 'Euro 4',
  euro_5: 'Euro 5',
  euro_6: 'Euro 6',
  euro_6d: 'Euro 6d',
  euro_6e: 'Euro 6e',
  electric: 'Elektrikli',
}

const insuranceTypeLabels: Record<string, string> = {
  comprehensive: 'Kasko',
  traffic: 'Trafik',
  other: 'Diğer',
}

const faultStatusLabels: Record<string, string> = {
  pending: 'Beklemede',
  in_progress: 'İşlemde',
  resolved: 'Çözüldü',
  cancelled: 'İptal',
}

const faultPriorityLabels: Record<string, string> = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
  critical: 'Kritik',
}

// Status renkleri
const STATUS_COLORS: Record<string, { primary: string; bg: string }> = {
  available: { primary: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
  in_use: { primary: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' },
  in_maintenance: { primary: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
  maintenance: { primary: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
  out_of_service: { primary: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' }
}

// Local InfoRow Wrapper - undefined/null/empty check ile, boolean/number support
interface LocalInfoRowProps {
  label: string
  value?: string | number | boolean | null
  icon?: keyof typeof Ionicons.glyphMap
  highlight?: boolean
  valueColor?: string
}

function InfoRowLocal({ label, value, icon, highlight, valueColor }: LocalInfoRowProps) {
  if (value === undefined || value === null || value === '') return null
  const displayValue = typeof value === 'boolean' ? (value ? 'Evet' : 'Hayır') : String(value)
  return <InfoRowBase label={label} value={displayValue} icon={icon} highlight={highlight} valueColor={valueColor} />
}

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()

  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('info')
  const [isDeleting, setIsDeleting] = useState(false)

  // Memory leak önleme
  const isMountedRef = useRef(true)
  const deleteDialogRef = useRef<BottomSheetModal>(null)

  // Veri çekme fonksiyonu - useCallback ile
  const fetchData = useCallback(async (showLoading = true) => {
    if (!id) return

    try {
      if (showLoading) setIsLoading(true)
      setError(null)
      const data = await getVehicle(parseInt(id, 10))
      if (isMountedRef.current) {
        setVehicle(data)
      }
    } catch (err) {
      if (isMountedRef.current) {
        console.error('Vehicle fetch error:', err)
        setError(err instanceof Error ? err.message : 'Araç bilgileri yüklenemedi')
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
        setRefreshing(false)
      }
    }
  }, [id])

  // Edit'ten dönüşte yenileme
  useFocusEffect(
    useCallback(() => {
      isMountedRef.current = true
      fetchData(false)

      return () => {
        isMountedRef.current = false
      }
    }, [fetchData])
  )

  const onRefresh = () => {
    setRefreshing(true)
    fetchData(false)
  }

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    deleteDialogRef.current?.present()
  }

  const handleConfirmDelete = async () => {
    if (!id) return
    setIsDeleting(true)
    try {
      await deleteVehicle(parseInt(id, 10))
      deleteDialogRef.current?.dismiss()
      Toast.show({
        type: 'success',
        text1: 'Araç başarıyla silindi',
        position: 'top',
        visibilityTime: 1500
      })
      setTimeout(() => router.back(), 300)
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: err instanceof Error ? err.message : 'Araç silinemedi',
        position: 'top',
        visibilityTime: 1500
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/fleet/vehicle/${id}/edit`)
  }

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.back()
  }

  // Format date
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

  // Render info tab
  const renderInfoTab = () => {
    if (!vehicle) return null

    const isTruckTractor = vehicle.vehicle_type === 'truck_tractor'
    const isTrailer = vehicle.vehicle_type === 'trailer'

    return (
      <View style={styles.tabContent}>
        {/* Temel Bilgiler */}
        <View style={styles.section}>
          <SectionHeader title="Temel Bilgiler" icon="car-sport-outline" />
          <View style={styles.sectionContent}>
            <InfoRowLocal label="Marka" value={vehicle.brand} />
            <InfoRowLocal label="Model" value={vehicle.model} />
            <InfoRowLocal label="Model Yılı" value={vehicle.model_year || vehicle.year} />
            <InfoRowLocal label="Renk" value={vehicle.color} />
            <InfoRowLocal label="Ticari Adı" value={vehicle.commercial_name} />
            <InfoRowLocal label="Araç Cinsi" value={vehicle.vehicle_class} />
            <InfoRowLocal label="Araç Sınıfı" value={vehicle.vehicle_category} />
            <InfoRowLocal label="Vites Tipi" value={vehicle.gear_type ? gearTypeLabels[vehicle.gear_type] : undefined} />
            <InfoRowLocal label="Ehliyet Sınıfı" value={vehicle.document_type} />
            <InfoRowLocal label="Toplam KM" value={formatNumber(vehicle.total_km || vehicle.km_counter, 'km')} />
            <InfoRowLocal label="Net Ağırlık" value={formatNumber(vehicle.net_weight, 'kg')} />
            <InfoRowLocal label="Azami Yüklü Ağırlık" value={formatNumber(vehicle.max_loaded_weight, 'kg')} />
          </View>
        </View>

        {/* Ruhsat Bilgileri */}
        <View style={styles.section}>
          <SectionHeader title="Ruhsat Bilgileri" icon="document-outline" />
          <View style={styles.sectionContent}>
            <InfoRowLocal label="Tescil Sıra No" value={vehicle.registration_serial_no} />
            <InfoRowLocal label="İlk Tescil Tarihi" value={formatDate(vehicle.first_registration_date)} />
            <InfoRowLocal label="Tescil Tarihi" value={formatDate(vehicle.registration_date)} />
            <InfoRowLocal label="Motor No" value={vehicle.engine_number} />
            <InfoRowLocal label="Şasi No" value={vehicle.chassis_number} />
            <InfoRowLocal label="Motor Gücü" value={vehicle.engine_power ? `${vehicle.engine_power} kW` : undefined} />
            <InfoRowLocal label="Tekerlek Düzeni" value={vehicle.wheel_formula} />
            <InfoRowLocal label="Ruhsat Notu" value={vehicle.license_info} />
          </View>
        </View>

        {/* Çekici Bilgileri */}
        {isTruckTractor && (
          <View style={styles.section}>
            <SectionHeader title="Çekici Bilgileri" icon="settings-outline" />
            <View style={styles.sectionContent}>
              <InfoRowLocal label="Euro Norm" value={vehicle.euro_norm ? euroNormLabels[vehicle.euro_norm] : undefined} />
              {vehicle.euro_norm === 'electric' ? (
                <InfoRowLocal label="Batarya Kapasitesi" value={vehicle.battery_capacity ? `${vehicle.battery_capacity} kWh` : undefined} />
              ) : (
                <InfoRowLocal label="Yakıt Kapasitesi" value={vehicle.fuel_capacity ? `${vehicle.fuel_capacity} L` : undefined} />
              )}
              <InfoRowLocal label="GPS Takip" value={vehicle.has_gps_tracker} />
              <InfoRowLocal label="GPS Kimlik No" value={vehicle.gps_identity_no} />
            </View>
          </View>
        )}

        {/* Römork Bilgileri */}
        {isTrailer && (
          <View style={styles.section}>
            <SectionHeader title="Römork Bilgileri" icon="cube-outline" />
            <View style={styles.sectionContent}>
              <InfoRowLocal label="En" value={vehicle.trailer_width ? `${vehicle.trailer_width} m` : undefined} />
              <InfoRowLocal label="Boy" value={vehicle.trailer_length ? `${vehicle.trailer_length} m` : undefined} />
              <InfoRowLocal label="Yükseklik" value={vehicle.trailer_height ? `${vehicle.trailer_height} m` : undefined} />
              <InfoRowLocal label="Hacim" value={vehicle.trailer_volume ? `${vehicle.trailer_volume} m³` : undefined} />
              <InfoRowLocal label="Yan Kapak" value={vehicle.side_door_count} />
              <InfoRowLocal label="XL Sertifikası" value={vehicle.has_xl_certificate} />
              <InfoRowLocal label="Çift Katlı" value={vehicle.is_double_deck} />
              <InfoRowLocal label="P400" value={vehicle.has_p400} />
              <InfoRowLocal label="Kayar Perde" value={vehicle.has_sliding_curtain} />
              <InfoRowLocal label="Hafif Römork" value={vehicle.is_lightweight} />
              <InfoRowLocal label="Tren Uyumlu" value={vehicle.is_train_compatible} />
              <InfoRowLocal label="Brandalı" value={vehicle.has_tarpaulin} />
              <InfoRowLocal label="Rulo" value={vehicle.has_roller} />
              <InfoRowLocal label="Elektronik Kantar" value={vehicle.has_electronic_scale} />
            </View>
          </View>
        )}

        {/* Sahiplik Bilgileri */}
        <View style={styles.section}>
          <SectionHeader title="Sahiplik Bilgileri" icon="person-outline" />
          <View style={styles.sectionContent}>
            <InfoRowLocal label="Ad Soyad" value={vehicle.full_name} />
            <InfoRowLocal label="Şirket Adı" value={vehicle.company_name} />
            <InfoRowLocal label="TC/Vergi No" value={vehicle.id_or_tax_no} />
            <InfoRowLocal label="Noter Adı" value={vehicle.notary_name} />
            <InfoRowLocal label="Noter Satış Tarihi" value={formatDate(vehicle.notary_sale_date)} />
            <InfoRowLocal label="Adres" value={vehicle.address} />
          </View>
        </View>

        {/* Yurtiçi Taşımacılık */}
        {vehicle.domestic_transport_capable && (
          <View style={styles.section}>
            <SectionHeader title="Yurtiçi Taşımacılık" icon="navigate-outline" />
            <View style={styles.sectionContent}>
              <InfoRowLocal label="Yurtiçi Taşıma" value={vehicle.domestic_transport_capable} />
              <InfoRowLocal label="Yurtiçi Araç Sınıfı" value={vehicle.domestic_vehicle_class} />
            </View>
          </View>
        )}
      </View>
    )
  }

  // Render insurance tab
  const renderInsuranceTab = () => {
    const insurances = vehicle?.insurances || []

    if (insurances.length === 0) {
      return (
        <View style={styles.emptyTab}>
          <Ionicons name="shield-outline" size={48} color={DashboardColors.textMuted} />
          <Text style={styles.emptyText}>Henüz sigorta kaydı yok</Text>
        </View>
      )
    }

    return (
      <View style={styles.tabContent}>
        {insurances.map((insurance) => (
          <View key={insurance.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <View style={styles.itemTitleRow}>
                <Ionicons name="shield-outline" size={18} color={DashboardColors.primary} />
                <Text style={styles.itemTitle}>
                  {insuranceTypeLabels[insurance.insurance_type] || insurance.insurance_type}
                </Text>
              </View>
              <View style={[
                styles.statusBadge,
                { backgroundColor: insurance.is_active ? DashboardColors.successBg : DashboardColors.dangerBg }
              ]}>
                <Text style={[
                  styles.statusBadgeText,
                  { color: insurance.is_active ? DashboardColors.success : DashboardColors.danger }
                ]}>
                  {insurance.is_active ? 'Aktif' : 'Pasif'}
                </Text>
              </View>
            </View>
            <View style={styles.itemDetails}>
              <InfoRowLocal label="Poliçe No" value={insurance.policy_number} />
              <InfoRowLocal label="Sigorta Şirketi" value={insurance.insurance_company} />
              <InfoRowLocal label="Başlangıç" value={formatDate(insurance.start_date)} />
              <InfoRowLocal label="Bitiş" value={formatDate(insurance.end_date)} />
              <InfoRowLocal label="Prim Tutarı" value={formatCurrency(insurance.premium_amount)} />
            </View>
          </View>
        ))}
      </View>
    )
  }

  // Render maintenance tab
  const renderMaintenanceTab = () => {
    const maintenances = vehicle?.maintenances || []

    if (maintenances.length === 0) {
      return (
        <View style={styles.emptyTab}>
          <Ionicons name="construct-outline" size={48} color={DashboardColors.textMuted} />
          <Text style={styles.emptyText}>Henüz bakım kaydı yok</Text>
        </View>
      )
    }

    return (
      <View style={styles.tabContent}>
        {maintenances.map((maintenance) => (
          <View key={maintenance.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <View style={styles.itemTitleRow}>
                <Ionicons name="construct-outline" size={18} color={DashboardColors.primary} />
                <Text style={styles.itemTitle}>{formatDate(maintenance.maintenance_date)}</Text>
              </View>
              <View style={[
                styles.statusBadge,
                { backgroundColor: maintenance.is_active ? DashboardColors.successBg : DashboardColors.dangerBg }
              ]}>
                <Text style={[
                  styles.statusBadgeText,
                  { color: maintenance.is_active ? DashboardColors.success : DashboardColors.danger }
                ]}>
                  {maintenance.is_active ? 'Aktif' : 'Pasif'}
                </Text>
              </View>
            </View>
            <View style={styles.itemDetails}>
              <InfoRowLocal label="Bakım KM" value={formatNumber(maintenance.maintenance_km, 'km')} />
              <InfoRowLocal label="Sonraki Bakım KM" value={formatNumber(maintenance.next_maintenance_km, 'km')} />
              <InfoRowLocal label="Maliyet" value={formatCurrency(maintenance.cost, maintenance.currency_type)} />
              <InfoRowLocal label="Servis" value={maintenance.service_provider} />
              {maintenance.oil_change && <InfoRowLocal label="Yağ Değişimi" value={true} />}
              {maintenance.oil_filter_change && <InfoRowLocal label="Yağ Filtresi" value={true} />}
              {maintenance.air_filter_change && <InfoRowLocal label="Hava Filtresi" value={true} />}
              {maintenance.brake_adjustment && <InfoRowLocal label="Fren Ayarı" value={true} />}
              {maintenance.tire_change && <InfoRowLocal label="Lastik Değişimi" value={true} />}
            </View>
          </View>
        ))}
      </View>
    )
  }

  // Render inspection tab
  const renderInspectionTab = () => {
    const inspections = vehicle?.inspections || []

    if (inspections.length === 0) {
      return (
        <View style={styles.emptyTab}>
          <Ionicons name="clipboard-outline" size={48} color={DashboardColors.textMuted} />
          <Text style={styles.emptyText}>Henüz muayene kaydı yok</Text>
        </View>
      )
    }

    return (
      <View style={styles.tabContent}>
        {inspections.map((inspection) => (
          <View key={inspection.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <View style={styles.itemTitleRow}>
                <Ionicons name="clipboard-outline" size={18} color={DashboardColors.primary} />
                <Text style={styles.itemTitle}>{formatDate(inspection.inspection_date)}</Text>
              </View>
              <View style={[
                styles.statusBadge,
                {
                  backgroundColor: inspection.result === 'passed' ? DashboardColors.successBg :
                    inspection.result === 'failed' ? DashboardColors.dangerBg : DashboardColors.warningBg
                }
              ]}>
                <Text style={[
                  styles.statusBadgeText,
                  {
                    color: inspection.result === 'passed' ? DashboardColors.success :
                      inspection.result === 'failed' ? DashboardColors.danger : DashboardColors.warning
                  }
                ]}>
                  {inspection.result === 'passed' ? 'Geçti' :
                    inspection.result === 'failed' ? 'Kaldı' : 'Beklemede'}
                </Text>
              </View>
            </View>
            <View style={styles.itemDetails}>
              <InfoRowLocal label="Sonraki Muayene" value={formatDate(inspection.next_inspection_date)} />
              <InfoRowLocal label="İstasyon" value={inspection.station} />
              <InfoRowLocal label="Ücret" value={formatCurrency(inspection.fee, inspection.currency)} />
              <InfoRowLocal label="KM" value={formatNumber(inspection.odometer, 'km')} />
              <InfoRowLocal label="Notlar" value={inspection.notes} />
            </View>
          </View>
        ))}
      </View>
    )
  }

  // Render faults tab
  const renderFaultsTab = () => {
    const faults = vehicle?.faultReports || []

    if (faults.length === 0) {
      return (
        <View style={styles.emptyTab}>
          <Ionicons name="warning-outline" size={48} color={DashboardColors.textMuted} />
          <Text style={styles.emptyText}>Henüz arıza bildirimi yok</Text>
        </View>
      )
    }

    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'critical': return DashboardColors.danger
        case 'high': return DashboardColors.warning
        case 'medium': return DashboardColors.info
        default: return DashboardColors.textMuted
      }
    }

    return (
      <View style={styles.tabContent}>
        {faults.map((fault) => (
          <View key={fault.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <View style={styles.itemTitleRow}>
                <Ionicons
                  name="warning-outline"
                  size={18}
                  color={getPriorityColor(fault.priority)}
                />
                <Text style={styles.itemTitle} numberOfLines={1}>{fault.title}</Text>
              </View>
              <View style={[
                styles.statusBadge,
                {
                  backgroundColor: fault.status === 'resolved' ? DashboardColors.successBg :
                    fault.status === 'in_progress' ? DashboardColors.infoBg :
                      fault.status === 'cancelled' ? DashboardColors.dangerBg : DashboardColors.warningBg
                }
              ]}>
                <Text style={[
                  styles.statusBadgeText,
                  {
                    color: fault.status === 'resolved' ? DashboardColors.success :
                      fault.status === 'in_progress' ? DashboardColors.info :
                        fault.status === 'cancelled' ? DashboardColors.danger : DashboardColors.warning
                  }
                ]}>
                  {faultStatusLabels[fault.status] || fault.status}
                </Text>
              </View>
            </View>
            <View style={styles.itemDetails}>
              <InfoRowLocal label="Öncelik" value={faultPriorityLabels[fault.priority]} />
              <InfoRowLocal label="Açıklama" value={fault.description} />
              <InfoRowLocal label="Bildirme Tarihi" value={formatDate(fault.reported_at || fault.created_at)} />
              {fault.resolved_at && <InfoRowLocal label="Çözüm Tarihi" value={formatDate(fault.resolved_at)} />}
              <InfoRowLocal label="Tahmini Maliyet" value={formatCurrency(fault.estimated_cost, fault.estimated_currency)} />
              <InfoRowLocal label="Gerçek Maliyet" value={formatCurrency(fault.actual_cost, fault.actual_currency)} />
            </View>
          </View>
        ))}
      </View>
    )
  }

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':
        return renderInfoTab()
      case 'insurance':
        return renderInsuranceTab()
      case 'maintenance':
        return renderMaintenanceTab()
      case 'inspection':
        return renderInspectionTab()
      case 'faults':
        return renderFaultsTab()
      default:
        return null
    }
  }

  const statusColors = vehicle ? (STATUS_COLORS[vehicle.status] || STATUS_COLORS.available) : STATUS_COLORS.available

  return (
    <View style={styles.container}>
      {/* Header - tek sefer render */}
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
            {/* Sol: Geri Butonu */}
            <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>

            {/* Orta: Başlık */}
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>
                {vehicle ? vehicle.plate : 'Araç Detayı'}
              </Text>
              {vehicle && (
                <Text style={styles.headerSubtitle}>
                  {vehicleTypeLabels[vehicle.vehicle_type] || vehicle.vehicle_type}
                </Text>
              )}
            </View>

            {/* Sağ: Düzenle ve Sil */}
            {!isLoading && vehicle ? (
              <View style={styles.headerActions}>
                <TouchableOpacity onPress={handleEdit} style={styles.headerButton}>
                  <Ionicons name="create-outline" size={22} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleDelete}
                  style={[styles.headerButton, styles.deleteButton]}
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
        </View>

        <View style={styles.bottomCurve} />
      </View>

      {/* Loading State */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DashboardColors.primary} />
          <Text style={styles.loadingText}>Araç bilgileri yükleniyor...</Text>
        </View>
      )}

      {/* Error State */}
      {!isLoading && (error || !vehicle) && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={64} color={DashboardColors.danger} />
          <Text style={styles.errorTitle}>Bir hata oluştu</Text>
          <Text style={styles.errorText}>{error || 'Araç bulunamadı'}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchData(true)}
          >
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Normal İçerik */}
      {!isLoading && vehicle && (<>
      {/* Vehicle Summary Card - Content alanında */}
      <View style={styles.summaryCardContainer}>
        <View style={styles.summaryCard}>
          {/* Header - liste card ile aynı yapı */}
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <Ionicons name="car-sport-outline" size={20} color={DashboardColors.primary} />
            </View>
            <View style={styles.cardHeaderContent}>
              <Text style={styles.cardPlate} numberOfLines={1}>{vehicle.plate}</Text>
              <Text style={styles.cardType} numberOfLines={1}>
                {vehicleTypeLabels[vehicle.vehicle_type] || vehicle.vehicle_type}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
              <Text style={[styles.statusBadgeText, { color: statusColors.primary }]}>
                {statusLabels[vehicle.status] || vehicle.status}
              </Text>
            </View>
          </View>

          {/* Info rows - liste card ile aynı yapı */}
          <View style={styles.cardInfo}>
            <View style={styles.infoRow}>
              <Ionicons name="business-outline" size={14} color={DashboardColors.textMuted} />
              <Text style={styles.infoText}>
                {vehicle.brand || '-'} {vehicle.model || ''}
                {(vehicle.model_year || vehicle.year) ? ` (${vehicle.model_year || vehicle.year})` : ''}
              </Text>
            </View>
            {(vehicle.total_km || vehicle.km_counter) ? (
              <View style={styles.infoRow}>
                <Ionicons name="speedometer-outline" size={14} color={DashboardColors.textMuted} />
                <Text style={styles.infoText}>
                  {formatNumber(vehicle.total_km || vehicle.km_counter, 'km')}
                </Text>
              </View>
            ) : null}
            <View style={styles.infoRow}>
              <Ionicons name="key-outline" size={14} color={DashboardColors.textMuted} />
              <Text style={styles.infoText}>
                {ownershipLabels[vehicle.ownership_type] || vehicle.ownership_type}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            // Count items for badge
            let count = 0
            if (tab.id === 'insurance') count = vehicle.insurances?.length || 0
            else if (tab.id === 'maintenance') count = vehicle.maintenances?.length || 0
            else if (tab.id === 'inspection') count = vehicle.inspections?.length || 0
            else if (tab.id === 'faults') count = vehicle.faultReports?.length || 0

            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tab,
                  isActive && styles.tabActive
                ]}
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
                    <View style={[
                      styles.tabBadge,
                      { backgroundColor: isActive ? DashboardColors.primary : DashboardColors.textMuted }
                    ]}>
                      <Text style={styles.tabBadgeText}>{count}</Text>
                    </View>
                  )}
                </View>
                <Text style={[
                  styles.tabText,
                  { color: isActive ? DashboardColors.primary : DashboardColors.textSecondary }
                ]}>
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
      </>)}

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        ref={deleteDialogRef}
        title="Aracı Sil"
        message="Bu aracı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        type="danger"
        confirmText="Sil"
        cancelText="İptal"
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
  headerContainer: {
    position: 'relative',
    paddingBottom: 32,
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
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DashboardSpacing.md
  },
  headerTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center'
  },
  headerSubtitle: {
    fontSize: DashboardFontSizes.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 2
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

  // Summary Card - liste card ile aynı yapı
  summaryCardContainer: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingBottom: DashboardSpacing.md,
    backgroundColor: DashboardColors.background
  },
  summaryCard: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.lg,
    gap: DashboardSpacing.md,
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
    backgroundColor: DashboardColors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardHeaderContent: {
    flex: 1,
    marginLeft: DashboardSpacing.sm,
    marginRight: DashboardSpacing.md
  },
  cardPlate: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
    letterSpacing: 0.3,
    marginBottom: 2
  },
  cardType: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textMuted,
    fontWeight: '500'
  },
  cardInfo: {
    gap: DashboardSpacing.xs
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

  // Tabs
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight,
    backgroundColor: DashboardColors.surface
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
    minWidth: 70
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
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 4
  },
  tabText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '500'
  },

  // Content
  scrollView: {
    flex: 1,
    backgroundColor: DashboardColors.background
  },
  scrollContent: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: 0,
    paddingBottom: DashboardSpacing['2xl']
  },
  tabContent: {
    paddingTop: DashboardSpacing.lg,
    gap: DashboardSpacing.md
  },

  // Sections
  section: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    overflow: 'hidden',
    ...DashboardShadows.sm
  },
  sectionContent: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingBottom: DashboardSpacing.lg,
    gap: DashboardSpacing.xs
  },

  // Item Cards (for tabs)
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
    marginBottom: DashboardSpacing.md
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    flex: 1,
    marginRight: DashboardSpacing.sm
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
  statusBadge: {
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 4,
    borderRadius: DashboardBorderRadius.md
  },
  statusBadgeText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '700'
  },

  // Empty State
  emptyTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DashboardSpacing['4xl'],
    gap: DashboardSpacing.md
  },
  emptyText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: DashboardSpacing.md,
    backgroundColor: DashboardColors.background
  },
  loadingText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary
  },

  // Error
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: DashboardSpacing['2xl'],
    gap: DashboardSpacing.md,
    backgroundColor: DashboardColors.background
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
    borderRadius: DashboardBorderRadius.lg,
    backgroundColor: DashboardColors.primary
  },
  retryButtonText: {
    color: '#fff',
    fontSize: DashboardFontSizes.base,
    fontWeight: '600'
  }
})
