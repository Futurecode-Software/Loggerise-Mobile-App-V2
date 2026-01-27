/**
 * Transport Details Section (Always Editable)
 *
 * Comprehensive transport management for positions matching web functionality.
 * Supports Route selection, RoRo operations, Train operations, and position arrival dates.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ship, Train, Package, Clock, MapPin } from 'lucide-react-native';
import { Card, Button, Input, DateInput, Select } from '@/components/ui';
import { Colors, Typography, Spacing, BorderRadius, Brand } from '@/constants/theme';
import {
  Position,
  updatePosition,
  DeckType,
} from '@/services/endpoints/positions';
import {
  searchPorts,
  searchFerryCompanies,
} from '@/services/endpoints/locations';
import { showToast } from '@/utils/toast';

interface TransportDetailsSectionProps {
  position: Position;
  onUpdate: () => void;
}

const DECK_TYPES: { label: string; value: DeckType }[] = [
  { label: 'Alt Güverte', value: 'alt_guverte' },
  { label: 'Üst Güverte', value: 'ust_guverte' },
];

// Local Country type for route display
interface Country {
  id: number;
  name: string;
  code: string;
}

// Section header component
const SectionHeader = ({
  icon: Icon,
  title,
  color,
}: {
  icon: React.ComponentType<any>;
  title: string;
  color?: string;
}) => {
  const colors = Colors.light;
  return (
    <View style={styles.sectionHeader}>
      <Icon size={18} color={color || colors.textMuted} />
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
    </View>
  );
};

// Subsection header
const SubsectionHeader = ({ title }: { title: string }) => {
  const colors = Colors.light;
  return (
    <View style={styles.subsectionHeader}>
      <View style={[styles.subsectionDot, { backgroundColor: Brand.primary }]} />
      <Text style={[styles.subsectionTitle, { color: colors.text }]}>{title}</Text>
    </View>
  );
};

export function TransportDetailsSection({
  position,
  onUpdate,
}: TransportDetailsSectionProps) {
  const colors = Colors.light;
  const [isSaving, setIsSaving] = useState(false);

  // Route (countries list)
  const [routeCountries, setRouteCountries] = useState<Country[]>(() => {
    if (position.route) {
      const iso2Codes = position.route.split('-');
      return iso2Codes.map((code, index) => ({
        id: index,
        name: code.toUpperCase(),
        code: code.toUpperCase(),
        phone_code: '',
      }));
    }
    return [];
  });

  // Transport type flags
  const [isRoro, setIsRoro] = useState(!!position.is_roro);
  const [isTrain, setIsTrain] = useState(!!position.is_train);
  const [isMafi, setIsMafi] = useState(!!position.is_mafi);

  // Selected ports/company for display
  const [selectedDeparturePort, setSelectedDeparturePort] = useState(
    position.departurePort ? { id: position.departurePort.id, name: position.departurePort.name } : null
  );
  const [selectedArrivalPort, setSelectedArrivalPort] = useState(
    position.arrivalPort ? { id: position.arrivalPort.id, name: position.arrivalPort.name } : null
  );
  const [selectedFerryCompany, setSelectedFerryCompany] = useState(
    position.ferryCompany ? { id: position.ferryCompany.id, name: position.ferryCompany.name } : null
  );

  // RoRo form data
  const [roroData, setRoroData] = useState({
    departure_port_id: position.departure_port_id || null,
    arrival_port_id: position.arrival_port_id || null,
    ferry_company_id: position.ferry_company_id || null,
    roro_country_code: position.roro_country_code || '',
    roro_booking_reference: position.roro_booking_reference || '',
    roro_ship_name: position.roro_ship_name || '',
    roro_imo_number: position.roro_imo_number || '',
    roro_voyage_number: position.roro_voyage_number || '',
    roro_deck_type: position.roro_deck_type || '',
    roro_entry_location: position.roro_entry_location || '',
    roro_expected_entry_date: position.roro_expected_entry_date
      ? new Date(position.roro_expected_entry_date).toISOString().split('T')[0]
      : '',
    roro_entry_date: position.roro_entry_date
      ? new Date(position.roro_entry_date).toISOString().split('T')[0]
      : '',
    roro_exit_location: position.roro_exit_location || '',
    roro_expected_exit_date: position.roro_expected_exit_date
      ? new Date(position.roro_expected_exit_date).toISOString().split('T')[0]
      : '',
    roro_exit_date: position.roro_exit_date
      ? new Date(position.roro_exit_date).toISOString().split('T')[0]
      : '',
    roro_cutoff_date: position.roro_cutoff_date
      ? new Date(position.roro_cutoff_date).toISOString().split('T')[0]
      : '',
    roro_departure_date: position.roro_departure_date
      ? new Date(position.roro_departure_date).toISOString().split('T')[0]
      : '',
    roro_arrival_date: position.roro_arrival_date
      ? new Date(position.roro_arrival_date).toISOString().split('T')[0]
      : '',
    roro_notes: position.roro_notes || '',
  });

  // Train form data
  const [trainData, setTrainData] = useState({
    train_voyage_number: position.train_voyage_number || '',
    train_wagon_number: position.train_wagon_number || '',
    train_seal_number: position.train_seal_number || '',
    train_departure_terminal: position.train_departure_terminal || '',
    train_expected_departure_date: position.train_expected_departure_date
      ? new Date(position.train_expected_departure_date).toISOString().split('T')[0]
      : '',
    train_departure_date: position.train_departure_date
      ? new Date(position.train_departure_date).toISOString().split('T')[0]
      : '',
    train_arrival_terminal: position.train_arrival_terminal || '',
    train_expected_arrival_date: position.train_expected_arrival_date
      ? new Date(position.train_expected_arrival_date).toISOString().split('T')[0]
      : '',
    train_arrival_date: position.train_arrival_date
      ? new Date(position.train_arrival_date).toISOString().split('T')[0]
      : '',
  });

  // Position arrival dates
  const [arrivalDates, setArrivalDates] = useState({
    estimated_arrival_date: position.estimated_arrival_date
      ? new Date(position.estimated_arrival_date).toISOString().split('T')[0]
      : '',
    actual_arrival_date: position.actual_arrival_date
      ? new Date(position.actual_arrival_date).toISOString().split('T')[0]
      : '',
  });

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updateData: Partial<Position> = {
        route: routeCountries.map((c) => c.code).join('-'),
        is_roro: isRoro,
        is_train: isTrain,
        is_mafi: isMafi,
        ...arrivalDates,
      };

      if (isRoro) {
        Object.assign(updateData, roroData);
      }

      if (isTrain) {
        Object.assign(updateData, trainData);
      }

      await updatePosition(position.id, updateData);
      showToast({ type: 'success', message: 'Taşıma bilgileri güncellendi' });
      onUpdate();
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Güncelleme başarısız',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardView}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Güzergah & Taşıma Tipleri */}
        <Card style={styles.card}>
          <SectionHeader icon={MapPin} title="Güzergah & Taşıma Tipleri" />

          <Input
            label="Güzergah (Ülke kodları)"
            value={routeCountries.map((c) => c.code).join('-')}
            onChangeText={(text) => {
              const codes = text.toUpperCase().split('-');
              setRouteCountries(
                codes.map((code, index) => ({
                  id: index,
                  name: code,
                  code: code,
                  phone_code: '',
                }))
              );
            }}
            placeholder="TR-BG-RO-DE"
            
          />

          <View style={styles.switchGroup}>
            <View style={[styles.switchRow, { borderColor: colors.border }]}>
              <View style={styles.switchLabel}>
                <Ship size={18} color="#2563EB" />
                <Text style={[styles.switchText, { color: colors.text }]}>Ro-Ro</Text>
              </View>
              <Switch
                value={isRoro}
                onValueChange={setIsRoro}
                trackColor={{ false: colors.border, true: '#93C5FD' }}
                thumbColor={isRoro ? '#2563EB' : colors.surface}
              />
            </View>
            <View style={[styles.switchRow, { borderColor: colors.border }]}>
              <View style={styles.switchLabel}>
                <Train size={18} color="#D97706" />
                <Text style={[styles.switchText, { color: colors.text }]}>Tren</Text>
              </View>
              <Switch
                value={isTrain}
                onValueChange={setIsTrain}
                trackColor={{ false: colors.border, true: '#FDE68A' }}
                thumbColor={isTrain ? '#D97706' : colors.surface}
              />
            </View>
            <View style={[styles.switchRow, { borderColor: colors.border, borderBottomWidth: 0 }]}>
              <View style={styles.switchLabel}>
                <Package size={18} color="#16A34A" />
                <Text style={[styles.switchText, { color: colors.text }]}>Mafi</Text>
              </View>
              <Switch
                value={isMafi}
                onValueChange={setIsMafi}
                trackColor={{ false: colors.border, true: '#BBF7D0' }}
                thumbColor={isMafi ? '#16A34A' : colors.surface}
              />
            </View>
          </View>
        </Card>

        {/* Pozisyon Varış Tarihleri */}
        <Card style={styles.card}>
          <SectionHeader icon={Clock} title="Pozisyon Varış Tarihleri" />

          <View style={styles.row}>
            <View style={styles.halfColumn}>
              <DateInput
                label="Tahmini Varış"
                value={arrivalDates.estimated_arrival_date}
                onChangeDate={(value) => setArrivalDates({ ...arrivalDates, estimated_arrival_date: value })}
              />
            </View>
            <View style={styles.halfColumn}>
              <DateInput
                label="Gerçek Varış"
                value={arrivalDates.actual_arrival_date}
                onChangeDate={(value) => setArrivalDates({ ...arrivalDates, actual_arrival_date: value })}
              />
            </View>
          </View>
        </Card>

        {/* RoRo Detayları */}
        {isRoro && (
          <Card style={[styles.card, styles.roroCard]}>
            <SectionHeader icon={Ship} title="RoRo Detayları" color="#2563EB" />

            {/* Liman Seçimi */}
            <SubsectionHeader title="Liman Bilgileri" />

            <Select
              label="Kalkış Limanı"
              value={roroData.departure_port_id?.toString() || ''}
              data={selectedDeparturePort ? [{ label: selectedDeparturePort.name, value: selectedDeparturePort.id.toString() }] : []}
              onValueChange={(value) => {
                setRoroData({ ...roroData, departure_port_id: value ? Number(value) : null });
              }}
              onSearch={async (query) => {
                const results = await searchPorts(query);
                return results.map((p) => ({
                  label: `${p.name}${p.port_code ? ` (${p.port_code})` : ''}`,
                  value: p.id.toString(),
                }));
              }}
              placeholder="Liman ara..."
            />

            <Select
              label="Varış Limanı"
              value={roroData.arrival_port_id?.toString() || ''}
              data={selectedArrivalPort ? [{ label: selectedArrivalPort.name, value: selectedArrivalPort.id.toString() }] : []}
              onValueChange={(value) => {
                setRoroData({ ...roroData, arrival_port_id: value ? Number(value) : null });
              }}
              onSearch={async (query) => {
                const results = await searchPorts(query);
                return results.map((p) => ({
                  label: `${p.name}${p.port_code ? ` (${p.port_code})` : ''}`,
                  value: p.id.toString(),
                }));
              }}
              placeholder="Liman ara..."
            />

            <Select
              label="Feribot Şirketi"
              value={roroData.ferry_company_id?.toString() || ''}
              data={selectedFerryCompany ? [{ label: selectedFerryCompany.name, value: selectedFerryCompany.id.toString() }] : []}
              onValueChange={(value) => {
                setRoroData({ ...roroData, ferry_company_id: value ? Number(value) : null });
              }}
              onSearch={async (query) => {
                const results = await searchFerryCompanies(query);
                return results.map((f) => ({
                  label: `${f.name}${f.short_code ? ` (${f.short_code})` : ''}`,
                  value: f.id.toString(),
                }));
              }}
              placeholder="Şirket ara..."
            />

            {/* Gemi & Sefer Bilgileri */}
            <SubsectionHeader title="Gemi & Sefer Bilgileri" />

            <View style={styles.row}>
              <View style={styles.halfColumn}>
                <Input
                  label="Ülke Kodu"
                  value={roroData.roro_country_code}
                  onChangeText={(text) => setRoroData({ ...roroData, roro_country_code: text })}
                  placeholder="ALBANIA"
                />
              </View>
              <View style={styles.halfColumn}>
                <Input
                  label="Rezervasyon No"
                  value={roroData.roro_booking_reference}
                  onChangeText={(text) => setRoroData({ ...roroData, roro_booking_reference: text })}
                  placeholder="UND-2025-12345"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfColumn}>
                <Input
                  label="Gemi Adı"
                  value={roroData.roro_ship_name}
                  onChangeText={(text) => setRoroData({ ...roroData, roro_ship_name: text })}
                  placeholder="UN Marmara"
                />
              </View>
              <View style={styles.halfColumn}>
                <Input
                  label="IMO Numarası"
                  value={roroData.roro_imo_number}
                  onChangeText={(text) => setRoroData({ ...roroData, roro_imo_number: text })}
                  placeholder="1234567"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfColumn}>
                <Input
                  label="Sefer No"
                  value={roroData.roro_voyage_number}
                  onChangeText={(text) => setRoroData({ ...roroData, roro_voyage_number: text })}
                  placeholder="VOY-2025-001"
                />
              </View>
              <View style={styles.halfColumn}>
                <Select
                  label="Güverte Tipi"
                  value={roroData.roro_deck_type}
                  data={DECK_TYPES}
                  onValueChange={(value) => setRoroData({ ...roroData, roro_deck_type: value as DeckType })}
                  placeholder="Seçiniz"
                />
              </View>
            </View>

            {/* Giriş Bilgileri */}
            <SubsectionHeader title="Giriş Bilgileri" />

            <Input
              label="Giriş Yeri"
              value={roroData.roro_entry_location}
              onChangeText={(text) => setRoroData({ ...roroData, roro_entry_location: text })}
              placeholder="Giriş yeri"
              
            />

            <View style={styles.row}>
              <View style={styles.halfColumn}>
                <DateInput
                  label="Beklenen Giriş"
                  value={roroData.roro_expected_entry_date}
                  onChangeDate={(value) => setRoroData({ ...roroData, roro_expected_entry_date: value })}
                />
              </View>
              <View style={styles.halfColumn}>
                <DateInput
                  label="Gerçek Giriş"
                  value={roroData.roro_entry_date}
                  onChangeDate={(value) => setRoroData({ ...roroData, roro_entry_date: value })}
                />
              </View>
            </View>

            {/* Çıkış Bilgileri */}
            <SubsectionHeader title="Çıkış Bilgileri" />

            <Input
              label="Çıkış Yeri"
              value={roroData.roro_exit_location}
              onChangeText={(text) => setRoroData({ ...roroData, roro_exit_location: text })}
              placeholder="Çıkış yeri"
              
            />

            <View style={styles.row}>
              <View style={styles.halfColumn}>
                <DateInput
                  label="Beklenen Çıkış"
                  value={roroData.roro_expected_exit_date}
                  onChangeDate={(value) => setRoroData({ ...roroData, roro_expected_exit_date: value })}
                />
              </View>
              <View style={styles.halfColumn}>
                <DateInput
                  label="Gerçek Çıkış"
                  value={roroData.roro_exit_date}
                  onChangeDate={(value) => setRoroData({ ...roroData, roro_exit_date: value })}
                />
              </View>
            </View>

            {/* Gemi Tarihleri */}
            <SubsectionHeader title="Gemi Tarihleri" />

            <DateInput
              label="Cut-off Tarihi"
              value={roroData.roro_cutoff_date}
              onChangeDate={(value) => setRoroData({ ...roroData, roro_cutoff_date: value })}
              
            />

            <View style={styles.row}>
              <View style={styles.halfColumn}>
                <DateInput
                  label="Gemi Kalkış"
                  value={roroData.roro_departure_date}
                  onChangeDate={(value) => setRoroData({ ...roroData, roro_departure_date: value })}
                />
              </View>
              <View style={styles.halfColumn}>
                <DateInput
                  label="Gemi Varış"
                  value={roroData.roro_arrival_date}
                  onChangeDate={(value) => setRoroData({ ...roroData, roro_arrival_date: value })}
                />
              </View>
            </View>

            {/* Notlar */}
            <Input
              label="RoRo Notları"
              value={roroData.roro_notes}
              onChangeText={(text) => setRoroData({ ...roroData, roro_notes: text })}
              multiline
              numberOfLines={3}
              placeholder="Notlar..."
              
            />
          </Card>
        )}

        {/* Tren Detayları */}
        {isTrain && (
          <Card style={[styles.card, styles.trainCard]}>
            <SectionHeader icon={Train} title="Tren Detayları" color="#D97706" />

            {/* Sefer & Vagon Bilgileri */}
            <SubsectionHeader title="Sefer & Vagon Bilgileri" />

            <View style={styles.row}>
              <View style={styles.halfColumn}>
                <Input
                  label="Sefer No"
                  value={trainData.train_voyage_number}
                  onChangeText={(text) => setTrainData({ ...trainData, train_voyage_number: text })}
                  placeholder="TRN-2025-001"
                />
              </View>
              <View style={styles.halfColumn}>
                <Input
                  label="Vagon No"
                  value={trainData.train_wagon_number}
                  onChangeText={(text) => setTrainData({ ...trainData, train_wagon_number: text })}
                  placeholder="WAG-123456"
                />
              </View>
            </View>

            <Input
              label="Mühür No"
              value={trainData.train_seal_number}
              onChangeText={(text) => setTrainData({ ...trainData, train_seal_number: text })}
              placeholder="SEAL-12345"
              
            />

            {/* Kalkış Bilgileri */}
            <SubsectionHeader title="Kalkış Bilgileri" />

            <Input
              label="Kalkış Terminali"
              value={trainData.train_departure_terminal}
              onChangeText={(text) => setTrainData({ ...trainData, train_departure_terminal: text })}
              placeholder="Terminal adı"
              
            />

            <View style={styles.row}>
              <View style={styles.halfColumn}>
                <DateInput
                  label="Beklenen Kalkış"
                  value={trainData.train_expected_departure_date}
                  onChangeDate={(value) => setTrainData({ ...trainData, train_expected_departure_date: value })}
                />
              </View>
              <View style={styles.halfColumn}>
                <DateInput
                  label="Gerçek Kalkış"
                  value={trainData.train_departure_date}
                  onChangeDate={(value) => setTrainData({ ...trainData, train_departure_date: value })}
                />
              </View>
            </View>

            {/* Varış Bilgileri */}
            <SubsectionHeader title="Varış Bilgileri" />

            <Input
              label="Varış Terminali"
              value={trainData.train_arrival_terminal}
              onChangeText={(text) => setTrainData({ ...trainData, train_arrival_terminal: text })}
              placeholder="Terminal adı"
              
            />

            <View style={styles.row}>
              <View style={styles.halfColumn}>
                <DateInput
                  label="Beklenen Varış"
                  value={trainData.train_expected_arrival_date}
                  onChangeDate={(value) => setTrainData({ ...trainData, train_expected_arrival_date: value })}
                />
              </View>
              <View style={styles.halfColumn}>
                <DateInput
                  label="Gerçek Varış"
                  value={trainData.train_arrival_date}
                  onChangeDate={(value) => setTrainData({ ...trainData, train_arrival_date: value })}
                />
              </View>
            </View>
          </Card>
        )}

        {/* Kaydet Butonu */}
        <Button
          title="Kaydet"
          onPress={handleSave}
          loading={isSaving}
          fullWidth
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    gap: Spacing.md,
    paddingBottom: Spacing['2xl'],
  },
  card: {
    padding: Spacing.md,
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

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.headingSM,
    fontWeight: '600',
  },

  // Subsection header
  subsectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  subsectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  subsectionTitle: {
    ...Typography.bodySM,
    fontWeight: '600',
  },

  // Switch group
  switchGroup: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  switchText: {
    ...Typography.bodyMD,
    fontWeight: '500',
  },

  // Row layout (side by side inputs)
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  halfColumn: {
    flex: 1,
  },

  // Input container
  inputContainer: {
    marginBottom: Spacing.sm,
  },
});
