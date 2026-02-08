/**
 * New Invoice Screen
 *
 * Yeni fatura oluşturma ekranı.
 * Backend MobileInvoiceRequest validation kurallarına uyumlu.
 * Modern tasarım - CLAUDE.md form sayfası standardına uygun.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import Toast from 'react-native-toast-message'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius,
  DashboardShadows
} from '@/constants/dashboard-theme'
import {
  createInvoice,
  InvoiceFormData,
  InvoiceType,
  InvoiceStatus,
  PaymentStatus,
  InvoiceItem
} from '@/services/endpoints/invoices'
import { Contact, getContacts, ContactAddress, getContactAddresses } from '@/services/endpoints/contacts'
import { Warehouse, getWarehouses } from '@/services/endpoints/warehouses'
import { Product, getProducts } from '@/services/endpoints/products'
import { getLatestExchangeRate } from '@/services/endpoints/exchange-rates'
import {
  SearchableSelectModal,
  SearchableSelectModalRef,
  SelectOption
} from '@/components/modals'
import { FormHeader } from '@/components/navigation/FormHeader'
import { CURRENCY_OPTIONS, CurrencyCode } from '@/constants/currencies'
import { formatCurrency } from '@/utils/currency'

// Type picker options
const INVOICE_TYPES: { value: InvoiceType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'sale', label: 'Satış', icon: 'arrow-up-circle-outline' },
  { value: 'purchase', label: 'Alış', icon: 'arrow-down-circle-outline' },
  { value: 'service', label: 'Hizmet', icon: 'construct-outline' }
]

// Status picker options
const STATUS_OPTIONS: { value: InvoiceStatus; label: string }[] = [
  { value: 'draft', label: 'Taslak' },
  { value: 'approved', label: 'Onaylandı' }
]

// Payment status picker options
const PAYMENT_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: 'pending', label: 'Ödeme Bekliyor' },
  { value: 'paid', label: 'Ödendi' }
]

export default function NewInvoiceScreen() {
  // Modal refs
  const currencyModalRef = useRef<SearchableSelectModalRef>(null)
  const contactModalRef = useRef<SearchableSelectModalRef>(null)
  const contactAddressModalRef = useRef<SearchableSelectModalRef>(null)
  const warehouseModalRef = useRef<SearchableSelectModalRef>(null)
  const productModalRef = useRef<SearchableSelectModalRef>(null)

  // Form state
  const [type, setType] = useState<InvoiceType>('sale')
  const [status, setStatus] = useState<InvoiceStatus>('draft')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending')
  const [currencyType, setCurrencyCode] = useState<CurrencyCode>('TRY')
  const [currencyRate, setCurrencyRate] = useState('1')
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')

  // Selected entities
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [selectedContactAddress, setSelectedContactAddress] = useState<ContactAddress | null>(null)
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null)

  // Invoice items
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [currentItemIndex, setCurrentItemIndex] = useState<number | null>(null)

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingContacts, setIsLoadingContacts] = useState(false)
  const [isLoadingContactAddresses, setIsLoadingContactAddresses] = useState(false)
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false)
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)

  // Data for modals
  const [contacts, setContacts] = useState<Contact[]>([])
  const [contactAddresses, setContactAddresses] = useState<ContactAddress[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [products, setProducts] = useState<Product[]>([])

  // Load data on mount
  useEffect(() => {
    loadContacts()
    loadWarehouses()
    loadProducts()
  }, [])

  const loadContacts = async () => {
    try {
      setIsLoadingContacts(true)
      const response = await getContacts({ per_page: 100 })
      setContacts(response.contacts)
    } catch (err) {
      if (__DEV__) console.error('Contacts fetch error:', err)
      Toast.show({
        type: 'error',
        text1: 'Cariler yüklenemedi',
        position: 'top',
        visibilityTime: 1500
      })
    } finally {
      setIsLoadingContacts(false)
    }
  }

  const loadWarehouses = async () => {
    try {
      setIsLoadingWarehouses(true)
      const response = await getWarehouses({ is_active: true, per_page: 100 })
      setWarehouses(response.warehouses)
      // Auto-select first warehouse if available
      if (response.warehouses.length > 0 && !selectedWarehouse) {
        setSelectedWarehouse(response.warehouses[0])
      }
    } catch (err) {
      if (__DEV__) console.error('Warehouses fetch error:', err)
      Toast.show({
        type: 'error',
        text1: 'Depolar yüklenemedi',
        position: 'top',
        visibilityTime: 1500
      })
    } finally {
      setIsLoadingWarehouses(false)
    }
  }

  const loadProducts = async () => {
    try {
      setIsLoadingProducts(true)
      const response = await getProducts({ is_active: true, per_page: 200 })
      setProducts(response.products)
    } catch (err) {
      if (__DEV__) console.error('Products fetch error:', err)
      Toast.show({
        type: 'error',
        text1: 'Ürünler yüklenemedi',
        position: 'top',
        visibilityTime: 1500
      })
    } finally {
      setIsLoadingProducts(false)
    }
  }

  const loadContactAddresses = async (contactId: number) => {
    try {
      setIsLoadingContactAddresses(true)
      const response = await getContactAddresses(contactId)

      setContactAddresses(response.addresses)

      if (response.addresses.length === 0) {
        Toast.show({
          type: 'error',
          text1: 'Bu cari için adres bulunamadı',
          text2: 'Lütfen önce adres ekleyiniz',
          position: 'top',
          visibilityTime: 3000
        })
        setSelectedContactAddress(null)
        return
      }

      // Otomatik adres seçimi
      const billingAddress = response.addresses.find(
        (addr) => addr.address_type === 'billing' || addr.address_type === 'both'
      )
      const defaultAddress = response.addresses.find((addr) => addr.is_default)
      const firstAddress = response.addresses[0]

      const selectedAddr = billingAddress || defaultAddress || firstAddress
      setSelectedContactAddress(selectedAddr)
    } catch (err) {
      if (__DEV__) console.error('Contact addresses fetch error:', err)
      Toast.show({
        type: 'error',
        text1: 'Adresler yüklenemedi',
        position: 'top',
        visibilityTime: 1500
      })
      setSelectedContactAddress(null)
    } finally {
      setIsLoadingContactAddresses(false)
    }
  }

  // Fetch exchange rate when currency changes
  useEffect(() => {
    const fetchRate = async () => {
      if (currencyType === 'TRY') {
        setCurrencyRate('1')
        return
      }

      try {
        const rate = await getLatestExchangeRate(currencyType)
        setCurrencyRate(rate)
        Toast.show({
          type: 'success',
          text1: `${currencyType} kuru güncellendi: ${rate}`,
          position: 'top',
          visibilityTime: 1500
        })
      } catch (err) {
        if (__DEV__) console.error('Exchange rate fetch error:', err)
        Toast.show({
          type: 'error',
          text1: `${currencyType} için kur bulunamadı`,
          text2: 'Manuel giriş yapabilirsiniz',
          position: 'top',
          visibilityTime: 2000
        })
      }
    }

    fetchRate()
  }, [currencyType])

  // Transform data for modals
  const currencyOptions: SelectOption[] = CURRENCY_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label
  }))

  const contactOptions: SelectOption<Contact>[] = contacts.map((contact) => ({
    value: contact.id,
    label: contact.name,
    subtitle: contact.code || undefined,
    data: contact
  }))

  const contactAddressOptions: SelectOption<ContactAddress>[] = contactAddresses.map((address) => ({
    value: address.id,
    label: address.title,
    subtitle: address.address || address.city?.name || undefined,
    data: address
  }))

  const warehouseOptions: SelectOption<Warehouse>[] = warehouses.map((warehouse) => ({
    value: warehouse.id,
    label: warehouse.name,
    subtitle: warehouse.code || undefined,
    data: warehouse
  }))

  const productOptions: SelectOption<Product>[] = products.map((product) => ({
    value: product.id,
    label: product.name,
    subtitle: product.code ? `${product.code} - ${formatCurrency(product.sale_price || 0, 'TRY')}` : formatCurrency(product.sale_price || 0, 'TRY'),
    data: product
  }))

  // Modal selection handlers
  const handleCurrencySelect = (option: SelectOption) => {
    setCurrencyCode(option.value as CurrencyCode)
  }

  const handleContactSelect = (option: SelectOption<Contact>) => {
    setSelectedContact(option.data!)
    loadContactAddresses(option.data!.id)
  }

  const handleContactAddressSelect = (option: SelectOption<ContactAddress>) => {
    setSelectedContactAddress(option.data!)
  }

  const handleWarehouseSelect = (option: SelectOption<Warehouse>) => {
    setSelectedWarehouse(option.data!)
  }

  const handleProductSelect = (option: SelectOption<Product>) => {
    if (currentItemIndex === null) return

    const product = option.data!
    const newItems = [...items]
    const item = newItems[currentItemIndex]

    item.product_id = product.id
    item.description = product.name
    item.unit = product.unit
    item.unit_price = product.sale_price || 0
    item.vat_rate = product.vat_rate || 20

    const subtotal = item.quantity * item.unit_price
    const vatAmount = (subtotal * item.vat_rate) / 100
    item.sub_total = subtotal
    item.vat_amount = vatAmount
    item.total = subtotal + vatAmount

    setItems(newItems)
    setCurrentItemIndex(null)
  }

  // Add new item
  const addItem = () => {
    const newItem: InvoiceItem = {
      product_id: 0,
      description: '',
      quantity: 1,
      unit: 'NIU',
      unit_price: 0,
      vat_rate: 20,
      vat_amount: 0,
      sub_total: 0,
      total: 0
    }
    setItems([...items, newItem])
  }

  // Remove item
  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    setItems(newItems)
  }

  // Update item
  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items]
    ;(newItems[index] as any)[field] = value

    const item = newItems[index]
    const subtotal = item.quantity * item.unit_price
    const vatAmount = (subtotal * item.vat_rate) / 100
    item.sub_total = subtotal
    item.vat_amount = vatAmount
    item.total = subtotal + vatAmount

    setItems(newItems)
  }

  // Calculate invoice totals
  const calculateTotals = () => {
    const subTotal = items.reduce((sum, item) => sum + item.sub_total, 0)
    const vatAmount = items.reduce((sum, item) => sum + item.vat_amount, 0)
    const total = subTotal + vatAmount

    return {
      sub_total: Number(subTotal.toFixed(2)),
      vat_amount: Number(vatAmount.toFixed(2)),
      total: Number(total.toFixed(2))
    }
  }

  const totals = calculateTotals()

  // Form validation
  const validateForm = (): string | null => {
    if (!selectedContact) {
      return 'Lütfen cari seçiniz'
    }
    if (!selectedContactAddress) {
      return 'Lütfen adres seçiniz'
    }
    if (!selectedWarehouse) {
      return 'Lütfen depo seçiniz'
    }
    if (items.length === 0) {
      return 'En az bir kalem eklemelisiniz'
    }
    if (items.some((item) => item.product_id === 0)) {
      return 'Tüm kalemler için ürün seçmelisiniz'
    }
    if (items.some((item) => item.quantity <= 0)) {
      return 'Miktar 0\'dan büyük olmalıdır'
    }
    if (items.some((item) => item.unit_price < 0)) {
      return 'Birim fiyat 0 veya daha büyük olmalıdır'
    }
    return null
  }

  // Handlers
  const handleBack = useCallback(() => {
    router.back()
  }, [])

  const handleSubmit = async () => {
    const validationError = validateForm()
    if (validationError) {
      Toast.show({
        type: 'error',
        text1: validationError,
        position: 'top',
        visibilityTime: 1500
      })
      return
    }

    try {
      setIsSubmitting(true)

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
          total: item.total
        }))
      }

      await createInvoice(formData)

      Toast.show({
        type: 'success',
        text1: 'Fatura başarıyla oluşturuldu',
        position: 'top',
        visibilityTime: 1500
      })

      router.back()
    } catch (err) {
      if (__DEV__) console.error('Invoice creation error:', err)
      Toast.show({
        type: 'error',
        text1: err instanceof Error ? err.message : 'Fatura oluşturulamadı',
        position: 'top',
        visibilityTime: 1500
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render Section Header Component
  const renderSectionHeader = (title: string, icon: keyof typeof Ionicons.glyphMap) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>
        <Ionicons name={icon} size={18} color={DashboardColors.primary} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  )

  return (
    <View style={styles.container}>
      {/* Header */}
      <FormHeader
        title="Yeni Fatura"
        onBackPress={handleBack}
        onSavePress={handleSubmit}
        isSaving={isSubmitting}
      />

      {/* Form Content */}
      <KeyboardAwareScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        bottomOffset={20}
      >
        {/* Fatura Tipi Bölümü */}
        <View style={styles.section}>
          {renderSectionHeader('Fatura Tipi', 'document-text-outline')}
          <View style={styles.sectionContent}>
            <View style={styles.typePickerContainer}>
              {INVOICE_TYPES.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.typeButton,
                    type === option.value && styles.typeButtonActive
                  ]}
                  onPress={() => setType(option.value)}
                >
                  <Ionicons
                    name={option.icon}
                    size={20}
                    color={type === option.value ? '#fff' : DashboardColors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      type === option.value && styles.typeButtonTextActive
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.statusRow}>
              <View style={styles.statusColumn}>
                <Text style={styles.inputLabel}>Durum</Text>
                <View style={styles.chipGroup}>
                  {STATUS_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.chip,
                        status === option.value && styles.chipActive
                      ]}
                      onPress={() => setStatus(option.value)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          status === option.value && styles.chipTextActive
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.statusColumn}>
                <Text style={styles.inputLabel}>Ödeme Durumu</Text>
                <View style={styles.chipGroup}>
                  {PAYMENT_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.chip,
                        paymentStatus === option.value && styles.chipActive
                      ]}
                      onPress={() => setPaymentStatus(option.value)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          paymentStatus === option.value && styles.chipTextActive
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
        </View>

        {/* Cari Seçimi Bölümü */}
        <View style={styles.section}>
          {renderSectionHeader('Cari Seçimi', 'person-outline')}
          <View style={styles.sectionContent}>
            {selectedContact ? (
              <View style={styles.selectedItem}>
                <View style={styles.selectedItemIcon}>
                  <Ionicons name="person" size={20} color={DashboardColors.primary} />
                </View>
                <View style={styles.selectedItemInfo}>
                  <Text style={styles.selectedItemName}>{selectedContact.name}</Text>
                  {selectedContact.code && (
                    <Text style={styles.selectedItemCode}>{selectedContact.code}</Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedContact(null)
                    setSelectedContactAddress(null)
                    setContactAddresses([])
                  }}
                  style={styles.removeButton}
                >
                  <Ionicons name="close-circle" size={22} color={DashboardColors.danger} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => contactModalRef.current?.present()}
                disabled={isLoadingContacts}
              >
                {isLoadingContacts ? (
                  <ActivityIndicator size="small" color={DashboardColors.primary} />
                ) : (
                  <>
                    <Ionicons name="person-outline" size={20} color={DashboardColors.textSecondary} />
                    <Text style={styles.selectButtonText}>Cari seçiniz</Text>
                    <Ionicons name="chevron-forward" size={20} color={DashboardColors.textMuted} />
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Adres Seçimi Bölümü */}
        {selectedContact && (
          <View style={styles.section}>
            {renderSectionHeader('Adres Seçimi', 'location-outline')}
            <View style={styles.sectionContent}>
              {selectedContactAddress ? (
                <View style={styles.selectedItem}>
                  <View style={styles.selectedItemIcon}>
                    <Ionicons name="location" size={20} color={DashboardColors.primary} />
                  </View>
                  <View style={styles.selectedItemInfo}>
                    <Text style={styles.selectedItemName}>{selectedContactAddress.title}</Text>
                    {selectedContactAddress.address && (
                      <Text style={styles.selectedItemCode} numberOfLines={1}>
                        {selectedContactAddress.address}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => contactAddressModalRef.current?.present()}
                    style={styles.changeButton}
                  >
                    <Text style={styles.changeButtonText}>Değiştir</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => contactAddressModalRef.current?.present()}
                  disabled={isLoadingContactAddresses}
                >
                  {isLoadingContactAddresses ? (
                    <ActivityIndicator size="small" color={DashboardColors.primary} />
                  ) : (
                    <>
                      <Ionicons name="location-outline" size={20} color={DashboardColors.textSecondary} />
                      <Text style={styles.selectButtonText}>Adres seçiniz</Text>
                      <Ionicons name="chevron-forward" size={20} color={DashboardColors.textMuted} />
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Depo Seçimi Bölümü */}
        <View style={styles.section}>
          {renderSectionHeader('Depo Seçimi', 'cube-outline')}
          <View style={styles.sectionContent}>
            {selectedWarehouse ? (
              <View style={styles.selectedItem}>
                <View style={styles.selectedItemIcon}>
                  <Ionicons name="cube" size={20} color={DashboardColors.primary} />
                </View>
                <View style={styles.selectedItemInfo}>
                  <Text style={styles.selectedItemName}>{selectedWarehouse.name}</Text>
                  {selectedWarehouse.code && (
                    <Text style={styles.selectedItemCode}>{selectedWarehouse.code}</Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedWarehouse(null)}
                  style={styles.removeButton}
                >
                  <Ionicons name="close-circle" size={22} color={DashboardColors.danger} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => warehouseModalRef.current?.present()}
                disabled={isLoadingWarehouses}
              >
                {isLoadingWarehouses ? (
                  <ActivityIndicator size="small" color={DashboardColors.primary} />
                ) : (
                  <>
                    <Ionicons name="cube-outline" size={20} color={DashboardColors.textSecondary} />
                    <Text style={styles.selectButtonText}>Depo seçiniz</Text>
                    <Ionicons name="chevron-forward" size={20} color={DashboardColors.textMuted} />
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tarih & Para Birimi Bölümü */}
        <View style={styles.section}>
          {renderSectionHeader('Tarih & Para Birimi', 'calendar-outline')}
          <View style={styles.sectionContent}>
            <View style={styles.row}>
              <View style={styles.halfColumn}>
                <Text style={styles.inputLabel}>Fatura Tarihi *</Text>
                <TextInput
                  style={styles.input}
                  value={invoiceDate}
                  onChangeText={setInvoiceDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={DashboardColors.textMuted}
                />
              </View>

              <View style={styles.halfColumn}>
                <Text style={styles.inputLabel}>Vade Tarihi</Text>
                <TextInput
                  style={styles.input}
                  value={dueDate}
                  onChangeText={setDueDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={DashboardColors.textMuted}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfColumn}>
                <Text style={styles.inputLabel}>Para Birimi *</Text>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => currencyModalRef.current?.present()}
                >
                  <Ionicons name="cash-outline" size={20} color={DashboardColors.primary} />
                  <Text style={[styles.selectButtonText, { color: DashboardColors.textPrimary }]}>
                    {CURRENCY_OPTIONS.find((opt) => opt.value === currencyType)?.label || currencyType}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color={DashboardColors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.halfColumn}>
                <Text style={styles.inputLabel}>Kur *</Text>
                <TextInput
                  style={styles.input}
                  value={currencyRate}
                  onChangeText={setCurrencyRate}
                  keyboardType="decimal-pad"
                  placeholderTextColor={DashboardColors.textMuted}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Fatura Kalemleri Bölümü */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderWithAction}>
            <View style={styles.sectionHeaderLeft}>
              <View style={styles.sectionIcon}>
                <Ionicons name="list-outline" size={18} color={DashboardColors.primary} />
              </View>
              <Text style={styles.sectionTitle}>Fatura Kalemleri</Text>
              {items.length > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{items.length}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity style={styles.addButton} onPress={addItem}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.addButtonText}>Ekle</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionContent}>
            {items.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="document-outline" size={48} color={DashboardColors.textMuted} />
                <Text style={styles.emptyStateText}>Henüz kalem eklenmemiş</Text>
                <Text style={styles.emptyStateSubtext}>Ekle butonuna tıklayarak başlayın</Text>
              </View>
            ) : (
              items.map((item, index) => (
                <View key={index} style={styles.itemCard}>
                  <View style={styles.itemCardHeader}>
                    <View style={styles.itemNumberBadge}>
                      <Text style={styles.itemNumberText}>#{index + 1}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeItem(index)} style={styles.itemDeleteButton}>
                      <Ionicons name="trash-outline" size={18} color={DashboardColors.danger} />
                    </TouchableOpacity>
                  </View>

                  {/* Product Selection */}
                  <View style={styles.itemField}>
                    <Text style={styles.inputLabel}>Ürün *</Text>
                    {item.product_id > 0 ? (
                      <View style={styles.selectedProductItem}>
                        <View style={styles.selectedProductIcon}>
                          <Ionicons name="cube" size={16} color={DashboardColors.primary} />
                        </View>
                        <Text style={styles.selectedProductName} numberOfLines={1}>
                          {item.description}
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            setCurrentItemIndex(index)
                            productModalRef.current?.present()
                          }}
                        >
                          <Text style={styles.changeButtonText}>Değiştir</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.selectButton}
                        onPress={() => {
                          setCurrentItemIndex(index)
                          productModalRef.current?.present()
                        }}
                        disabled={isLoadingProducts}
                      >
                        {isLoadingProducts ? (
                          <ActivityIndicator size="small" color={DashboardColors.primary} />
                        ) : (
                          <>
                            <Ionicons name="cube-outline" size={18} color={DashboardColors.textSecondary} />
                            <Text style={styles.selectButtonText}>Ürün seçiniz</Text>
                            <Ionicons name="chevron-forward" size={18} color={DashboardColors.textMuted} />
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.itemField}>
                    <Text style={styles.inputLabel}>Açıklama</Text>
                    <TextInput
                      style={styles.input}
                      value={item.description || ''}
                      onChangeText={(text) => updateItem(index, 'description', text)}
                      placeholder="Ürün açıklaması"
                      placeholderTextColor={DashboardColors.textMuted}
                    />
                  </View>

                  <View style={styles.row}>
                    <View style={styles.halfColumn}>
                      <Text style={styles.inputLabel}>Miktar *</Text>
                      <TextInput
                        style={styles.input}
                        value={item.quantity.toString()}
                        onChangeText={(text) => updateItem(index, 'quantity', Number(text) || 0)}
                        keyboardType="decimal-pad"
                      />
                    </View>

                    <View style={styles.halfColumn}>
                      <Text style={styles.inputLabel}>Birim</Text>
                      <TextInput
                        style={styles.input}
                        value={item.unit}
                        onChangeText={(text) => updateItem(index, 'unit', text)}
                      />
                    </View>
                  </View>

                  <View style={styles.row}>
                    <View style={styles.halfColumn}>
                      <Text style={styles.inputLabel}>Birim Fiyat *</Text>
                      <TextInput
                        style={styles.input}
                        value={item.unit_price.toString()}
                        onChangeText={(text) => updateItem(index, 'unit_price', Number(text) || 0)}
                        keyboardType="decimal-pad"
                      />
                    </View>

                    <View style={styles.halfColumn}>
                      <Text style={styles.inputLabel}>KDV (%) *</Text>
                      <TextInput
                        style={styles.input}
                        value={item.vat_rate.toString()}
                        onChangeText={(text) => updateItem(index, 'vat_rate', Number(text) || 0)}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </View>

                  <View style={styles.itemTotals}>
                    <View style={styles.itemTotalRow}>
                      <Text style={styles.itemTotalLabel}>Ara Toplam:</Text>
                      <Text style={styles.itemTotalValue}>
                        {formatCurrency(item.sub_total, currencyType)}
                      </Text>
                    </View>
                    <View style={styles.itemTotalRow}>
                      <Text style={styles.itemTotalLabel}>KDV:</Text>
                      <Text style={styles.itemTotalValue}>
                        {formatCurrency(item.vat_amount, currencyType)}
                      </Text>
                    </View>
                    <View style={styles.itemTotalRow}>
                      <Text style={[styles.itemTotalLabel, styles.itemTotalLabelBold]}>Toplam:</Text>
                      <Text style={[styles.itemTotalValue, styles.itemTotalValueBold]}>
                        {formatCurrency(item.total, currencyType)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Fatura Özeti */}
        {items.length > 0 && (
          <View style={styles.summaryCard}>
            <LinearGradient
              colors={[DashboardColors.primary, '#065f4a']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.summaryHeader}>
              <Ionicons name="calculator-outline" size={22} color="#fff" />
              <Text style={styles.summaryTitle}>Fatura Özeti</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Ara Toplam:</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(totals.sub_total, currencyType)}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>KDV:</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(totals.vat_amount, currencyType)}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabelBold}>Genel Toplam:</Text>
              <Text style={styles.summaryValueBold}>
                {formatCurrency(totals.total, currencyType)}
              </Text>
            </View>
          </View>
        )}

        {/* Notlar Bölümü */}
        <View style={styles.section}>
          {renderSectionHeader('Notlar', 'chatbox-outline')}
          <View style={styles.sectionContent}>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Fatura notları (opsiyonel)"
              placeholderTextColor={DashboardColors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Submit Button */}
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
              <Text style={styles.submitButtonText}>Fatura Oluştur</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Bottom spacing */}
        <View style={{ height: DashboardSpacing['2xl'] }} />
      </KeyboardAwareScrollView>

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
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DashboardColors.background
  },
  content: {
    flex: 1
  },
  contentContainer: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: 0,
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
  sectionHeaderWithAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: DashboardSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
  countBadge: {
    backgroundColor: DashboardColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10
  },
  countBadgeText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600',
    color: '#fff'
  },
  typePickerContainer: {
    flexDirection: 'row',
    gap: DashboardSpacing.sm
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DashboardSpacing.xs,
    paddingVertical: DashboardSpacing.md,
    paddingHorizontal: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.lg,
    backgroundColor: DashboardColors.background,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight
  },
  typeButtonActive: {
    backgroundColor: DashboardColors.primary,
    borderColor: DashboardColors.primary
  },
  typeButtonText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: DashboardColors.textSecondary
  },
  typeButtonTextActive: {
    color: '#fff'
  },
  statusRow: {
    flexDirection: 'row',
    gap: DashboardSpacing.md
  },
  statusColumn: {
    flex: 1
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
    fontSize: DashboardFontSizes.xs,
    fontWeight: '500',
    color: DashboardColors.textSecondary
  },
  chipTextActive: {
    color: '#fff'
  },
  inputLabel: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: DashboardColors.textSecondary,
    marginBottom: DashboardSpacing.xs
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
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top'
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    backgroundColor: DashboardColors.background,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight,
    borderRadius: DashboardBorderRadius.lg,
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.md,
    minHeight: 48
  },
  selectButtonText: {
    flex: 1,
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DashboardColors.background,
    borderRadius: DashboardBorderRadius.lg,
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.sm,
    gap: DashboardSpacing.sm,
    minHeight: 56,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight
  },
  selectedItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: DashboardColors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center'
  },
  selectedItemInfo: {
    flex: 1
  },
  selectedItemName: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textPrimary
  },
  selectedItemCode: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    marginTop: 2
  },
  removeButton: {
    padding: DashboardSpacing.xs
  },
  changeButton: {
    paddingVertical: DashboardSpacing.xs,
    paddingHorizontal: DashboardSpacing.md,
    backgroundColor: DashboardColors.primaryGlow,
    borderRadius: DashboardBorderRadius.md
  },
  changeButtonText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: DashboardColors.primary
  },
  row: {
    flexDirection: 'row',
    gap: DashboardSpacing.md
  },
  halfColumn: {
    flex: 1
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: DashboardColors.primary,
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.md
  },
  addButtonText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: '#fff'
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DashboardSpacing['2xl']
  },
  emptyStateText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '500',
    color: DashboardColors.textSecondary,
    marginTop: DashboardSpacing.md
  },
  emptyStateSubtext: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textMuted,
    marginTop: DashboardSpacing.xs
  },
  itemCard: {
    backgroundColor: DashboardColors.background,
    borderRadius: DashboardBorderRadius.lg,
    padding: DashboardSpacing.md,
    marginBottom: DashboardSpacing.md,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight
  },
  itemCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DashboardSpacing.md
  },
  itemNumberBadge: {
    backgroundColor: DashboardColors.primary,
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 4,
    borderRadius: DashboardBorderRadius.md
  },
  itemNumberText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: '#fff'
  },
  itemDeleteButton: {
    padding: DashboardSpacing.xs
  },
  itemField: {
    marginBottom: DashboardSpacing.md
  },
  selectedProductItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.lg,
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.sm,
    gap: DashboardSpacing.sm,
    minHeight: 48,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight
  },
  selectedProductIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: DashboardColors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center'
  },
  selectedProductName: {
    flex: 1,
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: DashboardColors.textPrimary
  },
  itemTotals: {
    borderTopWidth: 1,
    borderTopColor: DashboardColors.borderLight,
    paddingTop: 0,
    marginTop: DashboardSpacing.sm
  },
  itemTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  itemTotalLabel: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary
  },
  itemTotalLabelBold: {
    color: DashboardColors.primary,
    fontWeight: '600'
  },
  itemTotalValue: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: DashboardColors.textPrimary
  },
  itemTotalValueBold: {
    color: DashboardColors.primary,
    fontWeight: '700'
  },
  summaryCard: {
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.lg,
    marginBottom: DashboardSpacing.lg,
    overflow: 'hidden'
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    marginBottom: DashboardSpacing.md
  },
  summaryTitle: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: '#fff'
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: DashboardSpacing.xs
  },
  summaryLabel: {
    fontSize: DashboardFontSizes.base,
    color: 'rgba(255, 255, 255, 0.8)'
  },
  summaryLabelBold: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '600',
    color: '#fff'
  },
  summaryValue: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '500',
    color: '#fff'
  },
  summaryValueBold: {
    fontSize: DashboardFontSizes['2xl'],
    fontWeight: '800',
    color: '#fff'
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginVertical: DashboardSpacing.sm
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
  }
})
