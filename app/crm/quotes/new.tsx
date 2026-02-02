/**
 * Multi-Step Quote Creation Screen
 *
 * Web ile %100 uyumlu 5-adımlı teklif oluşturma ekranı
 * Backend: MobileStoreQuoteRequest (güncellenmiş version)
 * Updated to match DESIGN_STANDARDS.md
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Spacing, Brand, Shadows } from '@/constants/theme';
import { FullScreenHeader } from '@/components/header/FullScreenHeader';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/ui';
import { QuoteFormStepper } from '@/components/quote/quote-form-stepper';
import { NewQuoteFormData, validateStep } from '@/services/endpoints/quotes-new-format';
import api from '@/services/api';

// Step component imports
import { QuoteCreateBasicInfoScreen } from '@/components/quote/steps/basic-info';
import { QuoteCreateCargoItemsScreen } from '@/components/quote/steps/cargo-items';
import { QuoteCreateAddressesScreen } from '@/components/quote/steps/addresses';
import { QuoteCreatePricingScreen } from '@/components/quote/steps/pricing';
import { QuoteCreatePreviewScreen } from '@/components/quote/steps/preview';

export default function CreateMultiStepQuoteScreen() {
  const { success, error: showError } = useToast();

  // Global form state
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSendConfirmDialog, setShowSendConfirmDialog] = useState(false);

  // Form data state
  const [quoteData, setQuoteData] = useState<Partial<NewQuoteFormData>>({
    quote_date: new Date().toISOString().split('T')[0],
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    currency: 'TRY',
    exchange_rate: 1,
    include_vat: true,
    vat_rate: 20,
    cargo_items: [],
  });

  // Update form data (partial update)
  const updateQuoteData = useCallback((updates: Partial<NewQuoteFormData>) => {
    setQuoteData((prev) => ({ ...prev, ...updates }));
  }, []);

  // Validate current step
  const validateCurrentStep = useCallback((): boolean => {
    const errors = validateStep(currentStep, quoteData);
    if (errors.length > 0) {
      showError(errors[0]); // İlk hatayı göster
      return false;
    }
    return true;
  }, [currentStep, quoteData, showError]);

  // Go to next step
  const goToNextStep = useCallback(() => {
    if (!validateCurrentStep()) {
      return;
    }

    // Mark current step as completed
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps((prev) => [...prev, currentStep]);
    }

    // Move to next step
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, validateCurrentStep, completedSteps]);

  // Go to previous step
  const goToPreviousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  }, [currentStep]);

  // Go to specific step (from stepper)
  const goToStep = useCallback(
    (step: number) => {
      // Sadece tamamlanmış veya önceki step'lere gidilebilir
      if (step <= currentStep || completedSteps.includes(step)) {
        setCurrentStep(step);
      }
    },
    [currentStep, completedSteps]
  );

  // Submit quote (draft or send)
  const handleSubmit = useCallback(
    async (action: 'draft' | 'send') => {
      // Final validation (all steps)
      const finalErrors = validateStep(5, quoteData);
      if (finalErrors.length > 0) {
        showError(finalErrors[0]);
        return;
      }

      try {
        setIsSubmitting(true);

        const response = await api.post('/quotes', {
          ...quoteData,
          action,
        });

        if (response.data.success) {
          success(
            action === 'send'
              ? 'Teklif oluşturuldu ve müşteriye gönderildi'
              : 'Teklif taslak olarak kaydedildi'
          );

          // Go to quote detail
          const quoteId = response.data.data.quote.id;
          router.replace(`/crm/quotes/${quoteId}`);
        } else {
          throw new Error(response.data.message || 'Teklif oluşturulamadı');
        }
      } catch (err: any) {
        console.error('[CreateMultiStepQuote] Submit error:', err);
        showError(err.response?.data?.message || err.message || 'Bir hata oluştu');
      } finally {
        setIsSubmitting(false);
      }
    },
    [quoteData, showError, success]
  );

  // Confirm send action - show dialog
  const confirmSendQuote = useCallback(() => {
    setShowSendConfirmDialog(true);
  }, []);

  // Handle send confirm
  const handleSendConfirm = useCallback(() => {
    setShowSendConfirmDialog(false);
    handleSubmit('send');
  }, [handleSubmit]);

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <QuoteCreateBasicInfoScreen
            data={quoteData}
            onChange={updateQuoteData}
            onNext={goToNextStep}
          />
        );
      case 2:
        return (
          <QuoteCreateCargoItemsScreen
            data={quoteData}
            onChange={updateQuoteData}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        );
      case 3:
        return (
          <QuoteCreateAddressesScreen
            data={quoteData}
            onChange={updateQuoteData}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        );
      case 4:
        return (
          <QuoteCreatePricingScreen
            data={quoteData}
            onChange={updateQuoteData}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        );
      case 5:
        return (
          <QuoteCreatePreviewScreen
            data={quoteData}
            onBack={goToPreviousStep}
            onSaveDraft={() => handleSubmit('draft')}
            onSend={confirmSendQuote}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <FullScreenHeader
        title="Yeni Teklif"
        subtitle={`Adım ${currentStep} / 5`}
        showBackButton
        onBackPress={() => currentStep > 1 ? goToPreviousStep() : router.back()}
      />

      <View style={styles.content}>
        {/* Stepper */}
        <QuoteFormStepper
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepPress={goToStep}
        />

        {/* Step Content - Scrollable */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderStepContent()}
        </ScrollView>

        {/* Loading Overlay */}
        {isSubmitting && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Brand.primary} />
            <Text style={styles.loadingText}>Teklif oluşturuluyor...</Text>
          </View>
        )}
      </View>

      {/* Send Confirmation Dialog */}
      <ConfirmDialog
        visible={showSendConfirmDialog}
        title="Teklif Gönder"
        message="Teklif müşteriye e-posta ile gönderilecektir. Onaylıyor musunuz?"
        confirmText="Gönder"
        cancelText="İptal"
        onConfirm={handleSendConfirm}
        onCancel={() => setShowSendConfirmDialog(false)}
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
    overflow: 'hidden',
    ...Shadows.lg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['4xl'],
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});
