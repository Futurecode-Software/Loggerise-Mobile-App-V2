/**
 * New Load Screen - 6 Step Wizard
 *
 * Web versiyonu ile %100 uyumlu - Müşteri/Firma seçimleri, fiyatlandırma kalemleri
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, Brand, Shadows } from '@/constants/theme';
import { FullScreenHeader } from '@/components/header/FullScreenHeader';
import { useToast } from '@/hooks/use-toast';
import LoadFormProgress from '@/components/load-form/LoadFormProgress';
import LoadFormNavigation from '@/components/load-form/LoadFormNavigation';
import Step1BasicInfo from '@/components/load-form/Step1BasicInfo';
import Step2LoadItems, { type LoadItem } from '@/components/load-form/Step2LoadItems';
import Step3Addresses, { type LoadAddress } from '@/components/load-form/Step3Addresses';
import Step4Pricing, { type LoadPricingItem } from '@/components/load-form/Step4Pricing';
import Step5InvoiceDeclaration from '@/components/load-form/Step5InvoiceDeclaration';
import Step6CustomsDocuments from '@/components/load-form/Step6CustomsDocuments';
import { createLoad, type LoadFormData } from '@/services/endpoints/loads';
import api from '@/services/api';

// SelectOption tipi
interface SelectOption {
  label: string;
  value: number;
  subtitle?: string;
}

const STEPS = [
  { id: 1, title: 'Temel Bilgiler', description: 'Yük hakkında temel bilgiler' },
  { id: 2, title: 'Yük Kalemleri', description: 'Yük kalemlerini ekleyin' },
  { id: 3, title: 'Adresler', description: 'Alış ve teslim adresleri' },
  { id: 4, title: 'Fiyatlandırma', description: 'Navlun fiyatlandırması' },
  { id: 5, title: 'Beyanname ve Fatura', description: 'Gümrük ve fatura bilgileri' },
  { id: 6, title: 'Gümrük ve Belgeler', description: 'GTIP, ATR ve belge durumları' },
];

// Default load item
const getDefaultLoadItem = (): LoadItem => ({
  cargo_name: '',
  cargo_name_foreign: '',
  package_type: '',
  package_count: 0,
  piece_count: 0,
  gross_weight: '0',
  net_weight: '0',
  volumetric_weight: '0',
  lademetre_weight: '0',
  total_chargeable_weight: '0',
  width: '0',
  height: '0',
  length: '0',
  volume: '0',
  lademetre: '0',
  is_stackable: false,
  stackable_rows: null,
  is_hazardous: false,
  hazmat_un_no: '',
  hazmat_class: '',
  hazmat_page_no: '',
  hazmat_packing_group: '',
  hazmat_flash_point: '0',
  hazmat_description: '',
});

export default function NewLoadScreen() {
  const colors = Colors.light;
  const params = useLocalSearchParams<{ direction?: string }>();
  const { success, error: showError } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data state
  const [formData, setFormData] = useState<LoadFormData>({
    direction: (params.direction as 'import' | 'export') || undefined,
    is_active: true,
    publish_to_pool: false,
    estimated_value_currency: 'TRY',
  });

  // Items state - ayrı state olarak yönetmek daha performanslı
  const [items, setItems] = useState<LoadItem[]>([getDefaultLoadItem()]);
  const [addresses, setAddresses] = useState<LoadAddress[]>([]);
  const [pricingItems, setPricingItems] = useState<LoadPricingItem[]>([]);

  // Firma seçim state'leri
  const [selectedCustomer, setSelectedCustomer] = useState<SelectOption | null>(null);
  const [selectedSender, setSelectedSender] = useState<SelectOption | null>(null);
  const [selectedManufacturer, setSelectedManufacturer] = useState<SelectOption | null>(null);
  const [selectedReceiver, setSelectedReceiver] = useState<SelectOption | null>(null);

  // Hata state'i
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form data güncelleme
  const updateFormData = useCallback((field: keyof LoadFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Hata temizle
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  // Müşteri seçim handler'ı
  const handleCustomerChange = useCallback(
    async (option: SelectOption | null) => {
      setSelectedCustomer(option);
      updateFormData('customer_id', option?.value);
    },
    [updateFormData]
  );

  // Gönderici firma seçim handler'ı
  const handleSenderChange = useCallback(
    async (option: SelectOption | null) => {
      setSelectedSender(option);
      updateFormData('sender_company_id', option?.value);
    },
    [updateFormData]
  );

  // Üretici firma seçim handler'ı
  const handleManufacturerChange = useCallback(
    async (option: SelectOption | null) => {
      setSelectedManufacturer(option);
      updateFormData('manufacturer_company_id', option?.value);
    },
    [updateFormData]
  );

  // Alıcı firma seçim handler'ı
  const handleReceiverChange = useCallback(
    async (option: SelectOption | null) => {
      setSelectedReceiver(option);
      updateFormData('receiver_company_id', option?.value);
    },
    [updateFormData]
  );

  // Validation
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.direction) {
        newErrors.direction = 'Yük yönü zorunludur';
      }
      if (!formData.loading_type) {
        newErrors.loading_type = 'Yükleme tipi zorunludur';
      }
      if (!formData.transport_speed) {
        newErrors.transport_speed = 'Taşıma hızı zorunludur';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        showError('Hata', 'Lütfen zorunlu alanları doldurunuz');
        return false;
      }
    }

    if (step === 2) {
      if (items.length === 0) {
        showError('Hata', 'En az bir yük kalemi eklemelisiniz');
        return false;
      }

      // Mal adı kontrolü
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.cargo_name || !item.cargo_name.trim()) {
          showError('Hata', `Kalem #${i + 1}: Mal adı zorunludur`);
          return false;
        }
      }

      // Tehlikeli madde kontrolü
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.is_hazardous) {
          if (!item.hazmat_un_no || !item.hazmat_un_no.trim()) {
            showError('Hata', `Kalem #${i + 1}: Tehlikeli madde için UN No zorunludur`);
            return false;
          }
          if (!item.hazmat_class || !item.hazmat_class.trim()) {
            showError('Hata', `Kalem #${i + 1}: Tehlikeli madde için Sınıf zorunludur`);
            return false;
          }
        }
      }
    }

    if (step === 3) {
      if (addresses.length < 2) {
        showError('Hata', 'Alış ve teslim adreslerini ekleyiniz');
        return false;
      }

      const pickupAddress = addresses.find((a) => a.type === 'pickup');
      const deliveryAddress = addresses.find((a) => a.type === 'delivery');

      if (!pickupAddress?.pickup_type) {
        showError('Hata', 'Teslim alma tipi seçiniz');
        return false;
      }
      if (!deliveryAddress?.delivery_type) {
        showError('Hata', 'Teslim etme tipi seçiniz');
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleStepClick = (stepId: number) => {
    // Önceki adımları validate et
    for (let i = 1; i < stepId; i++) {
      if (!validateStep(i)) {
        return;
      }
    }
    setCurrentStep(stepId);
  };

  const handleSubmit = async () => {
    // Tüm adımları validate et
    for (let step = 1; step <= 3; step++) {
      if (!validateStep(step)) {
        setCurrentStep(step);
        return;
      }
    }

    // Form verilerini hazırla - empty strings'leri null'a çevir
    const cleanedFormData = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => [
        key,
        value === '' ? null : value,
      ])
    ) as LoadFormData;

    const submitData: LoadFormData = {
      ...cleanedFormData,
      items: items.map((item) => ({
        cargo_name: item.cargo_name,
        cargo_name_foreign: item.cargo_name_foreign,
        package_type: item.package_type,
        package_count: item.package_count,
        piece_count: item.piece_count,
        gross_weight: parseFloat(item.gross_weight) || 0,
        net_weight: parseFloat(item.net_weight) || 0,
        volumetric_weight: parseFloat(item.volumetric_weight) || 0,
        lademetre_weight: parseFloat(item.lademetre_weight) || 0,
        total_chargeable_weight: parseFloat(item.total_chargeable_weight) || 0,
        width: parseFloat(item.width) || 0,
        height: parseFloat(item.height) || 0,
        length: parseFloat(item.length) || 0,
        volume: parseFloat(item.volume) || 0,
        lademetre: parseFloat(item.lademetre) || 0,
        is_stackable: item.is_stackable,
        stackable_rows: item.stackable_rows,
        is_hazardous: item.is_hazardous,
        hazmat_un_no: item.hazmat_un_no,
        hazmat_class: item.hazmat_class,
        hazmat_page_no: item.hazmat_page_no,
        hazmat_packing_group: item.hazmat_packing_group,
        hazmat_flash_point: item.hazmat_flash_point,
        hazmat_description: item.hazmat_description,
      })) as LoadFormData['items'],
      addresses: addresses as LoadFormData['addresses'],
      // Clean pricing items - remove nested 'product' object and convert values
      pricing_items: pricingItems.map((pItem) => ({
        product_id: pItem.product_id || null,
        description: pItem.description || '',
        quantity: parseFloat(pItem.quantity as string) || 1,
        unit: pItem.unit || 'NIU',
        unit_price: parseFloat(pItem.unit_price as string) || 0,
        currency: pItem.currency || 'TRY',
        exchange_rate: parseFloat(pItem.exchange_rate as string) || 1,
        vat_rate: parseFloat(pItem.vat_rate as string) || 0,
        vat_amount: parseFloat(pItem.vat_amount as string) || 0,
        discount_rate: parseFloat(pItem.discount_rate as string) || 0,
        discount_amount: parseFloat(pItem.discount_amount as string) || 0,
        sub_total: parseFloat(pItem.sub_total as string) || 0,
        total: parseFloat(pItem.total as string) || 0,
        sort_order: pItem.sort_order || 0,
        is_active: pItem.is_active !== false,
      })) as unknown as LoadFormData['pricing_items'],
    };

    try {
      setIsSubmitting(true);
      const response = await createLoad(submitData);

      if (response) {
        success('Başarılı', 'Yük başarıyla oluşturuldu');
        router.back();
      }
    } catch (error: any) {
      console.error('Load creation error:', error);
      showError('Hata', error?.message || 'Yük oluşturulamadı');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1BasicInfo
            data={formData}
            updateFormData={updateFormData}
            errors={errors}
            selectedCustomer={selectedCustomer}
            selectedSender={selectedSender}
            selectedManufacturer={selectedManufacturer}
            selectedReceiver={selectedReceiver}
            onCustomerChange={handleCustomerChange}
            onSenderChange={handleSenderChange}
            onManufacturerChange={handleManufacturerChange}
            onReceiverChange={handleReceiverChange}
            isDirectionLocked={!!params.direction}
          />
        );
      case 2:
        return <Step2LoadItems items={items} setItems={setItems} />;
      case 3:
        return <Step3Addresses addresses={addresses} setAddresses={setAddresses} />;
      case 4:
        return <Step4Pricing items={pricingItems} setItems={setPricingItems} />;
      case 5:
        return <Step5InvoiceDeclaration data={formData} updateFormData={updateFormData} />;
      case 6:
        return <Step6CustomsDocuments data={formData} updateFormData={updateFormData} />;
      default:
        return null;
    }
  };

  const headerTitle = formData.direction === 'export'
    ? 'Yeni İhracat Yükü'
    : formData.direction === 'import'
      ? 'Yeni İthalat Yükü'
      : 'Yeni Yük Ekle';

  return (
    <View style={styles.container}>
      <FullScreenHeader
        title={headerTitle}
        subtitle={`Adım ${currentStep} / ${STEPS.length}: ${STEPS[currentStep - 1].description}`}
        showBackButton
        onBackPress={() => router.back()}
      />

      <View style={styles.contentCard}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {/* Progress Steps */}
          <LoadFormProgress steps={STEPS} currentStep={currentStep} onStepClick={handleStepClick} />

          {/* Form Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {renderStep()}
          </ScrollView>

          {/* Navigation Buttons */}
          <LoadFormNavigation
            currentStep={currentStep}
            totalSteps={STEPS.length}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.primary,
  },
  contentCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
});
