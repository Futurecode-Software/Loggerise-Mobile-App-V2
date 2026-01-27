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
  ChevronRight,
} from 'lucide-react-native';
import { Card, Badge } from '@/components/ui';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { FullScreenHeader } from '@/components/header/FullScreenHeader';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
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
import {
  getPositions,
  Position,
  getPositionTypeLabel,
  getVehicleOwnerTypeLabel as getPositionVehicleOwnerTypeLabel,
  getDriverFullName as getPositionDriverFullName,
} from '@/services/endpoints/positions';

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
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPositions, setIsLoadingPositions] = useState(false);
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
      // Provide more specific error messages
      let errorMessage = 'Sefer bilgileri yüklenemedi';
      if (err instanceof Error) {
        if (err.message.includes('status code 500')) {
          errorMessage = 'Sunucu hatası: Sefer kaydı alınamadı. Lütfen daha sonra tekrar deneyin veya yöneticinize başvurun.';
        } else if (err.message.includes('status code 404')) {
          errorMessage = 'Sefer bulunamadı. Silinmiş veya artık mevcut olmayan bir sefer olabilir.';
        } else {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  // Fetch positions for this trip
  const fetchPositions = useCallback(async () => {
    if (!id) return;

    try {
      setIsLoadingPositions(true);
      const response = await getPositions({
        trip_id: parseInt(id, 10),
        per_page: 100, // Get all positions for this trip
      });
      setPositions(response.positions);
    } catch (err) {
      console.error('Positions fetch error:', err);
      // Don't set error - just show empty state
    } finally {
      setIsLoadingPositions(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTrip();
    fetchPositions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTrip();
    fetchPositions();
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
      router.back();
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
    // Return null for undefined, null, empty string, false boolean, or dash
    if (value === undefined || value === null || value === '' || value === false || value === '-') return null;
    const Icon = icon;
    // Safely convert value to string
    const displayValue = typeof value === 'boolean' ? 'Evet' : String(value);

    // Don't render if displayValue is empty or just whitespace
    if (!displayValue || displayValue.trim() === '') return null;

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
        {!!(trip.is_roro || trip.is_train || trip.is_mafi) && (
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
        {!!(trip.garage_location || trip.garage_entry_date || trip.garage_exit_date) && (
          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Garaj Bilgileri</Text>
            {renderInfoRow('Garaj Konumu', trip.garage_location)}
            {renderInfoRow('Giriş Tarihi', formatDate(trip.garage_entry_date))}
            {renderInfoRow('Çıkış Tarihi', formatDate(trip.garage_exit_date))}
          </Card>
        )}

        {/* Sınır Kapısı - Çıkış */}
        {!!(trip.border_exit_gate || trip.border_exit_date) && (
          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Sınır Kapısı - Çıkış</Text>
            {renderInfoRow('Çıkış Kapısı', trip.border_exit_gate)}
            {renderInfoRow('Çıkış Tarihi', formatDate(trip.border_exit_date))}
            {renderInfoRow('Manifest No', trip.border_exit_manifest_no)}
            {renderInfoRow('Manifest Tarihi', formatDate(trip.border_exit_manifest_date))}
          </Card>
        )}

        {/* Sınır Kapısı - Giriş */}
        {!!(trip.border_entry_gate || trip.border_entry_date) && (
          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Sınır Kapısı - Giriş</Text>
            {renderInfoRow('Giriş Kapısı', trip.border_entry_gate)}
            {renderInfoRow('Giriş Tarihi', formatDate(trip.border_entry_date))}
            {renderInfoRow('Manifest No', trip.border_entry_manifest_no)}
            {renderInfoRow('Manifest Tarihi', formatDate(trip.border_entry_manifest_date))}
          </Card>
        )}

        {/* Mühür Bilgileri */}
        {!!(trip.seal_no || trip.sealing_person) && (
          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Mühür Bilgileri</Text>
            {renderInfoRow('Mühür No', trip.seal_no)}
            {renderInfoRow('Mühürleyen Kişi', trip.sealing_person)}
          </Card>
        )}

        {/* Sigorta Bilgileri */}
        {!!(trip.insurance_status || trip.insurance_date || trip.insurance_amount) && (
          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Sigorta Bilgileri</Text>
            {renderInfoRow('Sigorta Durumu', trip.insurance_status)}
            {renderInfoRow('Sigorta Tarihi', formatDate(trip.insurance_date))}
            {renderInfoRow('Sigorta Tutarı', formatCurrency(trip.insurance_amount, trip.insurance_currency))}
          </Card>
        )}

        {/* Yakıt Bilgileri */}
        {!!(trip.current_fuel_liters || trip.fuel_added_liters || trip.remaining_fuel_liters) && (
          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Yakıt Bilgileri</Text>
            {renderInfoRow('Mevcut Yakıt', trip.current_fuel_liters ? `${trip.current_fuel_liters} L` : undefined)}
            {renderInfoRow('Eklenen Yakıt', trip.fuel_added_liters ? `${trip.fuel_added_liters} L` : undefined)}
            {renderInfoRow('Kalan Yakıt', trip.remaining_fuel_liters ? `${trip.remaining_fuel_liters} L` : undefined)}
            {renderInfoRow('Tüketim Yüzdesi', trip.fuel_consumption_percentage ? `%${trip.fuel_consumption_percentage}` : undefined)}
          </Card>
        )}

        {/* Kiralama Bilgileri */}
        {trip.vehicle_owner_type === 'rental' && !!trip.rental_fee && (
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
                    load.status === 'cancelled' ? 'danger' : 'warning'
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

  // Navigate to position detail
  const navigateToPosition = (position: Position) => {
    // Route based on position type (export or import)
    const basePath = position.position_type === 'export'
      ? '/exports/positions'
      : '/imports/positions';
    router.push(`${basePath}/${position.id}` as any);
  };

  // Get position status color
  const getPositionStatusColor = (status?: string): string => {
    switch (status) {
      case 'active':
        return '#22c55e';
      case 'completed':
        return '#3b82f6';
      case 'cancelled':
        return '#ef4444';
      case 'draft':
        return '#f59e0b';
      default:
        return '#6B7280';
    }
  };

  // Get position status label
  const getPositionStatusLabel = (status?: string): string => {
    const labels: Record<string, string> = {
      active: 'Aktif',
      completed: 'Tamamlandı',
      cancelled: 'İptal',
      draft: 'Taslak',
    };
    return status ? labels[status] || status : 'Aktif';
  };

  // Render positions tab
  const renderPositionsTab = () => {
    if (isLoadingPositions) {
      return (
        <View style={styles.emptyTab}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Pozisyonlar yükleniyor...
          </Text>
        </View>
      );
    }

    if (positions.length === 0) {
      return (
        <View style={styles.emptyTab}>
          <MapPin size={48} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Bu sefere henüz pozisyon eklenmemiş
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        {positions.map((position) => {
          const driverName = position.driver
            ? `${position.driver.first_name} ${position.driver.last_name}`.trim()
            : null;
          const vehiclePlate = position.truck_tractor?.plate || position.trailer?.plate;

          return (
            <TouchableOpacity
              key={position.id}
              activeOpacity={0.7}
              onPress={() => navigateToPosition(position)}
            >
              <Card style={styles.positionCard}>
                <View style={styles.positionHeader}>
                  <View style={styles.positionTitleRow}>
                    <View style={[styles.positionIcon, { backgroundColor: Brand.primary + '15' }]}>
                      <MapPin size={18} color={Brand.primary} />
                    </View>
                    <View style={styles.positionInfo}>
                      <Text style={[styles.positionNumber, { color: colors.text }]}>
                        {position.position_number || 'Taslak'}
                      </Text>
                      <View style={styles.positionTypeBadge}>
                        <Text style={[styles.positionTypeText, {
                          color: position.position_type === 'export' ? '#3b82f6' : '#8b5cf6'
                        }]}>
                          {getPositionTypeLabel(position.position_type)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.positionRight}>
                    <View style={[
                      styles.statusDot,
                      { backgroundColor: getPositionStatusColor(position.status) }
                    ]} />
                    <ChevronRight size={20} color={colors.textMuted} />
                  </View>
                </View>

                {/* Position Details */}
                <View style={styles.positionDetails}>
                  {position.route && (
                    <View style={styles.positionDetailRow}>
                      <Route size={14} color={colors.icon} />
                      <Text style={[styles.positionDetailText, { color: colors.textSecondary }]} numberOfLines={1}>
                        {position.route}
                      </Text>
                    </View>
                  )}
                  {vehiclePlate && (
                    <View style={styles.positionDetailRow}>
                      <Truck size={14} color={colors.icon} />
                      <Text style={[styles.positionDetailText, { color: colors.textSecondary }]}>
                        {vehiclePlate}
                        {(position.trailer?.plate && position.truck_tractor?.plate) && ` / ${position.trailer.plate}`}
                      </Text>
                    </View>
                  )}
                  {driverName && (
                    <View style={styles.positionDetailRow}>
                      <User size={14} color={colors.icon} />
                      <Text style={[styles.positionDetailText, { color: colors.textSecondary }]}>
                        {driverName}
                      </Text>
                    </View>
                  )}
                  {!!(position.loads_count !== undefined && position.loads_count > 0) && (
                    <View style={styles.positionDetailRow}>
                      <Package size={14} color={colors.icon} />
                      <Text style={[styles.positionDetailText, { color: colors.textSecondary }]}>
                        {position.loads_count} yük
                      </Text>
                    </View>
                  )}
                </View>

                {/* Status Badge */}
                <View style={styles.positionFooter}>
                  <Badge
                    label={getPositionStatusLabel(position.status)}
                    variant={
                      position.status === 'active' ? 'success' :
                      position.status === 'completed' ? 'info' :
                      position.status === 'cancelled' ? 'danger' : 'warning'
                    }
                    size="sm"
                  />
                  {!!(position.is_roro || position.is_train) && (
                    <View style={styles.transportBadges}>
                      {position.is_roro && (
                        <View style={[styles.miniTransportBadge, { backgroundColor: '#3b82f6' + '20' }]}>
                          <Ship size={12} color="#3b82f6" />
                        </View>
                      )}
                      {position.is_train && (
                        <View style={[styles.miniTransportBadge, { backgroundColor: '#8b5cf6' + '20' }]}>
                          <Train size={12} color="#8b5cf6" />
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}
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
      <View style={[styles.container, { backgroundColor: Brand.primary }]}>
        <FullScreenHeader
          title="Sefer Detayı"
          showBackButton
          onBackPress={() => router.back()}
        />
        <View style={styles.contentArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Brand.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Sefer bilgileri yükleniyor...
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Error state
  if (error || !trip) {
    return (
      <View style={[styles.container, { backgroundColor: Brand.primary }]}>
        <FullScreenHeader
          title="Sefer Detayı"
          showBackButton
          onBackPress={() => router.back()}
        />
        <View style={styles.contentArea}>
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
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.surface, marginTop: Spacing.sm, borderWidth: 1, borderColor: colors.border }]}
              onPress={() => router.back()}
            >
              <Text style={[styles.retryButtonText, { color: colors.text }]}>Geri Dön</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Brand.primary }]}>
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

      {/* Content Area */}
      <View style={styles.contentArea}>
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
          {!!(trip.is_roro || trip.is_train || trip.is_mafi) && (
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
          {((trip.truck_tractor?.plate) || (trip.trailer?.plate)) && (
            <View style={styles.vehicleRow}>
              {trip.truck_tractor?.plate && (
                <View style={styles.vehicleItem}>
                  <Truck size={14} color={colors.icon} />
                  <Text style={[styles.vehicleText, { color: colors.text }]}>
                    {trip.truck_tractor.plate}
                  </Text>
                </View>
              )}
              {trip.truck_tractor?.plate && trip.trailer?.plate && (
                <ArrowRight size={12} color={colors.icon} />
              )}
              {trip.trailer?.plate && (
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
              if (tab.id === 'positions') count = positions.length;

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
      </View>

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
  contentArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    ...Shadows.lg,
    overflow: 'hidden',
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
  // Position card styles
  positionCard: {
    padding: Spacing.md,
  },
  positionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  positionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
  },
  positionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  positionInfo: {
    flex: 1,
  },
  positionNumber: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  positionTypeBadge: {
    marginTop: 2,
  },
  positionTypeText: {
    ...Typography.bodyXS,
    fontWeight: '500',
  },
  positionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  positionDetails: {
    marginTop: Spacing.sm,
    marginLeft: 44, // Align with text after icon
    gap: Spacing.xs,
  },
  positionDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  positionDetailText: {
    ...Typography.bodySM,
    flex: 1,
  },
  positionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    marginLeft: 44,
  },
  transportBadges: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  miniTransportBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
