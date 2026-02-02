/**
 * Domestic Transport Order Detail Screen
 *
 * Shows order details with items, pricing, and expenses.
 * Matches web version at /yurtici-tasimacilik/{id}
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Edit,
  Trash2,
  Truck,
  User,
  Calendar,
  MapPin,
  Package,
  FileText,
  Phone,
  DollarSign,
  Receipt,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Play,
  Square,
} from 'lucide-react-native';
import { Card, Badge } from '@/components/ui';
import type { ViewStyle } from 'react-native';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { FullScreenHeader } from '@/components/header';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import { useToast } from '@/hooks/use-toast';
import {
  getDomesticOrder,
  deleteDomesticOrder,
  updateDomesticOrderStatus,
  DomesticTransportOrder,
  DomesticOrderStatus,
  getOrderStatusLabel,
  getOrderStatusVariant,
  getOrderTypeLabel,
  getOrderTypeColor,
  getBillingTypeLabel,
  getDriverFullName,
  formatDate,
  formatDateTime,
  formatCurrency,
} from '@/services/endpoints/domestic-orders';

// Tabs
const TABS = [
  { id: 'info', label: 'Genel Bilgi' },
  { id: 'items', label: 'Kalemler' },
  { id: 'pricing', label: 'Fiyatlandırma' },
  { id: 'expenses', label: 'Masraflar' },
];

export default function DomesticOrderDetailScreen() {
  const colors = Colors.light;
  const { id } = useLocalSearchParams<{ id: string }>();
  const { success, error: showError } = useToast();

  const [order, setOrder] = useState<DomesticTransportOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('info');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<DomesticOrderStatus | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!id) return;

    try {
      setError(null);
      const data = await getDomesticOrder(Number(id));
      setOrder(data);
    } catch (err) {
      console.error('Order fetch error:', err);
      setError(err instanceof Error ? err.message : 'İş emri yüklenemedi');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrder();
  };

  const handleDelete = async () => {
    if (!order) return;

    setIsDeleting(true);
    try {
      await deleteDomesticOrder(order.id);
      success('Başarılı', 'İş emri silindi');
      router.back();
    } catch (err) {
      showError('Hata', err instanceof Error ? err.message : 'İş emri silinemedi');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleStatusChange = async () => {
    if (!order || !pendingStatus) return;

    setIsUpdatingStatus(true);
    try {
      const dates: { pickup_actual_date?: string; delivery_actual_date?: string } = {};

      if (pendingStatus === 'in_transit') {
        dates.pickup_actual_date = new Date().toISOString();
      } else if (pendingStatus === 'completed') {
        dates.delivery_actual_date = new Date().toISOString();
      }

      const updatedOrder = await updateDomesticOrderStatus(order.id, pendingStatus, dates);
      setOrder(updatedOrder);
      success('Başarılı', 'Durum güncellendi');
    } catch (err) {
      showError('Hata', err instanceof Error ? err.message : 'Durum güncellenemedi');
    } finally {
      setIsUpdatingStatus(false);
      setStatusDialogOpen(false);
      setPendingStatus(null);
    }
  };

  const getNextStatus = (): DomesticOrderStatus | null => {
    if (!order) return null;

    const statusFlow: Record<DomesticOrderStatus, DomesticOrderStatus | null> = {
      draft: 'planned',
      planned: 'assigned',
      assigned: 'in_transit',
      in_transit: 'completed',
      completed: null,
      cancelled: null,
    };

    return statusFlow[order.status];
  };

  const getStatusActionLabel = (status: DomesticOrderStatus): string => {
    const labels: Record<DomesticOrderStatus, string> = {
      draft: 'Taslak',
      planned: 'Planla',
      assigned: 'Ata',
      in_transit: 'Yola Çıkar',
      completed: 'Tamamla',
      cancelled: 'İptal Et',
    };
    return labels[status];
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: Brand.primary }]}>
        <FullScreenHeader title="İş Emri Detayı" onBackPress={() => router.back()} />
        <View style={[styles.loadingCard, { backgroundColor: '#FFFFFF' }]}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Yükleniyor...
          </Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <View style={[styles.container, { backgroundColor: Brand.primary }]}>
        <FullScreenHeader title="İş Emri Detayı" onBackPress={() => router.back()} />
        <View style={[styles.errorCard, { backgroundColor: '#FFFFFF' }]}>
          <AlertTriangle size={64} color={colors.danger} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            {error || 'İş emri bulunamadı'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Brand.primary }]}
            onPress={fetchOrder}
          >
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const nextStatus = getNextStatus();

  const renderInfoTab = () => (
    <View style={styles.tabContentWrapper}>
      {/* Status & Type */}
      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <FileText size={20} color={Brand.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Sipariş Bilgileri</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Durum:</Text>
          <Badge label={getOrderStatusLabel(order.status)} variant={getOrderStatusVariant(order.status)} size="sm" />
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Sipariş Tipi:</Text>
          <View style={[styles.typeBadge, { backgroundColor: getOrderTypeColor(order.order_type) + '20' }]}>
            <Text style={[styles.typeText, { color: getOrderTypeColor(order.order_type) }]}>
              {getOrderTypeLabel(order.order_type)}
            </Text>
          </View>
        </View>

        {order.billing_type && (
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Faturalama:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {getBillingTypeLabel(order.billing_type)}
            </Text>
          </View>
        )}

        {order.notes && (
          <View style={styles.notesContainer}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Notlar:</Text>
            <Text style={[styles.notesText, { color: colors.textSecondary }]}>{order.notes}</Text>
          </View>
        )}
      </Card>

      {/* Customer */}
      {order.customer && (
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={20} color={Brand.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Müşteri</Text>
          </View>

          <Text style={[styles.customerName, { color: colors.text }]}>{order.customer.name}</Text>
          {order.customer.code && (
            <Text style={[styles.customerCode, { color: colors.textMuted }]}>
              Kod: {order.customer.code}
            </Text>
          )}
          {order.customer.phone && (
            <View style={styles.phoneRow}>
              <Phone size={14} color={colors.icon} />
              <Text style={[styles.phoneText, { color: colors.textSecondary }]}>
                {order.customer.phone}
              </Text>
            </View>
          )}
        </Card>
      )}

      {/* Addresses */}
      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <MapPin size={20} color={Brand.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Adresler</Text>
        </View>

        {order.pickup_address && (
          <View style={styles.addressBlock}>
            <View style={styles.addressHeader}>
              <View style={[styles.addressDot, { backgroundColor: '#22c55e' }]} />
              <Text style={[styles.addressTitle, { color: colors.text }]}>Alım Adresi</Text>
            </View>
            {order.pickup_address.title && (
              <Text style={[styles.addressName, { color: colors.text }]}>{order.pickup_address.title}</Text>
            )}
            <Text style={[styles.addressText, { color: colors.textSecondary }]}>
              {order.pickup_address.formatted_address || order.pickup_address.address}
            </Text>
          </View>
        )}

        {order.delivery_address && (
          <View style={[styles.addressBlock, { marginTop: Spacing.md }]}>
            <View style={styles.addressHeader}>
              <View style={[styles.addressDot, { backgroundColor: '#ef4444' }]} />
              <Text style={[styles.addressTitle, { color: colors.text }]}>Teslimat Adresi</Text>
            </View>
            {order.delivery_address.title && (
              <Text style={[styles.addressName, { color: colors.text }]}>{order.delivery_address.title}</Text>
            )}
            <Text style={[styles.addressText, { color: colors.textSecondary }]}>
              {order.delivery_address.formatted_address || order.delivery_address.address}
            </Text>
          </View>
        )}
      </Card>

      {/* Dates */}
      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <Calendar size={20} color={Brand.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Tarihler</Text>
        </View>

        <View style={styles.dateGrid}>
          <View style={styles.dateBlock}>
            <Text style={[styles.dateLabel, { color: colors.textMuted }]}>Planlanan Alım</Text>
            <Text style={[styles.dateValue, { color: colors.text }]}>
              {formatDate(order.pickup_expected_date)}
            </Text>
          </View>
          <View style={styles.dateBlock}>
            <Text style={[styles.dateLabel, { color: colors.textMuted }]}>Gerçekleşen Alım</Text>
            <Text style={[styles.dateValue, { color: order.pickup_actual_date ? '#22c55e' : colors.textMuted }]}>
              {formatDateTime(order.pickup_actual_date)}
            </Text>
          </View>
          <View style={styles.dateBlock}>
            <Text style={[styles.dateLabel, { color: colors.textMuted }]}>Planlanan Teslimat</Text>
            <Text style={[styles.dateValue, { color: colors.text }]}>
              {formatDate(order.delivery_expected_date)}
            </Text>
          </View>
          <View style={styles.dateBlock}>
            <Text style={[styles.dateLabel, { color: colors.textMuted }]}>Gerçekleşen Teslimat</Text>
            <Text style={[styles.dateValue, { color: order.delivery_actual_date ? '#22c55e' : colors.textMuted }]}>
              {formatDateTime(order.delivery_actual_date)}
            </Text>
          </View>
        </View>
      </Card>

      {/* Assignment */}
      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <Truck size={20} color={Brand.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Atama</Text>
        </View>

        <View style={styles.assignmentRow}>
          <Text style={[styles.assignmentLabel, { color: colors.textMuted }]}>Araç:</Text>
          <Text style={[styles.assignmentValue, { color: colors.text }]}>
            {order.vehicle ? `${order.vehicle.plate} - ${order.vehicle.brand || ''} ${order.vehicle.model || ''}`.trim() : '-'}
          </Text>
        </View>

        <View style={styles.assignmentRow}>
          <Text style={[styles.assignmentLabel, { color: colors.textMuted }]}>Sürücü:</Text>
          <Text style={[styles.assignmentValue, { color: colors.text }]}>
            {getDriverFullName(order.driver)}
          </Text>
        </View>

        {order.driver?.phone_1 && (
          <View style={styles.phoneRow}>
            <Phone size={14} color={colors.icon} />
            <Text style={[styles.phoneText, { color: colors.textSecondary }]}>
              {order.driver.phone_1}
            </Text>
          </View>
        )}
      </Card>
    </View>
  );

  const renderItemsTab = () => (
    <View style={styles.tabContentWrapper}>
      {order.items && order.items.length > 0 ? (
        order.items.map((item, index) => (
          <Card key={item.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Package size={18} color={Brand.primary} />
              <Text style={[styles.itemTitle, { color: colors.text }]}>
                {item.description || `Kalem ${index + 1}`}
              </Text>
            </View>

            <View style={styles.itemDetails}>
              {item.package_type && (
                <View style={styles.itemDetail}>
                  <Text style={[styles.itemLabel, { color: colors.textMuted }]}>Paket Tipi:</Text>
                  <Text style={[styles.itemValue, { color: colors.text }]}>{item.package_type}</Text>
                </View>
              )}
              {item.package_count && (
                <View style={styles.itemDetail}>
                  <Text style={[styles.itemLabel, { color: colors.textMuted }]}>Adet:</Text>
                  <Text style={[styles.itemValue, { color: colors.text }]}>{item.package_count}</Text>
                </View>
              )}
              {item.gross_weight && (
                <View style={styles.itemDetail}>
                  <Text style={[styles.itemLabel, { color: colors.textMuted }]}>Ağırlık:</Text>
                  <Text style={[styles.itemValue, { color: colors.text }]}>{item.gross_weight} kg</Text>
                </View>
              )}
              {item.volume && (
                <View style={styles.itemDetail}>
                  <Text style={[styles.itemLabel, { color: colors.textMuted }]}>Hacim:</Text>
                  <Text style={[styles.itemValue, { color: colors.text }]}>{item.volume} m³</Text>
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
              <Text style={[styles.specialInstructions, { color: colors.textSecondary }]}>
                {item.special_instructions}
              </Text>
            )}
          </Card>
        ))
      ) : (
        <View style={styles.emptyTab}>
          <Package size={48} color={colors.textMuted} />
          <Text style={[styles.emptyTabText, { color: colors.textMuted }]}>
            Henüz kalem eklenmemiş
          </Text>
        </View>
      )}
    </View>
  );

  const renderPricingTab = () => {
    const totalRevenue = order.pricing_items?.reduce((sum, item) => sum + (item.total_amount || 0), 0) || 0;

    return (
      <View style={styles.tabContentWrapper}>
        {order.pricing_items && order.pricing_items.length > 0 ? (
          <>
            {order.pricing_items.map((item, index) => (
              <Card key={item.id} style={styles.pricingCard}>
                <View style={styles.pricingHeader}>
                  <Text style={[styles.pricingType, { color: colors.text }]}>
                    {item.item_type || `Kalem ${index + 1}`}
                  </Text>
                  <Text style={[styles.pricingAmount, { color: Brand.primary }]}>
                    {formatCurrency(item.total_amount, item.currency)}
                  </Text>
                </View>
                {item.description && (
                  <Text style={[styles.pricingDescription, { color: colors.textSecondary }]}>
                    {item.description}
                  </Text>
                )}
                <View style={styles.pricingDetails}>
                  <Text style={[styles.pricingDetail, { color: colors.textMuted }]}>
                    {item.quantity} {item.unit} x {formatCurrency(item.unit_price, item.currency)}
                  </Text>
                </View>
              </Card>
            ))}

            <Card style={[styles.totalCard, { backgroundColor: (Brand.primary + '10') as string }]}>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.text }]}>Toplam Gelir</Text>
                <Text style={[styles.totalAmount, { color: Brand.primary }]}>
                  {formatCurrency(totalRevenue, 'TRY')}
                </Text>
              </View>
            </Card>
          </>
        ) : (
          <View style={styles.emptyTab}>
            <DollarSign size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTabText, { color: colors.textMuted }]}>
              Henüz fiyatlandırma eklenmemiş
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderExpensesTab = () => {
    const totalExpenses = order.expenses?.filter(e => e.status === 'approved').reduce((sum, e) => sum + (e.amount_try || 0), 0) || 0;

    return (
      <View style={styles.tabContentWrapper}>
        {order.expenses && order.expenses.length > 0 ? (
          <>
            {order.expenses.map((expense) => (
              <Card key={expense.id} style={styles.expenseCard}>
                <View style={styles.expenseHeader}>
                  <View>
                    <Text style={[styles.expenseType, { color: colors.text }]}>
                      {expense.expense_type || 'Masraf'}
                    </Text>
                    {expense.expense_date && (
                      <Text style={[styles.expenseDate, { color: colors.textMuted }]}>
                        {formatDate(expense.expense_date)}
                      </Text>
                    )}
                  </View>
                  <View style={styles.expenseAmountContainer}>
                    <Text style={[styles.expenseAmount, { color: colors.text }]}>
                      {formatCurrency(expense.amount, expense.currency)}
                    </Text>
                    <Badge
                      label={expense.status === 'approved' ? 'Onaylı' : expense.status === 'rejected' ? 'Reddedildi' : 'Bekliyor'}
                      variant={expense.status === 'approved' ? 'success' : expense.status === 'rejected' ? 'error' : 'warning'}
                      size="sm"
                    />
                  </View>
                </View>
                {expense.description && (
                  <Text style={[styles.expenseDescription, { color: colors.textSecondary }]}>
                    {expense.description}
                  </Text>
                )}
              </Card>
            ))}

            <Card style={[styles.totalCard, { backgroundColor: ('#ef4444' + '10') as string }]}>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.text }]}>Onaylı Masraflar</Text>
                <Text style={[styles.totalAmount, { color: '#ef4444' }]}>
                  {formatCurrency(totalExpenses, 'TRY')}
                </Text>
              </View>
            </Card>
          </>
        ) : (
          <View style={styles.emptyTab}>
            <Receipt size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTabText, { color: colors.textMuted }]}>
              Henüz masraf eklenmemiş
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: Brand.primary }]}>
      <FullScreenHeader
        title={order.order_number}
        onBackPress={() => router.back()}
        rightIcons={
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => router.push(`/logistics/domestic/${order.id}/edit` as any)}
              style={styles.headerButton}
            >
              <Edit size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setDeleteDialogOpen(true)}
              style={styles.headerButton}
            >
              <Trash2 size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        }
      />

      <View style={styles.contentWrapper}>
        {/* Tabs */}
        <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tab,
                  activeTab === tab.id && { borderBottomColor: Brand.primary },
                ]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: activeTab === tab.id ? Brand.primary : colors.textSecondary },
                  ]}
                >
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Brand.primary} />
          }
        >
          {activeTab === 'info' && renderInfoTab()}
          {activeTab === 'items' && renderItemsTab()}
          {activeTab === 'pricing' && renderPricingTab()}
          {activeTab === 'expenses' && renderExpensesTab()}
        </ScrollView>
      </View>

      {/* Status Action Button */}
      {nextStatus && order.status !== 'completed' && order.status !== 'cancelled' && (
        <View style={[styles.actionBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: Brand.primary }]}
            onPress={() => {
              setPendingStatus(nextStatus);
              setStatusDialogOpen(true);
            }}
          >
            {nextStatus === 'in_transit' ? (
              <Play size={20} color="#FFFFFF" />
            ) : nextStatus === 'completed' ? (
              <CheckCircle size={20} color="#FFFFFF" />
            ) : (
              <Clock size={20} color="#FFFFFF" />
            )}
            <Text style={styles.actionButtonText}>{getStatusActionLabel(nextStatus)}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Delete Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="İş Emrini Sil"
        description={`"${order.order_number}" numaralı iş emrini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        variant="destructive"
        loading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />

      {/* Status Change Dialog */}
      <ConfirmDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        title="Durum Değiştir"
        description={pendingStatus ? `İş emri durumunu "${getStatusActionLabel(pendingStatus)}" olarak güncellemek istediğinize emin misiniz?` : ''}
        confirmText="Onayla"
        cancelText="İptal"
        loading={isUpdatingStatus}
        onConfirm={handleStatusChange}
        onCancel={() => setStatusDialogOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    ...Shadows.lg,
  },
  loadingCard: {
    flex: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  },
  loadingText: {
    ...Typography.bodyMD,
    marginTop: Spacing.md,
  },
  errorCard: {
    flex: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    ...Shadows.lg,
  },
  errorTitle: {
    ...Typography.headingMD,
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: '#FFFFFF',
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerButton: {
    padding: Spacing.xs,
  },
  tabsContainer: {
    borderBottomWidth: 1,
    paddingTop: Spacing.md,
  },
  tabsContent: {
    paddingHorizontal: Spacing.md,
  },
  tab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    ...Typography.bodyMD,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: 120,
  },
  tabContentWrapper: {
    gap: Spacing.md,
  },
  section: {
    padding: Spacing.lg,
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.headingSM,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  infoLabel: {
    ...Typography.bodyMD,
  },
  infoValue: {
    ...Typography.bodyMD,
    fontWeight: '500',
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  typeText: {
    ...Typography.bodySM,
    fontWeight: '500',
  },
  notesContainer: {
    marginTop: Spacing.sm,
  },
  notesText: {
    ...Typography.bodyMD,
    marginTop: Spacing.xs,
  },
  customerName: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  customerCode: {
    ...Typography.bodySM,
    marginTop: 2,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  phoneText: {
    ...Typography.bodySM,
  },
  addressBlock: {
    paddingLeft: Spacing.md,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  addressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  addressTitle: {
    ...Typography.bodySM,
    fontWeight: '600',
  },
  addressName: {
    ...Typography.bodyMD,
    fontWeight: '500',
  },
  addressText: {
    ...Typography.bodySM,
    marginTop: 2,
  },
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  dateBlock: {
    width: '45%',
  },
  dateLabel: {
    ...Typography.bodySM,
    marginBottom: 2,
  },
  dateValue: {
    ...Typography.bodyMD,
    fontWeight: '500',
  },
  assignmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  assignmentLabel: {
    ...Typography.bodyMD,
  },
  assignmentValue: {
    ...Typography.bodyMD,
    fontWeight: '500',
  },
  itemCard: {
    padding: Spacing.lg,
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  itemTitle: {
    ...Typography.bodyMD,
    fontWeight: '600',
    flex: 1,
  },
  itemDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  itemDetail: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  itemLabel: {
    ...Typography.bodySM,
  },
  itemValue: {
    ...Typography.bodySM,
    fontWeight: '500',
  },
  itemFlags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  flagBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  flagText: {
    ...Typography.bodySM,
    fontWeight: '500',
  },
  specialInstructions: {
    ...Typography.bodySM,
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
  pricingCard: {
    padding: Spacing.lg,
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  pricingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pricingType: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  pricingAmount: {
    ...Typography.bodyMD,
    fontWeight: '700',
  },
  pricingDescription: {
    ...Typography.bodySM,
    marginTop: Spacing.xs,
  },
  pricingDetails: {
    marginTop: Spacing.sm,
  },
  pricingDetail: {
    ...Typography.bodySM,
  },
  expenseCard: {
    padding: Spacing.lg,
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  expenseType: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  expenseDate: {
    ...Typography.bodySM,
    marginTop: 2,
  },
  expenseAmountContainer: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  expenseAmount: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  expenseDescription: {
    ...Typography.bodySM,
    marginTop: Spacing.sm,
  },
  totalCard: {
    padding: Spacing.lg,
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  totalAmount: {
    ...Typography.headingMD,
    fontWeight: '700',
  },
  emptyTab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['4xl'],
  },
  emptyTabText: {
    ...Typography.bodyMD,
    marginTop: Spacing.md,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    borderTopWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  actionButtonText: {
    color: '#FFFFFF',
    ...Typography.bodyMD,
    fontWeight: '600',
  },
});
