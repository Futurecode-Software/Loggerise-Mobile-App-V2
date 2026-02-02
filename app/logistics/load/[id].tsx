/**
 * Yük Detay Sayfası
 *
 * Yük bilgilerini detaylı görüntüleme - loads.tsx tasarımı ile uyumlu
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
  LoadDirectionLabels
} from '@/constants/load-theme'
import { getLoad, deleteLoad } from '@/services/endpoints/loads'
import type { LoadDetail, LoadItem } from '@/types/load'
import { formatCurrency } from '@/utils/currency'

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
  const formatted = value.toLocaleString('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })
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
  const [expandedItems, setExpandedItems] = useState(false)
  const [expandedAddresses, setExpandedAddresses] = useState(false)

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

  // Yük kalemleri özeti
  const getItemsSummary = (items: LoadItem[]) => {
    let totalWeight = 0
    let totalVolume = 0
    let totalLDM = 0

    items.forEach(item => {
      if (item.gross_weight) totalWeight += item.gross_weight
      if (item.volume) totalVolume += item.volume
      if (item.lademetre) totalLDM += item.lademetre
    })

    return { totalWeight, totalVolume, totalLDM }
  }

  const itemsSummary = load ? getItemsSummary(load.items || []) : { totalWeight: 0, totalVolume: 0, totalLDM: 0 }
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

        <Text style={styles.cargoName} numberOfLines={1}>
          {load.cargo_name || 'Kargo adı belirtilmemiş'}
        </Text>

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

        {/* Normal içerik */}
        {!isLoading && load && (
          <>
            {/* Temel Bilgiler */}
            <View style={styles.card}>
              <SectionHeader title="Temel Bilgiler" icon="information-circle-outline" />
              <View style={styles.cardContent}>
                <InfoRow label="Araç Tipi" value={load.vehicle_type || '-'} icon="car-outline" />
                <InfoRow label="Yükleme Tipi" value={load.loading_type || '-'} icon="layers-outline" />
                <InfoRow label="Taşıma Hızı" value={load.transport_speed || '-'} icon="speedometer-outline" />
                <InfoRow label="Kargo Sınıfı" value={load.cargo_class || '-'} icon="pricetag-outline" />
                <InfoRow
                  label="Yük Tipi"
                  value={load.load_type === 'full' ? 'Komple' : load.load_type === 'partial' ? 'Parsiyel' : '-'}
                  icon="cube-outline"
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

            {/* Yük Kalemleri */}
            {load.items && load.items.length > 0 && (
              <View style={styles.card}>
                <SectionHeader
                  title="Yük Kalemleri"
                  icon="list-outline"
                  count={load.items.length}
                  isExpanded={expandedItems}
                  onToggle={() => {
                    Haptics.selectionAsync()
                    setExpandedItems(!expandedItems)
                  }}
                />

                {!expandedItems && (
                  <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                      <Ionicons name="scale-outline" size={16} color={DashboardColors.textMuted} />
                      <Text style={styles.summaryValue}>
                        {formatNumber(itemsSummary.totalWeight, 'kg')}
                      </Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Ionicons name="cube-outline" size={16} color={DashboardColors.textMuted} />
                      <Text style={styles.summaryValue}>
                        {formatNumber(itemsSummary.totalVolume, 'm³')}
                      </Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Ionicons name="resize-outline" size={16} color={DashboardColors.textMuted} />
                      <Text style={styles.summaryValue}>
                        {formatNumber(itemsSummary.totalLDM, 'LDM')}
                      </Text>
                    </View>
                  </View>
                )}

                {expandedItems && (
                  <View style={styles.cardContent}>
                    {load.items.map((item, index) => (
                      <View key={item.id || index} style={styles.itemCard}>
                        <View style={styles.itemHeader}>
                          <Text style={styles.itemName}>
                            {item.cargo_name || `Kalem #${index + 1}`}
                          </Text>
                          {item.is_hazardous && (
                            <View style={styles.hazardBadge}>
                              <Ionicons name="warning" size={12} color={DashboardColors.danger} />
                              <Text style={styles.hazardText}>ADR</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.itemDetails}>
                          {item.package_type && (
                            <Text style={styles.itemDetail}>
                              {item.package_count || 0} {item.package_type}
                            </Text>
                          )}
                          {item.gross_weight && (
                            <Text style={styles.itemDetail}>
                              {formatNumber(item.gross_weight, 'kg')}
                            </Text>
                          )}
                          {item.volume && (
                            <Text style={styles.itemDetail}>
                              {formatNumber(item.volume, 'm³')}
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Adresler */}
            {(pickupAddress || deliveryAddress) && (
              <View style={styles.card}>
                <SectionHeader
                  title="Adresler"
                  icon="location-outline"
                  count={load.addresses?.length}
                  isExpanded={expandedAddresses}
                  onToggle={() => {
                    Haptics.selectionAsync()
                    setExpandedAddresses(!expandedAddresses)
                  }}
                />

                {!expandedAddresses && (
                  <View style={styles.addressSummary}>
                    {pickupAddress?.loadingCompany && (
                      <View style={styles.addressSummaryItem}>
                        <Ionicons name="arrow-up-circle" size={16} color={DashboardColors.success} />
                        <Text style={styles.addressSummaryText} numberOfLines={1}>
                          {pickupAddress.loadingCompany.name}
                        </Text>
                      </View>
                    )}
                    <Ionicons name="arrow-forward" size={16} color={DashboardColors.textMuted} />
                    {deliveryAddress?.unloadingCompany && (
                      <View style={styles.addressSummaryItem}>
                        <Ionicons name="arrow-down-circle" size={16} color={DashboardColors.info} />
                        <Text style={styles.addressSummaryText} numberOfLines={1}>
                          {deliveryAddress.unloadingCompany.name}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {expandedAddresses && (
                  <View style={styles.cardContent}>
                    {pickupAddress && (
                      <View style={styles.addressCard}>
                        <View style={styles.addressHeader}>
                          <View style={[styles.addressIcon, { backgroundColor: DashboardColors.successBg }]}>
                            <Ionicons name="arrow-up" size={16} color={DashboardColors.success} />
                          </View>
                          <Text style={styles.addressTitle}>Yükleme Noktası</Text>
                        </View>
                        {pickupAddress.loadingCompany && (
                          <InfoRow label="Firma" value={pickupAddress.loadingCompany.name} />
                        )}
                        {pickupAddress.loadingLocation && (
                          <InfoRow label="Lokasyon" value={pickupAddress.loadingLocation.title} />
                        )}
                        {pickupAddress.expected_loading_entry_date && (
                          <InfoRow label="Beklenen Tarih" value={formatDate(pickupAddress.expected_loading_entry_date)} />
                        )}
                      </View>
                    )}

                    {deliveryAddress && (
                      <View style={[styles.addressCard, { marginTop: DashboardSpacing.sm }]}>
                        <View style={styles.addressHeader}>
                          <View style={[styles.addressIcon, { backgroundColor: DashboardColors.infoBg }]}>
                            <Ionicons name="arrow-down" size={16} color={DashboardColors.info} />
                          </View>
                          <Text style={styles.addressTitle}>Boşaltma Noktası</Text>
                        </View>
                        {deliveryAddress.unloadingCompany && (
                          <InfoRow label="Firma" value={deliveryAddress.unloadingCompany.name} />
                        )}
                        {deliveryAddress.unloadingLocation && (
                          <InfoRow label="Lokasyon" value={deliveryAddress.unloadingLocation.title} />
                        )}
                        {deliveryAddress.expected_unloading_entry_date && (
                          <InfoRow label="Beklenen Tarih" value={formatDate(deliveryAddress.expected_unloading_entry_date)} />
                        )}
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

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

            {/* Beyanname Bilgileri - Sadece ihracat/ithalat yüklerinde */}
            {load.direction && (
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

            {/* Fatura Bilgileri - Sadece ihracat/ithalat yüklerinde */}
            {load.direction && (
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

            {/* Gümrük Bilgileri - Sadece ihracat/ithalat yüklerinde */}
            {load.direction && (load.gtip_hs_code || load.atr_no || load.regime_no) && (
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

            {/* Belge Durumları - Sadece ihracat/ithalat yüklerinde */}
            {load.direction && (
              load.invoice_document ||
              load.atr_document ||
              load.packing_list_document ||
              load.origin_certificate_document ||
              load.health_certificate_document ||
              load.eur1_document ||
              load.t1_t2_document
            ) && (
              <View style={styles.card}>
                <SectionHeader title="Belge Durumları" icon="folder-outline" />
                <View style={styles.cardContent}>
                  {load.invoice_document && (
                    <InfoRow
                      label="Fatura"
                      value={load.invoice_document === 'original' ? 'Orijinal' : 'Kopya'}
                      icon="receipt-outline"
                    />
                  )}
                  {load.atr_document && (
                    <InfoRow
                      label="ATR"
                      value={load.atr_document === 'original' ? 'Orijinal' : 'Kopya'}
                      icon="document-text-outline"
                    />
                  )}
                  {load.packing_list_document && (
                    <InfoRow
                      label="Çeki Listesi"
                      value={load.packing_list_document === 'original' ? 'Orijinal' : 'Kopya'}
                      icon="list-outline"
                    />
                  )}
                  {load.origin_certificate_document && (
                    <InfoRow
                      label="Menşei Belgesi"
                      value={load.origin_certificate_document === 'original' ? 'Orijinal' : 'Kopya'}
                      icon="flag-outline"
                    />
                  )}
                  {load.health_certificate_document && (
                    <InfoRow
                      label="Sağlık Sertifikası"
                      value={load.health_certificate_document === 'original' ? 'Orijinal' : 'Kopya'}
                      icon="medkit-outline"
                    />
                  )}
                  {load.eur1_document && (
                    <InfoRow
                      label="EUR-1"
                      value={load.eur1_document === 'original' ? 'Orijinal' : 'Kopya'}
                      icon="document-outline"
                    />
                  )}
                  {load.t1_t2_document && (
                    <InfoRow
                      label="T1/T2"
                      value={load.t1_t2_document === 'original' ? 'Orijinal' : 'Kopya'}
                      icon="document-attach-outline"
                    />
                  )}
                </View>
              </View>
            )}

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

            {/* Alt boşluk */}
            <View style={{ height: insets.bottom + DashboardSpacing['3xl'] }} />
          </>
        )}
      </ScrollView>

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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DashboardSpacing.lg
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
  cargoName: {
    fontSize: DashboardFontSizes.base,
    color: 'rgba(255, 255, 255, 0.8)'
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

  // Özet
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: DashboardSpacing.lg,
    paddingHorizontal: DashboardSpacing.lg
  },
  summaryItem: {
    alignItems: 'center',
    gap: DashboardSpacing.xs
  },
  summaryValue: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: DashboardColors.textPrimary
  },

  // Yük Kalemi
  itemCard: {
    backgroundColor: DashboardColors.background,
    borderRadius: DashboardBorderRadius.lg,
    padding: DashboardSpacing.md,
    marginTop: DashboardSpacing.sm
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DashboardSpacing.xs
  },
  itemName: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    flex: 1
  },
  hazardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: DashboardColors.dangerBg,
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 2,
    borderRadius: DashboardBorderRadius.sm
  },
  hazardText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600',
    color: DashboardColors.danger
  },
  itemDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DashboardSpacing.md
  },
  itemDetail: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary
  },

  // Adres
  addressSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.lg,
    paddingHorizontal: DashboardSpacing.lg
  },
  addressSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.xs,
    maxWidth: 140
  },
  addressSummaryText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textPrimary
  },
  addressCard: {
    backgroundColor: DashboardColors.background,
    borderRadius: DashboardBorderRadius.lg,
    padding: DashboardSpacing.md
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    marginBottom: DashboardSpacing.sm
  },
  addressIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  addressTitle: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: DashboardColors.textPrimary
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
