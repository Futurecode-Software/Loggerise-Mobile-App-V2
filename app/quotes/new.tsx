import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react-native';
import { Button } from '@/components/ui';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import { createQuote, QuoteFormData } from '@/services/endpoints/quotes';
import QuoteFormStep1 from '@/components/quote-form/quote-form-step1';
import QuoteFormStep2 from '@/components/quote-form/quote-form-step2';
import QuoteFormStep3 from '@/components/quote-form/quote-form-step3';
import type { CargoItem } from '@/components/quote-form/cargo-item-form';

const STEPS = [
  { id: 1, label: 'Temel Bilgiler' },
  { id: 2, label: 'Yük Kalemleri' },
  { id: 3, label: 'Fiyat & İnceleme' },
];

export default function NewQuoteScreen() {
  const colors = Colors.light;

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<QuoteFormData>>({
    currency_type: 'TRY',
    status: 'draft',
    is_active: true,
    quote_date: new Date().toISOString().split('T')[0],
    vat_rate: 20,
    discount_total: 0,
  });
  const [cargoItems, setCargoItems] = useState<CargoItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.customer_id) {
      newErrors.customer_id = 'Müşteri seçimi zorunludur';
    }

    if (!formData.currency_type) {
      newErrors.currency_type = 'Para birimi zorunludur';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (cargoItems.length === 0) {
      newErrors.cargo_items = 'En az bir yük kalemi eklemelisiniz';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const newErrors: Record<string, string> = {};

    // All validations passed (pricing is auto-calculated)

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    let isValid = false;

    if (currentStep === 1) {
      isValid = validateStep1();
    } else if (currentStep === 2) {
      isValid = validateStep2();
    } else if (currentStep === 3) {
      isValid = validateStep3();
    }

    if (isValid && currentStep < 3) {
      setCurrentStep(currentStep + 1);
      setErrors({});
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    } else {
      // Exit form
      Alert.alert('Çıkış', 'Değişiklikler kaydedilmeyecek. Çıkmak istediğinizden emin misiniz?', [
        { text: 'Hayır', style: 'cancel' },
        { text: 'Evet', onPress: () => router.back() },
      ]);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep3()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare cargo items (backend expects cargo_items or load_items)
      const submitData = {
        ...formData,
        cargo_items: cargoItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          weight: item.weight,
          volume: item.volume,
          loading_type: item.loading_type,
          unit_price: item.unit_price,
        })),
      };

      const quote = await createQuote(submitData as QuoteFormData);
      Alert.alert('Başarılı', 'Teklif başarıyla oluşturuldu', [
        {
          text: 'Tamam',
          onPress: () => router.replace(`/quotes/${quote.id}` as any),
        },
      ]);
    } catch (err) {
      Alert.alert('Hata', err instanceof Error ? err.message : 'Teklif oluşturulamadı');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {STEPS.map((step, index) => (
        <View key={step.id} style={styles.stepItem}>
          <View
            style={[
              styles.stepCircle,
              {
                backgroundColor:
                  currentStep >= step.id ? Brand.primary : colors.surface,
                borderColor: currentStep >= step.id ? Brand.primary : colors.border,
              },
            ]}
          >
            {currentStep > step.id ? (
              <Check size={16} color="#FFFFFF" />
            ) : (
              <Text
                style={[
                  styles.stepNumber,
                  { color: currentStep >= step.id ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                {step.id}
              </Text>
            )}
          </View>
          <Text
            style={[
              styles.stepLabel,
              { color: currentStep >= step.id ? Brand.primary : colors.textSecondary },
            ]}
          >
            {step.label}
          </Text>
          {index < STEPS.length - 1 && (
            <View
              style={[
                styles.stepLine,
                { backgroundColor: currentStep > step.id ? Brand.primary : colors.border },
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <QuoteFormStep1 formData={formData} setFormData={setFormData} errors={errors} />;
      case 2:
        return (
          <QuoteFormStep2 cargoItems={cargoItems} setCargoItems={setCargoItems} errors={errors} />
        );
      case 3:
        return (
          <QuoteFormStep3
            formData={formData}
            setFormData={setFormData}
            cargoItems={cargoItems}
            errors={errors}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Yeni Teklif</Text>
        <View style={styles.backButton} />
      </View>

      {/* Step Indicator */}
      {renderStepIndicator()}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {renderCurrentStep()}
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Button
            label="Geri"
            onPress={handleBack}
            variant="secondary"
            style={styles.footerButton}
          />
          {currentStep < 3 ? (
            <Button
              label="İleri"
              onPress={handleNext}
              variant="primary"
              style={styles.footerButton}
              icon={<ChevronRight size={20} color="#FFFFFF" />}
              iconPosition="right"
            />
          ) : (
            <Button
              label={isSubmitting ? 'Kaydediliyor...' : 'Teklif Oluştur'}
              onPress={handleSubmit}
              disabled={isSubmitting}
              variant="primary"
              style={styles.footerButton}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
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
    width: 40,
  },
  headerTitle: {
    ...Typography.headingLG,
    flex: 1,
    textAlign: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  stepNumber: {
    ...Typography.bodySM,
    fontWeight: '700',
  },
  stepLabel: {
    ...Typography.bodyXS,
    fontWeight: '600',
    textAlign: 'center',
  },
  stepLine: {
    position: 'absolute',
    top: 16,
    left: '50%',
    width: '100%',
    height: 2,
    zIndex: -1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing['4xl'],
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
  },
});
