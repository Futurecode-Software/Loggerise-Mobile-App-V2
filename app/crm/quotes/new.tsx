/**
 * Multi-Step Quote Creation Screen
 *
 * Web ile %100 uyumlu 5-adımlı teklif oluşturma ekranı
 * Backend: MobileStoreQuoteRequest (güncellenmiş version)
 * CLAUDE.md form sayfası standardına uygun - animasyonlu header + KeyboardAwareScrollView
 */

import { QuoteFormStepper } from '@/components/quote/quote-form-stepper'
import { ConfirmDialog } from '@/components/ui'
import {
  DashboardBorderRadius,
  DashboardColors,
  DashboardFontSizes,
  DashboardSpacing
} from '@/constants/dashboard-theme'
import api from '@/services/api'
import { NewQuoteFormData, validateStep } from '@/services/endpoints/quotes-new-format'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

// Step component imports
import { QuoteCreateAddressesScreen } from '@/components/quote/steps/addresses'
import { QuoteCreateBasicInfoScreen } from '@/components/quote/steps/basic-info'
import { QuoteCreateCargoItemsScreen } from '@/components/quote/steps/cargo-items'
import { QuoteCreatePreviewScreen } from '@/components/quote/steps/preview'
import { QuoteCreatePricingScreen } from '@/components/quote/steps/pricing'

const TOTAL_STEPS = 5

export default function CreateMultiStepQuoteScreen() {
  const insets = useSafeAreaInsets()

  // Animasyonlu orb'lar için shared values
  const orb1TranslateY = useSharedValue(0)
  const orb2TranslateX = useSharedValue(0)
  const orb1Scale = useSharedValue(1)
  const orb2Scale = useSharedValue(1)

  useEffect(() => {
    orb1TranslateY.value = withRepeat(
      withTiming(15, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )
    orb1Scale.value = withRepeat(
      withTiming(1.1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )
    orb2TranslateX.value = withRepeat(
      withTiming(20, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )
    orb2Scale.value = withRepeat(
      withTiming(1.15, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const orb1AnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: orb1TranslateY.value },
      { scale: orb1Scale.value }
    ]
  }))

  const orb2AnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: orb2TranslateX.value },
      { scale: orb2Scale.value }
    ]
  }))

  // Global form state
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSendConfirmDialog, setShowSendConfirmDialog] = useState(false)

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
    cargo_items: []
  })

  // Update form data (partial update)
  const updateQuoteData = useCallback((updates: Partial<NewQuoteFormData>) => {
    setQuoteData((prev) => ({ ...prev, ...updates }))
  }, [])

  // Validate current step
  const validateCurrentStep = useCallback((): boolean => {
    const errors = validateStep(currentStep, quoteData)
    if (errors.length > 0) {
      Toast.show({
        type: 'error',
        text1: errors[0],
        position: 'top',
        visibilityTime: 1500
      })
      return false
    }
    return true
  }, [currentStep, quoteData])

  // Go to next step
  const goToNextStep = useCallback(() => {
    if (!validateCurrentStep()) {
      return
    }

    // Mark current step as completed
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps((prev) => [...prev, currentStep])
    }

    // Move to next step
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1)
    }
  }, [currentStep, validateCurrentStep, completedSteps])

  // Go to previous step
  const goToPreviousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }, [currentStep])

  // Go to specific step (from stepper)
  const goToStep = useCallback(
    (step: number) => {
      // Sadece tamamlanmış veya önceki step'lere gidilebilir
      if (step <= currentStep || completedSteps.includes(step)) {
        setCurrentStep(step)
      }
    },
    [currentStep, completedSteps]
  )

  // Submit quote (draft or send)
  const handleSubmit = useCallback(
    async (action: 'draft' | 'send') => {
      // Final validation (all steps)
      const finalErrors = validateStep(5, quoteData)
      if (finalErrors.length > 0) {
        Toast.show({
          type: 'error',
          text1: finalErrors[0],
          position: 'top',
          visibilityTime: 1500
        })
        return
      }

      try {
        setIsSubmitting(true)

        const response = await api.post('/quotes', {
          ...quoteData,
          action
        })

        if (response.data.success) {
          Toast.show({
            type: 'success',
            text1: action === 'send'
              ? 'Teklif oluşturuldu ve müşteriye gönderildi'
              : 'Teklif taslak olarak kaydedildi',
            position: 'top',
            visibilityTime: 1500
          })

          // Go to quote detail
          const quoteId = response.data.data.quote.id
          router.replace(`/crm/quotes/${quoteId}`)
        } else {
          throw new Error(response.data.message || 'Teklif oluşturulamadı')
        }
      } catch (err: any) {
        console.error('[CreateMultiStepQuote] Submit error:', err)
        Toast.show({
          type: 'error',
          text1: err.response?.data?.message || err.message || 'Bir hata oluştu',
          position: 'top',
          visibilityTime: 1500
        })
      } finally {
        setIsSubmitting(false)
      }
    },
    [quoteData]
  )

  // Confirm send action - show dialog
  const confirmSendQuote = useCallback(() => {
    setShowSendConfirmDialog(true)
  }, [])

  // Handle send confirm
  const handleSendConfirm = useCallback(() => {
    setShowSendConfirmDialog(false)
    handleSubmit('send')
  }, [handleSubmit])

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
        )
      case 2:
        return (
          <QuoteCreateCargoItemsScreen
            data={quoteData}
            onChange={updateQuoteData}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        )
      case 3:
        return (
          <QuoteCreateAddressesScreen
            data={quoteData}
            onChange={updateQuoteData}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        )
      case 4:
        return (
          <QuoteCreatePricingScreen
            data={quoteData}
            onChange={updateQuoteData}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        )
      case 5:
        return (
          <QuoteCreatePreviewScreen
            data={quoteData}
            onBack={goToPreviousStep}
            onSaveDraft={() => handleSubmit('draft')}
            onSend={confirmSendQuote}
          />
        )
      default:
        return null
    }
  }

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      goToPreviousStep()
    } else {
      router.back()
    }
  }, [currentStep, goToPreviousStep])

  // Render bottom navigation
  const renderBottomNavigation = () => {
    const isFirstStep = currentStep === 1
    const isLastStep = currentStep === TOTAL_STEPS
    const bottomPadding = Math.max(insets.bottom, DashboardSpacing.md)

    // Son adım: Geri / Taslak Kaydet / Gönder
    if (isLastStep) {
      return (
        <View style={[styles.bottomNav, { paddingBottom: bottomPadding }]}>
          <TouchableOpacity
            style={styles.navBackButton}
            onPress={goToPreviousStep}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color={DashboardColors.text} />
            <Text style={styles.navBackButtonText}>Geri</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navDraftButton, isSubmitting && styles.navButtonDisabled]}
            onPress={() => handleSubmit('draft')}
            disabled={isSubmitting}
            activeOpacity={0.7}
          >
            <Ionicons name="save-outline" size={18} color="#FFFFFF" />
            <Text style={styles.navDraftButtonText}>Taslak</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navSendButton, isSubmitting && styles.navButtonDisabled]}
            onPress={confirmSendQuote}
            disabled={isSubmitting}
            activeOpacity={0.7}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="send-outline" size={18} color="#FFFFFF" />
                <Text style={styles.navSendButtonText}>Gönder</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )
    }

    // Diğer adımlar: Geri / İleri
    return (
      <View style={[styles.bottomNav, { paddingBottom: bottomPadding }]}>
        {!isFirstStep && (
          <TouchableOpacity
            style={styles.navBackButton}
            onPress={goToPreviousStep}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color={DashboardColors.text} />
            <Text style={styles.navBackButtonText}>Geri</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.navNextButton, isFirstStep && { flex: 1 }]}
          onPress={goToNextStep}
          activeOpacity={0.7}
        >
          <Text style={styles.navNextButtonText}>İleri</Text>
          <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header with gradient and animated orbs */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={['#022920', '#044134', '#065f4a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Dekoratif ışık efektleri - Animasyonlu */}
        <Animated.View style={[styles.glowOrb1, orb1AnimatedStyle]} />
        <Animated.View style={[styles.glowOrb2, orb2AnimatedStyle]} />

        <View style={[styles.headerContent, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerBar}>
            {/* Sol: Geri Butonu */}
            <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>

            {/* Orta: Başlık ve Adım */}
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Yeni Teklif</Text>
              <Text style={styles.headerSubtitle}>Adım {currentStep} / {TOTAL_STEPS}</Text>
            </View>

            {/* Sağ: Boş alan (dengeleme için) */}
            <View style={styles.headerButton} />
          </View>
        </View>

        <View style={styles.bottomCurve} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Stepper */}
        <QuoteFormStepper
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepPress={goToStep}
        />

        {/* Step Content - Scrollable with Keyboard Support */}
        <KeyboardAwareScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          bottomOffset={20}
        >
          {renderStepContent()}
        </KeyboardAwareScrollView>

        {/* Fixed Bottom Navigation */}
        {renderBottomNavigation()}

        {/* Loading Overlay */}
        {isSubmitting && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={DashboardColors.primary} />
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
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DashboardColors.background
  },
  headerContainer: {
    position: 'relative',
    overflow: 'hidden'
  },
  glowOrb1: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(16, 185, 129, 0.12)'
  },
  glowOrb2: {
    position: 'absolute',
    bottom: 30,
    left: -50,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.04)'
  },
  headerContent: {
    paddingHorizontal: DashboardSpacing.lg
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 70
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DashboardSpacing.md
  },
  headerTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center'
  },
  headerSubtitle: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 2
  },
  bottomCurve: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 24,
    backgroundColor: DashboardColors.background,
    borderTopLeftRadius: DashboardBorderRadius['2xl'],
    borderTopRightRadius: DashboardBorderRadius['2xl']
  },
  content: {
    flex: 1
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: 0,
    paddingBottom: DashboardSpacing['4xl']
  },
  // Bottom Navigation
  bottomNav: {
    flexDirection: 'row',
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: DashboardSpacing.md,
    gap: DashboardSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  navBackButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DashboardSpacing.xs,
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: 'transparent',
  },
  navBackButtonText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.text,
  },
  navNextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DashboardSpacing.xs,
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
    backgroundColor: DashboardColors.primary,
  },
  navNextButtonText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  navDraftButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DashboardSpacing.xs,
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
    backgroundColor: '#4B5563',
  },
  navDraftButtonText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  navSendButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DashboardSpacing.xs,
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
    backgroundColor: DashboardColors.primary,
  },
  navSendButtonText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  navButtonDisabled: {
    opacity: 0.6,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  loadingText: {
    marginTop: DashboardSpacing.md,
    fontSize: DashboardFontSizes.lg,
    color: '#FFFFFF',
    fontWeight: '500'
  }
})
