/**
 * New Domestic Transport Order Screen
 *
 * Create new domestic transport order with customer, addresses, and items.
 */

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
import { router } from 'expo-router';
import { Save, Package, User, MapPin, Calendar, FileText } from 'lucide-react-native';
import { Input, Card, DateInput } from '@/components/ui';
import { SelectInput } from '@/components/ui/select-input';
import { FullScreenHeader } from '@/components/header';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage, getValidationErrors } from '@/services/api';
import {
  createDomesticOrder,
  DomesticOrderType,
  DomesticBillingType,
} from '@/services/endpoints/domestic-orders';
import api from '@/services/api';

// Order type options
const ORDER_TYPE_OPTIONS = [
  { label: 'Sipariş tipi seçiniz...', value: '' },
  { label: 'Ön Taşıma', value: 'pre_carriage' },
  { label: 'Dağıtım', value: 'distribution' },
  { label: 'Şehir İçi Teslimat', value: 'city_delivery' },
  { label: 'Depo Transferi', value: 'warehouse_transfer' },
];

// Billing type options
const BILLING_TYPE_OPTIONS = [
  { label: 'Faturalama tipi seçiniz...', value: '' },
  { label: 'Ana Faturaya Dahil', value: 'included_in_main' },
  { label: 'Ayrı Fatura', value: 'separate_invoice' },
  { label: 'Masraf Merkezi', value: 'cost_center' },
];

// Tabs
const TABS = [
  { id: 'general', label: 'Genel', icon: '📋' },
  { id: 'addresses', label: 'Adresler', icon: '📍' },
  { id: 'items', label: 'Kalemler', icon: '📦' },
];

interface Customer {
  id: number;
  name: string;
  code?: string;
}

interface Address {
  id: number;
  title?: string;
  address?: string;
  contact_id: number;
}

export default function NewDomesticOrderScreen() {
  const colors = Colors.light;
  const { success, error: showError } = useToast();

  const [activeTab, setActiveTab] = useState('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Data for selects
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    order_type: '' as DomesticOrderType | '',
    billing_type: '' as DomesticBillingType | '',
    customer_id: '',
    pickup_address_id: '',
    delivery_address_id: '',
    pickup_expected_date: '',
    delivery_expected_date: '',
    notes: '',
    // Items will be added later
  });

  // Load customers
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const response = await api.get('/contacts', {
          params: { per_page: 100, is_active: true, type: 'customer' },
        });

        let customerList: Customer[] = [];
        if (response.data?.data?.contacts) {
          customerList = response.data.data.contacts;
        } else if (Array.isArray(response.data?.data)) {
          customerList = response.data.data;
        } else if (Array.isArray(response.data)) {
          customerList = response.data;
        }

        setCustomers(customerList);
      } catch (err) {
        console.error('Failed to load customers:', err);
      } finally {
        setLoadingCustomers(false);
      }
    };

    loadCustomers();
  }, []);

  // Load addresses when customer changes
  useEffect(() => {
    if (!formData.customer_id) {
      setAddresses([]);
      return;
    }

    const loadAddresses = async () => {
      try {
        const response = await api.get(`/contacts/${formData.customer_id}/addresses`);

        let addressList: Address[] = [];
        if (response.data?.data?.addresses) {
          addressList = response.data.data.addresses;
        } else if (Array.isArray(response.data?.data)) {
          addressList = response.data.data;
        } else if (Array.isArray(response.data)) {
          addressList = response.data;
        }

        setAddresses(addressList);
      } catch (err) {
        console.error('Failed to load addresses:', err);
        setAddresses([]);
      }
    };

    loadAddresses();
  }, [formData.customer_id]);

  // Handle input change
  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field
    if (errors[field]) {
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // Validate form
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.order_type) {
      newErrors.order_type = 'Sipariş tipi zorunludur';
    }
    if (!formData.customer_id) {
      newErrors.customer_id = 'Müşteri seçimi zorunludur';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Submit form
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      // Switch to tab with first error
      if (errors.order_type || errors.customer_id || errors.billing_type) {
        setActiveTab('general');
      } else if (errors.pickup_address_id || errors.delivery_address_id) {
        setActiveTab('addresses');
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const data: Record<string, any> = {};

      // Only send non-empty values
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          data[key] = value;
        }
      });

      // Set default status
      data.status = 'draft';

      await createDomesticOrder(data);

      success('Başarılı', 'İş emri oluşturuldu');
      setTimeout(() => {
        router.back();
      }, 1000);
    } catch (err: any) {
      const validationErrors = getValidationErrors(err);
      if (validationErrors) {
        const flatErrors: Record<string, string> = {};
        Object.entries(validationErrors).forEach(([field, messages]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            flatErrors[field] = messages[0];
          }
        });
        setErrors(flatErrors);
      } else {
        showError('Hata', getErrorMessage(err));
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, errors]);

  // Count errors per tab
  const getTabErrorCount = useCallback((tabId: string) => {
    const tabFields: Record<string, string[]> = {
      general: ['order_type', 'billing_type', 'customer_id', 'pickup_expected_date', 'delivery_expected_date', 'notes'],
      addresses: ['pickup_address_id', 'delivery_address_id'],
      items: [],
    };

    return Object.keys(errors).filter((field) => tabFields[tabId]?.includes(field)).length;
  }, [errors]);

  // Customer options for select
  const customerOptions = [
    { label: 'Müşteri seçiniz...', value: '' },
    ...customers.map((c) => ({
      label: c.code ? `${c.name} (${c.code})` : c.name,
      value: String(c.id),
    })),
  ];

  // Address options for select
  const addressOptions = [
    { label: 'Adres seçiniz...', value: '' },
    ...addresses.map((a) => ({
      label: a.title || a.address || `Adres ${a.id}`,
      value: String(a.id),
    })),
  ];

  const renderGeneralTab = () => (
    <>
      <SelectInput
        label="Sipariş Tipi *"
        options={ORDER_TYPE_OPTIONS}
        selectedValue={formData.order_type}
        onValueChange={(value) => handleInputChange('order_type', value)}
        error={errors.order_type}
      />

      <SelectInput
        label="Faturalama Tipi"
        options={BILLING_TYPE_OPTIONS}
        selectedValue={formData.billing_type}
        onValueChange={(value) => handleInputChange('billing_type', value)}
        error={errors.billing_type}
      />

      {loadingCustomers ? (
        <View style={styles.loadingSelect}>
          <ActivityIndicator size="small" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Müşteriler yükleniyor...</Text>
        </View>
      ) : (
        <SelectInput
          label="Müşteri *"
          options={customerOptions}
          selectedValue={formData.customer_id}
          onValueChange={(value) => handleInputChange('customer_id', value)}
          error={errors.customer_id}
        />
      )}

      <DateInput
        label="Planlanan Alım Tarihi"
        placeholder="Tarih seçiniz"
        value={formData.pickup_expected_date}
        onChangeText={(text) => handleInputChange('pickup_expected_date', text)}
        error={errors.pickup_expected_date}
      />

      <DateInput
        label="Planlanan Teslimat Tarihi"
        placeholder="Tarih seçiniz"
        value={formData.delivery_expected_date}
        onChangeText={(text) => handleInputChange('delivery_expected_date', text)}
        error={errors.delivery_expected_date}
      />

      <Input
        label="Notlar"
        placeholder="Sipariş ile ilgili notlar..."
        value={formData.notes}
        onChangeText={(text) => handleInputChange('notes', text)}
        error={errors.notes}
        multiline
        numberOfLines={3}
      />
    </>
  );

  const renderAddressesTab = () => (
    <>
      {!formData.customer_id ? (
        <View style={styles.warningBox}>
          <Text style={[styles.warningText, { color: colors.textMuted }]}>
            Adres seçimi için önce müşteri seçmeniz gerekmektedir.
          </Text>
        </View>
      ) : addresses.length === 0 ? (
        <View style={styles.warningBox}>
          <Text style={[styles.warningText, { color: colors.textMuted }]}>
            Bu müşteriye tanımlı adres bulunmamaktadır.
          </Text>
        </View>
      ) : (
        <>
          <SelectInput
            label="Alım Adresi"
            options={addressOptions}
            selectedValue={formData.pickup_address_id}
            onValueChange={(value) => handleInputChange('pickup_address_id', value)}
            error={errors.pickup_address_id}
          />

          <SelectInput
            label="Teslimat Adresi"
            options={addressOptions}
            selectedValue={formData.delivery_address_id}
            onValueChange={(value) => handleInputChange('delivery_address_id', value)}
            error={errors.delivery_address_id}
          />
        </>
      )}
    </>
  );

  const renderItemsTab = () => (
    <View style={styles.emptyItems}>
      <Package size={48} color={colors.textMuted} />
      <Text style={[styles.emptyItemsText, { color: colors.textMuted }]}>
        Kalemler sipariş oluşturulduktan sonra eklenebilir.
      </Text>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralTab();
      case 'addresses':
        return renderAddressesTab();
      case 'items':
        return renderItemsTab();
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FullScreenHeader
        title="Yeni İş Emri"
        showBackButton
        onBackPress={() => router.back()}
        rightIcons={
          <TouchableOpacity
            onPress={handleSubmit}
            style={styles.headerButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Save size={22} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Tabs */}
        <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContent}
          >
            {TABS.map((tab) => {
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
                    <Text style={styles.tabIcon}>{tab.icon}</Text>
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
        >
          <Card style={styles.card}>
            {renderTabContent()}
          </Card>
        </ScrollView>
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
  loadingSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  loadingText: {
    ...Typography.bodySM,
  },
  warningBox: {
    padding: Spacing.lg,
    backgroundColor: '#f5a623' + '15',
    borderRadius: BorderRadius.md,
  },
  warningText: {
    ...Typography.bodyMD,
    textAlign: 'center',
  },
  emptyItems: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
  },
  emptyItemsText: {
    ...Typography.bodyMD,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
});
