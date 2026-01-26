/**
 * Trip Detail Screen
 *
 * Shows trip details with positions, loads, fuel records, advances, and expenses.
 * Matches web version at /lojistik-yonetimi/seferler/{id}
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
  Route,
  Ship,
  Train,
  Container,
  Fuel,
  Banknote,
  Receipt,
  AlertTriangle,
  ArrowRight,
  ArrowRightLeft,
} from 'lucide-react-native';
import { Card, Badge } from '@/components/ui';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { FullScreenHeader } from '@/components/header/FullScreenHeader';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import {
  getTrip,
  deleteTrip,
  Trip,
  getTripStatusLabel,
  getTripStatusVariant,
  getVehicleOwnerTypeLabel,
  getDriverFullName,
  getTripTypeLabel,
} from '@/services/endpoints/trips';

// Tab types
type TabId = 'info' | 'loads' | 'positions';

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'info', label: 'Bilgiler', icon: FileText },
  { id: 'loads', label: 'Yükler', icon: Package },
  { id: 'positions', label: 'Pozisyonlar', icon: MapPin },
];

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = Colors.light;
  const { success, error: showError } = useToast();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('info');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch trip data
  const fetchTrip = useCallback(async () => {
    if (!id) return;

    try {
      setError(null);
      const data = await getTrip(parseInt(id, 10));
      setTrip(data);
    } catch (err) {
      console.error('Trip fetch error:', err);
      setError(err instanceof Error ? err.message : 'Sefer bilgileri yüklenemedi');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTrip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTrip();
  };

  // Delete trip - open confirm dialog
  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  // Confirm and execute delete
  const handleConfirmDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await deleteTrip(parseInt(id, 10));
      success('Başarılı', 'Sefer silindi.');
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (err) {
      showError('Hata', err instanceof Error ? err.message : 'Sefer silinemedi.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Format date
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // Render info section
  const renderInfoRow = (label: string, value?: string | number | boolean, icon?: any) => {
    if (value === undefined || value === null || value === '') return null;
    const Icon = icon;
    const displayValue = typeof value === 'boolean' ? (value ? 'Evet' : 'Hayır') : String(value);

    return (
      <View style={styles.infoRow}>
        {Icon && <Icon size={16} color={colors.textMuted} />}
        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}:</Text>
        <Text style={[styles.infoValue, { color: colors.text }]}>{displayValue}</Text>
      </View>
    );
  };

  // Render info tab
  const renderInfoTab = () => {
    if (!trip) return null;

    return (
      <View style={styles.tabContent}>
        {/* Genel Bilgiler */}
        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Genel Bilgiler</Text>
          {renderInfoRow('Sefer No', trip.trip_number)}
          {renderInfoRow('Sefer Tipi', getTripTypeLabel(trip.trip_type))}
          {renderInfoRow('Güzergah', trip.route)}
          {renderInfoRow('Tahmini Varış', formatDate(trip.estimated_arrival_date))}
          {renderInfoRow('Gerçek Varış', formatDate(trip.actual_arrival_date))}
          {renderInfoRow('Notlar', trip.notes)}
        </Card>

        {/* Taşıma Tipi */}
        {(trip.is_roro || trip.is_train || trip.is_mafi) && (
          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Taşıma Tipi</Text>
            {renderInfoRow('RoRo', trip.is_roro)}
            {renderInfoRow('Tren', trip.is_train)}
            {renderInfoRow('Mafi', trip.is_mafi)}
          </Card>
        )}

        {/* Araç Bilgileri */}
        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Araç Bilgileri</Text>
          {renderInfoRow('Araç Durumu', getVehicleOwnerTypeLabel(trip.vehicle_owner_type))}
          {trip.vehicle_owner_contact && renderInfoRow('Araç Sahibi', trip.vehicle_owner_contact.name)}
          {trip.truck_tractor && renderInfoRow('Çekici', trip.truck_tractor.plate)}
          {trip.trailer && renderInfoRow('Römork', trip.trailer.plate)}
          {renderInfoRow('Konum', trip.manual_location)}
        </Card>

        {/* Sürücü Bilgileri */}
        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Sürücü Bilgileri</Text>
          {trip.driver && renderInfoRow('1. Sürücü', getDriverFullName(trip.driver))}
          {trip.second_driver && renderInfoRow('2. Sürücü', getDriverFullName(trip.second_driver))}
        </Card>

        {/* Garaj Bilgileri */}
        {(trip.garage_location || trip.garage_entry_date || trip.garage_exit_date) && (
          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Garaj Bilgileri</Text>
            {renderInfoRow('Garaj Konumu', trip.garage_location)}
            {renderInfoRow('Giriş Tarihi', formatDate(trip.garage_entry_date))}
            {renderInfoRow('Çıkış Tarihi', formatDate(trip.garage_exit_date))}
          </Card>
        )}

        {/* Sınır Kapısı - Çıkış */}
        {(trip.border_exit_gate || trip.border_exit_date) && (
          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Sınır Kapısı - Çıkış</Text>
            {renderInfoRow('Çıkış Kapısı', trip.border_exit_gate)}
            {renderInfoRow('Çıkış Tarihi', formatDate(trip.border_exit_date))}
            {renderInfoRow('Manifest No', trip.border_exit_manifest_no)}
            {renderInfoRow('Manifest Tarihi', formatDate(trip.border_exit_manifest_date))}
          </Card>
        )}

        {/* Sınır Kapısı - Giriş */}
        {(trip.border_entry_gate || trip.border_entry_date) && (
          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Sınır Kapısı - Giriş</Text>
            {renderInfoRow('Giriş Kapısı', trip.border_entry_gate)}
            {renderInfoRow('Giriş Tarihi', formatDate(trip.border_entry_date))}
            {renderInfoRow('Manifest No', trip.border_entry_manifest_no)}
            {renderInfoRow('Manifest Tarihi', formatDate(trip.border_entry_manifest_date))}
          </Card>
        )}

        {/* Mühür Bilgileri */}
        {(trip.seal_no || trip.sealing_person) && (
          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Mühür Bilgileri</Text>
            {renderInfoRow('Mühür No', trip.seal_no)}
            {renderInfoRow('Mühürleyen Kişi', trip.sealing_person)}
          </Card>
        )}

        {/* Sigorta Bilgileri */}
        {(trip.insurance_status || trip.insurance_date || trip.insurance_amount) && (
          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Sigorta Bilgileri</Text>
            {renderInfoRow('Sigorta Durumu', trip.insurance_status)}
            {renderInfoRow('Sigorta Tarihi', formatDate(trip.insurance_date))}
            {renderInfoRow('Sigorta Tutarı', formatCurrency(trip.insurance_amount, trip.insurance_currency))}
          </Card>
        )}

        {/* Yakıt Bilgileri */}
        {(trip.current_fuel_liters || trip.fuel_added_liters || trip.remaining_fuel_liters) && (
          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Yakıt Bilgileri</Text>
            {renderInfoRow('Mevcut Yakıt', trip.current_fuel_liters ? `${trip.current_fuel_liters} L` : undefined)}
            {renderInfoRow('Eklenen Yakıt', trip.fuel_added_liters ? `${trip.fuel_added_liters} L` : undefined)}
            {renderInfoRow('Kalan Yakıt', trip.remaining_fuel_liters ? `${trip.remaining_fuel_liters} L` : undefined)}
            {renderInfoRow('Tüketim Yüzdesi', trip.fuel_consumption_percentage ? `%${trip.fuel_consumption_percentage}` : undefined)}
          </Card>
        )}

        {/* Kiralama Bilgileri */}
        {trip.vehicle_owner_type === 'rental' && trip.rental_fee && (
          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Kiralama Bilgileri</Text>
            {renderInfoRow('Kiralama Ücreti', formatCurrency(trip.rental_fee, trip.rental_currency))}
          </Card>
        )}
      </View>
    );
  };

  // Render loads tab
  const renderLoadsTab = () => {
    const loads = trip?.loads || [];

    if (loads.length === 0) {
      return (
        <View style={styles.emptyTab}>
          <Package size={48} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Bu sefere henüz yük eklenmemiş
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        {loads.map((load) => (
          <Card key={load.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <View style={styles.itemTitleRow}>
                <Package size={18} color={Brand.primary} />
                <Text style={[styles.itemTitle, { color: colors.text }]}>
                  {load.load_number}
                </Text>
              </View>
              {load.status && (
                <Badge
                  label={load.status}
                  variant={
                    load.status === 'delivered' ? 'success' :
                    load.status === 'in_transit' ? 'info' :
                    load.status === 'cancelled' ? 'destructive' : 'warning'
                  }
                  size="sm"
                />
              )}
            </View>
            <View style={styles.itemDetails}>
              {load.cargo_name && (
                <Text style={[styles.loadCargo, { color: colors.textSecondary }]}>
                  {load.cargo_name}
                </Text>
              )}
              {load.load_type && (
                <Text style={[styles.loadType, { color: colors.textMuted }]}>
                  Tip: {load.load_type}
                </Text>
              )}
            </View>
          </Card>
        ))}
      </View>
    );
  };

  // Render positions tab (placeholder)
  const renderPositionsTab = () => {
    return (
      <View style={styles.emptyTab}>
        <MapPin size={48} color={colors.textMuted} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Pozisyon detayları için web uygulamasını kullanın
        </Text>
      </View>
    );
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':
        return renderInfoTab();
      case 'loads':
        return renderLoadsTab();
      case 'positions':
        return renderPositionsTab();
      default:
        return null;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <FullScreenHeader
          title="Sefer Detayı"
          showBackButton
          onBackPress={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Sefer bilgileri yükleniyor...
          </Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error || !trip) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <FullScreenHeader
          title="Sefer Detayı"
          showBackButton
          onBackPress={() => router.back()}
        />
        <View style={styles.errorContainer}>
          <AlertTriangle size={64} color={colors.danger} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Bir hata oluştu</Text>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {error || 'Sefer bulunamadı'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Brand.primary }]}
            onPress={fetchTrip}
          >
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FullScreenHeader
        title={trip.trip_number}
        showBackButton
        onBackPress={() => router.back()}
        rightIcons={
          <>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.push(`/trip/${trip.id}/edit` as any)}
            >
              <Edit size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Trash2 size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </>
        }
      />

      {/* Trip Summary Card */}
      <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.summaryHeader}>
          <View style={[styles.typeIconLarge, { backgroundColor: Brand.primary + '15' }]}>
            <Truck size={32} color={Brand.primary} />
          </View>
          <View style={styles.summaryInfo}>
            <Text style={[styles.summaryNumber, { color: colors.text }]}>{trip.trip_number}</Text>
            {trip.route && (
              <View style={styles.routeRow}>
                <Route size={14} color={colors.textMuted} />
                <Text style={[styles.summaryRoute, { color: colors.textSecondary }]} numberOfLines={1}>
                  {trip.route}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Transport Type Badges */}
        {(trip.is_roro || trip.is_train || trip.is_mafi) && (
          <View style={styles.transportIcons}>
            {trip.is_roro && (
              <View style={[styles.transportBadge, { backgroundColor: '#3b82f6' + '20' }]}>
                <Ship size={14} color="#3b82f6" />
                <Text style={[styles.transportText, { color: '#3b82f6' }]}>RoRo</Text>
              </View>
            )}
            {trip.is_train && (
              <View style={[styles.transportBadge, { backgroundColor: '#8b5cf6' + '20' }]}>
                <Train size={14} color="#8b5cf6" />
                <Text style={[styles.transportText, { color: '#8b5cf6' }]}>Tren</Text>
              </View>
            )}
            {trip.is_mafi && (
              <View style={[styles.transportBadge, { backgroundColor: '#f59e0b' + '20' }]}>
                <Container size={14} color="#f59e0b" />
                <Text style={[styles.transportText, { color: '#f59e0b' }]}>Mafi</Text>
              </View>
            )}
          </View>
        )}

        {/* Status and Type Badges */}
        <View style={styles.badgeRow}>
          <Badge
            label={getTripStatusLabel(trip.status)}
            variant={getTripStatusVariant(trip.status)}
            size="sm"
          />
          {trip.trip_type && (
            <Badge
              label={getTripTypeLabel(trip.trip_type)}
              variant="info"
              size="sm"
            />
          )}
          <Badge
            label={getVehicleOwnerTypeLabel(trip.vehicle_owner_type)}
            variant={trip.vehicle_owner_type === 'own' ? 'success' : 'warning'}
            size="sm"
          />
        </View>

        {/* Vehicle Info */}
        {(trip.truck_tractor || trip.trailer) && (
          <View style={styles.vehicleRow}>
            {trip.truck_tractor && (
              <View style={styles.vehicleItem}>
                <Truck size={14} color={colors.icon} />
                <Text style={[styles.vehicleText, { color: colors.text }]}>
                  {trip.truck_tractor.plate}
                </Text>
              </View>
            )}
            {trip.truck_tractor && trip.trailer && (
              <ArrowRight size={12} color={colors.icon} />
            )}
            {trip.trailer && (
              <View style={styles.vehicleItem}>
                <Text style={[styles.vehicleText, { color: colors.text }]}>
                  {trip.trailer.plate}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Driver Info */}
        {trip.driver && (
          <View style={styles.driverRow}>
            <User size={14} color={colors.icon} />
            <Text style={[styles.driverText, { color: colors.textSecondary }]}>
              {getDriverFullName(trip.driver)}
            </Text>
            {trip.second_driver && (
              <Text style={[styles.driverText, { color: colors.textMuted }]}>
                {' + '}{getDriverFullName(trip.second_driver)}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
          {TABS.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            // Count items for badge
            let count = 0;
            if (tab.id === 'loads') count = trip.loads?.length || 0;

            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tab,
                  isActive && { borderBottomColor: Brand.primary },
                ]}
                onPress={() => setActiveTab(tab.id)}
              >
                <View style={styles.tabIconRow}>
                  <TabIcon size={18} color={isActive ? Brand.primary : colors.textMuted} />
                  {count > 0 && (
                    <View style={[styles.tabBadge, { backgroundColor: isActive ? Brand.primary : colors.textMuted }]}>
                      <Text style={styles.tabBadgeText}>{count}</Text>
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.tabText,
                    { color: isActive ? Brand.primary : colors.textSecondary },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Tab Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Brand.primary} />
        }
      >
        {renderTabContent()}
      </ScrollView>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Seferi Sil"
        message="Bu seferi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmText="Sil"
        cancelText="İptal"
        isDangerous
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButton: {
    padding: Spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.bodyMD,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['2xl'],
    gap: Spacing.md,
  },
  errorTitle: {
    ...Typography.headingMD,
  },
  errorText: {
    ...Typography.bodyMD,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: '#FFFFFF',
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  summaryCard: {
    margin: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  typeIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryInfo: {
    flex: 1,
  },
  summaryNumber: {
    ...Typography.headingLG,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  summaryRoute: {
    ...Typography.bodyMD,
    flex: 1,
  },
  transportIcons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  transportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  transportText: {
    ...Typography.bodySM,
    fontWeight: '500',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  vehicleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  vehicleText: {
    ...Typography.bodySM,
    fontWeight: '500',
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  driverText: {
    ...Typography.bodySM,
  },
  tabsContainer: {
    borderBottomWidth: 1,
  },
  tabsContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  tab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    alignItems: 'center',
    minWidth: 80,
  },
  tabIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  tabBadge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 4,
  },
  tabText: {
    ...Typography.bodyXS,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing['2xl'],
  },
  tabContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  sectionCard: {
    padding: Spacing.md,
  },
  sectionTitle: {
    ...Typography.headingSM,
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
  },
  infoLabel: {
    ...Typography.bodySM,
    minWidth: 120,
  },
  infoValue: {
    ...Typography.bodySM,
    flex: 1,
    fontWeight: '500',
  },
  emptyTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['4xl'],
    gap: Spacing.md,
  },
  emptyText: {
    ...Typography.bodyMD,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  itemCard: {
    padding: Spacing.md,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
    marginRight: Spacing.sm,
  },
  itemTitle: {
    ...Typography.bodyMD,
    fontWeight: '600',
    flex: 1,
  },
  itemDetails: {
    gap: Spacing.xs,
  },
  loadCargo: {
    ...Typography.bodySM,
  },
  loadType: {
    ...Typography.bodyXS,
  },
});
