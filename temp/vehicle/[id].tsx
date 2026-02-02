/**
 * Vehicle Detail Screen
 *
 * Shows vehicle details with tabs for insurances, maintenances, inspections, and fault reports.
 * Matches web version at /filo-yonetimi/araclar/{id}
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
  Car,
  Box,
  Shield,
  Wrench,
  ClipboardCheck,
  AlertTriangle,
  Gauge,
  FileText,
} from 'lucide-react-native';
import { Card, Badge } from '@/components/ui';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { FullScreenHeader } from '@/components/header/FullScreenHeader';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import {
  getVehicle,
  deleteVehicle,
  Vehicle,
} from '@/services/endpoints/vehicles';

// Tab types
type TabId = 'info' | 'insurance' | 'maintenance' | 'inspection' | 'faults';

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'info', label: 'Bilgiler', icon: FileText },
  { id: 'insurance', label: 'Sigortalar', icon: Shield },
  { id: 'maintenance', label: 'Bakımlar', icon: Wrench },
  { id: 'inspection', label: 'Muayeneler', icon: ClipboardCheck },
  { id: 'faults', label: 'Arızalar', icon: AlertTriangle },
];

// Web ile aynı label'lar
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
};

const statusLabels: Record<string, string> = {
  available: 'Uygun',
  in_use: 'Kullanımda',
  in_maintenance: 'Bakımda',
  maintenance: 'Bakımda',
  out_of_service: 'Hizmet Dışı',
};

const ownershipLabels: Record<string, string> = {
  owned: 'Özmal',
  rented: 'Kiralık',
  leased: 'Kiralama',
  subcontractor: 'Taşeron',
};

const gearTypeLabels: Record<string, string> = {
  manual: 'Manuel',
  automatic: 'Otomatik',
  semi_automatic: 'Yarı Otomatik',
};

const euroNormLabels: Record<string, string> = {
  euro_3: 'Euro 3',
  euro_4: 'Euro 4',
  euro_5: 'Euro 5',
  euro_6: 'Euro 6',
  euro_6d: 'Euro 6d',
  euro_6e: 'Euro 6e',
  electric: 'Elektrikli',
};

const insuranceTypeLabels: Record<string, string> = {
  comprehensive: 'Kasko',
  traffic: 'Trafik',
  other: 'Diğer',
};

const faultStatusLabels: Record<string, string> = {
  pending: 'Beklemede',
  in_progress: 'İşlemde',
  resolved: 'Çözüldü',
  cancelled: 'İptal',
};

const faultPriorityLabels: Record<string, string> = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
  critical: 'Kritik',
};

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = Colors.light;
  const { success, error: showError } = useToast();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('info');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch vehicle data
  const fetchVehicle = useCallback(async () => {
    if (!id) return;

    try {
      setError(null);
      const data = await getVehicle(parseInt(id, 10));
      setVehicle(data);
    } catch (err) {
      console.error('Vehicle fetch error:', err);
      setError(err instanceof Error ? err.message : 'Araç bilgileri yüklenemedi');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchVehicle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchVehicle();
  };

  // Delete vehicle - open confirm dialog
  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  // Confirm and execute delete
  const handleConfirmDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await deleteVehicle(parseInt(id, 10));
      success('Başarılı', 'Araç silindi.');
      router.back();
    } catch (err) {
      showError('Hata', err instanceof Error ? err.message : 'Araç silinemedi.');
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

  // formatCurrency replaced with safe formatter from @/utils/formatters

  // Get vehicle type icon
  const getTypeIcon = () => {
    if (!vehicle) return Truck;
    switch (vehicle.vehicle_type) {
      case 'truck_tractor':
      case 'truck':
      case 'light_truck':
        return Truck;
      case 'trailer':
        return Box;
      case 'car':
      case 'van':
      case 'pickup':
        return Car;
      default:
        return Truck;
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
    if (!vehicle) return null;

    const isTruckTractor = vehicle.vehicle_type === 'truck_tractor';
    const isTrailer = vehicle.vehicle_type === 'trailer';

    return (
      <View style={styles.tabContent}>
        {/* Temel Bilgiler */}
        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Temel Bilgiler</Text>
          {renderInfoRow('Marka', vehicle.brand)}
          {renderInfoRow('Model', vehicle.model)}
          {renderInfoRow('Model Yılı', vehicle.model_year || vehicle.year)}
          {renderInfoRow('Renk', vehicle.color)}
          {renderInfoRow('Ticari Adı', vehicle.commercial_name)}
          {renderInfoRow('Araç Cinsi', vehicle.vehicle_class)}
          {renderInfoRow('Araç Sınıfı', vehicle.vehicle_category)}
          {renderInfoRow('Vites Tipi', vehicle.gear_type ? gearTypeLabels[vehicle.gear_type] : undefined)}
          {renderInfoRow('Ehliyet Sınıfı', vehicle.document_type)}
          {renderInfoRow('Toplam KM', formatNumber(vehicle.total_km || vehicle.km_counter, 'km'))}
          {renderInfoRow('Net Ağırlık', formatNumber(vehicle.net_weight, 'kg'))}
          {renderInfoRow('Azami Yüklü Ağırlık', formatNumber(vehicle.max_loaded_weight, 'kg'))}
        </Card>

        {/* Ruhsat Bilgileri */}
        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Ruhsat Bilgileri</Text>
          {renderInfoRow('Tescil Sıra No', vehicle.registration_serial_no)}
          {renderInfoRow('İlk Tescil Tarihi', formatDate(vehicle.first_registration_date))}
          {renderInfoRow('Tescil Tarihi', formatDate(vehicle.registration_date))}
          {renderInfoRow('Motor No', vehicle.engine_number)}
          {renderInfoRow('Şasi No', vehicle.chassis_number)}
          {renderInfoRow('Motor Gücü', vehicle.engine_power ? `${vehicle.engine_power} kW` : undefined)}
          {renderInfoRow('Tekerlek Düzeni', vehicle.wheel_formula)}
          {renderInfoRow('Ruhsat Notu', vehicle.license_info)}
        </Card>

        {/* Çekici Bilgileri */}
        {isTruckTractor && (
          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Çekici Bilgileri</Text>
            {renderInfoRow('Euro Norm', vehicle.euro_norm ? euroNormLabels[vehicle.euro_norm] : undefined)}
            {vehicle.euro_norm === 'electric' ? (
              renderInfoRow('Batarya Kapasitesi', vehicle.battery_capacity ? `${vehicle.battery_capacity} kWh` : undefined)
            ) : (
              renderInfoRow('Yakıt Kapasitesi', vehicle.fuel_capacity ? `${vehicle.fuel_capacity} L` : undefined)
            )}
            {renderInfoRow('GPS Takip', vehicle.has_gps_tracker)}
            {renderInfoRow('GPS Kimlik No', vehicle.gps_identity_no)}
          </Card>
        )}

        {/* Römork Bilgileri */}
        {isTrailer && (
          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Römork Bilgileri</Text>
            {renderInfoRow('En', vehicle.trailer_width ? `${vehicle.trailer_width} m` : undefined)}
            {renderInfoRow('Boy', vehicle.trailer_length ? `${vehicle.trailer_length} m` : undefined)}
            {renderInfoRow('Yükseklik', vehicle.trailer_height ? `${vehicle.trailer_height} m` : undefined)}
            {renderInfoRow('Hacim', vehicle.trailer_volume ? `${vehicle.trailer_volume} m³` : undefined)}
            {renderInfoRow('Yan Kapak', vehicle.side_door_count)}
            {renderInfoRow('XL Sertifikası', vehicle.has_xl_certificate)}
            {renderInfoRow('Çift Katlı', vehicle.is_double_deck)}
            {renderInfoRow('P400', vehicle.has_p400)}
            {renderInfoRow('Kayar Perde', vehicle.has_sliding_curtain)}
            {renderInfoRow('Hafif Römork', vehicle.is_lightweight)}
            {renderInfoRow('Tren Uyumlu', vehicle.is_train_compatible)}
            {renderInfoRow('Brandalı', vehicle.has_tarpaulin)}
            {renderInfoRow('Rulo', vehicle.has_roller)}
            {renderInfoRow('Elektronik Kantar', vehicle.has_electronic_scale)}
          </Card>
        )}

        {/* Sahiplik Bilgileri */}
        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Sahiplik Bilgileri</Text>
          {renderInfoRow('Ad Soyad', vehicle.full_name)}
          {renderInfoRow('Şirket Adı', vehicle.company_name)}
          {renderInfoRow('TC/Vergi No', vehicle.id_or_tax_no)}
          {renderInfoRow('Noter Adı', vehicle.notary_name)}
          {renderInfoRow('Noter Satış Tarihi', formatDate(vehicle.notary_sale_date))}
          {renderInfoRow('Adres', vehicle.address)}
        </Card>

        {/* Yurtiçi Taşımacılık */}
        {vehicle.domestic_transport_capable && (
          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Yurtiçi Taşımacılık</Text>
            {renderInfoRow('Yurtiçi Taşıma', vehicle.domestic_transport_capable)}
            {renderInfoRow('Yurtiçi Araç Sınıfı', vehicle.domestic_vehicle_class)}
          </Card>
        )}
      </View>
    );
  };

  // Render insurance tab
  const renderInsuranceTab = () => {
    const insurances = vehicle?.insurances || [];

    if (insurances.length === 0) {
      return (
        <View style={styles.emptyTab}>
          <Shield size={48} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Henüz sigorta kaydı yok
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        {insurances.map((insurance) => (
          <Card key={insurance.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <View style={styles.itemTitleRow}>
                <Shield size={18} color={Brand.primary} />
                <Text style={[styles.itemTitle, { color: colors.text }]}>
                  {insuranceTypeLabels[insurance.insurance_type] || insurance.insurance_type}
                </Text>
              </View>
              <Badge
                label={insurance.is_active ? 'Aktif' : 'Pasif'}
                variant={insurance.is_active ? 'success' : 'default'}
                size="sm"
              />
            </View>
            <View style={styles.itemDetails}>
              {renderInfoRow('Poliçe No', insurance.policy_number)}
              {renderInfoRow('Sigorta Şirketi', insurance.insurance_company)}
              {renderInfoRow('Başlangıç', formatDate(insurance.start_date))}
              {renderInfoRow('Bitiş', formatDate(insurance.end_date))}
              {renderInfoRow('Prim Tutarı', formatCurrency(insurance.premium_amount))}
            </View>
          </Card>
        ))}
      </View>
    );
  };

  // Render maintenance tab
  const renderMaintenanceTab = () => {
    const maintenances = vehicle?.maintenances || [];

    if (maintenances.length === 0) {
      return (
        <View style={styles.emptyTab}>
          <Wrench size={48} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Henüz bakım kaydı yok
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        {maintenances.map((maintenance) => (
          <Card key={maintenance.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <View style={styles.itemTitleRow}>
                <Wrench size={18} color={Brand.primary} />
                <Text style={[styles.itemTitle, { color: colors.text }]}>
                  {formatDate(maintenance.maintenance_date)}
                </Text>
              </View>
              <Badge
                label={maintenance.is_active ? 'Aktif' : 'Pasif'}
                variant={maintenance.is_active ? 'success' : 'default'}
                size="sm"
              />
            </View>
            <View style={styles.itemDetails}>
              {renderInfoRow('Bakım KM', formatNumber(maintenance.maintenance_km, 'km'))}
              {renderInfoRow('Sonraki Bakım KM', formatNumber(maintenance.next_maintenance_km, 'km'))}
              {renderInfoRow('Maliyet', formatCurrency(maintenance.cost, maintenance.currency_type))}
              {renderInfoRow('Servis', maintenance.service_provider)}
              {maintenance.oil_change && renderInfoRow('Yağ Değişimi', true)}
              {maintenance.oil_filter_change && renderInfoRow('Yağ Filtresi', true)}
              {maintenance.air_filter_change && renderInfoRow('Hava Filtresi', true)}
              {maintenance.brake_adjustment && renderInfoRow('Fren Ayarı', true)}
              {maintenance.tire_change && renderInfoRow('Lastik Değişimi', true)}
            </View>
          </Card>
        ))}
      </View>
    );
  };

  // Render inspection tab
  const renderInspectionTab = () => {
    const inspections = vehicle?.inspections || [];

    if (inspections.length === 0) {
      return (
        <View style={styles.emptyTab}>
          <ClipboardCheck size={48} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Henüz muayene kaydı yok
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        {inspections.map((inspection) => (
          <Card key={inspection.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <View style={styles.itemTitleRow}>
                <ClipboardCheck size={18} color={Brand.primary} />
                <Text style={[styles.itemTitle, { color: colors.text }]}>
                  {formatDate(inspection.inspection_date)}
                </Text>
              </View>
              <Badge
                label={
                  inspection.result === 'passed' ? 'Geçti' :
                  inspection.result === 'failed' ? 'Kaldı' : 'Beklemede'
                }
                variant={
                  inspection.result === 'passed' ? 'success' :
                  inspection.result === 'failed' ? 'danger' : 'warning'
                }
                size="sm"
              />
            </View>
            <View style={styles.itemDetails}>
              {renderInfoRow('Sonraki Muayene', formatDate(inspection.next_inspection_date))}
              {renderInfoRow('İstasyon', inspection.station)}
              {renderInfoRow('Ücret', formatCurrency(inspection.fee, inspection.currency))}
              {renderInfoRow('KM', formatNumber(inspection.odometer, 'km'))}
              {renderInfoRow('Notlar', inspection.notes)}
            </View>
          </Card>
        ))}
      </View>
    );
  };

  // Render faults tab
  const renderFaultsTab = () => {
    const faults = vehicle?.faultReports || [];

    if (faults.length === 0) {
      return (
        <View style={styles.emptyTab}>
          <AlertTriangle size={48} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Henüz arıza bildirimi yok
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        {faults.map((fault) => (
          <Card key={fault.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <View style={styles.itemTitleRow}>
                <AlertTriangle
                  size={18}
                  color={
                    fault.priority === 'critical' ? colors.danger :
                    fault.priority === 'high' ? colors.warning :
                    fault.priority === 'medium' ? colors.info : colors.textMuted
                  }
                />
                <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={1}>
                  {fault.title}
                </Text>
              </View>
              <Badge
                label={faultStatusLabels[fault.status] || fault.status}
                variant={
                  fault.status === 'resolved' ? 'success' :
                  fault.status === 'in_progress' ? 'info' :
                  fault.status === 'cancelled' ? 'default' : 'warning'
                }
                size="sm"
              />
            </View>
            <View style={styles.itemDetails}>
              {renderInfoRow('Öncelik', faultPriorityLabels[fault.priority])}
              {renderInfoRow('Açıklama', fault.description)}
              {renderInfoRow('Bildirme Tarihi', formatDate(fault.reported_at || fault.created_at))}
              {fault.resolved_at && renderInfoRow('Çözüm Tarihi', formatDate(fault.resolved_at))}
              {renderInfoRow('Tahmini Maliyet', formatCurrency(fault.estimated_cost, fault.estimated_currency))}
              {renderInfoRow('Gerçek Maliyet', formatCurrency(fault.actual_cost, fault.actual_currency))}
            </View>
          </Card>
        ))}
      </View>
    );
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':
        return renderInfoTab();
      case 'insurance':
        return renderInsuranceTab();
      case 'maintenance':
        return renderMaintenanceTab();
      case 'inspection':
        return renderInspectionTab();
      case 'faults':
        return renderFaultsTab();
      default:
        return null;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <FullScreenHeader
          title="Araç Detayı"
          showBackButton
          onBackPress={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Araç bilgileri yükleniyor...
          </Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error || !vehicle) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <FullScreenHeader
          title="Araç Detayı"
          showBackButton
          onBackPress={() => router.back()}
        />
        <View style={styles.errorContainer}>
          <AlertTriangle size={64} color={colors.danger} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Bir hata oluştu</Text>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {error || 'Araç bulunamadı'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Brand.primary }]}
            onPress={fetchVehicle}
          >
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const TypeIcon = getTypeIcon();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FullScreenHeader
        title={vehicle.plate}
        showBackButton
        onBackPress={() => router.back()}
        rightIcons={
          <>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.push(`/vehicle/${vehicle.id}/edit` as any)}
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

      {/* Vehicle Summary Card */}
      <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.summaryHeader}>
          <View style={[styles.typeIconLarge, { backgroundColor: Brand.primary + '15' }]}>
            <TypeIcon size={32} color={Brand.primary} />
          </View>
          <View style={styles.summaryInfo}>
            <Text style={[styles.summaryPlate, { color: colors.text }]}>{vehicle.plate}</Text>
            <Text style={[styles.summaryBrandModel, { color: colors.textSecondary }]}>
              {vehicle.brand || '-'} {vehicle.model || ''}
              {(vehicle.model_year || vehicle.year) ? ` (${vehicle.model_year || vehicle.year})` : ''}
            </Text>
          </View>
        </View>
        <View style={styles.badgeRow}>
          <Badge
            label={vehicleTypeLabels[vehicle.vehicle_type] || vehicle.vehicle_type}
            variant="info"
            size="sm"
          />
          <Badge
            label={ownershipLabels[vehicle.ownership_type] || vehicle.ownership_type}
            variant={vehicle.ownership_type === 'owned' ? 'success' : 'warning'}
            size="sm"
          />
          <Badge
            label={statusLabels[vehicle.status] || vehicle.status}
            variant={
              vehicle.status === 'available' ? 'success' :
              vehicle.status === 'in_use' ? 'info' :
              (vehicle.status === 'maintenance' || vehicle.status === 'in_maintenance') ? 'danger' : 'default'
            }
            size="sm"
          />
        </View>
        {(vehicle.total_km || vehicle.km_counter) && (
          <View style={[styles.kmBadge, { backgroundColor: colors.surface }]}>
            <Gauge size={16} color={colors.textMuted} />
            <Text style={[styles.kmText, { color: colors.text }]}>
              {formatNumber(vehicle.total_km || vehicle.km_counter, 'km')}
            </Text>
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
            if (tab.id === 'insurance') count = vehicle.insurances?.length || 0;
            else if (tab.id === 'maintenance') count = vehicle.maintenances?.length || 0;
            else if (tab.id === 'inspection') count = vehicle.inspections?.length || 0;
            else if (tab.id === 'faults') count = vehicle.faultReports?.length || 0;

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
        title="Aracı Sil"
        message="Bu aracı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
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
  summaryPlate: {
    ...Typography.headingLG,
  },
  summaryBrandModel: {
    ...Typography.bodyMD,
    marginTop: Spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  kmBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  kmText: {
    ...Typography.bodySM,
    fontWeight: '500',
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
    minWidth: 70,
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
    minWidth: 100,
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
  },
  itemCard: {
    padding: Spacing.md,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
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
});
