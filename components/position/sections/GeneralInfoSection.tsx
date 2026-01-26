/**
 * General Info Section
 *
 * Displays comprehensive position information matching web version exactly.
 * All data from web GeneralInfoSection is displayed in card format.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Truck,
  Car,
  User,
  MapPin,
  Calendar,
  Ship,
  Train,
  Anchor,
  Clock,
  FileText,
  Shield,
  Fuel,
} from 'lucide-react-native';
import { Card, Badge, Divider } from '@/components/ui';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import {
  Position,
  getVehicleOwnerTypeLabel,
  getInsuranceStatusLabel,
  getDeckTypeLabel,
  getDriverFullName,
  getPositionTypeLabel,
} from '@/services/endpoints/positions';

interface GeneralInfoSectionProps {
  position: Position;
}

// Format helpers
const formatDate = (date?: string | null): string => {
  if (!date) return '';
  try {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '';
  }
};

const formatDateTime = (date?: string | null): string => {
  if (!date) return '';
  try {
    return new Date(date).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
};

const formatNumber = (value?: string | null, decimals = 2): string => {
  if (!value) return '';
  try {
    return parseFloat(value).toLocaleString('tr-TR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  } catch {
    return '';
  }
};

// Info item component (returns null if no value - web style)
const InfoItem = ({
  label,
  value,
  valueColor,
}: {
  label: string;
  value?: string | null;
  valueColor?: string;
}) => {
  const colors = Colors.light;
  if (!value) return null;

  return (
    <View style={styles.infoItem}>
      <Text style={[styles.infoItemLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.infoItemValue, { color: valueColor || colors.text }]}>{value}</Text>
    </View>
  );
};

// Section header component
const SectionHeader = ({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<any>;
  title: string;
}) => {
  const colors = Colors.light;
  return (
    <View style={styles.sectionHeader}>
      <Icon size={16} color={colors.textMuted} />
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
    </View>
  );
};

export function GeneralInfoSection({ position }: GeneralInfoSectionProps) {
  const colors = Colors.light;

  // Check what sections to display (matching web exactly)
  const hasGarageInfo =
    position.garage_location ||
    position.manual_location ||
    position.garage_entry_date ||
    position.garage_exit_date;

  const hasRouteInfo =
    position.route ||
    position.is_roro ||
    position.is_train ||
    position.is_mafi ||
    position.estimated_arrival_date ||
    position.actual_arrival_date;

  const hasRoRoInfo =
    position.is_roro &&
    (position.departurePort ||
      position.arrivalPort ||
      position.ferryCompany ||
      position.roro_booking_reference ||
      position.roro_voyage_number ||
      position.roro_cutoff_date ||
      position.roro_departure_date ||
      position.roro_arrival_date ||
      position.roro_ship_name ||
      position.roro_entry_location ||
      position.roro_exit_location);

  const hasTrainInfo =
    position.is_train &&
    (position.train_voyage_number ||
      position.train_wagon_number ||
      position.train_departure_terminal ||
      position.train_arrival_terminal);

  const hasBorderExitInfo =
    position.border_exit_gate ||
    position.border_exit_date ||
    position.border_exit_manifest_no;

  const hasBorderEntryInfo =
    position.border_entry_gate ||
    position.border_entry_date ||
    position.border_entry_manifest_no;

  const hasSealInfo = position.status || position.seal_no || position.sealing_person;

  const hasInsuranceInfo =
    position.insurance_status || position.insurance_date || position.insurance_amount;

  const hasFuelInfo =
    position.current_fuel_liters ||
    position.fuel_added_liters ||
    position.remaining_fuel_liters ||
    position.fuel_consumption_percentage;

  return (
    <View style={styles.container}>
      {/* === SEFER ÖZETİ KARTI === */}
      <Card style={styles.card}>
        {/* Üst Başlık - Pozisyon No ve Durum */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Badge
              label={getPositionTypeLabel(position.position_type)}
              variant={position.position_type === 'import' ? 'success' : 'info'}
              size="sm"
            />
            <Text style={[styles.positionNumber, { color: colors.text }]}>
              {position.position_number}
            </Text>
          </View>
          <Badge
            label={position.is_active ? 'Aktif' : 'Pasif'}
            variant={position.is_active ? 'success' : 'default'}
            size="sm"
          />
        </View>

        <Divider style={styles.divider} />

        {/* Araç & Sürücü Bilgileri - Kompakt Grid */}
        <View style={styles.grid}>
          {/* Çekici */}
          <View style={styles.gridItem}>
            <View style={styles.gridHeader}>
              <Truck size={14} color={colors.textMuted} />
              <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>Çekici</Text>
            </View>
            {position.truck_tractor || position.truckTractor ? (
              <View>
                <Text style={[styles.gridValue, { color: colors.text }]}>
                  {(position.truck_tractor || position.truckTractor)?.plate}
                </Text>
                <Text style={[styles.gridValueSmall, { color: colors.textMuted }]}>
                  {(position.truck_tractor || position.truckTractor)?.brand}
                </Text>
              </View>
            ) : (
              <Text style={[styles.gridValueMuted, { color: colors.textMuted }]}>-</Text>
            )}
          </View>

          {/* Römork */}
          <View style={styles.gridItem}>
            <View style={styles.gridHeader}>
              <Car size={14} color={colors.textMuted} />
              <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>Römork</Text>
            </View>
            {position.trailer ? (
              <View>
                <Text style={[styles.gridValue, { color: colors.text }]}>
                  {position.trailer.plate}
                </Text>
                <Text style={[styles.gridValueSmall, { color: colors.textMuted }]}>
                  {position.trailer.brand}
                </Text>
              </View>
            ) : (
              <Text style={[styles.gridValueMuted, { color: colors.textMuted }]}>-</Text>
            )}
          </View>

          {/* Sürücü */}
          <View style={styles.gridItem}>
            <View style={styles.gridHeader}>
              <User size={14} color={colors.textMuted} />
              <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>Sürücü</Text>
            </View>
            {position.driver ? (
              <Text style={[styles.gridValue, { color: colors.text }]}>
                {getDriverFullName(position.driver)}
              </Text>
            ) : (
              <Text style={[styles.gridValueMuted, { color: colors.textMuted }]}>-</Text>
            )}
          </View>

          {/* 2. Sürücü */}
          <View style={styles.gridItem}>
            <View style={styles.gridHeader}>
              <User size={14} color={colors.textMuted} />
              <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>2. Sürücü</Text>
            </View>
            {position.second_driver || position.secondDriver ? (
              <Text style={[styles.gridValue, { color: colors.text }]}>
                {getDriverFullName(position.second_driver || position.secondDriver)}
              </Text>
            ) : (
              <Text style={[styles.gridValueMuted, { color: colors.textMuted }]}>-</Text>
            )}
          </View>
        </View>

        {/* Araç Sahibi Bilgisi */}
        {(position.vehicle_owner_type || position.vehicle_owner_contact || position.vehicleOwnerContact) && (
          <View style={[styles.ownerInfo, { backgroundColor: colors.surface }]}>
            <Text style={[styles.ownerLabel, { color: colors.textSecondary }]}>Araç Sahibi:</Text>
            {position.vehicle_owner_type && (
              <Badge
                label={getVehicleOwnerTypeLabel(position.vehicle_owner_type)}
                variant="secondary"
                size="sm"
              />
            )}
            {(position.vehicle_owner_contact || position.vehicleOwnerContact) && (
              <Text style={[styles.ownerValue, { color: colors.text }]}>
                {(position.vehicle_owner_contact || position.vehicleOwnerContact)?.name}
              </Text>
            )}
            {position.rentalInvoice && (
              <Text style={[styles.ownerLabel, { color: colors.textSecondary }]}>
                Fatura: {position.rentalInvoice.invoice_no}
              </Text>
            )}
          </View>
        )}
      </Card>

      {/* === GARAJ & KONUM === */}
      {hasGarageInfo && (
        <Card style={styles.card}>
          <SectionHeader icon={MapPin} title="Garaj & Konum" />
          <View style={styles.infoGrid}>
            <InfoItem label="Garaj Yeri" value={position.garage_location} />
            <InfoItem label="Manuel Konum" value={position.manual_location} />
            <InfoItem label="Giriş Tarihi" value={formatDate(position.garage_entry_date)} />
            <InfoItem label="Çıkış Tarihi" value={formatDate(position.garage_exit_date)} />
          </View>
        </Card>
      )}

      {/* === GÜZERGAH & TAŞIMA === */}
      {hasRouteInfo && (
        <Card style={styles.card}>
          <SectionHeader icon={MapPin} title="Güzergah" />

          {position.route && (
            <View style={[styles.routeBox, { backgroundColor: colors.surface }]}>
              <Text style={[styles.routeText, { color: colors.text }]}>{position.route}</Text>
            </View>
          )}

          <View style={styles.routeInfo}>
            {(position.is_roro || position.is_train || position.is_mafi) && (
              <View style={styles.badgeRow}>
                {position.is_roro && <Badge label="Ro-Ro" variant="secondary" size="sm" />}
                {position.is_train && <Badge label="Tren" variant="secondary" size="sm" />}
                {position.is_mafi && <Badge label="Mafi" variant="secondary" size="sm" />}
              </View>
            )}
            {position.estimated_arrival_date && (
              <Text style={[styles.dateInfo, { color: colors.textSecondary }]}>
                Tahmini:{' '}
                <Text style={{ fontWeight: '600', color: colors.text }}>
                  {formatDate(position.estimated_arrival_date)}
                </Text>
              </Text>
            )}
            {position.actual_arrival_date && (
              <Text style={[styles.dateInfo, { color: colors.textSecondary }]}>
                Gerçek:{' '}
                <Text style={{ fontWeight: '600', color: '#16A34A' }}>
                  {formatDate(position.actual_arrival_date)}
                </Text>
              </Text>
            )}
          </View>
        </Card>
      )}

      {/* === RORO BİLGİLERİ === */}
      {hasRoRoInfo && (
        <Card style={[styles.card, styles.roroCard]}>
          <SectionHeader icon={Ship} title="RoRo Bilgileri" />

          {/* Liman Bilgileri */}
          {(position.departurePort || position.arrivalPort) && (
            <View style={styles.portInfo}>
              {position.departurePort && (
                <View style={styles.portItem}>
                  <Anchor size={14} color={Brand.primary} />
                  <Text style={[styles.portLabel, { color: colors.textSecondary }]}>Kalkış:</Text>
                  <Text style={[styles.portValue, { color: colors.text }]}>
                    {position.departurePort.name}
                  </Text>
                  {position.departurePort.port_code && (
                    <Text style={[styles.portCode, { color: colors.textMuted }]}>
                      ({position.departurePort.port_code})
                    </Text>
                  )}
                </View>
              )}
              {position.departurePort && position.arrivalPort && (
                <Text style={[styles.portArrow, { color: colors.textMuted }]}>→</Text>
              )}
              {position.arrivalPort && (
                <View style={styles.portItem}>
                  <Anchor size={14} color={Brand.primary} />
                  <Text style={[styles.portLabel, { color: colors.textSecondary }]}>Varış:</Text>
                  <Text style={[styles.portValue, { color: colors.text }]}>
                    {position.arrivalPort.name}
                  </Text>
                  {position.arrivalPort.port_code && (
                    <Text style={[styles.portCode, { color: colors.textMuted }]}>
                      ({position.arrivalPort.port_code})
                    </Text>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Şirket ve Referans */}
          <View style={styles.roroDetails}>
            {position.ferryCompany && (
              <Text style={[styles.roroDetailText, { color: colors.textSecondary }]}>
                Feribot Şirketi:{' '}
                <Text style={{ fontWeight: '600', color: colors.text }}>
                  {position.ferryCompany.name}
                </Text>
                {position.ferryCompany.short_code && (
                  <Text style={{ color: colors.textMuted }}> ({position.ferryCompany.short_code})</Text>
                )}
              </Text>
            )}
            {position.roro_country_code && (
              <Text style={[styles.roroDetailText, { color: colors.textSecondary }]}>
                Ülke Kodu:{' '}
                <Text style={{ fontWeight: '600', color: colors.text }}>
                  {position.roro_country_code}
                </Text>
              </Text>
            )}
            {position.roro_ship_name && (
              <Text style={[styles.roroDetailText, { color: colors.textSecondary }]}>
                Gemi Adı:{' '}
                <Text style={{ fontWeight: '600', color: colors.text }}>
                  {position.roro_ship_name}
                </Text>
                {position.roro_imo_number && (
                  <Text style={{ color: colors.textMuted }}> (IMO: {position.roro_imo_number})</Text>
                )}
              </Text>
            )}
          </View>

          <View style={styles.roroDetails}>
            {position.roro_booking_reference && (
              <Text style={[styles.roroDetailText, { color: colors.textSecondary }]}>
                Rezervasyon:{' '}
                <Text style={{ fontWeight: '600', fontFamily: 'monospace', color: colors.text }}>
                  {position.roro_booking_reference}
                </Text>
              </Text>
            )}
            {position.roro_voyage_number && (
              <Text style={[styles.roroDetailText, { color: colors.textSecondary }]}>
                Sefer No:{' '}
                <Text style={{ fontWeight: '600', fontFamily: 'monospace', color: colors.text }}>
                  {position.roro_voyage_number}
                </Text>
              </Text>
            )}
            {position.roro_deck_type && (
              <Text style={[styles.roroDetailText, { color: colors.textSecondary }]}>
                Güverte:{' '}
                <Text style={{ fontWeight: '500', color: colors.text }}>
                  {getDeckTypeLabel(position.roro_deck_type)}
                </Text>
              </Text>
            )}
          </View>

          {/* Giriş / Çıkış Bilgileri */}
          {(position.roro_entry_location || position.roro_exit_location) && (
            <View style={[styles.roroEntryExit, { borderTopColor: '#DBEAFE' }]}>
              {position.roro_entry_location && (
                <View style={styles.entryExitBox}>
                  <Text style={[styles.entryExitTitle, { color: '#1D4ED8' }]}>
                    GİRİŞ: {position.roro_entry_location}
                  </Text>
                  <View style={styles.entryExitDates}>
                    {position.roro_expected_entry_date && (
                      <Text style={[styles.entryExitDate, { color: colors.textSecondary }]}>
                        Beklenen: {formatDateTime(position.roro_expected_entry_date)}
                      </Text>
                    )}
                    {position.roro_entry_date && (
                      <Text style={[styles.entryExitDate, { color: colors.textSecondary }]}>
                        Gerçek: {formatDateTime(position.roro_entry_date)}
                      </Text>
                    )}
                  </View>
                </View>
              )}
              {position.roro_exit_location && (
                <View style={styles.entryExitBox}>
                  <Text style={[styles.entryExitTitle, { color: '#1D4ED8' }]}>
                    ÇIKIŞ: {position.roro_exit_location}
                  </Text>
                  <View style={styles.entryExitDates}>
                    {position.roro_expected_exit_date && (
                      <Text style={[styles.entryExitDate, { color: colors.textSecondary }]}>
                        Beklenen: {formatDateTime(position.roro_expected_exit_date)}
                      </Text>
                    )}
                    {position.roro_exit_date && (
                      <Text style={[styles.entryExitDate, { color: colors.textSecondary }]}>
                        Gerçek: {formatDateTime(position.roro_exit_date)}
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Tarihler */}
          {(position.roro_cutoff_date ||
            position.roro_departure_date ||
            position.roro_arrival_date) && (
            <View style={styles.roroDateRow}>
              {position.roro_cutoff_date && (
                <View style={styles.roroDateItem}>
                  <Clock size={12} color="#F97316" />
                  <Text style={[styles.roroDateLabel, { color: colors.textSecondary }]}>Cut-off:</Text>
                  <Text style={[styles.roroDateValue, { color: '#C2410C' }]}>
                    {formatDateTime(position.roro_cutoff_date)}
                  </Text>
                </View>
              )}
              {position.roro_departure_date && (
                <Text style={[styles.roroDetailText, { color: colors.textSecondary }]}>
                  Kalkış:{' '}
                  <Text style={{ fontWeight: '600', color: colors.text }}>
                    {formatDateTime(position.roro_departure_date)}
                  </Text>
                </Text>
              )}
              {position.roro_arrival_date && (
                <Text style={[styles.roroDetailText, { color: colors.textSecondary }]}>
                  Varış:{' '}
                  <Text style={{ fontWeight: '600', color: '#16A34A' }}>
                    {formatDateTime(position.roro_arrival_date)}
                  </Text>
                </Text>
              )}
            </View>
          )}

          {/* RoRo Notları */}
          {position.roro_notes && (
            <View style={[styles.roroNotes, { backgroundColor: 'rgba(255,255,255,0.6)' }]}>
              <Text style={[styles.notesText, { color: colors.text }]}>{position.roro_notes}</Text>
            </View>
          )}
        </Card>
      )}

      {/* === TREN BİLGİLERİ === */}
      {hasTrainInfo && (
        <Card style={[styles.card, styles.trainCard]}>
          <SectionHeader icon={Train} title="Tren Bilgileri" />

          {/* Sefer ve Vagon */}
          <View style={styles.trainDetails}>
            {position.train_voyage_number && (
              <Text style={[styles.trainDetailText, { color: colors.textSecondary }]}>
                Sefer No:{' '}
                <Text style={{ fontWeight: '600', fontFamily: 'monospace', color: colors.text }}>
                  {position.train_voyage_number}
                </Text>
              </Text>
            )}
            {position.train_wagon_number && (
              <Text style={[styles.trainDetailText, { color: colors.textSecondary }]}>
                Vagon No:{' '}
                <Text style={{ fontWeight: '600', fontFamily: 'monospace', color: colors.text }}>
                  {position.train_wagon_number}
                </Text>
              </Text>
            )}
            {position.train_seal_number && (
              <Text style={[styles.trainDetailText, { color: colors.textSecondary }]}>
                Mühür No:{' '}
                <Text style={{ fontWeight: '600', fontFamily: 'monospace', color: colors.text }}>
                  {position.train_seal_number}
                </Text>
              </Text>
            )}
          </View>

          {/* Terminal Bilgileri */}
          <View style={[styles.trainTerminals, { borderTopColor: '#FDE68A' }]}>
            {position.train_departure_terminal && (
              <View style={styles.terminalBox}>
                <Text style={[styles.terminalTitle, { color: '#B45309' }]}>
                  KALKIŞ: {position.train_departure_terminal}
                </Text>
                <View style={styles.terminalDates}>
                  {position.train_expected_departure_date && (
                    <Text style={[styles.terminalDate, { color: colors.textSecondary }]}>
                      Beklenen: {formatDateTime(position.train_expected_departure_date)}
                    </Text>
                  )}
                  {position.train_departure_date && (
                    <Text style={[styles.terminalDate, { color: colors.textSecondary }]}>
                      Gerçek: {formatDateTime(position.train_departure_date)}
                    </Text>
                  )}
                </View>
              </View>
            )}
            {position.train_arrival_terminal && (
              <View style={styles.terminalBox}>
                <Text style={[styles.terminalTitle, { color: '#B45309' }]}>
                  VARIŞ: {position.train_arrival_terminal}
                </Text>
                <View style={styles.terminalDates}>
                  {position.train_expected_arrival_date && (
                    <Text style={[styles.terminalDate, { color: colors.textSecondary }]}>
                      Beklenen: {formatDateTime(position.train_expected_arrival_date)}
                    </Text>
                  )}
                  {position.train_arrival_date && (
                    <Text style={[styles.terminalDate, { color: colors.textSecondary }]}>
                      Gerçek: {formatDateTime(position.train_arrival_date)}
                    </Text>
                  )}
                </View>
              </View>
            )}
          </View>
        </Card>
      )}

      {/* === SINIR GEÇİŞLERİ === */}
      {(hasBorderExitInfo || hasBorderEntryInfo || hasSealInfo) && (
        <Card style={styles.card}>
          <SectionHeader icon={FileText} title="Sınır Geçişleri" />

          <View style={styles.borderRow}>
            {/* Çıkış */}
            {hasBorderExitInfo && (
              <View style={[styles.borderBox, { backgroundColor: '#FEE2E2' }]}>
                <Text style={[styles.borderTitle, { color: '#991B1B' }]}>ÇIKIŞ</Text>
                <View style={styles.borderGrid}>
                  {position.border_exit_gate && (
                    <Text style={[styles.borderText, { color: colors.textSecondary }]}>
                      Kapı: <Text style={{ fontWeight: '500', color: colors.text }}>{position.border_exit_gate}</Text>
                    </Text>
                  )}
                  {position.border_exit_date && (
                    <Text style={[styles.borderText, { color: colors.textSecondary }]}>
                      Tarih: <Text style={{ fontWeight: '500', color: colors.text }}>{formatDate(position.border_exit_date)}</Text>
                    </Text>
                  )}
                  {position.border_exit_manifest_no && (
                    <Text style={[styles.borderText, { color: colors.textSecondary }]}>
                      Manifesto: <Text style={{ fontWeight: '500', color: colors.text }}>{position.border_exit_manifest_no}</Text>
                      {position.border_exit_manifest_date && (
                        <Text style={{ color: colors.textMuted }}> ({formatDate(position.border_exit_manifest_date)})</Text>
                      )}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Giriş */}
            {hasBorderEntryInfo && (
              <View style={[styles.borderBox, { backgroundColor: '#DCFCE7' }]}>
                <Text style={[styles.borderTitle, { color: '#166534' }]}>GİRİŞ</Text>
                <View style={styles.borderGrid}>
                  {position.border_entry_gate && (
                    <Text style={[styles.borderText, { color: colors.textSecondary }]}>
                      Kapı: <Text style={{ fontWeight: '500', color: colors.text }}>{position.border_entry_gate}</Text>
                    </Text>
                  )}
                  {position.border_entry_date && (
                    <Text style={[styles.borderText, { color: colors.textSecondary }]}>
                      Tarih: <Text style={{ fontWeight: '500', color: colors.text }}>{formatDate(position.border_entry_date)}</Text>
                    </Text>
                  )}
                  {position.border_entry_manifest_no && (
                    <Text style={[styles.borderText, { color: colors.textSecondary }]}>
                      Manifesto: <Text style={{ fontWeight: '500', color: colors.text }}>{position.border_entry_manifest_no}</Text>
                      {position.border_entry_manifest_date && (
                        <Text style={{ color: colors.textMuted }}> ({formatDate(position.border_entry_manifest_date)})</Text>
                      )}
                    </Text>
                  )}
                </View>
              </View>
            )}
          </View>

          {/* Mühür */}
          {hasSealInfo && (
            <View style={styles.sealRow}>
              {position.status && (
                <Text style={[styles.sealText, { color: colors.textSecondary }]}>
                  Durum: <Text style={{ fontWeight: '500', color: colors.text }}>{position.status}</Text>
                </Text>
              )}
              {position.seal_no && (
                <Text style={[styles.sealText, { color: colors.textSecondary }]}>
                  Mühür No: <Text style={{ fontWeight: '500', color: colors.text }}>{position.seal_no}</Text>
                </Text>
              )}
              {position.sealing_person && (
                <Text style={[styles.sealText, { color: colors.textSecondary }]}>
                  Mühürleyen: <Text style={{ fontWeight: '500', color: colors.text }}>{position.sealing_person}</Text>
                </Text>
              )}
            </View>
          )}
        </Card>
      )}

      {/* === SİGORTA & YAKIT === */}
      {(hasInsuranceInfo || hasFuelInfo) && (
        <View style={styles.twoColumn}>
          {/* Sigorta */}
          {hasInsuranceInfo && (
            <Card style={[styles.card, styles.halfCard]}>
              <SectionHeader icon={Shield} title="Sigorta" />
              <View style={styles.insuranceContent}>
                {position.insurance_status && (
                  <Badge
                    {...getInsuranceStatusLabel(position.insurance_status)}
                    size="sm"
                  />
                )}
                {position.insurance_date && (
                  <Text style={[styles.insuranceText, { color: colors.textMuted }]}>
                    {formatDate(position.insurance_date)}
                  </Text>
                )}
                {position.insurance_amount && (
                  <Text style={[styles.insuranceAmount, { color: colors.text }]}>
                    {formatNumber(position.insurance_amount)} {position.insurance_currency || 'TRY'}
                  </Text>
                )}
              </View>
            </Card>
          )}

          {/* Yakıt */}
          {hasFuelInfo && (
            <Card style={[styles.card, styles.halfCard]}>
              <SectionHeader icon={Fuel} title="Yakıt" />
              <View style={styles.fuelContent}>
                {position.current_fuel_liters && (
                  <Text style={[styles.fuelText, { color: colors.textSecondary }]}>
                    Mevcut:{' '}
                    <Text style={{ fontWeight: '600', color: colors.text }}>
                      {formatNumber(position.current_fuel_liters)} lt
                    </Text>
                  </Text>
                )}
                {position.fuel_added_liters && (
                  <Text style={[styles.fuelText, { color: colors.textSecondary }]}>
                    Alınan:{' '}
                    <Text style={{ fontWeight: '600', color: '#16A34A' }}>
                      +{formatNumber(position.fuel_added_liters)} lt
                    </Text>
                  </Text>
                )}
                {position.remaining_fuel_liters && (
                  <Text style={[styles.fuelText, { color: colors.textSecondary }]}>
                    Kalan:{' '}
                    <Text style={{ fontWeight: '600', color: colors.text }}>
                      {formatNumber(position.remaining_fuel_liters)} lt
                    </Text>
                  </Text>
                )}
                {position.fuel_consumption_percentage && (
                  <Text style={[styles.fuelText, { color: colors.textSecondary }]}>
                    Sarfiyat:{' '}
                    <Text style={{ fontWeight: '600', color: '#C2410C' }}>
                      %{formatNumber(position.fuel_consumption_percentage)}
                    </Text>
                  </Text>
                )}
              </View>
            </Card>
          )}
        </View>
      )}

      {/* === NOTLAR === */}
      {position.notes && (
        <Card style={styles.card}>
          <SectionHeader icon={FileText} title="Notlar" />
          <View style={[styles.notesBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.notesText, { color: colors.text }]}>{position.notes}</Text>
          </View>
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  card: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  halfCard: {
    flex: 1,
  },
  roroCard: {
    borderColor: '#DBEAFE',
    borderWidth: 1,
    backgroundColor: '#EFF6FF',
  },
  trainCard: {
    borderColor: '#FEF3C7',
    borderWidth: 1,
    backgroundColor: '#FFFBEB',
  },
  divider: {
    marginVertical: Spacing.sm,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  positionNumber: {
    ...Typography.headingMD,
    fontFamily: 'monospace',
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.bodySM,
    fontWeight: '600',
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  gridItem: {
    flex: 1,
    minWidth: '45%',
    gap: 2,
  },
  gridHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gridLabel: {
    ...Typography.bodyXS,
  },
  gridValue: {
    ...Typography.bodySM,
    fontWeight: '600',
  },
  gridValueSmall: {
    ...Typography.bodyXS,
  },
  gridValueMuted: {
    ...Typography.bodySM,
  },

  // Owner info
  ownerInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  ownerLabel: {
    ...Typography.bodySM,
  },
  ownerValue: {
    ...Typography.bodySM,
    fontWeight: '500',
  },

  // Info grid/item
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  infoItem: {
    flex: 1,
    minWidth: '45%',
    gap: 2,
  },
  infoItemLabel: {
    ...Typography.bodyXS,
  },
  infoItemValue: {
    ...Typography.bodySM,
    fontWeight: '500',
  },

  // Route
  routeBox: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  routeText: {
    ...Typography.bodySM,
    fontFamily: 'monospace',
  },
  routeInfo: {
    gap: Spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  dateInfo: {
    ...Typography.bodyXS,
  },

  // RoRo
  portInfo: {
    gap: Spacing.sm,
  },
  portItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  portLabel: {
    ...Typography.bodySM,
  },
  portValue: {
    ...Typography.bodySM,
    fontWeight: '600',
  },
  portCode: {
    ...Typography.bodyXS,
    fontFamily: 'monospace',
  },
  portArrow: {
    ...Typography.bodySM,
    textAlign: 'center',
  },
  roroDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  roroDetailText: {
    ...Typography.bodyXS,
  },
  roroEntryExit: {
    flexDirection: 'row',
    gap: Spacing.md,
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
    marginTop: Spacing.sm,
  },
  entryExitBox: {
    flex: 1,
    gap: 4,
  },
  entryExitTitle: {
    ...Typography.bodyXS,
    fontWeight: '600',
  },
  entryExitDates: {
    gap: 2,
  },
  entryExitDate: {
    fontSize: 10,
  },
  roroDateRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    alignItems: 'center',
  },
  roroDateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roroDateLabel: {
    ...Typography.bodyXS,
  },
  roroDateValue: {
    ...Typography.bodyXS,
    fontWeight: '600',
  },
  roroNotes: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
  },

  // Train
  trainDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  trainDetailText: {
    ...Typography.bodySM,
  },
  trainTerminals: {
    flexDirection: 'row',
    gap: Spacing.md,
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
    marginTop: Spacing.sm,
  },
  terminalBox: {
    flex: 1,
    gap: 4,
  },
  terminalTitle: {
    ...Typography.bodyXS,
    fontWeight: '600',
  },
  terminalDates: {
    gap: 2,
  },
  terminalDate: {
    fontSize: 10,
  },

  // Border
  borderRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  borderBox: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  borderTitle: {
    ...Typography.bodyXS,
    fontWeight: '700',
    marginBottom: 4,
  },
  borderGrid: {
    gap: 4,
  },
  borderText: {
    ...Typography.bodyXS,
  },
  sealRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  sealText: {
    ...Typography.bodyXS,
  },

  // Insurance & Fuel
  twoColumn: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  insuranceContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  insuranceText: {
    ...Typography.bodyXS,
  },
  insuranceAmount: {
    ...Typography.bodySM,
    fontWeight: '600',
  },
  fuelContent: {
    gap: 4,
  },
  fuelText: {
    ...Typography.bodyXS,
  },

  // Notes
  notesBox: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  notesText: {
    ...Typography.bodySM,
    lineHeight: 20,
  },
});
