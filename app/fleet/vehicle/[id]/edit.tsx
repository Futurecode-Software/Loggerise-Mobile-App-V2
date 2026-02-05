/**
 * Araç Düzenleme Sayfası
 *
 * CLAUDE.md form sayfası standardına uygun modern tasarım
 * FormHeader component kullanır
 */

import React, { useState, useCallback, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput
} from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import Toast from 'react-native-toast-message'
import { FormHeader } from '@/components/navigation/FormHeader'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius,
  DashboardShadows
} from '@/constants/dashboard-theme'
import api, { getErrorMessage, getValidationErrors } from '@/services/api'
import { getVehicle } from '@/services/endpoints/vehicles'

// Vehicle type constants
const VEHICLE_TYPES = {
  TRAILER: 'trailer',
  CAR: 'car',
  MINIBUS: 'minibus',
  BUS: 'bus',
  LIGHT_TRUCK: 'light_truck',
  TRUCK: 'truck',
  TRUCK_TRACTOR: 'truck_tractor',
  TRACTOR: 'tractor',
  MOTORCYCLE: 'motorcycle',
  CONSTRUCTION_MACHINE: 'construction_machine',
}

// Options
const VEHICLE_TYPE_OPTIONS = [
  { label: 'Çekici', value: VEHICLE_TYPES.TRUCK_TRACTOR },
  { label: 'Römork', value: VEHICLE_TYPES.TRAILER },
  { label: 'Kamyon', value: VEHICLE_TYPES.TRUCK },
  { label: 'Hafif Kamyon', value: VEHICLE_TYPES.LIGHT_TRUCK },
  { label: 'Otomobil', value: VEHICLE_TYPES.CAR },
  { label: 'Minibüs', value: VEHICLE_TYPES.MINIBUS },
  { label: 'Otobüs', value: VEHICLE_TYPES.BUS },
  { label: 'Traktör', value: VEHICLE_TYPES.TRACTOR },
  { label: 'Motosiklet', value: VEHICLE_TYPES.MOTORCYCLE },
  { label: 'İş Makinesi', value: VEHICLE_TYPES.CONSTRUCTION_MACHINE },
]

const GEAR_TYPE_OPTIONS = [
  { label: 'Manuel', value: 'manual' },
  { label: 'Otomatik', value: 'automatic' },
]

const OWNERSHIP_TYPE_OPTIONS = [
  { label: 'Özmal', value: 'owned' },
  { label: 'Kiralık', value: 'rented' },
]

const STATUS_OPTIONS = [
  { label: 'Müsait', value: 'available' },
  { label: 'Kullanımda', value: 'in_use' },
  { label: 'Bakımda', value: 'in_maintenance' },
]

const EURO_NORM_OPTIONS = [
  { label: 'Euro 3', value: 'euro_3' },
  { label: 'Euro 4', value: 'euro_4' },
  { label: 'Euro 5', value: 'euro_5' },
  { label: 'Euro 6', value: 'euro_6' },
  { label: 'Euro 6d', value: 'euro_6d' },
  { label: 'Euro 6e', value: 'euro_6e' },
  { label: 'Elektrikli', value: 'electric' },
]

const SIDE_DOOR_OPTIONS = [
  { label: 'Kapaksız', value: 'none' },
  { label: '4 Kapak', value: '4_doors' },
  { label: '6 Kapak', value: '6_doors' },
  { label: '8 Kapak', value: '8_doors' },
]

// Tabs
const TABS = [
  { id: 'basic', label: 'Temel Bilgiler', icon: 'car-sport-outline' as keyof typeof Ionicons.glyphMap },
  { id: 'license', label: 'Ruhsat Bilgileri', icon: 'document-text-outline' as keyof typeof Ionicons.glyphMap },
  { id: 'tractor', label: 'Çekici Bilgileri', icon: 'settings-outline' as keyof typeof Ionicons.glyphMap },
  { id: 'trailer', label: 'Römork Bilgileri', icon: 'cube-outline' as keyof typeof Ionicons.glyphMap },
  { id: 'ownership', label: 'Sahiplik', icon: 'person-outline' as keyof typeof Ionicons.glyphMap },
]

export default function EditVehicleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const currentYear = new Date().getFullYear()

  const [activeTab, setActiveTab] = useState('basic')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    vehicle_type: '',
    plate: '',
    brand: '',
    model: '',
    model_year: String(currentYear),
    color: '',
    commercial_name: '',
    vehicle_class: '',
    vehicle_category: '',
    gear_type: 'manual',
    document_type: 'B',
    ownership_type: 'owned',
    status: 'available',
    total_km: '',
    net_weight: '',
    max_loaded_weight: '',
    domestic_transport_capable: false,
    domestic_vehicle_class: '',
    registration_serial_no: '',
    first_registration_date: '',
    registration_date: '',
    engine_number: '',
    engine_power: '',
    wheel_formula: '',
    chassis_number: '',
    license_info: '',
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
    full_name: '',
    company_name: '',
    id_or_tax_no: '',
    notary_name: '',
    notary_sale_date: '',
    address: '',
    is_active: true,
  })

  // Load vehicle data
  useEffect(() => {
    const loadVehicle = async () => {
      if (!id) return
      try {
        const vehicleData = await getVehicle(parseInt(id, 10))

        setFormData({
          vehicle_type: vehicleData.vehicle_type || '',
          plate: vehicleData.plate || '',
          brand: vehicleData.brand || '',
          model: vehicleData.model || '',
          model_year: String(vehicleData.model_year || vehicleData.year || currentYear),
          color: vehicleData.color || '',
          commercial_name: vehicleData.commercial_name || '',
          vehicle_class: vehicleData.vehicle_class || '',
          vehicle_category: vehicleData.vehicle_category || '',
          gear_type: vehicleData.gear_type || 'manual',
          document_type: vehicleData.document_type || 'B',
          ownership_type: vehicleData.ownership_type || 'owned',
          status: vehicleData.status || 'available',
          total_km: String(vehicleData.total_km || vehicleData.km_counter || ''),
          net_weight: String(vehicleData.net_weight || ''),
          max_loaded_weight: String(vehicleData.max_loaded_weight || ''),
          domestic_transport_capable: vehicleData.domestic_transport_capable || false,
          domestic_vehicle_class: vehicleData.domestic_vehicle_class || '',
          registration_serial_no: vehicleData.registration_serial_no || '',
          first_registration_date: vehicleData.first_registration_date || '',
          registration_date: vehicleData.registration_date || '',
          engine_number: vehicleData.engine_number || '',
          engine_power: String(vehicleData.engine_power || ''),
          wheel_formula: vehicleData.wheel_formula || '',
          chassis_number: vehicleData.chassis_number || '',
          license_info: vehicleData.license_info || '',
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
          full_name: vehicleData.full_name || '',
          company_name: vehicleData.company_name || '',
          id_or_tax_no: vehicleData.id_or_tax_no || '',
          notary_name: vehicleData.notary_name || '',
          notary_sale_date: vehicleData.notary_sale_date || '',
          address: vehicleData.address || '',
          is_active: vehicleData.is_active !== false,
        })
      } catch {
        Toast.show({
          type: 'error',
          text1: 'Araç bilgileri yüklenemedi',
          position: 'top',
          visibilityTime: 1500
        })
        setTimeout(() => router.back(), 1500)
      } finally {
        setIsLoading(false)
      }
    }

    loadVehicle()
  }, [id])

  const isTruckTractor = formData.vehicle_type === VEHICLE_TYPES.TRUCK_TRACTOR
  const isTrailer = formData.vehicle_type === VEHICLE_TYPES.TRAILER
  const isElectric = formData.euro_norm === 'electric'

  const filteredTabs = TABS.filter(tab => {
    if (tab.id === 'tractor' && !isTruckTractor) return false
    if (tab.id === 'trailer' && !isTrailer) return false
    return true
  })

  const handleInputChange = useCallback((key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[key]
        return newErrors
      })
    }
  }, [errors])

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.vehicle_type) newErrors.vehicle_type = 'Araç tipi zorunludur'
    if (!formData.plate) newErrors.plate = 'Plaka zorunludur'
    if (!formData.brand) newErrors.brand = 'Marka zorunludur'
    if (!formData.color) newErrors.color = 'Renk zorunludur'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: 'Lütfen zorunlu alanları doldurunuz',
        position: 'top',
        visibilityTime: 1500
      })
      return
    }

    if (!id) return

    setIsSubmitting(true)
    try {
      const data: Record<string, any> = {}
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          data[key] = value
        }
      })

      await api.put(`/vehicles/${id}`, data)

      Toast.show({
        type: 'success',
        text1: 'Araç başarıyla güncellendi',
        position: 'top',
        visibilityTime: 1500
      })
      router.back()
    } catch (error: any) {
      const validationErrors = getValidationErrors(error)
      if (validationErrors) {
        const flatErrors: Record<string, string> = {}
        Object.entries(validationErrors).forEach(([field, messages]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            flatErrors[field] = messages[0]
          }
        })
        setErrors(flatErrors)
      } else {
        Toast.show({
          type: 'error',
          text1: getErrorMessage(error),
          position: 'top',
          visibilityTime: 1500
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [id, formData, validateForm])

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.back()
  }

  const renderSectionHeader = (title: string, icon: keyof typeof Ionicons.glyphMap) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>
        <Ionicons name={icon} size={18} color={DashboardColors.primary} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  )

  const renderOptionChips = (
    options: { label: string; value: string }[],
    selectedValue: string,
    onSelect: (value: string) => void
  ) => (
    <View style={styles.chipGroup}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[styles.chip, selectedValue === option.value && styles.chipActive]}
          onPress={() => onSelect(option.value)}
        >
          <Text style={[styles.chipText, selectedValue === option.value && styles.chipTextActive]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )

  const renderCheckbox = (label: string, value: boolean, onChange: (val: boolean) => void) => (
    <TouchableOpacity style={styles.checkboxRow} onPress={() => onChange(!value)}>
      <View style={[styles.checkbox, value && styles.checkboxChecked]}>
        {value && <Ionicons name="checkmark" size={14} color="#fff" />}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return (
          <View style={styles.section}>
            {renderSectionHeader('Temel Bilgiler', 'car-sport-outline')}
            <View style={styles.sectionContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Araç Tipi <Text style={styles.required}>*</Text></Text>
                {renderOptionChips(VEHICLE_TYPE_OPTIONS.slice(0, 5), formData.vehicle_type, (v) => handleInputChange('vehicle_type', v))}
                {renderOptionChips(VEHICLE_TYPE_OPTIONS.slice(5), formData.vehicle_type, (v) => handleInputChange('vehicle_type', v))}
                {errors.vehicle_type && <Text style={styles.errorText}>{errors.vehicle_type}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Plaka <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[styles.input, errors.plate && styles.inputError]}
                  value={formData.plate}
                  onChangeText={(text) => handleInputChange('plate', text.toUpperCase())}
                  placeholder="34 ABC 123"
                  placeholderTextColor={DashboardColors.textMuted}
                  autoCapitalize="characters"
                />
                {errors.plate && <Text style={styles.errorText}>{errors.plate}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Marka <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[styles.input, errors.brand && styles.inputError]}
                  value={formData.brand}
                  onChangeText={(text) => handleInputChange('brand', text)}
                  placeholder="Mercedes, Volvo vb."
                  placeholderTextColor={DashboardColors.textMuted}
                />
                {errors.brand && <Text style={styles.errorText}>{errors.brand}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Model</Text>
                <TextInput
                  style={styles.input}
                  value={formData.model}
                  onChangeText={(text) => handleInputChange('model', text)}
                  placeholder="Actros, FH16 vb."
                  placeholderTextColor={DashboardColors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Model Yılı</Text>
                <TextInput
                  style={styles.input}
                  value={formData.model_year}
                  onChangeText={(text) => handleInputChange('model_year', text)}
                  placeholder={String(currentYear)}
                  placeholderTextColor={DashboardColors.textMuted}
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Renk <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[styles.input, errors.color && styles.inputError]}
                  value={formData.color}
                  onChangeText={(text) => handleInputChange('color', text)}
                  placeholder="Beyaz, Siyah vb."
                  placeholderTextColor={DashboardColors.textMuted}
                />
                {errors.color && <Text style={styles.errorText}>{errors.color}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Vites Tipi</Text>
                {renderOptionChips(GEAR_TYPE_OPTIONS, formData.gear_type, (v) => handleInputChange('gear_type', v))}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Sahiplik Tipi</Text>
                {renderOptionChips(OWNERSHIP_TYPE_OPTIONS, formData.ownership_type, (v) => handleInputChange('ownership_type', v))}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Durum</Text>
                {renderOptionChips(STATUS_OPTIONS, formData.status, (v) => handleInputChange('status', v))}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Toplam KM</Text>
                <TextInput
                  style={styles.input}
                  value={formData.total_km}
                  onChangeText={(text) => handleInputChange('total_km', text.replace(/[^0-9]/g, ''))}
                  placeholder="Opsiyonel"
                  placeholderTextColor={DashboardColors.textMuted}
                  keyboardType="numeric"
                />
              </View>

              {renderCheckbox('Yurtiçi Taşıma Yapabilir', formData.domestic_transport_capable, (v) => handleInputChange('domestic_transport_capable', v))}
            </View>
          </View>
        )

      case 'license':
        return (
          <View style={styles.section}>
            {renderSectionHeader('Ruhsat Bilgileri', 'document-text-outline')}
            <View style={styles.sectionContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tescil Sıra No</Text>
                <TextInput
                  style={styles.input}
                  value={formData.registration_serial_no}
                  onChangeText={(text) => handleInputChange('registration_serial_no', text)}
                  placeholder="Opsiyonel"
                  placeholderTextColor={DashboardColors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Motor Numarası</Text>
                <TextInput
                  style={styles.input}
                  value={formData.engine_number}
                  onChangeText={(text) => handleInputChange('engine_number', text)}
                  placeholder="Opsiyonel"
                  placeholderTextColor={DashboardColors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Motor Gücü (kW)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.engine_power}
                  onChangeText={(text) => handleInputChange('engine_power', text.replace(/[^0-9]/g, ''))}
                  placeholder="Opsiyonel"
                  placeholderTextColor={DashboardColors.textMuted}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tekerlek Düzeni</Text>
                <TextInput
                  style={styles.input}
                  value={formData.wheel_formula}
                  onChangeText={(text) => handleInputChange('wheel_formula', text)}
                  placeholder="Örn: 4x2, 6x4"
                  placeholderTextColor={DashboardColors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Şasi Numarası</Text>
                <TextInput
                  style={styles.input}
                  value={formData.chassis_number}
                  onChangeText={(text) => handleInputChange('chassis_number', text)}
                  placeholder="Opsiyonel"
                  placeholderTextColor={DashboardColors.textMuted}
                />
              </View>
            </View>
          </View>
        )

      case 'tractor':
        if (!isTruckTractor) return null
        return (
          <View style={styles.section}>
            {renderSectionHeader('Çekici Bilgileri', 'settings-outline')}
            <View style={styles.sectionContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Euro Norm</Text>
                {renderOptionChips(EURO_NORM_OPTIONS.slice(0, 4), formData.euro_norm, (v) => handleInputChange('euro_norm', v))}
                {renderOptionChips(EURO_NORM_OPTIONS.slice(4), formData.euro_norm, (v) => handleInputChange('euro_norm', v))}
              </View>

              {!isElectric && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Yakıt Kapasitesi (Lt)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.fuel_capacity}
                    onChangeText={(text) => handleInputChange('fuel_capacity', text.replace(/[^0-9]/g, ''))}
                    placeholder="Opsiyonel"
                    placeholderTextColor={DashboardColors.textMuted}
                    keyboardType="numeric"
                  />
                </View>
              )}

              {isElectric && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Batarya Kapasitesi (kWh)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.battery_capacity}
                    onChangeText={(text) => handleInputChange('battery_capacity', text.replace(/[^0-9]/g, ''))}
                    placeholder="Opsiyonel"
                    placeholderTextColor={DashboardColors.textMuted}
                    keyboardType="numeric"
                  />
                </View>
              )}

              {renderCheckbox('Uydu Takip Cihazı Var', formData.has_gps_tracker, (v) => handleInputChange('has_gps_tracker', v))}

              {formData.has_gps_tracker && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Uydu Kimlik No</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.gps_identity_no}
                    onChangeText={(text) => handleInputChange('gps_identity_no', text)}
                    placeholder="Opsiyonel"
                    placeholderTextColor={DashboardColors.textMuted}
                  />
                </View>
              )}
            </View>
          </View>
        )

      case 'trailer':
        if (!isTrailer) return null
        return (
          <View style={styles.section}>
            {renderSectionHeader('Römork Bilgileri', 'cube-outline')}
            <View style={styles.sectionContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>En (m)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.trailer_width}
                  onChangeText={(text) => handleInputChange('trailer_width', text)}
                  placeholder="Örn: 2.5"
                  placeholderTextColor={DashboardColors.textMuted}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Boy (m)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.trailer_length}
                  onChangeText={(text) => handleInputChange('trailer_length', text)}
                  placeholder="Örn: 13.6"
                  placeholderTextColor={DashboardColors.textMuted}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Yükseklik (m)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.trailer_height}
                  onChangeText={(text) => handleInputChange('trailer_height', text)}
                  placeholder="Örn: 3.0"
                  placeholderTextColor={DashboardColors.textMuted}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Hacim (m³)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.trailer_volume}
                  onChangeText={(text) => handleInputChange('trailer_volume', text)}
                  placeholder="Örn: 90.0"
                  placeholderTextColor={DashboardColors.textMuted}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Yan Kapak</Text>
                {renderOptionChips(SIDE_DOOR_OPTIONS, formData.side_door_count, (v) => handleInputChange('side_door_count', v))}
              </View>

              <View style={styles.checkboxGroup}>
                {renderCheckbox('XL Sertifikası', formData.has_xl_certificate, (v) => handleInputChange('has_xl_certificate', v))}
                {renderCheckbox('Çift Katlı', formData.is_double_deck, (v) => handleInputChange('is_double_deck', v))}
                {renderCheckbox('P400', formData.has_p400, (v) => handleInputChange('has_p400', v))}
                {renderCheckbox('Kayar Perde', formData.has_sliding_curtain, (v) => handleInputChange('has_sliding_curtain', v))}
                {renderCheckbox('Hafif Römork', formData.is_lightweight, (v) => handleInputChange('is_lightweight', v))}
                {renderCheckbox('Tren Uyumlu', formData.is_train_compatible, (v) => handleInputChange('is_train_compatible', v))}
                {renderCheckbox('Brandalı', formData.has_tarpaulin, (v) => handleInputChange('has_tarpaulin', v))}
                {renderCheckbox('Rulo Sistemi', formData.has_roller, (v) => handleInputChange('has_roller', v))}
                {renderCheckbox('Elektronik Kantar', formData.has_electronic_scale, (v) => handleInputChange('has_electronic_scale', v))}
              </View>
            </View>
          </View>
        )

      case 'ownership':
        return (
          <View style={styles.section}>
            {renderSectionHeader('Sahiplik Bilgileri', 'person-outline')}
            <View style={styles.sectionContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Sahibinin Adı Soyadı</Text>
                <TextInput
                  style={styles.input}
                  value={formData.full_name}
                  onChangeText={(text) => handleInputChange('full_name', text)}
                  placeholder="Opsiyonel"
                  placeholderTextColor={DashboardColors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Firma Adı</Text>
                <TextInput
                  style={styles.input}
                  value={formData.company_name}
                  onChangeText={(text) => handleInputChange('company_name', text)}
                  placeholder="Opsiyonel"
                  placeholderTextColor={DashboardColors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>TC/Vergi No</Text>
                <TextInput
                  style={styles.input}
                  value={formData.id_or_tax_no}
                  onChangeText={(text) => handleInputChange('id_or_tax_no', text)}
                  placeholder="Opsiyonel"
                  placeholderTextColor={DashboardColors.textMuted}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Noter Adı</Text>
                <TextInput
                  style={styles.input}
                  value={formData.notary_name}
                  onChangeText={(text) => handleInputChange('notary_name', text)}
                  placeholder="Opsiyonel"
                  placeholderTextColor={DashboardColors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Adres</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.address}
                  onChangeText={(text) => handleInputChange('address', text)}
                  placeholder="Opsiyonel"
                  placeholderTextColor={DashboardColors.textMuted}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>
        )

      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <FormHeader
          title="Araç Düzenle"
          onBackPress={handleBack}
          onSavePress={() => {}}
          saveDisabled
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DashboardColors.primary} />
          <Text style={styles.loadingText}>Araç bilgileri yükleniyor...</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <FormHeader
        title="Araç Düzenle"
        onBackPress={handleBack}
        onSavePress={handleSubmit}
        isSaving={isSubmitting}
      />

      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {filteredTabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => {
                  Haptics.selectionAsync()
                  setActiveTab(tab.id)
                }}
              >
                <Ionicons
                  name={tab.icon}
                  size={18}
                  color={isActive ? DashboardColors.primary : DashboardColors.textMuted}
                />
                <Text style={[styles.tabText, { color: isActive ? DashboardColors.primary : DashboardColors.textSecondary }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      <KeyboardAwareScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        bottomOffset={20}
      >
        {renderTabContent()}

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
              <Text style={styles.submitButtonText}>Kaydet</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: DashboardSpacing['2xl'] }} />
      </KeyboardAwareScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DashboardColors.background
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight,
    backgroundColor: DashboardColors.surface
  },
  tabsContent: {
    paddingHorizontal: DashboardSpacing.md,
    gap: DashboardSpacing.xs
  },
  tab: {
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    alignItems: 'center',
    flexDirection: 'row',
    gap: DashboardSpacing.xs
  },
  tabActive: {
    borderBottomColor: DashboardColors.primary
  },
  tabText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500'
  },
  content: {
    flex: 1
  },
  contentContainer: {
    padding: DashboardSpacing.lg,
    paddingBottom: DashboardSpacing['3xl']
  },
  section: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    marginBottom: DashboardSpacing.lg,
    overflow: 'hidden',
    ...DashboardShadows.sm
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DashboardSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight,
    gap: DashboardSpacing.sm
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: DashboardBorderRadius.lg,
    backgroundColor: DashboardColors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sectionTitle: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '600',
    color: DashboardColors.textPrimary
  },
  sectionContent: {
    padding: DashboardSpacing.lg,
    gap: DashboardSpacing.md
  },
  inputGroup: {
    marginBottom: DashboardSpacing.sm
  },
  inputLabel: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: DashboardColors.textSecondary,
    marginBottom: DashboardSpacing.xs
  },
  required: {
    color: DashboardColors.danger
  },
  input: {
    backgroundColor: DashboardColors.background,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight,
    borderRadius: DashboardBorderRadius.lg,
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.md,
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textPrimary,
    minHeight: 48
  },
  inputError: {
    borderColor: DashboardColors.danger
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top'
  },
  errorText: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.danger,
    marginTop: DashboardSpacing.xs
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DashboardSpacing.xs,
    marginTop: DashboardSpacing.xs
  },
  chip: {
    paddingVertical: DashboardSpacing.xs,
    paddingHorizontal: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.full,
    backgroundColor: DashboardColors.background,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight
  },
  chipActive: {
    backgroundColor: DashboardColors.primary,
    borderColor: DashboardColors.primary
  },
  chipText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: DashboardColors.textSecondary
  },
  chipTextActive: {
    color: '#fff'
  },
  checkboxGroup: {
    gap: DashboardSpacing.sm
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    paddingVertical: DashboardSpacing.xs
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: DashboardBorderRadius.sm,
    borderWidth: 2,
    borderColor: DashboardColors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkboxChecked: {
    backgroundColor: DashboardColors.primary,
    borderColor: DashboardColors.primary
  },
  checkboxLabel: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textPrimary
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DashboardSpacing.sm,
    backgroundColor: DashboardColors.primary,
    paddingVertical: DashboardSpacing.lg,
    borderRadius: DashboardBorderRadius.xl,
    ...DashboardShadows.md
  },
  submitButtonDisabled: {
    opacity: 0.6
  },
  submitButtonText: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: '#fff'
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: DashboardSpacing.md
  },
  loadingText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary
  }
})
