/**
 * Yeni Araç Oluşturma Sayfası
 *
 * CLAUDE.md form sayfası standardına uygun modern tasarım
 * FormHeader component kullanır
 */

import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator
} from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { router } from 'expo-router'
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

export default function NewVehicleScreen() {
  const currentYear = new Date().getFullYear()

  const [activeTab, setActiveTab] = useState('basic')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    // Temel Bilgiler
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

    // Ruhsat Bilgileri
    registration_serial_no: '',
    first_registration_date: '',
    registration_date: '',
    engine_number: '',
    engine_power: '',
    wheel_formula: '',
    chassis_number: '',
    license_info: '',

    // Çekici Bilgileri
    euro_norm: '',
    fuel_capacity: '',
    has_gps_tracker: false,
    gps_identity_no: '',
    battery_capacity: '',

    // Römork Bilgileri
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

    // Sahiplik Bilgileri
    full_name: '',
    company_name: '',
    id_or_tax_no: '',
    notary_name: '',
    notary_sale_date: '',
    address: '',

    is_active: true,
  })

  const isTruckTractor = formData.vehicle_type === VEHICLE_TYPES.TRUCK_TRACTOR
  const isTrailer = formData.vehicle_type === VEHICLE_TYPES.TRAILER
  const isElectric = formData.euro_norm === 'electric'

  // Filter tabs based on vehicle type
  const filteredTabs = TABS.filter(tab => {
    if (tab.id === 'tractor' && !isTruckTractor) return false
    if (tab.id === 'trailer' && !isTrailer) return false
    return true
  })

  const handleInputChange = useCallback((key: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [key]: value }

      // Clear error for this field
      if (errors[key]) {
        setErrors(prevErrors => {
          const newErrors = { ...prevErrors }
          delete newErrors[key]
          return newErrors
        })
      }

      // Reset fields when vehicle type changes
      if (key === 'vehicle_type') {
        if (value !== VEHICLE_TYPES.TRUCK_TRACTOR) {
          updated.euro_norm = ''
          updated.fuel_capacity = ''
          updated.has_gps_tracker = false
          updated.gps_identity_no = ''
          updated.battery_capacity = ''
        }
        if (value !== VEHICLE_TYPES.TRAILER) {
          updated.trailer_width = ''
          updated.trailer_length = ''
          updated.trailer_height = ''
          updated.trailer_volume = ''
          updated.side_door_count = ''
          updated.has_xl_certificate = false
          updated.is_double_deck = false
          updated.has_p400 = false
          updated.has_sliding_curtain = false
          updated.is_lightweight = false
          updated.is_train_compatible = false
          updated.has_tarpaulin = false
          updated.has_roller = false
          updated.has_electronic_scale = false
        }
      }

      // Handle electric vehicle
      if (key === 'euro_norm' && value === 'electric') {
        updated.fuel_capacity = ''
      }

      return updated
    })
  }, [errors])

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.vehicle_type) newErrors.vehicle_type = 'Araç tipi zorunludur'
    if (!formData.plate) newErrors.plate = 'Plaka zorunludur'
    if (!formData.brand) newErrors.brand = 'Marka zorunludur'
    if (!formData.model) newErrors.model = 'Model zorunludur'
    if (!formData.model_year) {
      newErrors.model_year = 'Model yılı zorunludur'
    } else {
      const year = parseInt(formData.model_year)
      if (isNaN(year) || year < 1900 || year > currentYear + 1) {
        newErrors.model_year = 'Geçerli bir model yılı giriniz'
      }
    }
    if (!formData.color) newErrors.color = 'Renk zorunludur'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData, currentYear])

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: 'Lütfen formu eksiksiz doldurunuz',
        position: 'top',
        visibilityTime: 1500
      })
      // Switch to tab with errors
      if (errors.vehicle_type || errors.plate || errors.brand || errors.model || errors.model_year || errors.color) {
        setActiveTab('basic')
      }
      return
    }

    setIsSubmitting(true)
    try {
      const data: Record<string, any> = {}
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          if (typeof value === 'boolean') {
            data[key] = value ? '1' : '0'
          } else {
            data[key] = value
          }
        }
      })

      await api.post('/vehicles', data)

      Toast.show({
        type: 'success',
        text1: 'Araç başarıyla oluşturuldu',
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
  }, [formData, validateForm, errors])

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.back()
  }

  // Section Header Component
  const renderSectionHeader = (title: string, icon: keyof typeof Ionicons.glyphMap) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>
        <Ionicons name={icon} size={18} color={DashboardColors.primary} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  )

  // Option chips render
  const renderOptionChips = (
    options: { label: string; value: string }[],
    selectedValue: string,
    onSelect: (value: string) => void
  ) => (
    <View style={styles.chipGroup}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.chip,
            selectedValue === option.value && styles.chipActive
          ]}
          onPress={() => onSelect(option.value)}
        >
          <Text style={[
            styles.chipText,
            selectedValue === option.value && styles.chipTextActive
          ]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )

  // Checkbox render
  const renderCheckbox = (label: string, value: boolean, onChange: (val: boolean) => void) => (
    <TouchableOpacity
      style={styles.checkboxRow}
      onPress={() => onChange(!value)}
    >
      <View style={[styles.checkbox, value && styles.checkboxChecked]}>
        {value && <Ionicons name="checkmark" size={14} color="#fff" />}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
  )

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return (
          <View style={styles.section}>
            {renderSectionHeader('Temel Bilgiler', 'car-sport-outline')}
            <View style={styles.sectionContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Araç Tipi <Text style={styles.required}>*</Text>
                </Text>
                {renderOptionChips(VEHICLE_TYPE_OPTIONS.slice(0, 5), formData.vehicle_type, (v) => handleInputChange('vehicle_type', v))}
                {renderOptionChips(VEHICLE_TYPE_OPTIONS.slice(5), formData.vehicle_type, (v) => handleInputChange('vehicle_type', v))}
                {errors.vehicle_type && <Text style={styles.errorText}>{errors.vehicle_type}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Plaka <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.plate && styles.inputError]}
                  value={formData.plate}
                  onChangeText={(text) => handleInputChange('plate', text.toUpperCase())}
                  placeholder="Örn: 34 ABC 123"
                  placeholderTextColor={DashboardColors.textMuted}
                  autoCapitalize="characters"
                />
                {errors.plate && <Text style={styles.errorText}>{errors.plate}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Marka <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.brand && styles.inputError]}
                  value={formData.brand}
                  onChangeText={(text) => handleInputChange('brand', text)}
                  placeholder="Örn: Mercedes-Benz"
                  placeholderTextColor={DashboardColors.textMuted}
                />
                {errors.brand && <Text style={styles.errorText}>{errors.brand}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Model <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.model && styles.inputError]}
                  value={formData.model}
                  onChangeText={(text) => handleInputChange('model', text)}
                  placeholder="Örn: Actros"
                  placeholderTextColor={DashboardColors.textMuted}
                />
                {errors.model && <Text style={styles.errorText}>{errors.model}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Model Yılı <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.model_year && styles.inputError]}
                  value={formData.model_year}
                  onChangeText={(text) => handleInputChange('model_year', text)}
                  placeholder={String(currentYear)}
                  placeholderTextColor={DashboardColors.textMuted}
                  keyboardType="numeric"
                  maxLength={4}
                />
                {errors.model_year && <Text style={styles.errorText}>{errors.model_year}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Renk <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.color && styles.inputError]}
                  value={formData.color}
                  onChangeText={(text) => handleInputChange('color', text)}
                  placeholder="Örn: Beyaz"
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

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Net Ağırlık (Kg)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.net_weight}
                  onChangeText={(text) => handleInputChange('net_weight', text.replace(/[^0-9]/g, ''))}
                  placeholder="Opsiyonel"
                  placeholderTextColor={DashboardColors.textMuted}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Azami Yüklü Ağırlık (Kg)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.max_loaded_weight}
                  onChangeText={(text) => handleInputChange('max_loaded_weight', text.replace(/[^0-9]/g, ''))}
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <FormHeader
        title="Yeni Araç"
        onBackPress={handleBack}
        onSavePress={handleSubmit}
        isSaving={isSubmitting}
        saveDisabled={!formData.vehicle_type}
      />

      {/* Tabs */}
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
                <Text style={[
                  styles.tabText,
                  { color: isActive ? DashboardColors.primary : DashboardColors.textSecondary }
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {/* Form Content */}
      <KeyboardAwareScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        bottomOffset={20}
      >
        {renderTabContent()}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting || !formData.vehicle_type}
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

  // Tabs
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

  // Content
  content: {
    flex: 1
  },
  contentContainer: {
    padding: DashboardSpacing.lg,
    paddingBottom: DashboardSpacing['3xl']
  },

  // Section
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

  // Input
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

  // Chips
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

  // Checkbox
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

  // Submit
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
  }
})
