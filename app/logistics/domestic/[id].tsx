/**
 * Domestic Transport Order Detail Screen
 *
 * Shows order details with items, pricing, and expenses.
 * Matches web version at /yurtici-tasimacilik/{id}
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
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
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import Toast from 'react-native-toast-message'
import ConfirmDialog from '@/components/modals/ConfirmDialog'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius,
  DashboardShadows
} from '@/constants/dashboard-theme'
import { formatCurrency } from '@/utils/currency'
import {
  getDomesticOrder,
  deleteDomesticOrder,
  updateDomesticOrderStatus,
  DomesticTransportOrder,
  DomesticOrderStatus,
  getOrderStatusLabel,
  getOrderTypeLabel,
  getOrderTypeColor,
  getBillingTypeLabel,
  getDriverFullName
} from '@/services/endpoints/domestic-orders'

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

const formatDateTime = (dateString?: string): string => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateString
  }
}

// Bölüm başlığı
interface SectionHeaderProps {
  title: string
  icon: keyof typeof Ionicons.glyphMap
}

function SectionHeader({ title, icon }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>
        <Ionicons name={icon} size={16} color={DashboardColors.primary} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  )
}

// Bilgi satırı
interface InfoRowProps {
  label: string
  value: string
  icon?: keyof typeof Ionicons.glyphMap
}

function InfoRow({ label, value, icon }: InfoRowProps) {
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
      <Text style={styles.infoValue}>
        {value}
      </Text>
    </View>
  )
}

// Badge component
interface BadgeProps {
  label: string
  variant: 'success' | 'warning' | 'error' | 'info'
}

function Badge({ label, variant }: BadgeProps) {
  const colors: Record<typeof variant, { bg: string; text: string }> = {
    success: { bg: 'rgba(16, 185, 129, 0.2)', text: DashboardColors.success },
    warning: { bg: 'rgba(245, 158, 11, 0.2)', text: '#f59e0b' },
    error: { bg: 'rgba(239, 68, 68, 0.2)', text: DashboardColors.danger },
    info: { bg: 'rgba(59, 130, 246, 0.2)', text: '#3b82f6' }
  }

  return (
    <View style={[styles.badge, { backgroundColor: colors[variant].bg }]}>
      <Text style={[styles.badgeText, { color: colors[variant].text }]}>
        {label}
      </Text>
    </View>
  )
}

// Status variant'ı badge variant'a çevir
const getStatusVariant = (status: DomesticOrderStatus): 'success' | 'warning' | 'error' | 'info' => {
  switch (status) {
    case 'completed':
      return 'success'
    case 'cancelled':
      return 'error'
    case 'draft':
      return 'warning'
    default:
      return 'info'
  }
}

// Tabs
const TABS = [
  { id: 'info', label: 'Genel Bilgi' },
  { id: 'items', label: 'Kalemler' },
  { id: 'pricing', label: 'Fiyatlandırma' },
  { id: 'expenses', label: 'Masraflar' }
]

export default function DomesticOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()

  // State
  const [order, setOrder] = useState<DomesticTransportOrder | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('info')
  const [isDeleting, setIsDeleting] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<DomesticOrderStatus | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  // Refs
  const isMountedRef = useRef(true)
  const deleteDialogRef = useRef<BottomSheetModal>(null)
  const statusDialogRef = useRef<BottomSheetModal>(null)

  const fetchOrder = useCallback(async (showLoading = true) => {
    if (!id) return

    try {
      if (showLoading) {
        setIsLoading(true)
        setError(null)
      }

      const data = await getDomesticOrder(Number(id))

      if (isMountedRef.current) {
        setOrder(data)
        setError(null)
      }
    } catch (err) {
      if (isMountedRef.current) {
        console.error('Order fetch error:', err)
        setError(err instanceof Error ? err.message : 'İş emri yüklenemedi')
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
        setRefreshing(false)
      }
    }
  }, [id])

  useEffect(() => {
    isMountedRef.current = true
    fetchOrder()

    return () => {
      isMountedRef.current = false
    }
  }, [fetchOrder])

  // Edit sayfasından dönüşte yenile
  useFocusEffect(
    useCallback(() => {
      fetchOrder(false)
    }, [fetchOrder])
  )

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchOrder(false)
  }, [fetchOrder])

  const handleDelete = async () => {
    if (!order) return

    setIsDeleting(true)
    try {
      await deleteDomesticOrder(order.id)
      deleteDialogRef.current?.dismiss()
      Toast.show({
        type: 'success',
        text1: 'İş emri silindi',
        position: 'top',
        visibilityTime: 1500
      })

      setTimeout(() => {
        router.back()
      }, 300)
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: err instanceof Error ? err.message : 'İş emri silinemedi',
        position: 'top',
        visibilityTime: 1500
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleStatusChange = async () => {
    if (!order || !pendingStatus) return

    setIsUpdatingStatus(true)
    try {
      const dates: { pickup_actual_date?: string; delivery_actual_date?: string } = {}

      if (pendingStatus === 'in_transit') {
        dates.pickup_actual_date = new Date().toISOString()
      } else if (pendingStatus === 'completed') {
        dates.delivery_actual_date = new Date().toISOString()
      }

      const updatedOrder = await updateDomesticOrderStatus(order.id, pendingStatus, dates)
      setOrder(updatedOrder)
      statusDialogRef.current?.dismiss()
      Toast.show({
        type: 'success',
        text1: 'Durum güncellendi',
        position: 'top',
        visibilityTime: 1500
      })
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: err instanceof Error ? err.message : 'Durum güncellenemedi',
        position: 'top',
        visibilityTime: 1500
      })
    } finally {
      setIsUpdatingStatus(false)
      setPendingStatus(null)
    }
  }

  const getNextStatus = (): DomesticOrderStatus | null => {
    if (!order) return null

    const statusFlow: Record<DomesticOrderStatus, DomesticOrderStatus | null> = {
      draft: 'planned',
      planned: 'assigned',
      assigned: 'in_transit',
      in_transit: 'completed',
      completed: null,
      cancelled: null,
    }

    return statusFlow[order.status]
  }

  const getStatusActionLabel = (status: DomesticOrderStatus): string => {
    const labels: Record<DomesticOrderStatus, string> = {
      draft: 'Taslak',
      planned: 'Planla',
      assigned: 'Ata',
      in_transit: 'Yola Çıkar',
      completed: 'Tamamla',
      cancelled: 'İptal Et',
    }
    return labels[status]
  }

  const nextStatus = getNextStatus()

  const renderInfoTab = () => (
    <View style={styles.tabContentWrapper}>
      {/* Status & Type */}
      <View style={styles.card}>
        <SectionHeader title="Sipariş Bilgileri" icon="document-text-outline" />
        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <Ionicons name="flag-outline" size={14} color={DashboardColors.textMuted} style={styles.infoIcon} />
              <Text style={styles.infoLabelText}>Durum</Text>
            </View>
            <Badge label={getOrderStatusLabel(order.status)} variant={getStatusVariant(order.status)} />
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <Ionicons name="layers-outline" size={14} color={DashboardColors.textMuted} style={styles.infoIcon} />
              <Text style={styles.infoLabelText}>Sipariş Tipi</Text>
            </View>
            <View style={[styles.typeBadge, { backgroundColor: getOrderTypeColor(order.order_type) + '20' }]}>
              <Text style={[styles.typeText, { color: getOrderTypeColor(order.order_type) }]}>
                {getOrderTypeLabel(order.order_type)}
              </Text>
            </View>
          </View>

          {order.billing_type && (
            <InfoRow
              label="Faturalama"
              value={getBillingTypeLabel(order.billing_type)}
              icon="receipt-outline"
            />
          )}

          {order.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notlar:</Text>
              <Text style={styles.notesText}>{order.notes}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Customer */}
      {order.customer && (
        <View style={styles.card}>
          <SectionHeader title="Müşteri" icon="person-outline" />
          <View style={styles.cardContent}>
            <InfoRow
              label="Müşteri Adı"
              value={order.customer.name}
              icon="text-outline"
            />
            {order.customer.code && (
              <InfoRow
                label="Müşteri Kodu"
                value={order.customer.code}
                icon="barcode-outline"
              />
            )}
            {order.customer.phone && (
              <InfoRow
                label="Telefon"
                value={order.customer.phone}
                icon="call-outline"
              />
            )}
          </View>
        </View>
      )}

      {/* Addresses */}
      <View style={styles.card}>
        <SectionHeader title="Adresler" icon="location-outline" />
        <View style={styles.cardContent}>
          {order.pickup_address && (
            <View style={styles.addressBlock}>
              <View style={styles.addressHeader}>
                <View style={[styles.addressDot, { backgroundColor: '#22c55e' }]} />
                <Text style={styles.addressTitle}>Alım Adresi</Text>
              </View>
              {order.pickup_address.title && (
                <Text style={styles.addressName}>{order.pickup_address.title}</Text>
              )}
              <Text style={styles.addressText}>
                {order.pickup_address.formatted_address || order.pickup_address.address}
              </Text>
            </View>
          )}

          {order.delivery_address && (
            <View style={[styles.addressBlock, order.pickup_address && { marginTop: DashboardSpacing.md }]}>
              <View style={styles.addressHeader}>
                <View style={[styles.addressDot, { backgroundColor: '#ef4444' }]} />
                <Text style={styles.addressTitle}>Teslimat Adresi</Text>
              </View>
              {order.delivery_address.title && (
                <Text style={styles.addressName}>{order.delivery_address.title}</Text>
              )}
              <Text style={styles.addressText}>
                {order.delivery_address.formatted_address || order.delivery_address.address}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Dates */}
      <View style={styles.card}>
        <SectionHeader title="Tarihler" icon="calendar-outline" />
        <View style={styles.cardContent}>
          <View style={styles.dateGrid}>
            <View style={styles.dateBlock}>
              <Text style={styles.dateLabel}>Planlanan Alım</Text>
              <Text style={styles.dateValue}>
                {formatDate(order.pickup_expected_date)}
              </Text>
            </View>
            <View style={styles.dateBlock}>
              <Text style={styles.dateLabel}>Gerçekleşen Alım</Text>
              <Text style={[styles.dateValue, order.pickup_actual_date && styles.dateValueActive]}>
                {formatDateTime(order.pickup_actual_date)}
              </Text>
            </View>
            <View style={styles.dateBlock}>
              <Text style={styles.dateLabel}>Planlanan Teslimat</Text>
              <Text style={styles.dateValue}>
                {formatDate(order.delivery_expected_date)}
              </Text>
            </View>
            <View style={styles.dateBlock}>
              <Text style={styles.dateLabel}>Gerçekleşen Teslimat</Text>
              <Text style={[styles.dateValue, order.delivery_actual_date && styles.dateValueActive]}>
                {formatDateTime(order.delivery_actual_date)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Assignment */}
      <View style={styles.card}>
        <SectionHeader title="Atama" icon="car-outline" />
        <View style={styles.cardContent}>
          <InfoRow
            label="Araç"
            value={order.vehicle ? `${order.vehicle.plate} - ${order.vehicle.brand || ''} ${order.vehicle.model || ''}`.trim() : '-'}
            icon="car-sport-outline"
          />
          <InfoRow
            label="Sürücü"
            value={getDriverFullName(order.driver)}
            icon="person-outline"
          />
          {order.driver?.phone_1 && (
            <InfoRow
              label="Telefon"
              value={order.driver.phone_1}
              icon="call-outline"
            />
          )}
        </View>
      </View>
    </View>
  )

  const renderItemsTab = () => (
    <View style={styles.tabContentWrapper}>
      {order.items && order.items.length > 0 ? (
        order.items.map((item, index) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.itemHeader}>
              <Ionicons name="cube-outline" size={18} color={DashboardColors.primary} />
              <Text style={styles.itemTitle}>
                {item.description || `Kalem ${index + 1}`}
              </Text>
            </View>

            <View style={styles.cardContent}>
              <View style={styles.itemDetails}>
                {item.package_type && (
                  <View style={styles.itemDetail}>
                    <Text style={styles.itemLabel}>Paket Tipi:</Text>
                    <Text style={styles.itemValue}>{item.package_type}</Text>
                  </View>
                )}
                {item.package_count && (
                  <View style={styles.itemDetail}>
                    <Text style={styles.itemLabel}>Adet:</Text>
                    <Text style={styles.itemValue}>{item.package_count}</Text>
                  </View>
                )}
                {item.gross_weight && (
                  <View style={styles.itemDetail}>
                    <Text style={styles.itemLabel}>Ağırlık:</Text>
                    <Text style={styles.itemValue}>{item.gross_weight} kg</Text>
                  </View>
                )}
                {item.volume && (
                  <View style={styles.itemDetail}>
                    <Text style={styles.itemLabel}>Hacim:</Text>
                    <Text style={styles.itemValue}>{item.volume} m³</Text>
                  </View>
                )}
              </View>

              {/* Flags */}
              <View style={styles.itemFlags}>
                {item.is_fragile && (
                  <View style={[styles.flagBadge, { backgroundColor: '#f59e0b' + '20' }]}>
                    <Text style={[styles.flagText, { color: '#f59e0b' }]}>Kırılabilir</Text>
                  </View>
                )}
                {item.requires_temperature_control && (
                  <View style={[styles.flagBadge, { backgroundColor: '#3b82f6' + '20' }]}>
                    <Text style={[styles.flagText, { color: '#3b82f6' }]}>
                      Sıcaklık: {item.min_temperature}°C - {item.max_temperature}°C
                    </Text>
                  </View>
                )}
                {item.requires_insurance && (
                  <View style={[styles.flagBadge, { backgroundColor: '#8b5cf6' + '20' }]}>
                    <Text style={[styles.flagText, { color: '#8b5cf6' }]}>Sigortalı</Text>
                  </View>
                )}
              </View>

              {item.special_instructions && (
                <Text style={styles.specialInstructions}>
                  {item.special_instructions}
                </Text>
              )}
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyTab}>
          <Ionicons name="cube-outline" size={48} color={DashboardColors.textMuted} />
          <Text style={styles.emptyTabText}>
            Henüz kalem eklenmemiş
          </Text>
        </View>
      )}
    </View>
  )

  const renderPricingTab = () => {
    const totalRevenue = order.pricing_items?.reduce((sum, item) => sum + (item.total_amount || 0), 0) || 0

    return (
      <View style={styles.tabContentWrapper}>
        {order.pricing_items && order.pricing_items.length > 0 ? (
          <>
            {order.pricing_items.map((item, index) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.pricingHeader}>
                  <Text style={styles.pricingType}>
                    {item.item_type || `Kalem ${index + 1}`}
                  </Text>
                  <Text style={styles.pricingAmount}>
                    {formatCurrency(item.total_amount, item.currency)}
                  </Text>
                </View>
                {item.description && (
                  <Text style={styles.pricingDescription}>
                    {item.description}
                  </Text>
                )}
                <View style={styles.pricingDetails}>
                  <Text style={styles.pricingDetail}>
                    {item.quantity} {item.unit} x {formatCurrency(item.unit_price, item.currency)}
                  </Text>
                </View>
              </View>
            ))}

            <View style={[styles.totalCard, { backgroundColor: DashboardColors.primaryGlow }]}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Toplam Gelir</Text>
                <Text style={styles.totalAmount}>
                  {formatCurrency(totalRevenue, 'TRY')}
                </Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.emptyTab}>
            <Ionicons name="cash-outline" size={48} color={DashboardColors.textMuted} />
            <Text style={styles.emptyTabText}>
              Henüz fiyatlandırma eklenmemiş
            </Text>
          </View>
        )}
      </View>
    )
  }

  const renderExpensesTab = () => {
    const totalExpenses = order.expenses?.filter(e => e.status === 'approved').reduce((sum, e) => sum + (e.amount_try || 0), 0) || 0

    return (
      <View style={styles.tabContentWrapper}>
        {order.expenses && order.expenses.length > 0 ? (
          <>
            {order.expenses.map((expense) => (
              <View key={expense.id} style={styles.card}>
                <View style={styles.expenseHeader}>
                  <View>
                    <Text style={styles.expenseType}>
                      {expense.expense_type || 'Masraf'}
                    </Text>
                    {expense.expense_date && (
                      <Text style={styles.expenseDate}>
                        {formatDate(expense.expense_date)}
                      </Text>
                    )}
                  </View>
                  <View style={styles.expenseAmountContainer}>
                    <Text style={styles.expenseAmount}>
                      {formatCurrency(expense.amount, expense.currency)}
                    </Text>
                    <Badge
                      label={expense.status === 'approved' ? 'Onaylı' : expense.status === 'rejected' ? 'Reddedildi' : 'Bekliyor'}
                      variant={expense.status === 'approved' ? 'success' : expense.status === 'rejected' ? 'error' : 'warning'}
                    />
                  </View>
                </View>
                {expense.description && (
                  <Text style={styles.expenseDescription}>
                    {expense.description}
                  </Text>
                )}
              </View>
            ))}

            <View style={[styles.totalCard, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Onaylı Masraflar</Text>
                <Text style={[styles.totalAmount, { color: '#ef4444' }]}>
                  {formatCurrency(totalExpenses, 'TRY')}
                </Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.emptyTab}>
            <Ionicons name="receipt-outline" size={48} color={DashboardColors.textMuted} />
            <Text style={styles.emptyTabText}>
              Henüz masraf eklenmemiş
            </Text>
          </View>
        )}
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
        {/* Statik glow orbs */}
        <View style={styles.glowOrb1} />
        <View style={styles.glowOrb2} />

        <View style={[styles.headerContent, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerBar}>
            <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>

            {/* Başlık */}
            {isLoading ? (
              <View style={styles.headerTitleSection}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            ) : order ? (
              <View style={styles.headerTitleSection}>
                <Text style={styles.headerName} numberOfLines={1}>
                  {order.order_number}
                </Text>
              </View>
            ) : (
              <View style={styles.headerTitleSection} />
            )}

            {/* Aksiyonlar */}
            {!isLoading && order ? (
              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.headerButton} onPress={() => router.push(`/logistics/domestic/${order.id}/edit` as any)}>
                  <Ionicons name="create-outline" size={22} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.headerButton, styles.deleteButton]}
                  onPress={() => deleteDialogRef.current?.present()}
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

      {/* Loading state */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DashboardColors.primary} />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      )}

      {/* Error state */}
      {!isLoading && (error || !order) && (
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle" size={48} color={DashboardColors.danger} />
          </View>
          <Text style={styles.errorTitle}>{error || 'İş emri bulunamadı'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchOrder()}>
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Normal content */}
      {!isLoading && order && (
        <>
          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
              {TABS.map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.tab,
                    activeTab === tab.id && styles.tabActive
                  ]}
                  onPress={() => setActiveTab(tab.id)}
                >
                  <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DashboardColors.primary} />
            }
          >
            {activeTab === 'info' && renderInfoTab()}
            {activeTab === 'items' && renderItemsTab()}
            {activeTab === 'pricing' && renderPricingTab()}
            {activeTab === 'expenses' && renderExpensesTab()}
          </ScrollView>

          {/* Status Action Button */}
          {nextStatus && order.status !== 'completed' && order.status !== 'cancelled' && (
            <View style={styles.actionBar}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  setPendingStatus(nextStatus)
                  statusDialogRef.current?.present()
                }}
              >
                {nextStatus === 'in_transit' ? (
                  <Ionicons name="play" size={20} color="#fff" />
                ) : nextStatus === 'completed' ? (
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                ) : (
                  <Ionicons name="time" size={20} color="#fff" />
                )}
                <Text style={styles.actionButtonText}>{getStatusActionLabel(nextStatus)}</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {/* Delete Dialog */}
      <ConfirmDialog
        ref={deleteDialogRef}
        title="İş Emrini Sil"
        message={order ? `"${order.order_number}" numaralı iş emrini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.` : ''}
        type="danger"
        confirmText="Sil"
        cancelText="İptal"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />

      {/* Status Change Dialog */}
      <ConfirmDialog
        ref={statusDialogRef}
        title="Durum Değiştir"
        message={pendingStatus ? `İş emri durumunu "${getStatusActionLabel(pendingStatus)}" olarak güncellemek istediğinize emin misiniz?` : ''}
        type="info"
        confirmText="Onayla"
        cancelText="İptal"
        onConfirm={handleStatusChange}
        isLoading={isUpdatingStatus}
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
    alignItems: 'center',
    marginHorizontal: DashboardSpacing.md
  },
  headerName: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center'
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm
  },
  headerActionsPlaceholder: {
    width: 96 // 44 + 8 + 44
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
  // Loading & Error
  loadingContainer: {
    flex: 1,
    backgroundColor: DashboardColors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100
  },
  loadingText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    marginTop: DashboardSpacing.md
  },
  errorContainer: {
    flex: 1,
    backgroundColor: DashboardColors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DashboardSpacing['2xl'],
    paddingBottom: 100
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
    marginBottom: DashboardSpacing.xl,
    textAlign: 'center'
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
  },
  // Tabs
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight,
    backgroundColor: DashboardColors.background,
    paddingTop: DashboardSpacing.md
  },
  tabsContent: {
    paddingHorizontal: DashboardSpacing.md
  },
  tab: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingVertical: DashboardSpacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  tabActive: {
    borderBottomColor: DashboardColors.primary
  },
  tabText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '500',
    color: DashboardColors.textSecondary
  },
  tabTextActive: {
    color: DashboardColors.primary
  },
  // Content
  content: {
    flex: 1,
    backgroundColor: DashboardColors.background
  },
  contentContainer: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: 0,
    paddingBottom: 120
  },
  tabContentWrapper: {
    gap: DashboardSpacing.md
  },
  // Cards
  card: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    ...DashboardShadows.sm,
    overflow: 'hidden'
  },
  cardContent: {
    padding: DashboardSpacing.lg
  },
  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DashboardSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight,
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
  // Info Row
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
  // Badge
  badge: {
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 4,
    borderRadius: DashboardBorderRadius.full
  },
  badgeText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600'
  },
  typeBadge: {
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 2,
    borderRadius: DashboardBorderRadius.sm
  },
  typeText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500'
  },
  notesContainer: {
    marginTop: DashboardSpacing.sm,
    paddingTop: DashboardSpacing.sm
  },
  notesLabel: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textMuted,
    marginBottom: DashboardSpacing.xs
  },
  notesText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    lineHeight: 22
  },
  // Address
  addressBlock: {
    paddingBottom: DashboardSpacing.md
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    marginBottom: DashboardSpacing.xs
  },
  addressDot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  addressTitle: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: DashboardColors.textPrimary
  },
  addressName: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '500',
    color: DashboardColors.textPrimary
  },
  addressText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    marginTop: 2
  },
  // Date
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DashboardSpacing.md
  },
  dateBlock: {
    width: '45%'
  },
  dateLabel: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textMuted,
    marginBottom: 2
  },
  dateValue: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '500',
    color: DashboardColors.textPrimary
  },
  dateValueActive: {
    color: '#22c55e'
  },
  // Items
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    padding: DashboardSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight
  },
  itemTitle: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    flex: 1
  },
  itemDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DashboardSpacing.md
  },
  itemDetail: {
    flexDirection: 'row',
    gap: DashboardSpacing.xs
  },
  itemLabel: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textMuted
  },
  itemValue: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: DashboardColors.textPrimary
  },
  itemFlags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DashboardSpacing.xs,
    marginTop: DashboardSpacing.sm
  },
  flagBadge: {
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 2,
    borderRadius: DashboardBorderRadius.sm
  },
  flagText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500'
  },
  specialInstructions: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    marginTop: DashboardSpacing.sm,
    fontStyle: 'italic'
  },
  // Pricing
  pricingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: DashboardSpacing.lg
  },
  pricingType: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textPrimary
  },
  pricingAmount: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '700',
    color: DashboardColors.primary
  },
  pricingDescription: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    paddingHorizontal: DashboardSpacing.lg
  },
  pricingDetails: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingBottom: DashboardSpacing.lg,
    paddingTop: DashboardSpacing.sm
  },
  pricingDetail: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textMuted
  },
  // Expense
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: DashboardSpacing.lg
  },
  expenseType: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textPrimary
  },
  expenseDate: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textMuted,
    marginTop: 2
  },
  expenseAmountContainer: {
    alignItems: 'flex-end',
    gap: DashboardSpacing.xs
  },
  expenseAmount: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textPrimary
  },
  expenseDescription: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    paddingHorizontal: DashboardSpacing.lg
  },
  // Total
  totalCard: {
    padding: DashboardSpacing.lg,
    marginTop: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.lg
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  totalLabel: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textPrimary
  },
  totalAmount: {
    fontSize: DashboardFontSizes['2xl'],
    fontWeight: '700',
    color: DashboardColors.primary
  },
  // Empty
  emptyTab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DashboardSpacing['4xl']
  },
  emptyTabText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textMuted,
    marginTop: DashboardSpacing.md
  },
  // Action Bar
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: DashboardSpacing.lg,
    borderTopWidth: 1,
    borderTopColor: DashboardColors.borderLight,
    backgroundColor: DashboardColors.background
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DashboardSpacing.sm,
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
    backgroundColor: DashboardColors.primary
  },
  actionButtonText: {
    color: '#fff',
    fontSize: DashboardFontSizes.base,
    fontWeight: '600'
  }
})