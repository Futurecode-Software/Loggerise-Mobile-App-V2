/**
 * Load Detail Screen
 *
 * Shows load details with items, addresses, companies, and documents.
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
  Package,
  Truck,
  Building2,
  MapPin,
  Calendar,
  AlertCircle,
  FileText,
  DollarSign,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Box,
  Scale,
  Ruler,
} from 'lucide-react-native';
import { Card, Badge } from '@/components/ui';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { FullScreenHeader } from '@/components/header/FullScreenHeader';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import { useToast } from '@/hooks/use-toast';
import {
  getLoad,
  deleteLoad,
  LoadDetail,
  LoadItem,
  LoadAddress,
  getStatusLabel,
  getStatusColor,
  getDirectionLabel,
  getDirectionColor,
  getLoadTypeLabel,
  getDocumentStatusLabel,
} from '@/services/endpoints/loads';

export default function LoadDetailScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const colors = Colors.light;
  const { success, error: showError } = useToast();

  // Parse ID safely - handle string, array, or undefined
  const loadId = React.useMemo(() => {
    const idStr = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!idStr) return null;
    const parsed = parseInt(idStr, 10);
    return isNaN(parsed) ? null : parsed;
  }, [rawId]);

  const [load, setLoad] = useState<LoadDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [expandedItems, setExpandedItems] = useState(false);
  const [expandedAddresses, setExpandedAddresses] = useState(false);

  // Fetch load data
  const fetchLoad = useCallback(async () => {
    if (!loadId) {
      setError('Geçersiz yük ID');
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const data = await getLoad(loadId);
      setLoad(data);
    } catch (err) {
      console.error('Load fetch error:', err);
      setError(err instanceof Error ? err.message : 'Yük bilgileri yüklenemedi');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [loadId]);

  useEffect(() => {
    fetchLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLoad();
  };

  // Delete load
  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!loadId) return;
    setIsDeleting(true);
    try {
      await deleteLoad(loadId);
      success('Başarılı', 'Yük silindi.');
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (err) {
      showError('Hata', err instanceof Error ? err.message : 'Yük silinemedi.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Format date
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // Format number with unit
  const formatNumber = (value?: number, unit?: string): string => {
    if (value === undefined || value === null) return '-';
    const formatted = value.toLocaleString('tr-TR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    return unit ? `${formatted} ${unit}` : formatted;
  };

  // Format price
  const formatPrice = (amount?: number, currency?: string): string => {
    if (amount === undefined || amount === null) return '-';
    const formatted = amount.toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${formatted} ${currency || 'TL'}`;
  };

  // Render info row
  const renderInfoRow = (
    label: string,
    value?: string | number | boolean | null,
    IconComponent?: any
  ) => {
    if (value === undefined || value === null || value === '') return null;
    const displayValue = typeof value === 'boolean' ? (value ? 'Evet' : 'Hayir') : String(value);

    return (
      <View style={styles.infoRow}>
        <View style={styles.infoRowLeft}>
          {IconComponent && <IconComponent size={16} color={colors.textMuted} />}
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}:</Text>
        </View>
        <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={2}>
          {displayValue}
        </Text>
      </View>
    );
  };

  // Get pickup address
  const getPickupAddress = (): LoadAddress | undefined => {
    return load?.addresses?.find((addr) => addr.type === 'pickup');
  };

  // Get delivery address
  const getDeliveryAddress = (): LoadAddress | undefined => {
    return load?.addresses?.find((addr) => addr.type === 'delivery');
  };

  // Get loading location name
  const getLoadingLocationName = (address?: LoadAddress): string => {
    if (!address) return '-';
    if (address.loadingLocation?.title) return address.loadingLocation.title;
    if (address.loadingCompany?.name) return address.loadingCompany.name;
    return '-';
  };

  // Get unloading location name
  const getUnloadingLocationName = (address?: LoadAddress): string => {
    if (!address) return '-';
    if (address.unloadingLocation?.title) return address.unloadingLocation.title;
    if (address.unloadingCompany?.name) return address.unloadingCompany.name;
    if (address.destinationCountry?.name) return address.destinationCountry.name;
    return '-';
  };

  // Render load item
  const renderLoadItem = (item: LoadItem, index: number) => (
    <View
      key={item.id}
      style={[
        styles.itemCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
        index > 0 && { marginTop: Spacing.sm },
      ]}
    >
      <View style={styles.itemHeader}>
        <View style={styles.itemHeaderLeft}>
          <Box size={16} color={colors.icon} />
          <Text style={[styles.itemTitle, { color: colors.text }]}>
            {item.cargo_name || item.package_type || `Kalem ${index + 1}`}
          </Text>
        </View>
        {item.is_hazardous && (
          <View style={[styles.hazardBadge, { backgroundColor: colors.danger + '15' }]}>
            <AlertTriangle size={12} color={colors.danger} />
            <Text style={[styles.hazardText, { color: colors.danger }]}>ADR</Text>
          </View>
        )}
      </View>
      <View style={styles.itemDetails}>
        <View style={styles.itemDetailRow}>
          <Text style={[styles.itemDetailLabel, { color: colors.textMuted }]}>Paket:</Text>
          <Text style={[styles.itemDetailValue, { color: colors.textSecondary }]}>
            {item.package_count || '-'} {item.package_type || ''}
          </Text>
        </View>
        <View style={styles.itemDetailRow}>
          <Text style={[styles.itemDetailLabel, { color: colors.textMuted }]}>Adet:</Text>
          <Text style={[styles.itemDetailValue, { color: colors.textSecondary }]}>
            {item.piece_count ?? '-'}
          </Text>
        </View>
        <View style={styles.itemDetailRow}>
          <Text style={[styles.itemDetailLabel, { color: colors.textMuted }]}>Brüt:</Text>
          <Text style={[styles.itemDetailValue, { color: colors.textSecondary }]}>
            {formatNumber(item.gross_weight, 'kg')}
          </Text>
        </View>
        <View style={styles.itemDetailRow}>
          <Text style={[styles.itemDetailLabel, { color: colors.textMuted }]}>Hacim:</Text>
          <Text style={[styles.itemDetailValue, { color: colors.textSecondary }]}>
            {formatNumber(item.volume, 'm³')}
          </Text>
        </View>
        {item.lademetre && (
          <View style={styles.itemDetailRow}>
            <Text style={[styles.itemDetailLabel, { color: colors.textMuted }]}>LDM:</Text>
            <Text style={[styles.itemDetailValue, { color: colors.textSecondary }]}>
              {formatNumber(item.lademetre)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <FullScreenHeader
          title="Yük Detayı"
          showBackButton
          onBackPress={() => router.back()}
        />
        <View style={styles.content}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Brand.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Yük bilgileri yükleniyor...
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Error state
  if (error || !load) {
    return (
      <View style={styles.container}>
        <FullScreenHeader
          title="Yük Detayı"
          showBackButton
          onBackPress={() => router.back()}
        />
        <View style={styles.content}>
          <View style={styles.errorContainer}>
            <AlertCircle size={64} color={colors.danger} />
            <Text style={[styles.errorTitle, { color: colors.text }]}>Bir hata oluştu</Text>
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>
              {error || 'Yük bulunamadı'}
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: Brand.primary }]}
              onPress={fetchLoad}
            >
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const pickupAddress = getPickupAddress();
  const deliveryAddress = getDeliveryAddress();
  const hasDocuments =
    load.declaration_no ||
    load.cargo_invoice_no ||
    load.invoice_document ||
    load.atr_document ||
    load.packing_list_document;

  return (
    <View style={styles.container}>
      <FullScreenHeader
        title={load.load_number}
        showBackButton
        onBackPress={() => router.back()}
        rightIcons={
          <>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.push(`/load/${load.id}/edit` as any)}
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
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Brand.primary} />
        }
      >
        {/* Status Card */}
        <View style={[styles.statusCard, { backgroundColor: Brand.primary }]}>
          <View style={styles.statusCardHeader}>
            <Package size={32} color="#FFFFFF" />
            <View style={styles.statusCardInfo}>
              <Text style={styles.statusCardNumber}>{load.load_number}</Text>
              {load.cargo_name && (
                <Text style={styles.statusCardCargo} numberOfLines={1}>
                  {load.cargo_name}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.statusCardFooter}>
            <Badge
              label={getStatusLabel(load.status)}
              variant="default"
              size="sm"
              style={{ backgroundColor: getStatusColor(load.status) }}
              textStyle={{ color: '#FFFFFF' }}
            />
            {load.direction && (
              <Badge
                label={getDirectionLabel(load.direction)}
                variant="outline"
                size="sm"
                style={{
                  borderColor: '#FFFFFF',
                  backgroundColor: getDirectionColor(load.direction) + '40',
                }}
                textStyle={{ color: '#FFFFFF' }}
              />
            )}
          </View>
        </View>

        {/* Details */}
        {/* Temel Bilgiler */}
        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Temel Bilgiler</Text>
          {renderInfoRow('Araç Tipi', load.vehicle_type, Truck)}
          {renderInfoRow('Yükleme Tipi', load.loading_type, Package)}
          {renderInfoRow('Taşıma Hızı', load.transport_speed, Truck)}
          {renderInfoRow('Kargo Sınıfı', load.cargo_class, Box)}
          {renderInfoRow('Yük Tipi', getLoadTypeLabel(load.load_type), Package)}
          {renderInfoRow('Teslim Şekli', load.delivery_terms, FileText)}
          {load.gtip_hs_code && renderInfoRow('GTIP/HS Kodu', load.gtip_hs_code, FileText)}
        </Card>

        {/* Firmalar */}
        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Firmalar</Text>
          {renderInfoRow('Müşteri', load.customer?.name, Building2)}
          {renderInfoRow('Gönderici', load.sender_company?.name, Building2)}
          {renderInfoRow('Üretici', load.manufacturer_company?.name, Building2)}
          {renderInfoRow('Alıcı', load.receiver_company?.name, Building2)}
        </Card>

        {/* Yük Kalemleri */}
        {load.items && load.items.length > 0 && (
          <Card style={styles.sectionCard}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setExpandedItems(!expandedItems)}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Yük Kalemleri ({load.items.length})
              </Text>
              {expandedItems ? (
                <ChevronUp size={20} color={colors.icon} />
              ) : (
                <ChevronDown size={20} color={colors.icon} />
              )}
            </TouchableOpacity>
            {expandedItems && (
              <View style={styles.itemsContainer}>
                {load.items.map((item, index) => renderLoadItem(item, index))}
              </View>
            )}
            {!expandedItems && (
              <View style={styles.collapsedSummary}>
                <View style={styles.summaryItem}>
                  <Scale size={14} color={colors.icon} />
                  <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
                    {formatNumber(
                      load.items.reduce((sum, item) => sum + (item.gross_weight || 0), 0),
                      'kg'
                    )}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Box size={14} color={colors.icon} />
                  <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
                    {formatNumber(
                      load.items.reduce((sum, item) => sum + (item.volume || 0), 0),
                      'm³'
                    )}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Ruler size={14} color={colors.icon} />
                  <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
                    {formatNumber(load.items.reduce((sum, item) => sum + (item.lademetre || 0), 0))}{' '}
                    LDM
                  </Text>
                </View>
              </View>
            )}
          </Card>
        )}

        {/* Adresler */}
        <Card style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setExpandedAddresses(!expandedAddresses)}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Adresler</Text>
            {expandedAddresses ? (
              <ChevronUp size={20} color={colors.icon} />
            ) : (
              <ChevronDown size={20} color={colors.icon} />
            )}
          </TouchableOpacity>

          {/* Collapsed view - simplified */}
          {!expandedAddresses && (
            <View style={styles.addressSummary}>
              <View style={styles.addressPoint}>
                <MapPin size={16} color={colors.success} />
                <View style={styles.addressPointInfo}>
                  <Text
                    style={[styles.addressPointLabel, { color: colors.textMuted }]}
                    numberOfLines={1}
                  >
                    Yükleme
                  </Text>
                  <Text style={[styles.addressPointValue, { color: colors.text }]} numberOfLines={1}>
                    {getLoadingLocationName(pickupAddress)}
                  </Text>
                  {pickupAddress?.expected_loading_entry_date && (
                    <Text style={[styles.addressDate, { color: colors.textSecondary }]}>
                      {formatDate(pickupAddress.expected_loading_entry_date)}
                    </Text>
                  )}
                </View>
              </View>

              <View style={[styles.addressDivider, { backgroundColor: colors.border }]} />

              <View style={styles.addressPoint}>
                <MapPin size={16} color={colors.danger} />
                <View style={styles.addressPointInfo}>
                  <Text
                    style={[styles.addressPointLabel, { color: colors.textMuted }]}
                    numberOfLines={1}
                  >
                    Bosaltma
                  </Text>
                  <Text style={[styles.addressPointValue, { color: colors.text }]} numberOfLines={1}>
                    {getUnloadingLocationName(deliveryAddress)}
                  </Text>
                  {deliveryAddress?.expected_unloading_entry_date && (
                    <Text style={[styles.addressDate, { color: colors.textSecondary }]}>
                      {formatDate(deliveryAddress.expected_unloading_entry_date)}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Expanded view - detailed */}
          {expandedAddresses && (
            <View style={styles.addressesExpanded}>
              {pickupAddress && (
                <View
                  style={[
                    styles.addressCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.addressCardHeader}>
                    <MapPin size={16} color={colors.success} />
                    <Text style={[styles.addressCardTitle, { color: colors.success }]}>
                      Yükleme Noktasi
                    </Text>
                  </View>
                  {renderInfoRow('Firma', pickupAddress.loadingCompany?.name)}
                  {renderInfoRow('Lokasyon', pickupAddress.loadingLocation?.title)}
                  {renderInfoRow(
                    'Beklenen Tarih',
                    formatDate(pickupAddress.expected_loading_entry_date),
                    Calendar
                  )}
                  {renderInfoRow(
                    'Giriş Tarihi',
                    formatDate(pickupAddress.loading_entry_date),
                    Calendar
                  )}
                  {renderInfoRow(
                    'Çıkış Tarihi',
                    formatDate(pickupAddress.loading_exit_date),
                    Calendar
                  )}
                </View>
              )}

              {deliveryAddress && (
                <View
                  style={[
                    styles.addressCard,
                    { backgroundColor: colors.surface, borderColor: colors.border, marginTop: Spacing.sm },
                  ]}
                >
                  <View style={styles.addressCardHeader}>
                    <MapPin size={16} color={colors.danger} />
                    <Text style={[styles.addressCardTitle, { color: colors.danger }]}>
                      Boşaltma Noktası
                    </Text>
                  </View>
                  {renderInfoRow('Firma', deliveryAddress.unloadingCompany?.name)}
                  {renderInfoRow('Lokasyon', deliveryAddress.unloadingLocation?.title)}
                  {renderInfoRow('Varış Ülkesi', deliveryAddress.destinationCountry?.name)}
                  {renderInfoRow(
                    'Beklenen Tarih',
                    formatDate(deliveryAddress.expected_unloading_entry_date),
                    Calendar
                  )}
                  {renderInfoRow(
                    'Varış Tarihi',
                    formatDate(deliveryAddress.unloading_arrival_date),
                    Calendar
                  )}
                  {renderInfoRow(
                    'Giriş Tarihi',
                    formatDate(deliveryAddress.unloading_entry_date),
                    Calendar
                  )}
                  {renderInfoRow(
                    'Çıkış Tarihi',
                    formatDate(deliveryAddress.unloading_exit_date),
                    Calendar
                  )}
                </View>
              )}
            </View>
          )}
        </Card>

        {/* Finansal Bilgiler */}
        {(load.freight_fee || load.estimated_cargo_value) && (
          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Finansal Bilgiler</Text>
            {load.freight_fee !== undefined && load.freight_fee !== null && (
              <View style={styles.priceRow}>
                <View style={styles.priceRowLeft}>
                  <DollarSign size={16} color={colors.success} />
                  <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>
                    Navlun Ücreti:
                  </Text>
                </View>
                <Text style={[styles.priceValue, { color: colors.success }]}>
                  {formatPrice(load.freight_fee, load.freight_fee_currency)}
                </Text>
              </View>
            )}
            {load.estimated_cargo_value !== undefined && load.estimated_cargo_value !== null && (
              <View style={styles.priceRow}>
                <View style={styles.priceRowLeft}>
                  <DollarSign size={16} color={colors.textMuted} />
                  <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>
                    Mal Bedeli:
                  </Text>
                </View>
                <Text style={[styles.priceValue, { color: colors.text }]}>
                  {formatPrice(load.estimated_cargo_value, load.estimated_value_currency)}
                </Text>
              </View>
            )}
          </Card>
        )}

        {/* Belgeler */}
        {hasDocuments && (
          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Belgeler</Text>
            {load.declaration_no && (
              <>
                {renderInfoRow('Beyanname No', load.declaration_no, FileText)}
                {renderInfoRow(
                  'Beyanname Teslim',
                  formatDate(load.declaration_submission_date),
                  Calendar
                )}
                {renderInfoRow(
                  'Beyanname Hazır',
                  formatDate(load.declaration_ready_date),
                  Calendar
                )}
              </>
            )}
            {load.cargo_invoice_no && (
              <>
                {renderInfoRow('Fatura No', load.cargo_invoice_no, FileText)}
                {renderInfoRow('Fatura Tarihi', formatDate(load.cargo_invoice_date), Calendar)}
              </>
            )}
            {load.atr_no && renderInfoRow('ATR No', load.atr_no, FileText)}
            {load.regime_no && renderInfoRow('Rejim No', load.regime_no, FileText)}

            {/* Document statuses */}
            {(load.invoice_document ||
              load.atr_document ||
              load.packing_list_document ||
              load.origin_certificate_document ||
              load.health_certificate_document ||
              load.eur1_document ||
              load.t1_t2_document) && (
              <View style={[styles.documentStatuses, { borderTopColor: colors.border }]}>
                <Text style={[styles.documentStatusTitle, { color: colors.textMuted }]}>
                  Belge Durumları
                </Text>
                {load.invoice_document &&
                  renderInfoRow('Fatura', getDocumentStatusLabel(load.invoice_document))}
                {load.atr_document &&
                  renderInfoRow('ATR', getDocumentStatusLabel(load.atr_document))}
                {load.packing_list_document &&
                  renderInfoRow('Çeki Listesi', getDocumentStatusLabel(load.packing_list_document))}
                {load.origin_certificate_document &&
                  renderInfoRow(
                    'Menşei Belgesi',
                    getDocumentStatusLabel(load.origin_certificate_document)
                  )}
                {load.health_certificate_document &&
                  renderInfoRow(
                    'Sağlık Sertifikası',
                    getDocumentStatusLabel(load.health_certificate_document)
                  )}
                {load.eur1_document &&
                  renderInfoRow('EUR.1', getDocumentStatusLabel(load.eur1_document))}
                {load.t1_t2_document &&
                  renderInfoRow('T1/T2', getDocumentStatusLabel(load.t1_t2_document))}
              </View>
            )}
          </Card>
        )}
      </ScrollView>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Yükü Sil"
        message="Bu yükü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
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
    backgroundColor: Brand.primary,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    ...Shadows.lg,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing['2xl'],
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
  statusCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    gap: Spacing.lg,
  },
  statusCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  statusCardInfo: {
    flex: 1,
  },
  statusCardNumber: {
    ...Typography.headingLG,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  statusCardCargo: {
    ...Typography.bodyMD,
    color: 'rgba(255,255,255,0.8)',
    marginTop: Spacing.xs,
  },
  statusCardFooter: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  sectionCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...Typography.headingSM,
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
  },
  infoRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  infoLabel: {
    ...Typography.bodySM,
  },
  infoValue: {
    ...Typography.bodySM,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
  // Items
  itemsContainer: {
    marginTop: Spacing.sm,
  },
  itemCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  itemHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  itemTitle: {
    ...Typography.bodySM,
    fontWeight: '600',
  },
  hazardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  hazardText: {
    ...Typography.bodyXS,
    fontWeight: '600',
  },
  itemDetails: {
    gap: Spacing.xs,
  },
  itemDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemDetailLabel: {
    ...Typography.bodyXS,
  },
  itemDetailValue: {
    ...Typography.bodyXS,
    fontWeight: '500',
  },
  collapsedSummary: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginTop: -Spacing.sm,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  summaryText: {
    ...Typography.bodySM,
  },
  // Addresses
  addressSummary: {
    marginTop: -Spacing.sm,
  },
  addressPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  addressPointInfo: {
    flex: 1,
  },
  addressPointLabel: {
    ...Typography.bodyXS,
  },
  addressPointValue: {
    ...Typography.bodySM,
    fontWeight: '500',
  },
  addressDate: {
    ...Typography.bodyXS,
    marginTop: Spacing.xs,
  },
  addressDivider: {
    height: 1,
    marginVertical: Spacing.xs,
  },
  addressesExpanded: {
    marginTop: Spacing.sm,
  },
  addressCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  addressCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  addressCardTitle: {
    ...Typography.bodySM,
    fontWeight: '600',
  },
  // Price
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  priceRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  priceLabel: {
    ...Typography.bodySM,
  },
  priceValue: {
    ...Typography.bodyMD,
    fontWeight: '700',
  },
  // Documents
  documentStatuses: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  documentStatusTitle: {
    ...Typography.bodyXS,
    marginBottom: Spacing.sm,
  },
});
