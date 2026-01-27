/**
 * New Promissory Note Screen
 *
 * Create new promissory note (senet).
 * Matches backend MobileStorePromissoryNoteRequest validation.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Save } from 'lucide-react-native';
import { Input, Card, Checkbox } from '@/components/ui';
import { SelectInput } from '@/components/ui/select-input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { DateInput } from '@/components/ui/date-input';
import { FullScreenHeader } from '@/components/header/FullScreenHeader';
import { Colors, Typography, Spacing, BorderRadius, Brand, Shadows } from '@/constants/theme';
import { useToast } from '@/hooks/use-toast';
import {
  createPromissoryNote,
  PromissoryNoteFormData,
  PromissoryNoteType,
  PromissoryNoteStatus,
  CurrencyType,
} from '@/services/endpoints/promissory-notes';
import { getContacts, Contact } from '@/services/endpoints/contacts';
import { getErrorMessage, getValidationErrors } from '@/services/api';

// Type options
const TYPE_OPTIONS = [
  { label: 'Alınan', value: 'received' },
  { label: 'Verilen', value: 'issued' },
];

// Status options
const STATUS_OPTIONS = [
  { label: 'Beklemede', value: 'pending' },
  { label: 'Transfer Edildi', value: 'transferred' },
  { label: 'Tahsil Edildi', value: 'cleared' },
  { label: 'Protesto Edildi', value: 'protested' },
  { label: 'İptal Edildi', value: 'cancelled' },
];

// Currency options
const CURRENCY_OPTIONS = [
  { label: 'Türk Lirası (TRY)', value: 'TRY' },
  { label: 'Amerikan Doları (USD)', value: 'USD' },
  { label: 'Euro (EUR)', value: 'EUR' },
  { label: 'İngiliz Sterlini (GBP)', value: 'GBP' },
];

export default function NewPromissoryNoteScreen() {
  const colors = Colors.light;
  const { success, error: showError } = useToast();

  // Form state
  const [formData, setFormData] = useState<PromissoryNoteFormData>({
    contact_id: 0,
    promissory_note_number: '',
    bank_name: '',
    branch_name: '',
    account_number: '',
    drawer_name: '',
    endorser_name: '',
    portfolio_number: '',
    type: 'received',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date().toISOString().split('T')[0],
    amount: 0,
    currency_type: 'TRY',
    status: 'pending',
    description: '',
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Contacts
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Fetch contacts
  useEffect(() => {
    const fetchContacts = async () => {
      setLoadingContacts(true);
      try {
        const response = await getContacts({ per_page: 100, is_active: true });
        setContacts(response.contacts);
      } catch (err) {
        console.error('Failed to load contacts:', err);
      } finally {
        setLoadingContacts(false);
      }
    };
    fetchContacts();
  }, []);

  // Handle input change
  const handleInputChange = useCallback((field: keyof PromissoryNoteFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // Validation
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.contact_id || formData.contact_id === 0) {
      newErrors.contact_id = 'Cari seçimi zorunludur.';
    }
    if (!formData.promissory_note_number?.trim()) {
      newErrors.promissory_note_number = 'Senet numarası zorunludur.';
    }
    if (!formData.bank_name?.trim()) {
      newErrors.bank_name = 'Banka adı zorunludur.';
    }
    if (!formData.branch_name?.trim()) {
      newErrors.branch_name = 'Şube adı zorunludur.';
    }
    if (!formData.type) {
      newErrors.type = 'Senet tipi zorunludur.';
    }
    if (!formData.issue_date) {
      newErrors.issue_date = 'Düzenleme tarihi zorunludur.';
    }
    if (!formData.due_date) {
      newErrors.due_date = 'Vade tarihi zorunludur.';
    }
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Tutar 0\'dan büyük olmalıdır.';
    }
    if (!formData.currency_type) {
      newErrors.currency_type = 'Para birimi zorunludur.';
    }
    if (!formData.status) {
      newErrors.status = 'Durum zorunludur.';
    }

    // Date validation
    if (formData.issue_date && formData.due_date) {
      const issueDate = new Date(formData.issue_date);
      const dueDate = new Date(formData.due_date);
      if (dueDate < issueDate) {
        newErrors.due_date = 'Vade tarihi, düzenleme tarihinden önce olamaz.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Submit
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createPromissoryNote(formData);

      success('Başarılı', 'Senet başarıyla oluşturuldu.');
      router.back();
    } catch (error: any) {
      const validationErrors = getValidationErrors(error);
      if (validationErrors) {
        const flatErrors: Record<string, string> = {};
        Object.entries(validationErrors).forEach(([field, messages]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            flatErrors[field] = messages[0];
          }
        });
        setErrors(flatErrors);
      } else {
        showError('Hata', getErrorMessage(error));
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, success, showError]);

  const contactOptions = contacts.map(contact => ({
    label: contact.name,
    value: contact.id,
    subtitle: contact.code,
  }));

  return (
    <View style={styles.container}>
      <FullScreenHeader
        title="Yeni Senet"
        subtitle="Senet bilgilerini girin"
        rightIcons={
          <TouchableOpacity
            onPress={handleSubmit}
            activeOpacity={0.7}
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
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Card variant="outlined" style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Temel Bilgiler</Text>

          <SearchableSelect
            label="Cari"
            placeholder="Cari seçin"
            options={contactOptions}
            value={formData.contact_id || undefined}
            onValueChange={(value) => handleInputChange('contact_id', value)}
            error={errors.contact_id}
            loading={loadingContacts}
            required
          />

          <Input
            label="Senet Numarası"
            placeholder="SEN-2025-001"
            value={formData.promissory_note_number}
            onChangeText={(value) => handleInputChange('promissory_note_number', value)}
            error={errors.promissory_note_number}
            required
          />

          <SelectInput
            label="Senet Tipi"
            options={TYPE_OPTIONS}
            value={formData.type}
            onValueChange={(value) => handleInputChange('type', value as PromissoryNoteType)}
            error={errors.type}
            required
          />

          <SelectInput
            label="Durum"
            options={STATUS_OPTIONS}
            value={formData.status}
            onValueChange={(value) => handleInputChange('status', value as PromissoryNoteStatus)}
            error={errors.status}
            required
          />

          <Checkbox
            label="Aktif"
            checked={formData.is_active || false}
            onCheckedChange={(checked) => handleInputChange('is_active', checked)}
          />
        </Card>

        <Card variant="outlined" style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Banka Bilgileri</Text>

          <Input
            label="Banka Adı"
            placeholder="Ziraat Bankası"
            value={formData.bank_name}
            onChangeText={(value) => handleInputChange('bank_name', value)}
            error={errors.bank_name}
            required
          />

          <Input
            label="Şube Adı"
            placeholder="Bakırköy Şubesi"
            value={formData.branch_name}
            onChangeText={(value) => handleInputChange('branch_name', value)}
            error={errors.branch_name}
            required
          />

          <Input
            label="Hesap Numarası"
            placeholder="123456789"
            value={formData.account_number}
            onChangeText={(value) => handleInputChange('account_number', value)}
            error={errors.account_number}
            keyboardType="numeric"
          />

          <Input
            label="Keşideci Adı"
            placeholder="Ali Veli"
            value={formData.drawer_name}
            onChangeText={(value) => handleInputChange('drawer_name', value)}
            error={errors.drawer_name}
          />

          <Input
            label="Ciranta Adı"
            placeholder="Mehmet Can"
            value={formData.endorser_name}
            onChangeText={(value) => handleInputChange('endorser_name', value)}
            error={errors.endorser_name}
          />

          <Input
            label="Portföy Numarası"
            placeholder="PORT-001"
            value={formData.portfolio_number}
            onChangeText={(value) => handleInputChange('portfolio_number', value)}
            error={errors.portfolio_number}
          />
        </Card>

        <Card variant="outlined" style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Tarih ve Tutar</Text>

          <DateInput
            label="Düzenleme Tarihi"
            value={formData.issue_date}
            onDateChange={(value) => handleInputChange('issue_date', value)}
            error={errors.issue_date}
            required
          />

          <DateInput
            label="Vade Tarihi"
            value={formData.due_date}
            onDateChange={(value) => handleInputChange('due_date', value)}
            error={errors.due_date}
            required
          />

          <Input
            label="Tutar"
            placeholder="0.00"
            value={formData.amount.toString()}
            onChangeText={(value) => {
              const numValue = parseFloat(value) || 0;
              handleInputChange('amount', numValue);
            }}
            error={errors.amount}
            keyboardType="decimal-pad"
            required
          />

          <SelectInput
            label="Para Birimi"
            options={CURRENCY_OPTIONS}
            value={formData.currency_type}
            onValueChange={(value) => handleInputChange('currency_type', value as CurrencyType)}
            error={errors.currency_type}
            required
          />
        </Card>

        <Card variant="outlined" style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Diğer</Text>

          <Input
            label="Açıklama"
            placeholder="Senet hakkında notlar..."
            value={formData.description}
            onChangeText={(value) => handleInputChange('description', value)}
            error={errors.description}
            multiline
            numberOfLines={4}
          />
        </Card>
      </ScrollView>
      </KeyboardAvoidingView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  card: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.headingSM,
    marginBottom: Spacing.md,
  },
});
