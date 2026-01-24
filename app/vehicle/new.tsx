import React, { useState, useCallback, useEffect } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, Save, AlertCircle, Truck, Link2 } from 'lucide-react-native';
import { Input, Card, Badge, Checkbox, DateInput } from '@/components/ui';
import { SelectInput } from '@/components/ui/select-input';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import api from '@/services/api';
import { getErrorMessage, getValidationErrors } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

// Assignment vehicle interface
interface AssignmentVehicle {
  id: number;
  plate: string;
  brand?: string;
  model?: string;
  model_year?: number;
  vehicle_type: string;
}

// Vehicle type constants matching web
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
};

// Document type options
const DOCUMENT_TYPE_OPTIONS = [
  { label: 'A1', value: 'A1' },
  { label: 'A2', value: 'A2' },
  { label: 'A', value: 'A' },
  { label: 'B1', value: 'B1' },
  { label: 'B', value: 'B' },
  { label: 'C1', value: 'C1' },
  { label: 'C', value: 'C' },
  { label: 'D1', value: 'D1' },
  { label: 'D', value: 'D' },
  { label: 'BE', value: 'BE' },
  { label: 'C1E', value: 'C1E' },
  { label: 'CE', value: 'CE' },
  { label: 'D1E', value: 'D1E' },
  { label: 'DE', value: 'DE' },
  { label: 'F', value: 'F' },
  { label: 'G', value: 'G' },
];

// Gear type options
const GEAR_TYPE_OPTIONS = [
  { label: 'Manuel', value: 'manual' },
  { label: 'Otomatik', value: 'automatic' },
];

// Ownership type options
const OWNERSHIP_TYPE_OPTIONS = [
  { label: 'Kiralık', value: 'rented' },
  { label: 'Özmal', value: 'owned' },
];

// Status options
const STATUS_OPTIONS = [
  { label: 'Müsait', value: 'available' },
  { label: 'Kullanımda', value: 'in_use' },
  { label: 'Bakımda', value: 'in_maintenance' },
];

// Vehicle type options
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
];

// Euro norm options
const EURO_NORM_OPTIONS = [
  { label: 'Euro 3', value: 'euro_3' },
  { label: 'Euro 4', value: 'euro_4' },
  { label: 'Euro 5', value: 'euro_5' },
  { label: 'Euro 6', value: 'euro_6' },
  { label: 'Euro 6d', value: 'euro_6d' },
  { label: 'Euro 6e', value: 'euro_6e' },
  { label: 'Elektrikli', value: 'electric' },
];

// Side door options
const SIDE_DOOR_OPTIONS = [
  { label: 'Kapaksız', value: 'none' },
  { label: '4 Kapak', value: '4_doors' },
  { label: '6 Kapak', value: '6_doors' },
  { label: '8 Kapak', value: '8_doors' },
];

// Domestic vehicle class options
const DOMESTIC_VEHICLE_CLASS_OPTIONS = [
  { label: 'Seçiniz...', value: '' },
  { label: 'Panelvan', value: 'panel_van' },
  { label: 'Pikap', value: 'pickup' },
  { label: 'Sprinter', value: 'sprinter' },
  { label: 'Kamyon', value: 'truck' },
  { label: 'Çekici', value: 'truck_tractor' },
];

// Tabs matching web version
const TABS = [
  { id: 'basic', label: 'Temel Bilgiler', icon: '🚛' },
  { id: 'license', label: 'Ruhsat Bilgileri', icon: '📝' },
  { id: 'tractor', label: 'Çekici Bilgileri', icon: '⚙️' },
  { id: 'trailer', label: 'Römork Bilgileri', icon: '📦' },
  { id: 'ownership', label: 'Sahiplik', icon: '👤' },
  { id: 'assignment', label: 'Eşleştirme', icon: '🔗' },
];

export default function NewVehicleScreen() {
  const colors = Colors.light;
  const currentYear = new Date().getFullYear();
  const { success, error } = useToast();

  // Form state
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    // Temel Bilgiler (Basic Information) - Tab 1
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

    // Ruhsat Bilgileri (License Information) - Tab 2
    registration_serial_no: '',
    first_registration_date: '',
    registration_date: '',
    engine_number: '',
    engine_power: '',
    wheel_formula: '',
    chassis_number: '',

    // Çekici Bilgileri (Tractor Information) - Tab 3
    euro_norm: '',
    fuel_capacity: '',
    has_gps_tracker: false,
    gps_identity_no: '',
    battery_capacity: '',

    // Römork Bilgileri (Trailer Information) - Tab 4
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

    // Sahiplik Bilgileri (Ownership Information) - Tab 5
    full_name: '',
    company_name: '',
    id_or_tax_no: '',
    notary_name: '',
    notary_sale_date: '',
    address: '',

    // Eşleştirme (Assignment) - Tab 6
    assignment_vehicle_id: '',

    // Yurtiçi Taşımacılık
    domestic_transport_capable: false,
    domestic_vehicle_class: '',

    // Other
    license_info: '',
    sort_order: '0',
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Assignment vehicles state
  const [tractors, setTractors] = useState<AssignmentVehicle[]>([]);
  const [trailers, setTrailers] = useState<AssignmentVehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  // Load tractors and trailers for assignment
  useEffect(() => {
    const loadAssignmentVehicles = async () => {
      setLoadingVehicles(true);
      try {
        // Load all vehicles and filter
        const response = await api.get('/vehicles', {
          params: { per_page: 1000, is_active: true }
        });

        // Handle response structure safely
        let vehicles = [];
        if (response.data) {
          // If response.data is an array, use it directly
          if (Array.isArray(response.data)) {
            vehicles = response.data;
          }
          // If response.data has a 'data' property (paginated response)
          else if (Array.isArray(response.data.data)) {
            vehicles = response.data.data;
          }
        }

        // Filter tractors (truck_tractor) and trailers
        const tractorList = vehicles.filter((v: AssignmentVehicle) => v.vehicle_type === 'truck_tractor');
        const trailerList = vehicles.filter((v: AssignmentVehicle) => v.vehicle_type === 'trailer');

        setTractors(tractorList);
        setTrailers(trailerList);
      } catch (error) {
        console.error('Failed to load vehicles for assignment:', error);
        // Set empty arrays on error to prevent crashes
        setTractors([]);
        setTrailers([]);
      } finally {
        setLoadingVehicles(false);
      }
    };

    loadAssignmentVehicles();
  }, []);

  // Determine which tabs to show based on vehicle type
  const isTruckTractor = formData.vehicle_type === VEHICLE_TYPES.TRUCK_TRACTOR;
  const isTrailer = formData.vehicle_type === VEHICLE_TYPES.TRAILER;
  const showAssignmentTab = isTruckTractor || isTrailer;

  // Filter tabs based on vehicle type
  const filteredTabs = TABS.filter(tab => {
    if (tab.id === 'tractor' && !isTruckTractor) return false;
    if (tab.id === 'trailer' && !isTrailer) return false;
    if (tab.id === 'assignment' && !showAssignmentTab) return false;
    return true;
  });

  // Field to tab mapping for error counting
  const fieldToTab: Record<string, string> = {
    // Temel Bilgiler
    vehicle_type: 'basic', plate: 'basic', brand: 'basic', model: 'basic',
    model_year: 'basic', color: 'basic', commercial_name: 'basic',
    vehicle_class: 'basic', vehicle_category: 'basic', gear_type: 'basic',
    document_type: 'basic', ownership_type: 'basic', status: 'basic',
    total_km: 'basic', net_weight: 'basic', max_loaded_weight: 'basic',
    domestic_transport_capable: 'basic', domestic_vehicle_class: 'basic',
    // Ruhsat Bilgileri
    registration_serial_no: 'license', first_registration_date: 'license',
    registration_date: 'license', engine_number: 'license',
    engine_power: 'license', wheel_formula: 'license', chassis_number: 'license',
    // Çekici Bilgileri
    euro_norm: 'tractor', fuel_capacity: 'tractor', battery_capacity: 'tractor',
    gps_identity_no: 'tractor', has_gps_tracker: 'tractor',
    // Römork Bilgileri
    trailer_width: 'trailer', trailer_length: 'trailer', trailer_height: 'trailer',
    trailer_volume: 'trailer', side_door_count: 'trailer',
    // Sahiplik Bilgileri
    full_name: 'ownership', company_name: 'ownership', id_or_tax_no: 'ownership',
    notary_name: 'ownership', notary_sale_date: 'ownership', address: 'ownership',
    // Eşleştirme
    assignment_vehicle_id: 'assignment',
  };

  // Count errors per tab
  const getTabErrorCount = useCallback((tabId: string) => {
    return Object.keys(errors).filter(field => fieldToTab[field] === tabId).length;
  }, [errors]);

  // Handle input change
  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Clear error for this field
      if (errors[field]) {
        setErrors(prevErrors => {
          const newErrors = { ...prevErrors };
          delete newErrors[field];
          return newErrors;
        });
      }

      // Reset tractor/trailer specific fields when vehicle type changes
      if (field === 'vehicle_type') {
        if (value !== VEHICLE_TYPES.TRUCK_TRACTOR) {
          updated.euro_norm = '';
          updated.fuel_capacity = '';
          updated.has_gps_tracker = false;
          updated.gps_identity_no = '';
          updated.battery_capacity = '';
        }
        if (value !== VEHICLE_TYPES.TRAILER) {
          updated.trailer_width = '';
          updated.trailer_length = '';
          updated.trailer_height = '';
          updated.trailer_volume = '';
          updated.side_door_count = '';
          updated.has_xl_certificate = false;
          updated.is_double_deck = false;
          updated.has_p400 = false;
          updated.has_sliding_curtain = false;
          updated.is_lightweight = false;
          updated.is_train_compatible = false;
          updated.has_tarpaulin = false;
          updated.has_roller = false;
          updated.has_electronic_scale = false;
        }
        if (value !== VEHICLE_TYPES.TRUCK_TRACTOR && value !== VEHICLE_TYPES.TRAILER) {
          updated.assignment_vehicle_id = '';
        }
      }

      // Handle electric vehicle - hide fuel capacity
      if (field === 'euro_norm' && value === 'electric') {
        updated.fuel_capacity = '';
      }

      return updated;
    });
  }, [errors]);

  // Validation function matching web rules exactly
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    // Required fields validation (matching StoreVehicleRequest)
    if (!formData.vehicle_type) {
      newErrors.vehicle_type = 'Araç tipi zorunludur.';
    }
    if (!formData.plate) {
      newErrors.plate = 'Plaka zorunludur.';
    }
    if (!formData.brand) {
      newErrors.brand = 'Marka zorunludur.';
    }
    if (!formData.model) {
      newErrors.model = 'Model zorunludur.';
    }
    if (!formData.model_year) {
      newErrors.model_year = 'Model yılı zorunludur.';
    } else {
      const year = parseInt(formData.model_year);
      if (isNaN(year)) {
        newErrors.model_year = 'Model yılı sayı olmalıdır.';
      } else if (year < 1900) {
        newErrors.model_year = 'Model yılı 1900\'den küçük olamaz.';
      } else if (year > currentYear + 1) {
        newErrors.model_year = 'Model yılı gelecek yıldan büyük olamaz.';
      }
    }
    if (!formData.color) {
      newErrors.color = 'Renk zorunludur.';
    }
    if (!formData.gear_type) {
      newErrors.gear_type = 'Vites tipi zorunludur.';
    }
    if (!formData.document_type) {
      newErrors.document_type = 'Ehliyet sınıfı zorunludur.';
    }
    if (!formData.ownership_type) {
      newErrors.ownership_type = 'Sahiplik tipi zorunludur.';
    }
    if (!formData.status) {
      newErrors.status = 'Durum zorunludur.';
    }

    // Numeric validations
    if (formData.total_km && isNaN(parseInt(formData.total_km))) {
      newErrors.total_km = 'Toplam km sayı olmalıdır.';
    }
    if (formData.net_weight && isNaN(parseInt(formData.net_weight))) {
      newErrors.net_weight = 'Net ağırlık sayı olmalıdır.';
    }
    if (formData.max_loaded_weight && isNaN(parseInt(formData.max_loaded_weight))) {
      newErrors.max_loaded_weight = 'Azami yüklü ağırlık sayı olmalıdır.';
    }
    if (formData.engine_power && isNaN(parseInt(formData.engine_power))) {
      newErrors.engine_power = 'Motor gücü sayı olmalıdır.';
    }

    // Wheel formula validation
    if (formData.wheel_formula && !/^\d+x\d+$/.test(formData.wheel_formula)) {
      newErrors.wheel_formula = 'Tekerlek düzeni 4x2, 6x4 gibi bir format olmalıdır.';
    }

    // Tractor-specific validations
    if (isTruckTractor) {
      if (formData.fuel_capacity && isNaN(parseInt(formData.fuel_capacity))) {
        newErrors.fuel_capacity = 'Yakıt kapasitesi sayı olmalıdır.';
      }
      if (formData.battery_capacity && isNaN(parseInt(formData.battery_capacity))) {
        newErrors.battery_capacity = 'Batarya kapasitesi sayı olmalıdır.';
      }
    }

    // Trailer-specific validations
    if (isTrailer) {
      if (formData.trailer_width && isNaN(parseFloat(formData.trailer_width))) {
        newErrors.trailer_width = 'Römork eni sayı olmalıdır.';
      }
      if (formData.trailer_length && isNaN(parseFloat(formData.trailer_length))) {
        newErrors.trailer_length = 'Römork boyu sayı olmalıdır.';
      }
      if (formData.trailer_height && isNaN(parseFloat(formData.trailer_height))) {
        newErrors.trailer_height = 'Römork yüksekliği sayı olmalıdır.';
      }
      if (formData.trailer_volume && isNaN(parseFloat(formData.trailer_volume))) {
        newErrors.trailer_volume = 'Römork hacmi sayı olmalıdır.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, isTruckTractor, isTrailer, currentYear]);

  // Submit handler
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      // Find first error and switch to its tab
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        // Determine which tab has the error
        if (['vehicle_type', 'plate', 'brand', 'model', 'model_year', 'color', 'commercial_name', 'vehicle_class', 'vehicle_category', 'gear_type', 'document_type', 'ownership_type', 'status', 'total_km', 'net_weight', 'max_loaded_weight'].includes(firstErrorField)) {
          setActiveTab('basic');
        } else if (['registration_serial_no', 'first_registration_date', 'registration_date', 'engine_number', 'engine_power', 'wheel_formula', 'chassis_number'].includes(firstErrorField)) {
          setActiveTab('license');
        } else if (['euro_norm', 'fuel_capacity', 'has_gps_tracker', 'gps_identity_no', 'battery_capacity'].includes(firstErrorField)) {
          setActiveTab('tractor');
        } else if (['trailer_width', 'trailer_length', 'trailer_height', 'trailer_volume', 'side_door_count', 'has_xl_certificate', 'is_double_deck', 'has_p400', 'has_sliding_curtain', 'is_lightweight', 'is_train_compatible', 'has_tarpaulin', 'has_roller', 'has_electronic_scale'].includes(firstErrorField)) {
          setActiveTab('trailer');
        } else if (['full_name', 'company_name', 'id_or_tax_no', 'notary_name', 'notary_sale_date', 'address'].includes(firstErrorField)) {
          setActiveTab('ownership');
        } else if (['assignment_vehicle_id'].includes(firstErrorField)) {
          setActiveTab('assignment');
        }
      }
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare data - only send non-empty values
      const data: Record<string, any> = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          // Convert boolean strings to actual booleans for checkboxes
          if (typeof value === 'boolean') {
            data[key] = value ? '1' : '0';
          } else {
            data[key] = value;
          }
        }
      });

      // Use mobile API endpoint
      await api.post('/vehicles', data);

      // Success - show toast message and redirect
      success('Başarılı', 'Araç başarıyla oluşturuldu.');
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error: any) {
      const validationErrors = getValidationErrors(error);
      if (validationErrors) {
        // Convert Laravel errors to flat object
        const flatErrors: Record<string, string> = {};
        Object.entries(validationErrors).forEach(([field, messages]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            flatErrors[field] = messages[0];
          }
        });
        setErrors(flatErrors);
        
        // Auto-focus to first error
        const firstErrorField = Object.keys(flatErrors)[0];
        if (firstErrorField) {
          if (['vehicle_type', 'plate', 'brand', 'model', 'model_year', 'color', 'commercial_name', 'vehicle_class', 'vehicle_category', 'gear_type', 'document_type', 'ownership_type', 'status', 'total_km', 'net_weight', 'max_loaded_weight'].includes(firstErrorField)) {
            setActiveTab('basic');
          } else if (['registration_serial_no', 'first_registration_date', 'registration_date', 'engine_number', 'engine_power', 'wheel_formula', 'chassis_number'].includes(firstErrorField)) {
            setActiveTab('license');
          } else if (['euro_norm', 'fuel_capacity', 'has_gps_tracker', 'gps_identity_no', 'battery_capacity'].includes(firstErrorField)) {
            setActiveTab('tractor');
          } else if (['trailer_width', 'trailer_length', 'trailer_height', 'trailer_volume', 'side_door_count', 'has_xl_certificate', 'is_double_deck', 'has_p400', 'has_sliding_curtain', 'is_lightweight', 'is_train_compatible', 'has_tarpaulin', 'has_roller', 'has_electronic_scale'].includes(firstErrorField)) {
            setActiveTab('trailer');
          } else if (['full_name', 'company_name', 'id_or_tax_no', 'notary_name', 'notary_sale_date', 'address'].includes(firstErrorField)) {
            setActiveTab('ownership');
          } else if (['assignment_vehicle_id'].includes(firstErrorField)) {
            setActiveTab('assignment');
          }
        }
      } else {
        error('Hata', getErrorMessage(error));
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, errors]);

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return (
          <>
            <SelectInput
              label="Araç Tipi *"
              options={VEHICLE_TYPE_OPTIONS}
              selectedValue={formData.vehicle_type}
              onValueChange={(value) => handleInputChange('vehicle_type', value)}
              error={errors.vehicle_type}
            />
            <Input
              label="Plaka *"
              placeholder="Örn: 34 ABC 123"
              value={formData.plate}
              onChangeText={(text) => handleInputChange('plate', text.toUpperCase())}
              error={errors.plate}
              autoCapitalize="characters"
            />
            <Input
              label="Marka *"
              placeholder="Örn: Mercedes-Benz"
              value={formData.brand}
              onChangeText={(text) => handleInputChange('brand', text)}
              error={errors.brand}
            />
            <Input
              label="Model *"
              placeholder="Örn: Actros"
              value={formData.model}
              onChangeText={(text) => handleInputChange('model', text)}
              error={errors.model}
            />
            <Input
              label="Model Yılı *"
              placeholder={String(currentYear)}
              value={formData.model_year}
              onChangeText={(text) => handleInputChange('model_year', text)}
              error={errors.model_year}
              keyboardType="numeric"
              maxLength={4}
            />
            <Input
              label="Renk *"
              placeholder="Örn: Beyaz"
              value={formData.color}
              onChangeText={(text) => handleInputChange('color', text)}
              error={errors.color}
            />
            <Input
              label="Ticari Adı"
              placeholder="Opsiyonel"
              value={formData.commercial_name}
              onChangeText={(text) => handleInputChange('commercial_name', text)}
              error={errors.commercial_name}
            />
            <Input
              label="Araç Cinsi"
              placeholder="Opsiyonel"
              value={formData.vehicle_class}
              onChangeText={(text) => handleInputChange('vehicle_class', text)}
              error={errors.vehicle_class}
            />
            <Input
              label="Araç Sınıfı"
              placeholder="Opsiyonel"
              value={formData.vehicle_category}
              onChangeText={(text) => handleInputChange('vehicle_category', text)}
              error={errors.vehicle_category}
            />
            <SelectInput
              label="Vites Tipi *"
              options={GEAR_TYPE_OPTIONS}
              selectedValue={formData.gear_type}
              onValueChange={(value) => handleInputChange('gear_type', value)}
              error={errors.gear_type}
            />
            <SelectInput
              label="Ehliyet Sınıfı *"
              options={DOCUMENT_TYPE_OPTIONS}
              selectedValue={formData.document_type}
              onValueChange={(value) => handleInputChange('document_type', value)}
              error={errors.document_type}
            />
            <SelectInput
              label="Sahiplik Tipi *"
              options={OWNERSHIP_TYPE_OPTIONS}
              selectedValue={formData.ownership_type}
              onValueChange={(value) => handleInputChange('ownership_type', value)}
              error={errors.ownership_type}
            />
            <SelectInput
              label="Durum *"
              options={STATUS_OPTIONS}
              selectedValue={formData.status}
              onValueChange={(value) => handleInputChange('status', value)}
              error={errors.status}
            />
            <Input
              label="Toplam KM"
              placeholder="Opsiyonel"
              value={formData.total_km}
              onChangeText={(text) => handleInputChange('total_km', text.replace(/[^0-9]/g, ''))}
              error={errors.total_km}
              keyboardType="numeric"
            />
            <Input
              label="Net Ağırlık (Kg)"
              placeholder="Opsiyonel"
              value={formData.net_weight}
              onChangeText={(text) => handleInputChange('net_weight', text.replace(/[^0-9]/g, ''))}
              error={errors.net_weight}
              keyboardType="numeric"
            />
            <Input
              label="Azami Yüklü Ağırlık (Kg)"
              placeholder="Opsiyonel"
              value={formData.max_loaded_weight}
              onChangeText={(text) => handleInputChange('max_loaded_weight', text.replace(/[^0-9]/g, ''))}
              error={errors.max_loaded_weight}
              keyboardType="numeric"
            />

            {/* Yurtiçi Taşımacılık Bölümü */}
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
                error={errors.domestic_vehicle_class}
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
              error={errors.registration_serial_no}
            />
            <DateInput
              label="İlk Tescil Tarihi"
              placeholder="Tarih seçiniz"
              value={formData.first_registration_date}
              onChangeText={(text) => handleInputChange('first_registration_date', text)}
              error={errors.first_registration_date}
            />
            <DateInput
              label="Tescil Tarihi"
              placeholder="Tarih seçiniz"
              value={formData.registration_date}
              onChangeText={(text) => handleInputChange('registration_date', text)}
              error={errors.registration_date}
            />
            <Input
              label="Motor Numarası"
              placeholder="Opsiyonel"
              value={formData.engine_number}
              onChangeText={(text) => handleInputChange('engine_number', text)}
              error={errors.engine_number}
            />
            <Input
              label="Motor Gücü (kW)"
              placeholder="Opsiyonel"
              value={formData.engine_power}
              onChangeText={(text) => handleInputChange('engine_power', text.replace(/[^0-9]/g, ''))}
              error={errors.engine_power}
              keyboardType="numeric"
            />
            <Input
              label="Tekerlek Düzeni"
              placeholder="Örn: 4x2, 6x4"
              value={formData.wheel_formula}
              onChangeText={(text) => handleInputChange('wheel_formula', text)}
              error={errors.wheel_formula}
            />
            <Input
              label="Şasi Numarası"
              placeholder="Opsiyonel"
              value={formData.chassis_number}
              onChangeText={(text) => handleInputChange('chassis_number', text)}
              error={errors.chassis_number}
            />
          </>
        );

      case 'tractor':
        if (!isTruckTractor) return null;
        return (
          <>
            <SelectInput
              label="Euro Norm"
              options={EURO_NORM_OPTIONS}
              selectedValue={formData.euro_norm}
              onValueChange={(value) => handleInputChange('euro_norm', value)}
              error={errors.euro_norm}
            />
            {formData.euro_norm !== 'electric' && (
              <Input
                label="Yakıt Kapasitesi (Lt)"
                placeholder="Opsiyonel"
                value={formData.fuel_capacity}
                onChangeText={(text) => handleInputChange('fuel_capacity', text.replace(/[^0-9]/g, ''))}
                error={errors.fuel_capacity}
                keyboardType="numeric"
              />
            )}
            {formData.euro_norm === 'electric' && (
              <Input
                label="Batarya Kapasitesi (kWh)"
                placeholder="Opsiyonel"
                value={formData.battery_capacity}
                onChangeText={(text) => handleInputChange('battery_capacity', text.replace(/[^0-9]/g, ''))}
                error={errors.battery_capacity}
                keyboardType="numeric"
              />
            )}
            <View style={styles.checkboxRow}>
              <Checkbox
                value={formData.has_gps_tracker}
                onValueChange={(val) => handleInputChange('has_gps_tracker', val)}
              />
              <Text style={[styles.checkboxRowLabel, { color: Colors.light.text }]}>
                Uydu Takip Cihazı Var
              </Text>
            </View>
            <Input
              label="Uydu Kimlik No"
              placeholder="Opsiyonel"
              value={formData.gps_identity_no}
              onChangeText={(text) => handleInputChange('gps_identity_no', text)}
              error={errors.gps_identity_no}
            />
          </>
        );

      case 'trailer':
        if (!isTrailer) return null;
        return (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Boyut Bilgileri</Text>
            <Input
              label="En (m)"
              placeholder="Örn: 2.5"
              value={formData.trailer_width}
              onChangeText={(text) => handleInputChange('trailer_width', text)}
              error={errors.trailer_width}
              keyboardType="decimal-pad"
            />
            <Input
              label="Boy (m)"
              placeholder="Örn: 13.6"
              value={formData.trailer_length}
              onChangeText={(text) => handleInputChange('trailer_length', text)}
              error={errors.trailer_length}
              keyboardType="decimal-pad"
            />
            <Input
              label="Yükseklik (m)"
              placeholder="Örn: 3.0"
              value={formData.trailer_height}
              onChangeText={(text) => handleInputChange('trailer_height', text)}
              error={errors.trailer_height}
              keyboardType="decimal-pad"
            />
            <Input
              label="Hacim (m³)"
              placeholder="Örn: 90.0"
              value={formData.trailer_volume}
              onChangeText={(text) => handleInputChange('trailer_volume', text)}
              error={errors.trailer_volume}
              keyboardType="decimal-pad"
            />
            <SelectInput
              label="Yan Kapak"
              options={SIDE_DOOR_OPTIONS}
              selectedValue={formData.side_door_count}
              onValueChange={(value) => handleInputChange('side_door_count', value)}
              error={errors.side_door_count}
            />

            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: Spacing.lg }]}>Özellikler</Text>
            {[
              { key: 'has_xl_certificate', label: 'XL Sertifikası' },
              { key: 'is_double_deck', label: 'Çift Katlı' },
              { key: 'has_p400', label: 'P400 (Tren Taşımacılığı)' },
              { key: 'has_sliding_curtain', label: 'Kayar Perde' },
              { key: 'is_lightweight', label: 'Hafif Römork' },
              { key: 'is_train_compatible', label: 'Tren Uyumlu' },
              { key: 'has_tarpaulin', label: 'Brandalı' },
              { key: 'has_roller', label: 'Rulo Sistemi' },
              { key: 'has_electronic_scale', label: 'Elektronik Kantar' },
            ].map(({ key, label }) => (
              <View key={key} style={styles.checkboxRow}>
                <Checkbox
                  value={!!formData[key as keyof typeof formData]}
                  onValueChange={(val) => handleInputChange(key, val)}
                />
                <Text style={[styles.checkboxRowLabel, { color: Colors.light.text }]}>
                  {label}
                </Text>
              </View>
            ))}
          </>
        );

      case 'ownership':
        return (
          <>
            <Input
              label="Sahibinin Adı Soyadı"
              placeholder="Opsiyonel"
              value={formData.full_name}
              onChangeText={(text) => handleInputChange('full_name', text)}
              error={errors.full_name}
            />
            <Input
              label="Firma Adı"
              placeholder="Opsiyonel"
              value={formData.company_name}
              onChangeText={(text) => handleInputChange('company_name', text)}
              error={errors.company_name}
            />
            <Input
              label="TC/Vergi No"
              placeholder="Opsiyonel"
              value={formData.id_or_tax_no}
              onChangeText={(text) => handleInputChange('id_or_tax_no', text)}
              error={errors.id_or_tax_no}
              keyboardType="numeric"
            />
            <Input
              label="Noter Adı"
              placeholder="Opsiyonel"
              value={formData.notary_name}
              onChangeText={(text) => handleInputChange('notary_name', text)}
              error={errors.notary_name}
            />
            <DateInput
              label="Noter Satış Tarihi"
              placeholder="Tarih seçiniz"
              value={formData.notary_sale_date}
              onChangeText={(text) => handleInputChange('notary_sale_date', text)}
              error={errors.notary_sale_date}
            />
            <Input
              label="Adres"
              placeholder="Opsiyonel"
              value={formData.address}
              onChangeText={(text) => handleInputChange('address', text)}
              error={errors.address}
              multiline
              numberOfLines={3}
            />
          </>
        );

      case 'assignment':
        if (!showAssignmentTab) return null;

        // Prepare options for assignment select
        const assignmentOptions = isTruckTractor
          ? [
              { label: 'Römork seçiniz...', value: '' },
              ...trailers.map(v => ({
                label: `${v.plate} - ${v.brand || ''} ${v.model || ''}`.trim(),
                value: String(v.id),
              })),
            ]
          : [
              { label: 'Çekici seçiniz...', value: '' },
              ...tractors.map(v => ({
                label: `${v.plate} - ${v.brand || ''} ${v.model || ''}`.trim(),
                value: String(v.id),
              })),
            ];

        return (
          <>
            <View style={styles.infoBox}>
              <Link2 size={16} color={Brand.primary} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                {isTruckTractor
                  ? 'Bu çekiciye eşleştirilecek römorku seçin. Eşleştirme işlemi araç kaydedildikten sonra yapılır.'
                  : 'Bu römorka eşleştirilecek çekiciyi seçin. Eşleştirme işlemi araç kaydedildikten sonra yapılır.'}
              </Text>
            </View>

            {loadingVehicles ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Brand.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Araçlar yükleniyor...
                </Text>
              </View>
            ) : (
              <SelectInput
                label={isTruckTractor ? 'Eşleştirilecek Römork' : 'Eşleştirilecek Çekici'}
                options={assignmentOptions}
                selectedValue={formData.assignment_vehicle_id}
                onValueChange={(value) => handleInputChange('assignment_vehicle_id', value)}
                error={errors.assignment_vehicle_id}
              />
            )}

            {/* Display current assignment count */}
            {!loadingVehicles && (
              <View style={[styles.statsBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.statItem}>
                  <Truck size={20} color={Brand.primary} />
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {isTruckTractor ? trailers.length : tractors.length}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    {isTruckTractor ? 'Mevcut Römork' : 'Mevcut Çekici'}
                  </Text>
                </View>
              </View>
            )}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Yeni Araç Ekle</Text>
          <TouchableOpacity 
            onPress={handleSubmit} 
            style={styles.headerButton} 
            disabled={isSubmitting || !formData.vehicle_type}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={Brand.primary} />
            ) : (
              <Save size={22} color={formData.vehicle_type ? Brand.primary : colors.textMuted} />
            )}
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContent}
          >
            {filteredTabs.map((tab) => {
              const errorCount = getTabErrorCount(tab.id);
              const isActive = activeTab === tab.id;

              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.tab,
                    isActive && { borderBottomColor: Brand.primary },
                  ]}
                  onPress={() => setActiveTab(tab.id)}
                >
                  <View style={styles.tabHeader}>
                    <Text style={[styles.tabIcon]}>{tab.icon}</Text>
                    {errorCount > 0 && (
                      <View style={styles.errorBadge}>
                        <Text style={styles.errorBadgeText}>{errorCount}</Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.tabText,
                      { color: isActive ? Brand.primary : colors.textSecondary },
                      errorCount > 0 && { color: '#DC2626' },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Form Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
        >
          <Card style={styles.card}>
            {renderTabContent()}
          </Card>

          {/* Hidden fields that are not editable */}
          <View style={{ display: 'none' }}>
            <Input
              value={formData.license_info}
              onChangeText={(text) => handleInputChange('license_info', text)}
            />
            <Input
              value={formData.sort_order}
              onChangeText={(text) => handleInputChange('sort_order', text)}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  headerTitle: {
    ...Typography.headingLG,
    flex: 1,
    marginLeft: Spacing.sm,
  },
  headerButton: {
    padding: Spacing.sm,
  },
  tabsContainer: {
    borderBottomWidth: 1,
  },
  tabsContent: {
    paddingHorizontal: Spacing.sm,
  },
  tab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    alignItems: 'center',
    minWidth: 80,
  },
  tabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  tabIcon: {
    fontSize: 18,
  },
  tabText: {
    ...Typography.bodySM,
    fontWeight: '500',
    textAlign: 'center',
  },
  errorBadge: {
    backgroundColor: '#DC2626',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  errorBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
  },
  card: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  sectionTitle: {
    ...Typography.headingMD,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  checkboxRowLabel: {
    ...Typography.bodyMD,
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Brand.primary + '15',
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  infoText: {
    ...Typography.bodySM,
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  loadingText: {
    ...Typography.bodySM,
  },
  statsBox: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.md,
  },
  statItem: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statValue: {
    ...Typography.headingLG,
    fontWeight: '600',
  },
  statLabel: {
    ...Typography.bodySM,
  },
});
