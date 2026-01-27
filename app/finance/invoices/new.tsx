import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import {
  Save,
  Plus,
  Trash2,
  Package,
  Calculator,
  User,
  Building,
  Calendar,
  DollarSign,
  ChevronDown,
} from 'lucide-react-native';
import { FullScreenHeader } from '@/components/header';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import { showToast } from '@/utils/toast';
import {
  createInvoice,
  InvoiceFormData,
  InvoiceType,
  InvoiceStatus,
  PaymentStatus,
  CurrencyType,
  InvoiceItem,
} from '@/services/endpoints/invoices';
import { Contact, getContacts, ContactAddress, getContactAddresses } from '@/services/endpoints/contacts';
import { Warehouse, getWarehouses } from '@/services/endpoints/warehouses';
import { Product, getProducts } from '@/services/endpoints/products';
import { getLatestExchangeRate } from '@/services/endpoints/exchange-rates';
import {
  SearchableSelectModal,
  SearchableSelectModalRef,
  SelectOption,
} from '@/components/modals';

// Type picker options
const INVOICE_TYPES: Array<{ value: InvoiceType; label: string }> = [
  { value: 'sale', label: 'Satış Faturası' },
  { value: 'purchase', label: 'Alış Faturası' },
  { value: 'service', label: 'Hizmet Faturası' },
];

// Status picker options
const STATUS_OPTIONS: Array<{ value: InvoiceStatus; label: string }> = [
  { value: 'draft', label: 'Taslak' },
  { value: 'approved', label: 'Onaylandı' },
];

// Payment status picker options
const PAYMENT_OPTIONS: Array<{ value: PaymentStatus; label: string }> = [
  { value: 'pending', label: 'Ödeme Bekliyor' },
  { value: 'paid', label: 'Ödendi' },
];

// Currency picker options (Tüm dövizler)
const CURRENCY_OPTIONS: Array<{ value: CurrencyType; label: string }> = [
  { value: 'TRY', label: 'Türk Lirası (₺)' },
  { value: 'USD', label: 'ABD Doları ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'İngiliz Sterlini (£)' },
  { value: 'AUD', label: 'Avustralya Doları (A$)' },
  { value: 'DKK', label: 'Danimarka Kronu (kr)' },
  { value: 'CHF', label: 'İsviçre Frangı (CHF)' },
  { value: 'SEK', label: 'İsveç Kronu (kr)' },
  { value: 'CAD', label: 'Kanada Doları (C$)' },
  { value: 'KWD', label: 'Kuveyt Dinarı (KD)' },
  { value: 'NOK', label: 'Norveç Kronu (kr)' },
  { value: 'SAR', label: 'Suudi Arabistan Riyali (SR)' },
  { value: 'JPY', label: 'Japon Yeni (¥)' },
  { value: 'BGN', label: 'Bulgar Levası (лв)' },
  { value: 'RON', label: 'Rumen Leyi (lei)' },
  { value: 'RUB', label: 'Rus Rublesi (₽)' },
  { value: 'CNY', label: 'Çin Yuanı (¥)' },
  { value: 'PKR', label: 'Pakistan Rupisi (₨)' },
  { value: 'QAR', label: 'Katar Riyali (QR)' },
  { value: 'KRW', label: 'Güney Kore Wonu (₩)' },
  { value: 'AZN', label: 'Azerbaycan Manatı (₼)' },
  { value: 'AED', label: 'BAE Dirhemi (AED)' },
  { value: 'XDR', label: 'Özel Çekme Hakkı (XDR)' },
];

export default function NewInvoiceScreen() {
  const colors = Colors.light;

  // Modal refs
  const currencyModalRef = useRef<SearchableSelectModalRef>(null);
  const contactModalRef = useRef<SearchableSelectModalRef>(null);
  const contactAddressModalRef = useRef<SearchableSelectModalRef>(null);
  const warehouseModalRef = useRef<SearchableSelectModalRef>(null);
  const productModalRef = useRef<SearchableSelectModalRef>(null);

  // Form state
  const [type, setType] = useState<InvoiceType>('sale');
  const [status, setStatus] = useState<InvoiceStatus>('draft');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending');
  const [currencyType, setCurrencyType] = useState<CurrencyType>('TRY');
  const [currencyRate, setCurrencyRate] = useState('1');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  // Selected entities
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedContactAddress, setSelectedContactAddress] = useState<ContactAddress | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);

  // Invoice items
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [currentItemIndex, setCurrentItemIndex] = useState<number | null>(null);

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isLoadingContactAddresses, setIsLoadingContactAddresses] = useState(false);
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Data for modals
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactAddresses, setContactAddresses] = useState<ContactAddress[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Load data on mount
  useEffect(() => {
    loadContacts();
    loadWarehouses();
    loadProducts();
  }, []);

  const loadContacts = async () => {
    try {
      setIsLoadingContacts(true);
      const response = await getContacts({ per_page: 100 });
      setContacts(response.contacts);
    } catch (err) {
      console.error('Contacts fetch error:', err);
      showToast({
        type: 'error',
        message: 'Cariler yüklenemedi',
      });
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const loadWarehouses = async () => {
    try {
      setIsLoadingWarehouses(true);
      const response = await getWarehouses({ is_active: true, per_page: 100 });
      setWarehouses(response.warehouses);
      // Auto-select first warehouse if available
      if (response.warehouses.length > 0 && !selectedWarehouse) {
        setSelectedWarehouse(response.warehouses[0]);
      }
    } catch (err) {
      console.error('Warehouses fetch error:', err);
      showToast({
        type: 'error',
        message: 'Depolar yüklenemedi',
      });
    } finally {
      setIsLoadingWarehouses(false);
    }
  };

  const loadProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const response = await getProducts({ is_active: true, per_page: 200 });
      setProducts(response.products);
    } catch (err) {
      console.error('Products fetch error:', err);
      showToast({
        type: 'error',
        message: 'Ürünler yüklenemedi',
      });
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const loadContactAddresses = async (contactId: number) => {
    try {
      setIsLoadingContactAddresses(true);
      const response = await getContactAddresses(contactId);

      setContactAddresses(response.addresses);

      if (response.addresses.length === 0) {
        showToast({
          type: 'error',
          message: 'Bu cari için adres bulunamadı. Lütfen önce adres ekleyiniz.',
          duration: 4000,
        });
        setSelectedContactAddress(null);
        return;
      }

      // Otomatik adres seçimi:
      // 1. Öncelik: billing veya both tipinde olan adres
      // 2. Sonra: is_default = true olan adres
      // 3. En son: İlk adres
      const billingAddress = response.addresses.find(
        (addr) => addr.address_type === 'billing' || addr.address_type === 'both'
      );
      const defaultAddress = response.addresses.find((addr) => addr.is_default);
      const firstAddress = response.addresses[0];

      const selectedAddr = billingAddress || defaultAddress || firstAddress;
      setSelectedContactAddress(selectedAddr);
    } catch (err) {
      console.error('Contact addresses fetch error:', err);
      showToast({
        type: 'error',
        message: 'Adresler yüklenemedi',
      });
      setSelectedContactAddress(null);
    } finally {
      setIsLoadingContactAddresses(false);
    }
  };

  // Fetch exchange rate when currency changes (Web ile aynı davranış)
  useEffect(() => {
    const fetchRate = async () => {
      if (currencyType === 'TRY') {
        setCurrencyRate('1');
        return;
      }

      try {
        const rate = await getLatestExchangeRate(currencyType);
        setCurrencyRate(rate);
        showToast({
          type: 'success',
          message: `${currencyType} kuru güncellendi: ${rate}`,
        });
      } catch (err) {
        console.error('Exchange rate fetch error:', err);
        showToast({
          type: 'error',
          message: `${currencyType} için kur bulunamadı. Manuel giriş yapabilirsiniz.`,
        });
      }
    };

    fetchRate();
  }, [currencyType]);

  // Transform data for modals
  const currencyOptions: SelectOption[] = CURRENCY_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
  }));

  const contactOptions: SelectOption<Contact>[] = contacts.map((contact) => ({
    value: contact.id,
    label: contact.name,
    subtitle: contact.code || undefined,
    data: contact,
  }));

  const contactAddressOptions: SelectOption<ContactAddress>[] = contactAddresses.map((address) => ({
    value: address.id,
    label: address.title,
    subtitle: address.address || address.city?.name || undefined,
    data: address,
  }));

  const warehouseOptions: SelectOption<Warehouse>[] = warehouses.map((warehouse) => ({
    value: warehouse.id,
    label: warehouse.name,
    subtitle: warehouse.code || undefined,
    data: warehouse,
  }));

  const productOptions: SelectOption<Product>[] = products.map((product) => ({
    value: product.id,
    label: product.name,
    subtitle: product.code ? `${product.code} - ${product.sale_price || 0} ₺` : `${product.sale_price || 0} ₺`,
    data: product,
  }));

  // Modal selection handlers
  const handleCurrencySelect = (option: SelectOption) => {
    setCurrencyType(option.value as CurrencyType);
  };

  const handleContactSelect = (option: SelectOption<Contact>) => {
    setSelectedContact(option.data!);
    // Cari seçildiğinde adreslerini yükle
    loadContactAddresses(option.data!.id);
  };

  const handleContactAddressSelect = (option: SelectOption<ContactAddress>) => {
    setSelectedContactAddress(option.data!);
  };

  const handleWarehouseSelect = (option: SelectOption<Warehouse>) => {
    setSelectedWarehouse(option.data!);
  };

  const handleProductSelect = (option: SelectOption<Product>) => {
    if (currentItemIndex === null) return;

    const product = option.data!;
    const newItems = [...items];
    const item = newItems[currentItemIndex];

    // Web'deki gibi otomatik doldur
    item.product_id = product.id;
    item.description = product.name;
    item.unit = product.unit; // Birim
    item.unit_price = product.sale_price || 0;
    item.vat_rate = product.vat_rate || 20;

    // Totalleri yeniden hesapla
    const subtotal = item.quantity * item.unit_price;
    const vatAmount = (subtotal * item.vat_rate) / 100;
    item.sub_total = subtotal;
    item.vat_amount = vatAmount;
    item.total = subtotal + vatAmount;

    setItems(newItems);
    setCurrentItemIndex(null);
  };

  // Add new item
  const addItem = () => {
    const newItem: InvoiceItem = {
      product_id: 0,
      description: '',
      quantity: 1,
      unit: 'NIU', // Adet (UN/ECE code)
      unit_price: 0,
      vat_rate: 20,
      vat_amount: 0,
      sub_total: 0,
      total: 0,
    };
    setItems([...items, newItem]);
  };

  // Remove item
  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  // Update item
  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;

    // Recalculate totals for this item
    const item = newItems[index];
    const subtotal = item.quantity * item.unit_price;
    const vatAmount = (subtotal * item.vat_rate) / 100;
    item.sub_total = subtotal;
    item.vat_amount = vatAmount;
    item.total = subtotal + vatAmount;

    setItems(newItems);
  };

  // Calculate invoice totals
  const calculateTotals = () => {
    const subTotal = items.reduce((sum, item) => sum + item.sub_total, 0);
    const vatAmount = items.reduce((sum, item) => sum + item.vat_amount, 0);
    const total = subTotal + vatAmount;

    return {
      sub_total: Number(subTotal.toFixed(2)),
      vat_amount: Number(vatAmount.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  };

  const totals = calculateTotals();

  // Form validation
  const validateForm = (): string | null => {
    if (!selectedContact) {
      return 'Lütfen cari seçiniz';
    }
    if (!selectedContactAddress) {
      return 'Lütfen adres seçiniz. Cari için adres bulunamadıysa, önce adres ekleyiniz.';
    }
    if (!selectedWarehouse) {
      return 'Lütfen depo seçiniz';
    }
    if (items.length === 0) {
      return 'En az bir kalem eklemelisiniz';
    }
    if (items.some((item) => item.product_id === 0)) {
      return 'Tüm kalemler için ürün seçmelisiniz';
    }
    if (items.some((item) => item.quantity <= 0)) {
      return 'Miktar 0\'dan büyük olmalıdır';
    }
    if (items.some((item) => item.unit_price < 0)) {
      return 'Birim fiyat 0 veya daha büyük olmalıdır';
    }
    return null;
  };

  // Submit form
  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      showToast({
        type: 'error',
        message: validationError,
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const formData: InvoiceFormData = {
        contact_id: selectedContact!.id,
        contact_address_id: selectedContactAddress!.id,
        warehouse_id: selectedWarehouse!.id,
        type,
        status,
        payment_status: paymentStatus,
        currency_type: currencyType,
        currency_rate: Number(currencyRate),
        invoice_date: invoiceDate,
        due_date: dueDate || undefined,
        sub_total: totals.sub_total,
        vat_amount: totals.vat_amount,
        total: totals.total,
        notes: notes || undefined,
        items: items.map((item) => ({
          product_id: item.product_id,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          vat_rate: item.vat_rate,
          vat_amount: item.vat_amount,
          sub_total: item.sub_total,
          total: item.total,
        })),
      };

      await createInvoice(formData);

      showToast({
        type: 'success',
        message: 'Fatura başarıyla oluşturuldu',
      });

      router.back();
    } catch (err) {
      console.error('Invoice creation error:', err);
      showToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Fatura oluşturulamadı',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <FullScreenHeader
        title="Yeni Fatura"
        subtitle="Fatura bilgilerini giriniz"
        showBackButton
        rightIcons={
          <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Save size={22} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        {/* Type & Status */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Fatura Bilgileri</Text>

          <View style={styles.row}>
            <View style={styles.halfColumn}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Fatura Tipi *</Text>
              <View style={styles.pickerRow}>
                {INVOICE_TYPES.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      {
                        backgroundColor: type === option.value ? Brand.primary : colors.background,
                        borderColor: Brand.primary,
                      },
                    ]}
                    onPress={() => setType(option.value)}
                  >
                    <Text
                      style={[
                        styles.optionButtonText,
                        { color: type === option.value ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfColumn}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Durum *</Text>
              <View style={styles.pickerRow}>
                {STATUS_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      {
                        backgroundColor: status === option.value ? Brand.primary : colors.background,
                        borderColor: Brand.primary,
                      },
                    ]}
                    onPress={() => setStatus(option.value)}
                  >
                    <Text
                      style={[
                        styles.optionButtonText,
                        { color: status === option.value ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Contact Selection */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Cari Seçimi *</Text>

          {selectedContact ? (
            <View style={[styles.selectedItem, { backgroundColor: colors.background }]}>
              <View style={styles.selectedItemInfo}>
                <User size={20} color={Brand.primary} />
                <View style={styles.selectedItemText}>
                  <Text style={[styles.selectedItemName, { color: colors.text }]}>
                    {selectedContact.name}
                  </Text>
                  {selectedContact.code && (
                    <Text style={[styles.selectedItemCode, { color: colors.textMuted }]}>
                      {selectedContact.code}
                    </Text>
                  )}
                </View>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setSelectedContact(null);
                  setSelectedContactAddress(null);
                  setContactAddresses([]);
                }}
              >
                <Trash2 size={20} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.selectButton, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => contactModalRef.current?.present()}
              disabled={isLoadingContacts}
            >
              {isLoadingContacts ? (
                <ActivityIndicator size="small" color={Brand.primary} />
              ) : (
                <>
                  <User size={20} color={colors.icon} />
                  <Text style={[styles.selectButtonText, { color: colors.textMuted }]}>
                    Cari seçiniz
                  </Text>
                  <ChevronDown size={20} color={colors.icon} />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Contact Address Selection */}
        {selectedContact && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Adres Seçimi *</Text>

            {selectedContactAddress ? (
              <View style={[styles.selectedItem, { backgroundColor: colors.background }]}>
                <View style={styles.selectedItemInfo}>
                  <Building size={20} color={Brand.primary} />
                  <View style={styles.selectedItemText}>
                    <Text style={[styles.selectedItemName, { color: colors.text }]}>
                      {selectedContactAddress.title}
                    </Text>
                    {selectedContactAddress.address && (
                      <Text style={[styles.selectedItemCode, { color: colors.textMuted }]} numberOfLines={1}>
                        {selectedContactAddress.address}
                      </Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity onPress={() => contactAddressModalRef.current?.present()}>
                  <Text style={[styles.changeText, { color: Brand.primary }]}>Değiştir</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.selectButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => contactAddressModalRef.current?.present()}
                disabled={isLoadingContactAddresses}
              >
                {isLoadingContactAddresses ? (
                  <ActivityIndicator size="small" color={Brand.primary} />
                ) : (
                  <>
                    <Building size={20} color={colors.icon} />
                    <Text style={[styles.selectButtonText, { color: colors.textMuted }]}>
                      Adres seçiniz
                    </Text>
                    <ChevronDown size={20} color={colors.icon} />
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Warehouse Selection */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Depo Seçimi *</Text>

          {selectedWarehouse ? (
            <View style={[styles.selectedItem, { backgroundColor: colors.background }]}>
              <View style={styles.selectedItemInfo}>
                <Building size={20} color={Brand.primary} />
                <View style={styles.selectedItemText}>
                  <Text style={[styles.selectedItemName, { color: colors.text }]}>
                    {selectedWarehouse.name}
                  </Text>
                  {selectedWarehouse.code && (
                    <Text style={[styles.selectedItemCode, { color: colors.textMuted }]}>
                      {selectedWarehouse.code}
                    </Text>
                  )}
                </View>
              </View>
              <TouchableOpacity onPress={() => setSelectedWarehouse(null)}>
                <Trash2 size={20} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.selectButton, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => warehouseModalRef.current?.present()}
              disabled={isLoadingWarehouses}
            >
              {isLoadingWarehouses ? (
                <ActivityIndicator size="small" color={Brand.primary} />
              ) : (
                <>
                  <Building size={20} color={colors.icon} />
                  <Text style={[styles.selectButtonText, { color: colors.textMuted }]}>
                    Depo seçiniz
                  </Text>
                  <ChevronDown size={20} color={colors.icon} />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Dates & Currency */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Tarih & Para Birimi</Text>

          <View style={styles.row}>
            <View style={styles.halfColumn}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Fatura Tarihi *</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                ]}
                value={invoiceDate}
                onChangeText={setInvoiceDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.halfColumn}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Vade Tarihi</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                ]}
                value={dueDate}
                onChangeText={setDueDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfColumn}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Para Birimi *</Text>
              <TouchableOpacity
                style={[styles.selectButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => currencyModalRef.current?.present()}
              >
                <DollarSign size={20} color={colors.icon} />
                <Text style={[styles.selectButtonText, { color: colors.text }]}>
                  {CURRENCY_OPTIONS.find((opt) => opt.value === currencyType)?.label || currencyType}
                </Text>
                <ChevronDown size={20} color={colors.icon} />
              </TouchableOpacity>
            </View>

            <View style={styles.halfColumn}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Kur *</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                ]}
                value={currencyRate}
                onChangeText={setCurrencyRate}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </View>

        {/* Payment Status */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Ödeme Durumu *</Text>

          <View style={styles.pickerRow}>
            {PAYMENT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor:
                      paymentStatus === option.value ? Brand.primary : colors.background,
                    borderColor: Brand.primary,
                  },
                ]}
                onPress={() => setPaymentStatus(option.value)}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    { color: paymentStatus === option.value ? '#FFFFFF' : colors.text },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Invoice Items */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.itemsHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Fatura Kalemleri</Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: Brand.primary }]}
              onPress={addItem}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Kalem Ekle</Text>
            </TouchableOpacity>
          </View>

          {items.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Henüz kalem eklenmemiş. "Kalem Ekle" butonuna tıklayarak başlayın.
            </Text>
          ) : (
            items.map((item, index) => (
              <View
                key={index}
                style={[styles.itemCard, { backgroundColor: colors.background }]}
              >
                <View style={styles.itemCardHeader}>
                  <Text style={[styles.itemNumber, { color: colors.text }]}>
                    Kalem #{index + 1}
                  </Text>
                  <TouchableOpacity onPress={() => removeItem(index)}>
                    <Trash2 size={20} color={colors.danger} />
                  </TouchableOpacity>
                </View>

                {/* Product Selection */}
                <View style={styles.itemField}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Ürün *</Text>
                  {item.product_id > 0 ? (
                    <View style={[styles.selectedItem, { backgroundColor: colors.card }]}>
                      <View style={styles.selectedItemInfo}>
                        <Package size={18} color={Brand.primary} />
                        <View style={styles.selectedItemText}>
                          <Text style={[styles.selectedItemName, { color: colors.text, fontSize: Typography.sizes.sm }]}>
                            {item.description}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          setCurrentItemIndex(index);
                          productModalRef.current?.present();
                        }}
                      >
                        <Text style={[styles.changeText, { color: Brand.primary }]}>Değiştir</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.selectButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={() => {
                        setCurrentItemIndex(index);
                        productModalRef.current?.present();
                      }}
                      disabled={isLoadingProducts}
                    >
                      {isLoadingProducts ? (
                        <ActivityIndicator size="small" color={Brand.primary} />
                      ) : (
                        <>
                          <Package size={18} color={colors.icon} />
                          <Text style={[styles.selectButtonText, { color: colors.textMuted, fontSize: Typography.sizes.sm }]}>
                            Ürün seçiniz
                          </Text>
                          <ChevronDown size={18} color={colors.icon} />
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.itemField}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Açıklama</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.card,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    value={item.description || ''}
                    onChangeText={(text) => updateItem(index, 'description', text)}
                    placeholder="Ürün açıklaması"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={styles.row}>
                  <View style={styles.halfColumn}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Miktar *</Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.card,
                          color: colors.text,
                          borderColor: colors.border,
                        },
                      ]}
                      value={item.quantity.toString()}
                      onChangeText={(text) => updateItem(index, 'quantity', Number(text) || 0)}
                      keyboardType="decimal-pad"
                    />
                  </View>

                  <View style={styles.halfColumn}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Birim</Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.card,
                          color: colors.text,
                          borderColor: colors.border,
                        },
                      ]}
                      value={item.unit}
                      onChangeText={(text) => updateItem(index, 'unit', text)}
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={styles.halfColumn}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>
                      Birim Fiyat *
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.card,
                          color: colors.text,
                          borderColor: colors.border,
                        },
                      ]}
                      value={item.unit_price.toString()}
                      onChangeText={(text) => updateItem(index, 'unit_price', Number(text) || 0)}
                      keyboardType="decimal-pad"
                    />
                  </View>

                  <View style={styles.halfColumn}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>KDV (%) *</Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.card,
                          color: colors.text,
                          borderColor: colors.border,
                        },
                      ]}
                      value={item.vat_rate.toString()}
                      onChangeText={(text) => updateItem(index, 'vat_rate', Number(text) || 0)}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                <View style={[styles.itemTotals, { borderTopColor: colors.border }]}>
                  <View style={styles.itemTotalRow}>
                    <Text style={[styles.itemTotalLabel, { color: colors.textMuted }]}>
                      Ara Toplam:
                    </Text>
                    <Text style={[styles.itemTotalValue, { color: colors.text }]}>
                      {item.sub_total.toFixed(2)} {currencyType}
                    </Text>
                  </View>
                  <View style={styles.itemTotalRow}>
                    <Text style={[styles.itemTotalLabel, { color: colors.textMuted }]}>KDV:</Text>
                    <Text style={[styles.itemTotalValue, { color: colors.text }]}>
                      {item.vat_amount.toFixed(2)} {currencyType}
                    </Text>
                  </View>
                  <View style={styles.itemTotalRow}>
                    <Text
                      style={[
                        styles.itemTotalLabel,
                        { color: Brand.primary, fontWeight: Typography.fontWeights.semibold },
                      ]}
                    >
                      Toplam:
                    </Text>
                    <Text
                      style={[
                        styles.itemTotalValue,
                        { color: Brand.primary, fontWeight: Typography.fontWeights.semibold },
                      ]}
                    >
                      {item.total.toFixed(2)} {currencyType}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Invoice Totals */}
        {items.length > 0 && (
          <View style={[styles.card, { backgroundColor: Brand.primary }]}>
            <View style={styles.summaryRow}>
              <Calculator size={20} color="#FFFFFF" />
              <Text style={[styles.summaryTitle, { color: '#FFFFFF' }]}>Fatura Özeti</Text>
            </View>

            <View style={styles.summaryTotalRow}>
              <Text style={styles.summaryLabel}>Ara Toplam:</Text>
              <Text style={styles.summaryValue}>
                {totals.sub_total.toFixed(2)} {currencyType}
              </Text>
            </View>

            <View style={styles.summaryTotalRow}>
              <Text style={styles.summaryLabel}>KDV:</Text>
              <Text style={styles.summaryValue}>
                {totals.vat_amount.toFixed(2)} {currencyType}
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />

            <View style={styles.summaryTotalRow}>
              <Text style={[styles.summaryLabel, { fontSize: Typography.sizes.lg }]}>
                Genel Toplam:
              </Text>
              <Text
                style={[
                  styles.summaryValue,
                  { fontSize: Typography.sizes['2xl'], fontWeight: Typography.fontWeights.bold },
                ]}
              >
                {totals.total.toFixed(2)} {currencyType}
              </Text>
            </View>
          </View>
        )}

        {/* Notes */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Notlar</Text>
          <TextInput
            style={[
              styles.textArea,
              { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
            ]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Fatura notları (opsiyonel)"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: Brand.primary },
            isSubmitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Save size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Fatura Oluştur</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Bottom spacing */}
        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      {/* Modals */}
      <SearchableSelectModal
        ref={currencyModalRef}
        title="Para Birimi Seçin"
        options={currencyOptions}
        selectedValue={currencyType}
        onSelect={handleCurrencySelect}
        searchPlaceholder="Para birimi ara..."
        emptyMessage="Para birimi bulunamadı"
      />

      <SearchableSelectModal
        ref={contactModalRef}
        title="Cari Seçin"
        options={contactOptions}
        selectedValue={selectedContact?.id}
        onSelect={handleContactSelect}
        searchPlaceholder="Cari ara..."
        emptyMessage="Cari bulunamadı"
        loading={isLoadingContacts}
      />

      <SearchableSelectModal
        ref={contactAddressModalRef}
        title="Adres Seçin"
        options={contactAddressOptions}
        selectedValue={selectedContactAddress?.id}
        onSelect={handleContactAddressSelect}
        searchPlaceholder="Adres ara..."
        emptyMessage="Adres bulunamadı"
        loading={isLoadingContactAddresses}
      />

      <SearchableSelectModal
        ref={warehouseModalRef}
        title="Depo Seçin"
        options={warehouseOptions}
        selectedValue={selectedWarehouse?.id}
        onSelect={handleWarehouseSelect}
        searchPlaceholder="Depo ara..."
        emptyMessage="Depo bulunamadı"
        loading={isLoadingWarehouses}
      />

      <SearchableSelectModal
        ref={productModalRef}
        title="Ürün Seçin"
        options={productOptions}
        selectedValue={currentItemIndex !== null ? items[currentItemIndex]?.product_id : undefined}
        onSelect={handleProductSelect}
        searchPlaceholder="Ürün ara..."
        emptyMessage="Ürün bulunamadı"
        loading={isLoadingProducts}
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
    padding: Spacing.md,
    paddingBottom: Spacing['3xl'],
  },
  card: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.fontWeights.semibold,
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  halfColumn: {
    flex: 1,
  },
  label: {
    fontSize: Typography.sizes.sm,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    fontSize: Typography.sizes.md,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    fontSize: Typography.sizes.md,
    minHeight: 100,
  },
  pickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  optionButton: {
    flex: 1,
    minWidth: '30%',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  optionButtonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.fontWeights.medium,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  selectButtonText: {
    flex: 1,
    fontSize: Typography.sizes.md,
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  selectedItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  selectedItemText: {
    flex: 1,
  },
  selectedItemName: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.fontWeights.medium,
  },
  selectedItemCode: {
    fontSize: Typography.sizes.sm,
    marginTop: 2,
  },
  changeText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.fontWeights.medium,
  },
  emptyText: {
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.fontWeights.medium,
  },
  itemCard: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  itemCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  itemNumber: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.fontWeights.semibold,
  },
  itemField: {
    marginBottom: Spacing.sm,
  },
  itemTotals: {
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
    marginTop: Spacing.sm,
  },
  itemTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemTotalLabel: {
    fontSize: Typography.sizes.sm,
  },
  itemTotalValue: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.fontWeights.medium,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  summaryTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.fontWeights.semibold,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  summaryLabel: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.md,
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.md,
    fontWeight: Typography.fontWeights.medium,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.sm,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    ...Shadows.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.md,
    fontWeight: Typography.fontWeights.semibold,
  },
});
