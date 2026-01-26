/**
 * Vehicle Info Section (Editable)
 *
 * Matches web version: resources/js/components/logistics-management/positions/VehicleInfo.tsx
 * Allows editing vehicle owner, truck, trailer, driver information.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Truck, Users, Building2, Receipt } from 'lucide-react-native';
import { Card, Button, Input, Select, SearchableSelect } from '@/components/ui';
import type { SearchableSelectOption } from '@/components/ui';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import {
  Position,
  updatePosition,
  CURRENCY_TYPES,
  VehicleOwnerType,
} from '@/services/endpoints/positions';
import { getVehicles, Vehicle } from '@/services/endpoints/vehicles';
import { getEmployees, Employee } from '@/services/endpoints/employees';
import { getContacts, Contact } from '@/services/endpoints/contacts';
import { getLatestRate } from '@/services/endpoints/exchange-rates';
import { showToast } from '@/utils/toast';

interface VehicleInfoSectionProps {
  position: Position;
  onUpdate: () => void;
}

// Vehicle owner type options
const VEHICLE_OWNER_TYPE_OPTIONS = [
  { value: 'own', label: 'Özmal' },
  { value: 'contract_rental', label: 'Sözleşmeli Kiralık' },
  { value: 'market_rental', label: 'Piyasa (Tek Seferlik) Kiralık' },
  { value: 'other', label: 'Diğer' },
];

interface FormData {
  vehicle_owner_type: VehicleOwnerType;
  vehicle_owner_contact_id: number | null;
  rental_fee: string;
  rental_currency: string;
  rental_exchange_rate: string;
  truck_tractor_id: number | null;
  trailer_id: number | null;
  manual_location: string;
  driver_id: number | null;
  second_driver_id: number | null;
}

export function VehicleInfoSection({ position, onUpdate }: VehicleInfoSectionProps) {
  const colors = Colors.light;

  // Form state
  const [formData, setFormData] = useState<FormData>({
    vehicle_owner_type: position.vehicle_owner_type || 'own',
    vehicle_owner_contact_id: position.vehicle_owner_contact_id || null,
    rental_fee: position.rental_fee || '',
    rental_currency: position.rental_currency || 'TRY',
    rental_exchange_rate: position.rental_exchange_rate || '1',
    truck_tractor_id: position.truck_tractor_id || null,
    trailer_id: position.trailer_id || null,
    manual_location: position.manual_location || '',
    driver_id: position.driver_id || null,
    second_driver_id: position.second_driver_id || null,
  });

  // Selected options for SearchableSelect components
  // Backend returns snake_case: vehicle_owner_contact, truck_tractor, second_driver
  const [selectedContact, setSelectedContact] = useState<SearchableSelectOption | null>(
    position.vehicle_owner_contact
      ? { value: position.vehicle_owner_contact.id, label: position.vehicle_owner_contact.name }
      : null
  );
  const [selectedTruckTractor, setSelectedTruckTractor] = useState<SearchableSelectOption | null>(
    position.truck_tractor
      ? { value: position.truck_tractor.id, label: position.truck_tractor.plate }
      : null
  );
  const [selectedTrailer, setSelectedTrailer] = useState<SearchableSelectOption | null>(
    position.trailer ? { value: position.trailer.id, label: position.trailer.plate } : null
  );
  const [selectedDriver, setSelectedDriver] = useState<SearchableSelectOption | null>(
    position.driver
      ? {
          value: position.driver.id,
          label: `${position.driver.first_name} ${position.driver.last_name}`,
        }
      : null
  );
  const [selectedSecondDriver, setSelectedSecondDriver] = useState<SearchableSelectOption | null>(
    position.second_driver
      ? {
          value: position.second_driver.id,
          label: `${position.second_driver.first_name} ${position.second_driver.last_name}`,
        }
      : null
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingRate, setIsFetchingRate] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form when position changes
  useEffect(() => {
    setFormData({
      vehicle_owner_type: position.vehicle_owner_type || 'own',
      vehicle_owner_contact_id: position.vehicle_owner_contact_id || null,
      rental_fee: position.rental_fee || '',
      rental_currency: position.rental_currency || 'TRY',
      rental_exchange_rate: position.rental_exchange_rate || '1',
      truck_tractor_id: position.truck_tractor_id || null,
      trailer_id: position.trailer_id || null,
      manual_location: position.manual_location || '',
      driver_id: position.driver_id || null,
      second_driver_id: position.second_driver_id || null,
    });

    // Update selected options (Backend returns snake_case)
    setSelectedContact(
      position.vehicle_owner_contact
        ? { value: position.vehicle_owner_contact.id, label: position.vehicle_owner_contact.name }
        : null
    );
    setSelectedTruckTractor(
      position.truck_tractor
        ? { value: position.truck_tractor.id, label: position.truck_tractor.plate }
        : null
    );
    setSelectedTrailer(
      position.trailer ? { value: position.trailer.id, label: position.trailer.plate } : null
    );
    setSelectedDriver(
      position.driver
        ? {
            value: position.driver.id,
            label: `${position.driver.first_name} ${position.driver.last_name}`,
          }
        : null
    );
    setSelectedSecondDriver(
      position.second_driver
        ? {
            value: position.second_driver.id,
            label: `${position.second_driver.first_name} ${position.second_driver.last_name}`,
          }
        : null
    );
  }, [position]);

  // Fetch exchange rate when currency changes
  const fetchExchangeRate = async (currencyCode: string) => {
    if (currencyCode === 'TRY') {
      setFormData((prev) => ({ ...prev, rental_exchange_rate: '1' }));
      return;
    }

    setIsFetchingRate(true);
    try {
      const rateData = await getLatestRate(currencyCode);
      const rate = rateData.forex_selling.toString();
      setFormData((prev) => ({ ...prev, rental_exchange_rate: rate }));
    } catch (error) {
      console.error('Exchange rate fetch error:', error);
      showToast({
        type: 'error',
        message: `${currencyCode} için kur bulunamadı. Manuel giriş yapabilirsiniz.`,
      });
    } finally {
      setIsFetchingRate(false);
    }
  };

  // Handle currency change
  const handleCurrencyChange = (currency: string | undefined) => {
    if (!currency) return;
    setFormData((prev) => ({ ...prev, rental_currency: currency }));
    fetchExchangeRate(currency);
  };

  // Load contacts for SearchableSelect
  const loadContacts = useCallback(async (query: string): Promise<SearchableSelectOption[]> => {
    try {
      const { contacts } = await getContacts({ search: query, per_page: 20 });
      return contacts.map((contact: Contact) => ({
        value: contact.id,
        label: contact.name,
        subtitle: contact.short_name || undefined,
      }));
    } catch (error) {
      console.error('Error loading contacts:', error);
      return [];
    }
  }, []);

  // Load truck tractors for SearchableSelect
  const loadTruckTractors = useCallback(async (query: string): Promise<SearchableSelectOption[]> => {
    try {
      const { vehicles } = await getVehicles({
        search: query,
        vehicle_type: 'truck_tractor',
        per_page: 20,
      });
      return vehicles.map((vehicle: Vehicle) => ({
        value: vehicle.id,
        label: vehicle.plate,
        subtitle: vehicle.brand && vehicle.model ? `${vehicle.brand} ${vehicle.model}` : undefined,
      }));
    } catch (error) {
      console.error('Error loading truck tractors:', error);
      return [];
    }
  }, []);

  // Load trailers for SearchableSelect
  const loadTrailers = useCallback(async (query: string): Promise<SearchableSelectOption[]> => {
    try {
      const { vehicles } = await getVehicles({
        search: query,
        vehicle_type: 'trailer',
        per_page: 20,
      });
      return vehicles.map((vehicle: Vehicle) => ({
        value: vehicle.id,
        label: vehicle.plate,
        subtitle: vehicle.brand && vehicle.model ? `${vehicle.brand} ${vehicle.model}` : undefined,
      }));
    } catch (error) {
      console.error('Error loading trailers:', error);
      return [];
    }
  }, []);

  // Load drivers for SearchableSelect
  const loadDrivers = useCallback(async (query: string): Promise<SearchableSelectOption[]> => {
    try {
      // Backend filters by position='driver' and status=true automatically
      const { employees } = await getEmployees({
        search: query,
        position: 'driver',
        per_page: 20,
      });
      return employees.map((employee: Employee) => ({
        value: employee.id,
        label: `${employee.first_name} ${employee.last_name}`,
        subtitle: employee.phone_1 || undefined,
      }));
    } catch (error) {
      console.error('Error loading drivers:', error);
      return [];
    }
  }, []);

  // Reset form to original values
  const handleReset = () => {
    setFormData({
      vehicle_owner_type: position.vehicle_owner_type || 'own',
      vehicle_owner_contact_id: position.vehicle_owner_contact_id || null,
      rental_fee: position.rental_fee || '',
      rental_currency: position.rental_currency || 'TRY',
      rental_exchange_rate: position.rental_exchange_rate || '1',
      truck_tractor_id: position.truck_tractor_id || null,
      trailer_id: position.trailer_id || null,
      manual_location: position.manual_location || '',
      driver_id: position.driver_id || null,
      second_driver_id: position.second_driver_id || null,
    });

    // Reset selected options (Backend returns snake_case)
    setSelectedContact(
      position.vehicle_owner_contact
        ? { value: position.vehicle_owner_contact.id, label: position.vehicle_owner_contact.name }
        : null
    );
    setSelectedTruckTractor(
      position.truck_tractor
        ? { value: position.truck_tractor.id, label: position.truck_tractor.plate }
        : null
    );
    setSelectedTrailer(
      position.trailer ? { value: position.trailer.id, label: position.trailer.plate } : null
    );
    setSelectedDriver(
      position.driver
        ? {
            value: position.driver.id,
            label: `${position.driver.first_name} ${position.driver.last_name}`,
          }
        : null
    );
    setSelectedSecondDriver(
      position.second_driver
        ? {
            value: position.second_driver.id,
            label: `${position.second_driver.first_name} ${position.second_driver.last_name}`,
          }
        : null
    );

    setErrors({});
  };

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    setErrors({});

    try {
      await updatePosition(position.id, {
        vehicle_owner_type: formData.vehicle_owner_type,
        vehicle_owner_contact_id: formData.vehicle_owner_contact_id,
        rental_fee: formData.rental_fee || undefined,
        rental_currency: formData.rental_currency,
        rental_exchange_rate: formData.rental_exchange_rate,
        truck_tractor_id: formData.truck_tractor_id,
        trailer_id: formData.trailer_id,
        manual_location: formData.manual_location || undefined,
        driver_id: formData.driver_id,
        second_driver_id: formData.second_driver_id,
      });

      showToast({
        type: 'success',
        message: 'Araç ve sürücü bilgileri başarıyla güncellendi.',
      });

      onUpdate();
    } catch (error: any) {
      console.error('Update error:', error);

      // Handle validation errors
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }

      showToast({
        type: 'error',
        message: 'Bilgiler güncellenirken bir hata oluştu.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Check if rental details should be shown
  const showRentalDetails = formData.vehicle_owner_type !== 'own';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Vehicle Owner Section */}
      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <Building2 size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Araç Sahibi Bilgileri</Text>
        </View>

        {/* Vehicle Owner Type */}
        <Select
          label="Araç Sahibi Tipi"
          data={VEHICLE_OWNER_TYPE_OPTIONS}
          value={formData.vehicle_owner_type}
          onValueChange={(value) =>
            setFormData((prev) => ({
              ...prev,
              vehicle_owner_type: (value as VehicleOwnerType) || 'own',
            }))
          }
          error={errors.vehicle_owner_type}
          placeholder="Seçiniz"
        />

        {/* Show owner contact and rental details if not owned */}
        {showRentalDetails && (
          <>
            {/* Vehicle Owner Contact */}
            <SearchableSelect
              label="Araç Sahibi Firma (Cari)"
              placeholder="Firma seçiniz"
              value={formData.vehicle_owner_contact_id || undefined}
              selectedOption={selectedContact}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  vehicle_owner_contact_id: value ? Number(value) : null,
                }))
              }
              onSelect={(option) => setSelectedContact(option)}
              loadOptions={loadContacts}
              error={errors.vehicle_owner_contact_id}
            />

            {/* Rental Details */}
            <View style={[styles.rentalSection, { backgroundColor: colors.surface }]}>
              <View style={styles.rentalHeader}>
                <Receipt size={18} color={colors.primary} />
                <Text style={[styles.rentalTitle, { color: colors.text }]}>Kiralama Bilgileri</Text>
              </View>

              {/* Rental Fee */}
              <Input
                label="Kiralama Bedeli"
                value={formData.rental_fee}
                onChangeText={(text) =>
                  setFormData((prev) => ({
                    ...prev,
                    rental_fee: text.replace(/[^0-9.,]/g, ''),
                  }))
                }
                keyboardType="decimal-pad"
                error={errors.rental_fee}
                placeholder="0.00"
              />

              {/* Currency */}
              <Select
                label="Döviz Cinsi"
                data={CURRENCY_TYPES}
                value={formData.rental_currency}
                onValueChange={handleCurrencyChange}
                error={errors.rental_currency}
                placeholder="Döviz seçiniz"
              />

              {/* Exchange Rate */}
              <Input
                label="Döviz Kuru"
                value={formData.rental_exchange_rate}
                onChangeText={(text) =>
                  setFormData((prev) => ({
                    ...prev,
                    rental_exchange_rate: text.replace(/[^0-9.,]/g, ''),
                  }))
                }
                keyboardType="decimal-pad"
                error={errors.rental_exchange_rate}
                placeholder="1.0000"
              />
            </View>
          </>
        )}
      </Card>

      {/* Vehicle Section */}
      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <Truck size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Araç Bilgileri</Text>
        </View>

        {/* Truck Tractor */}
        <SearchableSelect
          label="Çekici Plaka (Truck Tractor)"
          placeholder="Çekici seçiniz"
          value={formData.truck_tractor_id || undefined}
          selectedOption={selectedTruckTractor}
          onValueChange={(value) =>
            setFormData((prev) => ({
              ...prev,
              truck_tractor_id: value ? Number(value) : null,
            }))
          }
          onSelect={(option) => setSelectedTruckTractor(option)}
          loadOptions={loadTruckTractors}
          error={errors.truck_tractor_id}
        />

        {/* Trailer */}
        <SearchableSelect
          label="Kuyruk Plaka (Trailer)"
          placeholder="Kuyruk seçiniz"
          value={formData.trailer_id || undefined}
          selectedOption={selectedTrailer}
          onValueChange={(value) =>
            setFormData((prev) => ({
              ...prev,
              trailer_id: value ? Number(value) : null,
            }))
          }
          onSelect={(option) => setSelectedTrailer(option)}
          loadOptions={loadTrailers}
          error={errors.trailer_id}
        />

        {/* Manual Location */}
        <Input
          label="Manuel Konum Bilgisi"
          value={formData.manual_location}
          onChangeText={(text) => setFormData((prev) => ({ ...prev, manual_location: text }))}
          error={errors.manual_location}
          placeholder="Manuel konum bilgisi giriniz"
        />
      </Card>

      {/* Driver Section */}
      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <Users size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Sürücü Bilgileri</Text>
        </View>

        {/* Driver */}
        <SearchableSelect
          label="Sürücü"
          placeholder="Sürücü seçiniz"
          value={formData.driver_id || undefined}
          selectedOption={selectedDriver}
          onValueChange={(value) =>
            setFormData((prev) => ({
              ...prev,
              driver_id: value ? Number(value) : null,
            }))
          }
          onSelect={(option) => setSelectedDriver(option)}
          loadOptions={loadDrivers}
          error={errors.driver_id}
        />

        {/* Second Driver */}
        <SearchableSelect
          label="2. Sürücü"
          placeholder="2. Sürücü seçiniz"
          value={formData.second_driver_id || undefined}
          selectedOption={selectedSecondDriver}
          onValueChange={(value) =>
            setFormData((prev) => ({
              ...prev,
              second_driver_id: value ? Number(value) : null,
            }))
          }
          onSelect={(option) => setSelectedSecondDriver(option)}
          loadOptions={loadDrivers}
          error={errors.second_driver_id}
        />
      </Card>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          title="Değişiklikleri İptal Et"
          onPress={handleReset}
          variant="outline"
          disabled={isSaving}
          style={styles.cancelButton}
        />
        <Button
          title={isSaving ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
          onPress={handleSave}
          variant="primary"
          loading={isSaving}
          disabled={isSaving}
          style={styles.saveButton}
        />
      </View>

      {/* Bottom spacing */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.headingMD,
    fontWeight: '600',
  },
  rentalSection: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  rentalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  rentalTitle: {
    ...Typography.bodySM,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  bottomSpacer: {
    height: Spacing['2xl'],
  },
});
