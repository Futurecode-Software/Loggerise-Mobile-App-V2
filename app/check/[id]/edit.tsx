/**
 * Edit Check Screen
 *
 * Edit existing check (çek).
 * Matches backend MobileUpdateCheckRequest validation.
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
import { router, useLocalSearchParams } from 'expo-router';
import { Save } from 'lucide-react-native';
import { Input, Card } from '@/components/ui';
import { SelectInput } from '@/components/ui/select-input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { DateInput } from '@/components/ui/date-input';
import { FullScreenHeader } from '@/components/header/FullScreenHeader';
import { Colors, Typography, Spacing, BorderRadius, Brand, Shadows } from '@/constants/theme';
import { useToast } from '@/hooks/use-toast';
import {
  getCheck,
  updateCheck,
  CheckFormData,
  CheckType,
  CheckStatus,
  CurrencyType,
} from '@/services/endpoints/checks';
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
  { label: 'Karşılıksız', value: 'bounced' },
  { label: 'İptal Edildi', value: 'cancelled' },
];

// Currency options
const CURRENCY_OPTIONS = [
  { label: 'Türk Lirası (TRY)', value: 'TRY' },
  { label: 'Amerikan Doları (USD)', value: 'USD' },
  { label: 'Euro (EUR)', value: 'EUR' },
  { label: 'İngiliz Sterlini (GBP)', value: 'GBP' },
];

export default function EditCheckScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = Colors.light;
  const { success, error: showError } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState<CheckFormData>({
    contact_id: 0,
    check_number: '',
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
  });

  // Contacts for searchable select
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Fetch check data
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        // Fetch check and contacts in parallel
        const [checkData, contactsResponse] = await Promise.all([
          getCheck(parseInt(id, 10)),
          getContacts({ per_page: 100, is_active: true }).catch(() => ({ contacts: [], pagination: {} as any })),
        ]);

        setContacts(contactsResponse.contacts);

        // Populate form with check data
        setFormData({
          contact_id: checkData.contact_id,
          check_number: checkData.check_number,
          bank_name: checkData.bank_name,
          branch_name: checkData.branch_name,
          account_number: checkData.account_number || '',
          drawer_name: checkData.drawer_name || '',
          endorser_name: checkData.endorser_name || '',
          portfolio_number: checkData.portfolio_number || '',
          type: checkData.type,
          issue_date: checkData.issue_date,
          due_date: checkData.due_date,
          amount: checkData.amount,
          currency_type: checkData.currency_type,
          status: checkData.status,
          transferred_to_type: checkData.transferred_to_type || null,
          transferred_to_id: checkData.transferred_to_id || null,
          transferred_date: checkData.transferred_date || null,
          cleared_date: checkData.cleared_date || null,
          bounced_date: checkData.bounced_date || null,
          cancelled_date: checkData.cancelled_date || null,
          attached_document: checkData.attached_document || null,
          description: checkData.description || '',
        });
      } catch (err) {
        console.error('Failed to load check:', err);
        showError('Hata', 'Çek bilgileri yüklenemedi.');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Handle input change
  const handleInputChange = useCallback((field: keyof CheckFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // Validation function matching backend rules
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.contact_id || formData.contact_id === 0) {
      newErrors.contact_id = 'Cari seçimi zorunludur.';
    }
    if (!formData.check_number?.trim()) {
      newErrors.check_number = 'Çek numarası zorunludur.';
    }
    if (!formData.bank_name?.trim()) {
      newErrors.bank_name = 'Banka adı zorunludur.';
    }
    if (!formData.branch_name?.trim()) {
      newErrors.branch_name = 'Şube adı zorunludur.';
    }
    if (!formData.type) {
      newErrors.type = 'Çek tipi zorunludur.';
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

    // Length validations
    if (formData.check_number && formData.check_number.length > 255) {
      newErrors.check_number = 'Çek numarası en fazla 255 karakter olabilir.';
    }
    if (formData.bank_name && formData.bank_name.length > 255) {
      newErrors.bank_name = 'Banka adı en fazla 255 karakter olabilir.';
    }
    if (formData.branch_name && formData.branch_name.length > 255) {
      newErrors.branch_name = 'Şube adı en fazla 255 karakter olabilir.';
    }

    // Amount validation
    if (formData.amount && formData.amount > 999999999999.99) {
      newErrors.amount = 'Tutar çok büyük.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Submit handler
  const handleSubmit = useCallback(async () => {
    if (!validateForm() || !id) {
      return;
    }

    setIsSubmitting(true);
    try {
      await updateCheck(parseInt(id, 10), formData);

      success('Başarılı', 'Çek başarıyla güncellendi.');
      router.back();
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
      } else {
        showError('Hata', getErrorMessage(error));
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [id, formData, validateForm, success, showError]);

  // Prepare contact options
  const contactOptions = contacts.map(contact => ({
    label: contact.name,
    value: contact.id,
    subtitle: contact.code,
  }));

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <FullScreenHeader title="Çek Düzenle" showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Çek bilgileri yükleniyor...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FullScreenHeader
        title="Çek Düzenle"
        subtitle="Çek bilgilerini güncelleyin"
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
            label="Çek Numarası"
            placeholder="ÇEK-2025-001"
            value={formData.check_number}
            onChangeText={(value) => handleInputChange('check_number', value)}
            error={errors.check_number}
            required
          />

          <SelectInput
            label="Çek Tipi"
            options={TYPE_OPTIONS}
            value={formData.type}
            onValueChange={(value) => handleInputChange('type', value as CheckType)}
            error={errors.type}
            required
          />

          <SelectInput
            label="Durum"
            options={STATUS_OPTIONS}
            value={formData.status}
            onValueChange={(value) => handleInputChange('status', value as CheckStatus)}
            error={errors.status}
            required
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
            onChangeDate={(value) => handleInputChange('issue_date', value)}
            error={errors.issue_date}
            required
          />

          <DateInput
            label="Vade Tarihi"
            value={formData.due_date}
            onChangeDate={(value) => handleInputChange('due_date', value)}
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
            placeholder="Çek hakkında notlar..."
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.bodyMD,
  },
});
