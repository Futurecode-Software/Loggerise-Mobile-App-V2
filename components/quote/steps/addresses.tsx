/**
 * Quote Create - Step 3: Adresler
 *
 * Yükleme ve teslimat adresleri
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { MapPin, Plus } from 'lucide-react-native';
import { Card, AutocompleteInput, SelectInput } from '@/components/ui';
import type { AutocompleteOption } from '@/components/ui';
import { Spacing, Brand } from '@/constants/theme';
import {
  NewQuoteFormData,
  PickupType,
  DeliveryType,
} from '@/services/endpoints/quotes-new-format';
import { getContactAddresses } from '@/services/endpoints/contacts';

interface QuoteCreateAddressesScreenProps {
  data: Partial<NewQuoteFormData>;
  onChange: (updates: Partial<NewQuoteFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const PICKUP_TYPE_OPTIONS = [
  { label: 'Ön Taşıma', value: 'pre_transport' },
  { label: 'Doğrudan Adresten', value: 'direct_from_address' },
  { label: 'Müşteri Deposundan', value: 'customer_to_warehouse' },
];

const DELIVERY_TYPE_OPTIONS = [
  { label: 'Adrese Teslimat', value: 'deliver_to_address' },
  { label: 'Son Taşıma', value: 'final_transport' },
  { label: 'Depodan Teslim Alma', value: 'pickup_from_warehouse' },
];

export function QuoteCreateAddressesScreen({
  data,
  onChange,
  onNext,
  onBack,
}: QuoteCreateAddressesScreenProps) {
  const [showPickupAddressForm, setShowPickupAddressForm] = useState(false);
  const [showDeliveryAddressForm, setShowDeliveryAddressForm] = useState(false);

  // Load pickup address options
  const loadPickupAddressOptions = useCallback(
    async (searchQuery: string): Promise<AutocompleteOption[]> => {
      if (!data.customer_id) return [];

      try {
        const response = await getContactAddresses(data.customer_id, {
          search: searchQuery || undefined, // Boşsa tüm adresleri getir
          is_shipping: true,
        });

        const addresses = response.addresses || [];

        return addresses.map((addr) => ({
          label: addr.title,
          value: addr.id,
          subtitle: addr.address_line_1 || addr.address,
        }));
      } catch (error) {
        if (__DEV__) console.error('[Addresses] Load pickup addresses error:', error);
        return [];
      }
    },
    [data.customer_id]
  );

  // Load delivery address options
  const loadDeliveryAddressOptions = useCallback(
    async (searchQuery: string): Promise<AutocompleteOption[]> => {
      if (!data.customer_id) return [];

      try {
        const response = await getContactAddresses(data.customer_id, {
          search: searchQuery || undefined, // Boşsa tüm adresleri getir
          is_shipping: true,
        });

        const addresses = response.addresses || [];

        return addresses.map((addr) => ({
          label: addr.title,
          value: addr.id,
          subtitle: addr.address_line_1 || addr.address,
        }));
      } catch (error) {
        if (__DEV__) console.error('[Addresses] Load delivery addresses error:', error);
        return [];
      }
    },
    [data.customer_id]
  );

  return (
    <>
      {/* Yükleme Adresi */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin size={20} color={Brand.primary} />
            <Text style={styles.sectionTitle}>Yükleme Adresi</Text>
          </View>

          <SelectInput
            label="Teslim Alma Tipi"
            placeholder="Seçiniz..."
            value={data.pickup_type}
            onValueChange={(value) => onChange({ pickup_type: value as PickupType })}
            options={PICKUP_TYPE_OPTIONS}
          />

          {!data.customer_id ? (
            <View style={styles.disabledInfo}>
              <Text style={styles.disabledInfoText}>
                Adres seçmek için önce müşteri seçiniz
              </Text>
            </View>
          ) : !data.new_pickup_address ? (
            <>
              <AutocompleteInput
                label="Mevcut Adresler"
                placeholder="Adres ara ve seçiniz..."
                value={data.pickup_contact_address_id}
                onValueChange={(value) =>
                  onChange({ pickup_contact_address_id: Number(value) })
                }
                loadOptions={loadPickupAddressOptions}
                minSearchLength={0}
                debounceMs={300}
              />

              <TouchableOpacity
                style={styles.newAddressButton}
                onPress={() => setShowPickupAddressForm(true)}
                activeOpacity={0.7}
              >
                <Plus size={20} color={Brand.primary} />
                <Text style={styles.newAddressButtonText}>Yeni Adres Ekle</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.newAddressPreview}>
              <Text style={styles.newAddressTitle}>
                {data.new_pickup_address.title}
              </Text>
              <Text style={styles.newAddressText}>
                {data.new_pickup_address.address}
              </Text>
              <TouchableOpacity
                onPress={() => onChange({ new_pickup_address: undefined })}
                style={styles.removeAddressButton}
              >
                <Text style={styles.removeAddressText}>Kaldır</Text>
              </TouchableOpacity>
            </View>
          )}
        </Card>

        {/* Teslimat Adresi */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin size={20} color={Brand.secondary} />
            <Text style={styles.sectionTitle}>Teslimat Adresi</Text>
          </View>

          <SelectInput
            label="Teslim Etme Tipi"
            placeholder="Seçiniz..."
            value={data.delivery_type}
            onValueChange={(value) =>
              onChange({ delivery_type: value as DeliveryType })
            }
            options={DELIVERY_TYPE_OPTIONS}
          />

          {!data.customer_id ? (
            <View style={styles.disabledInfo}>
              <Text style={styles.disabledInfoText}>
                Adres seçmek için önce müşteri seçiniz
              </Text>
            </View>
          ) : !data.new_delivery_address ? (
            <>
              <AutocompleteInput
                label="Mevcut Adresler"
                placeholder="Adres ara ve seçiniz..."
                value={data.delivery_contact_address_id}
                onValueChange={(value) =>
                  onChange({ delivery_contact_address_id: Number(value) })
                }
                loadOptions={loadDeliveryAddressOptions}
                minSearchLength={0}
                debounceMs={300}
              />

              <TouchableOpacity
                style={styles.newAddressButton}
                onPress={() => setShowDeliveryAddressForm(true)}
                activeOpacity={0.7}
              >
                <Plus size={20} color={Brand.primary} />
                <Text style={styles.newAddressButtonText}>Yeni Adres Ekle</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.newAddressPreview}>
              <Text style={styles.newAddressTitle}>
                {data.new_delivery_address.title}
              </Text>
              <Text style={styles.newAddressText}>
                {data.new_delivery_address.address}
              </Text>
              <TouchableOpacity
                onPress={() => onChange({ new_delivery_address: undefined })}
                style={styles.removeAddressButton}
              >
                <Text style={styles.removeAddressText}>Kaldır</Text>
              </TouchableOpacity>
            </View>
          )}
        </Card>

      {/* Yeni Adres Modal (Pickup) - Basitleştirilmiş versiyon */}
      <Modal
        visible={showPickupAddressForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPickupAddressForm(false)}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Yeni Yükleme Adresi</Text>
          <Text style={styles.modalSubtitle}>
            (Basit form - geliştirilecek)
          </Text>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowPickupAddressForm(false)}
          >
            <Text style={styles.modalCloseText}>Kapat</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Yeni Adres Modal (Delivery) */}
      <Modal
        visible={showDeliveryAddressForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDeliveryAddressForm(false)}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Yeni Teslimat Adresi</Text>
          <Text style={styles.modalSubtitle}>
            (Basit form - geliştirilecek)
          </Text>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowDeliveryAddressForm(false)}
          >
            <Text style={styles.modalCloseText}>Kapat</Text>
          </TouchableOpacity>
        </View>
            </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: Spacing.sm,
  },
  newAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    marginTop: Spacing.sm,
  },
  newAddressButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Brand.primary,
    marginLeft: Spacing.xs,
  },
  newAddressPreview: {
    padding: Spacing.md,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginTop: Spacing.sm,
  },
  newAddressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: Spacing.xs,
  },
  newAddressText: {
    fontSize: 14,
    color: '#6B7280',
  },
  removeAddressButton: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  removeAddressText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
  },
  bottomActions: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: 'transparent',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: Spacing.sm,
  },
  backButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  nextButton: {
    flex: 1,
    backgroundColor: Brand.primary,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalContainer: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: Spacing.sm,
  },
  modalCloseButton: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Brand.primary,
    borderRadius: 8,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledInfo: {
    padding: Spacing.md,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
    marginTop: Spacing.sm,
  },
  disabledInfoText: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
  },
});
