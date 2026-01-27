/**
 * Vehicle Edit Screen
 *
 * Edit existing vehicle information.
 * Matches web version at /filo-yonetimi/araclar/{id}/duzenle
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Save } from 'lucide-react-native';
import { FullScreenHeader } from '@/components/header/FullScreenHeader';
import { Input, Checkbox, DateInput } from '@/components/ui';
import { SelectInput } from '@/components/ui/select-input';
import { Colors, Typography, Spacing, Brand, Shadows } from '@/constants/theme';
import { useToast } from '@/hooks/use-toast';
import api, { getErrorMessage, getValidationErrors } from '@/services/api';
import { getVehicle } from '@/services/endpoints/vehicles';

// Domestic vehicle class options - web ile aynı
const DOMESTIC_VEHICLE_CLASS_OPTIONS = [
  { label: 'Seçiniz...', value: '' },
  { label: 'Panelvan', value: 'panel_van' },
  { label: 'Pikap', value: 'pickup' },
  { label: 'Sprinter', value: 'sprinter' },
  { label: 'Kamyon', value: 'truck' },
  { label: 'Çekici', value: 'truck_tractor' },
];

// Form tabs - new.tsx ile aynı
const TABS = [
  { id: 'basic', label: 'Temel Bilgiler', icon: '🚛' },
  { id: 'license', label: 'Ruhsat Bilgileri', icon: '📝' },
  { id: 'tractor', label: 'Çekici Bilgileri', icon: '⚙️' },
  { id: 'trailer', label: 'Römork Bilgileri', icon: '📦' },
  { id: 'ownership', label: 'Sahiplik', icon: '👤' },
];

// Typeface
const VehicleTypeOptions = [
  { label: 'Seçiniz...', value: '' },
  { label: 'Otomobil', value: 'car' },
  { label: 'Kamyon', value: 'truck' },
  { label: 'Çekici', value: 'truck_tractor' },
  { label: 'Römork', value: 'trailer' },
  { label: 'Hafif Kamyon', value: 'light_truck' },
  { label: 'Minibüs', value: 'minibus' },
  { label: 'Otobüs', value: 'bus' },
];

const GearTypeOptions = [
  { label: 'Manuel', value: 'manual' },
  { label: 'Otomatik', value: 'automatic' },
  { label: 'Yarı Otomatik', value: 'semi_automatic' },
];

const DocumentTypeOptions = [
  { label: 'A1', value: 'A1' },
  { label: 'A2', value: 'A2' },
  { label: 'A', value: 'A' },
  { label: 'B1', value: 'B1' },
  { label: 'B', value: 'B' },
  { label: 'C1', value: 'C1' },
  { label: 'C', value: 'C' },
  { label: 'D1', value: 'D1' },
  { label: 'D', value: 'D' },
];

const OwnershipTypeOptions = [
  { label: 'Özmal', value: 'owned' },
  { label: 'Kiralık', value: 'rented' },
];

const StatusOptions = [
  { label: 'Uygun', value: 'available' },
  { label: 'Kullanımda', value: 'in_use' },
  { label: 'Bakımda', value: 'in_maintenance' },
];

const EuroNormOptions = [
  { label: 'Euro 3', value: 'euro_3' },
  { label: 'Euro 4', value: 'euro_4' },
  { label: 'Euro 5', value: 'euro_5' },
  { label: 'Euro 6', value: 'euro_6' },
  { label: 'Euro 6d', value: 'euro_6d' },
  { label: 'Euro 6e', value: 'euro_6e' },
  { label: 'Elektrikli', value: 'electric' },
];

const SideDoorOptions = [
  { label: 'Yok', value: 'none' },
  { label: '4 Kapı', value: '4_doors' },
  { label: '6 Kapı', value: '6_doors' },
  { label: '8 Kapı', value: '8_doors' },
];

export default function VehicleEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = Colors.light;
  const currentYear = new Date().getFullYear();
  const { success, error: showError } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [activeTab, setActiveTab] = useState('basic');
  const formRef = useRef<ScrollView>(null);

  // Form data
  const [formData, setFormData] = useState({
    brand: '',
    plate: '',
    color: '',
    gear_type: 'manual',
    vehicle_type: '',
    vehicle_class: '',
    vehicle_category: '',
    document_type: '',
    model: '',
    commercial_name: '',
    model_year: currentYear,
    ownership_type: 'owned',
    status: 'available',
    total_km: '',
    net_weight: '',
    max_loaded_weight: '',
    first_registration_date: '',
    registration_date: '',
    registration_serial_no: '',
    engine_number: '',
    engine_power: '',
    wheel_formula: '',
    chassis_number: '',
    license_info: '',
    notary_name: '',
    notary_sale_date: '',
    full_name: '',
    company_name: '',
    id_or_tax_no: '',
    address: '',
    euro_norm: '',
    fuel_capacity: '',
    has_gps_tracker: false,
    gps_identity_no: '',
    battery_capacity: '',
    trailer_width: '',
    trailer_length: '',
    trailer_height: '',
    trailer_volume: '',
    side_door_count: '',
    has_xl_certificate: false,
    is_double_deck: false,
    has_p400: false,
    has_sliding_curtain: false,
    is_lightweight: false,
    is_train_compatible: false,
    has_tarpaulin: false,
    has_roller: false,
    has_electronic_scale: false,
    domestic_transport_capable: false,
    domestic_vehicle_class: '',
    is_active: true,
  });

  // Load vehicle data
  useEffect(() => {
    const loadVehicle = async () => {
      if (!id) return;
      try {
        const vehicleData = await getVehicle(parseInt(id, 10));

        // Populate form with existing data
        setFormData({
          brand: vehicleData.brand || '',
          plate: vehicleData.plate || '',
          color: vehicleData.color || '',
          gear_type: vehicleData.gear_type || 'manual',
          vehicle_type: vehicleData.vehicle_type || '',
          vehicle_class: vehicleData.vehicle_class || '',
          vehicle_category: vehicleData.vehicle_category || '',
          document_type: vehicleData.document_type || '',
          model: vehicleData.model || '',
          commercial_name: vehicleData.commercial_name || '',
          model_year: vehicleData.model_year || vehicleData.year || currentYear,
          ownership_type: vehicleData.ownership_type || 'owned',
          status: vehicleData.status || 'available',
          total_km: String(vehicleData.total_km || vehicleData.km_counter || ''),
          net_weight: String(vehicleData.net_weight || ''),
          max_loaded_weight: String(vehicleData.max_loaded_weight || ''),
          first_registration_date: vehicleData.first_registration_date
            ? new Date(vehicleData.first_registration_date).toISOString().split('T')[0]
            : '',
          registration_date: vehicleData.registration_date
            ? new Date(vehicleData.registration_date).toISOString().split('T')[0]
            : '',
          registration_serial_no: vehicleData.registration_serial_no || '',
          engine_number: vehicleData.engine_number || '',
          engine_power: String(vehicleData.engine_power || ''),
          wheel_formula: vehicleData.wheel_formula || '',
          chassis_number: vehicleData.chassis_number || '',
          license_info: vehicleData.license_info || '',
          notary_name: vehicleData.notary_name || '',
          notary_sale_date: vehicleData.notary_sale_date
            ? new Date(vehicleData.notary_sale_date).toISOString().split('T')[0]
            : '',
          full_name: vehicleData.full_name || '',
          company_name: vehicleData.company_name || '',
          id_or_tax_no: vehicleData.id_or_tax_no || '',
          address: vehicleData.address || '',
          euro_norm: vehicleData.euro_norm || '',
          fuel_capacity: String(vehicleData.fuel_capacity || ''),
          has_gps_tracker: vehicleData.has_gps_tracker || false,
          gps_identity_no: vehicleData.gps_identity_no || '',
          battery_capacity: String(vehicleData.battery_capacity || ''),
          trailer_width: String(vehicleData.trailer_width || ''),
          trailer_length: String(vehicleData.trailer_length || ''),
          trailer_height: String(vehicleData.trailer_height || ''),
          trailer_volume: String(vehicleData.trailer_volume || ''),
          side_door_count: vehicleData.side_door_count || '',
          has_xl_certificate: vehicleData.has_xl_certificate || false,
          is_double_deck: vehicleData.is_double_deck || false,
          has_p400: vehicleData.has_p400 || false,
          has_sliding_curtain: vehicleData.has_sliding_curtain || false,
          is_lightweight: vehicleData.is_lightweight || false,
          is_train_compatible: vehicleData.is_train_compatible || false,
          has_tarpaulin: vehicleData.has_tarpaulin || false,
          has_roller: vehicleData.has_roller || false,
          has_electronic_scale: vehicleData.has_electronic_scale || false,
          domestic_transport_capable: vehicleData.domestic_transport_capable || false,
          domestic_vehicle_class: vehicleData.domestic_vehicle_class || '',
          is_active: vehicleData.is_active !== false,
        });
      } catch {
        showError('Hata', 'Araç bilgileri yüklenemedi');
        setTimeout(() => {
          router.back();
        }, 1500);
      } finally {
        setIsLoading(false);
      }
    };

    loadVehicle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleInputChange = useCallback((key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  }, [errors]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string[]> = {};

    if (!formData.brand) {
      newErrors.brand = ['Marka zorunludur.'];
    }
    if (!formData.plate) {
      newErrors.plate = ['Plaka zorunludur.'];
    }
    if (!formData.vehicle_type) {
      newErrors.vehicle_type = ['Araç tipi zorunludur.'];
    }
    if (!formData.color) {
      newErrors.color = ['Renk zorunludur.'];
    }
    if (!formData.gear_type) {
      newErrors.gear_type = ['Vites tipi zorunludur.'];
    }
    if (!formData.document_type) {
      newErrors.document_type = ['Ehliyet sınıfı zorunludur.'];
    }
    if (!formData.ownership_type) {
      newErrors.ownership_type = ['Sahiplik tipi zorunludur.'];
    }
    if (!formData.status) {
      newErrors.status = ['Durum zorunludur.'];
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    if (!id) return;

    setIsSubmitting(true);
    try {
      const data: Record<string, any> = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          data[key] = value;
        }
      });

      await api.put(`/vehicles/${id}`, data);

      success('Başarılı', 'Araç başarıyla güncellendi.');
      router.back();
    } catch (error) {
      const validationErrors = getValidationErrors(error);
      if (validationErrors) {
        setErrors(validationErrors);
      } else {
        showError('Hata', getErrorMessage(error));
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [id, formData, validateForm, success, showError]);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <FullScreenHeader
          title="Araç Düzenle"
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

  const isTruckTractor = formData.vehicle_type === 'truck_tractor';
  const isTrailer = formData.vehicle_type === 'trailer';
  const isElectric = formData.euro_norm === 'electric';

  // Filtered tabs based on vehicle type
  const filteredTabs = TABS.filter((tab) => {
    if (tab.id === 'tractor' && !isTruckTractor) return false;
    if (tab.id === 'trailer' && !isTrailer) return false;
    return true;
  });

  const renderTab = () => {
    switch (activeTab) {
      case 'basic':
        return (
          <>
            <SelectInput
              label="Araç Tipi *"
              options={VehicleTypeOptions}
              selectedValue={formData.vehicle_type}
              onValueChange={(value) => handleInputChange('vehicle_type', value)}
              error={errors.vehicle_type?.[0]}
            />
            <Input
              label="Plaka *"
              placeholder="34 ABC 123"
              value={formData.plate}
              onChangeText={(text) => handleInputChange('plate', text)}
              error={errors.plate?.[0]}
            />
            <Input
              label="Marka *"
              placeholder="Mercedes, Volvo vb."
              value={formData.brand}
              onChangeText={(text) => handleInputChange('brand', text)}
              error={errors.brand?.[0]}
            />
            <Input
              label="Model"
              placeholder="Actros, FH16 vb."
              value={formData.model}
              onChangeText={(text) => handleInputChange('model', text)}
            />
            <Input
              label="Model Yılı"
              placeholder={String(currentYear)}
              value={String(formData.model_year)}
              onChangeText={(text) =>
                handleInputChange('model_year', parseInt(text) || currentYear)
              }
              keyboardType="numeric"
            />
            <Input
              label="Renk *"
              placeholder="Beyaz, Siyah vb."
              value={formData.color}
              onChangeText={(text) => handleInputChange('color', text)}
              error={errors.color?.[0]}
            />
            <Input
              label="Ticari Adı"
              placeholder="Opsiyonel"
              value={formData.commercial_name}
              onChangeText={(text) => handleInputChange('commercial_name', text)}
            />
            <Input
              label="Araç Cinsi"
              placeholder="Opsiyonel"
              value={formData.vehicle_class}
              onChangeText={(text) => handleInputChange('vehicle_class', text)}
            />
            <Input
              label="Araç Sınıfı"
              placeholder="Opsiyonel"
              value={formData.vehicle_category}
              onChangeText={(text) => handleInputChange('vehicle_category', text)}
            />
            <SelectInput
              label="Vites Tipi *"
              options={GearTypeOptions}
              selectedValue={formData.gear_type}
              onValueChange={(value) => handleInputChange('gear_type', value)}
              error={errors.gear_type?.[0]}
            />
            <SelectInput
              label="Ehliyet Sınıfı *"
              options={DocumentTypeOptions}
              selectedValue={formData.document_type}
              onValueChange={(value) => handleInputChange('document_type', value)}
              error={errors.document_type?.[0]}
            />
            <SelectInput
              label="Sahiplik Tipi *"
              options={OwnershipTypeOptions}
              selectedValue={formData.ownership_type}
              onValueChange={(value) => handleInputChange('ownership_type', value)}
              error={errors.ownership_type?.[0]}
            />
            <SelectInput
              label="Durum *"
              options={StatusOptions}
              selectedValue={formData.status}
              onValueChange={(value) => handleInputChange('status', value)}
              error={errors.status?.[0]}
            />
            <Input
              label="Toplam KM"
              placeholder="Opsiyonel"
              value={formData.total_km}
              onChangeText={(text) =>
                handleInputChange('total_km', text.replace(/[^0-9]/g, ''))
              }
              keyboardType="numeric"
            />
            <Input
              label="Net Ağırlık (Kg)"
              placeholder="Opsiyonel"
              value={formData.net_weight}
              onChangeText={(text) =>
                handleInputChange('net_weight', text.replace(/[^0-9]/g, ''))
              }
              keyboardType="numeric"
            />
            <Input
              label="Azami Yüklü Ağırlık (Kg)"
              placeholder="Opsiyonel"
              value={formData.max_loaded_weight}
              onChangeText={(text) =>
                handleInputChange('max_loaded_weight', text.replace(/[^0-9]/g, ''))
              }
              keyboardType="numeric"
            />

            {/* Yurtiçi Taşımacılık */}
            <View style={[styles.switchRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.switchContent}>
                <Text style={[styles.switchLabel, { color: colors.text }]}>
                  Yurtiçi Taşıma Yapabilir
                </Text>
                <Text style={[styles.switchDescription, { color: colors.textSecondary }]}>
                  Bu araç yurtiçi taşımacılık için kullanılabilir
                </Text>
              </View>
              <Checkbox
                value={formData.domestic_transport_capable}
                onValueChange={(val) => {
                  handleInputChange('domestic_transport_capable', val);
                  if (!val) {
                    handleInputChange('domestic_vehicle_class', '');
                  }
                }}
              />
            </View>
            {formData.domestic_transport_capable && (
              <SelectInput
                label="Yurtiçi Araç Sınıfı"
                options={DOMESTIC_VEHICLE_CLASS_OPTIONS}
                selectedValue={formData.domestic_vehicle_class}
                onValueChange={(value) => handleInputChange('domestic_vehicle_class', value)}
              />
            )}
          </>
        );

      case 'license':
        return (
          <>
            <Input
              label="Tescil Sıra No"
              placeholder="Opsiyonel"
              value={formData.registration_serial_no}
              onChangeText={(text) => handleInputChange('registration_serial_no', text)}
            />
            <DateInput
              label="İlk Tescil Tarihi"
              placeholder="Tarih seçiniz"
              value={formData.first_registration_date}
              onChangeText={(text) => handleInputChange('first_registration_date', text)}
            />
            <DateInput
              label="Tescil Tarihi"
              placeholder="Tarih seçiniz"
              value={formData.registration_date}
              onChangeText={(text) => handleInputChange('registration_date', text)}
            />
            <Input
              label="Motor No"
              placeholder="Opsiyonel"
              value={formData.engine_number}
              onChangeText={(text) => handleInputChange('engine_number', text)}
            />
            <Input
              label="Şasi No"
              placeholder="Opsiyonel"
              value={formData.chassis_number}
              onChangeText={(text) => handleInputChange('chassis_number', text)}
            />
            <Input
              label="Motor Gücü (kW)"
              placeholder="Opsiyonel"
              value={formData.engine_power}
              onChangeText={(text) =>
                handleInputChange('engine_power', text.replace(/[^0-9]/g, ''))
              }
              keyboardType="numeric"
            />
            <Input
              label="Tekerlek Düzeni (örn: 4x2, 6x4)"
              placeholder="Opsiyonel"
              value={formData.wheel_formula}
              onChangeText={(text) => handleInputChange('wheel_formula', text)}
            />
            <Input
              label="Ruhsat Notu"
              placeholder="Opsiyonel"
              value={formData.license_info}
              onChangeText={(text) => handleInputChange('license_info', text)}
            />
          </>
        );

      case 'tractor':
        return (
          <>
            <SelectInput
              label="Euro Norm"
              options={EuroNormOptions}
              selectedValue={formData.euro_norm}
              onValueChange={(value) => handleInputChange('euro_norm', value)}
            />
            {isElectric ? (
              <Input
                label="Batarya Kapasitesi (kWh)"
                placeholder="Opsiyonel"
                value={formData.battery_capacity}
                onChangeText={(text) =>
                  handleInputChange('battery_capacity', text.replace(/[^0-9]/g, ''))
                }
                keyboardType="numeric"
              />
            ) : (
              <Input
                label="Yakıt Kapasitesi (L)"
                placeholder="Opsiyonel"
                value={formData.fuel_capacity}
                onChangeText={(text) =>
                  handleInputChange('fuel_capacity', text.replace(/[^0-9]/g, ''))
                }
                keyboardType="numeric"
              />
            )}
            <View
              style={[styles.switchRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[styles.switchLabel, { color: colors.text }]}>GPS Takip</Text>
              <Checkbox
                value={formData.has_gps_tracker}
                onValueChange={(val) => handleInputChange('has_gps_tracker', val)}
              />
            </View>
            {formData.has_gps_tracker && (
              <Input
                label="GPS Kimlik No"
                placeholder="Opsiyonel"
                value={formData.gps_identity_no}
                onChangeText={(text) => handleInputChange('gps_identity_no', text)}
              />
            )}
          </>
        );

      case 'trailer':
        return (
          <>
            <Input
              label="Eni (m)"
              placeholder="Opsiyonel"
              value={formData.trailer_width}
              onChangeText={(text) =>
                handleInputChange('trailer_width', text.replace(/[^0-9.]/g, ''))
              }
              keyboardType="decimal-pad"
            />
            <Input
              label="Boyu (m)"
              placeholder="Opsiyonel"
              value={formData.trailer_length}
              onChangeText={(text) =>
                handleInputChange('trailer_length', text.replace(/[^0-9.]/g, ''))
              }
              keyboardType="decimal-pad"
            />
            <Input
              label="Yüksekliği (m)"
              placeholder="Opsiyonel"
              value={formData.trailer_height}
              onChangeText={(text) =>
                handleInputChange('trailer_height', text.replace(/[^0-9.]/g, ''))
              }
              keyboardType="decimal-pad"
            />
            <Input
              label="Hacmi (m³)"
              placeholder="Opsiyonel"
              value={formData.trailer_volume}
              onChangeText={(text) =>
                handleInputChange('trailer_volume', text.replace(/[^0-9.]/g, ''))
              }
              keyboardType="decimal-pad"
            />
            <SelectInput
              label="Yan Kapak"
              options={SideDoorOptions}
              selectedValue={formData.side_door_count}
              onValueChange={(value) => handleInputChange('side_door_count', value)}
            />
            {[
              { key: 'has_xl_certificate', label: 'XL Sertifikası' },
              { key: 'is_double_deck', label: 'Çift Katlı' },
              { key: 'has_p400', label: 'P400' },
              { key: 'has_sliding_curtain', label: 'Kayar Perde' },
              { key: 'is_lightweight', label: 'Hafif Römork' },
              { key: 'is_train_compatible', label: 'Tren Uyumlu' },
              { key: 'has_tarpaulin', label: 'Brandalı' },
              { key: 'has_roller', label: 'Rulo' },
              { key: 'has_electronic_scale', label: 'Elektronik Kantar' },
            ].map((item) => (
              <View
                key={item.key}
                style={[
                  styles.switchRow,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.switchLabel, { color: colors.text }]}>{item.label}</Text>
                <Checkbox
                  value={(formData as any)[item.key]}
                  onValueChange={(val) => handleInputChange(item.key, val)}
                />
              </View>
            ))}
          </>
        );

      case 'ownership':
        return (
          <>
            <Input
              label="Ad Soyad"
              placeholder="Opsiyonel"
              value={formData.full_name}
              onChangeText={(text) => handleInputChange('full_name', text)}
            />
            <Input
              label="Şirket Adı"
              placeholder="Opsiyonel"
              value={formData.company_name}
              onChangeText={(text) => handleInputChange('company_name', text)}
            />
            <Input
              label="TC/Vergi No"
              placeholder="Opsiyonel"
              value={formData.id_or_tax_no}
              onChangeText={(text) => handleInputChange('id_or_tax_no', text)}
            />
            <Input
              label="Noter Adı"
              placeholder="Opsiyonel"
              value={formData.notary_name}
              onChangeText={(text) => handleInputChange('notary_name', text)}
            />
            <DateInput
              label="Noter Satış Tarihi"
              placeholder="Tarih seçiniz"
              value={formData.notary_sale_date}
              onChangeText={(text) => handleInputChange('notary_sale_date', text)}
            />
            <Input
              label="Adres"
              placeholder="Opsiyonel"
              value={formData.address}
              onChangeText={(text) => handleInputChange('address', text)}
            />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Brand.primary }]}>
      <FullScreenHeader
        title="Araç Düzenle"
        showBackButton
        onBackPress={() => router.back()}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >

        {/* Tabs */}
        <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContent}
          >
            {filteredTabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tab,
                  activeTab === tab.id && { borderBottomColor: Brand.primary },
                ]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Text style={[styles.tabIcon]}>{tab.icon}</Text>
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

        {/* Form Content */}
        <ScrollView
          ref={formRef}
          style={styles.formContainer}
          contentContainerStyle={styles.formContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          <View style={styles.formWrapper}>
            {renderTab()}
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => router.back()}
            disabled={isSubmitting}
          >
            <Text style={[styles.cancelButtonText, { color: colors.text }]}>İptal</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: isSubmitting ? colors.textMuted : Brand.primary },
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Save size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Kaydet</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
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
  tabsContainer: {
    borderBottomWidth: 1,
  },
  tabsContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  tab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    alignItems: 'center',
    minWidth: 80,
  },
  tabIcon: {
    fontSize: 18,
    marginBottom: Spacing.xs,
  },
  tabText: {
    ...Typography.bodySM,
    fontWeight: '500',
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
  },
  formContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['2xl'],
  },
  formWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    ...Shadows.lg,
    overflow: 'hidden',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: Spacing.xs,
  },
  switchContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  switchLabel: {
    ...Typography.bodyMD,
    fontWeight: '500',
  },
  switchDescription: {
    ...Typography.bodySM,
    marginTop: Spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelButtonText: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    ...Typography.bodyMD,
    fontWeight: '600',
  },
});
