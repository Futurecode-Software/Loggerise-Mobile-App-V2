/**
 * Quote Detail Screen
 *
 * Shows quote details with load items, pricing, and actions.
 * Refactored using custom hooks and reusable components following React patterns.
 * Updated to match DESIGN_STANDARDS.md
 */

import React, { useCallback, useRef } from 'react'
import { View, Text, ScrollView, RefreshControl, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import ConfirmDialog from '@/components/modals/ConfirmDialog'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius
} from '@/constants/dashboard-theme'
import { useQuoteDetail } from '@/hooks/use-quote-detail'
import {
  QuoteHeaderCard,
  PricingCard,
  DatesInfoCard,
  PricingItemsCard,
  CargoItemsCard,
  NotesCard,
  QuoteActionButtons,
  LoadingState,
  ErrorState,
} from '@/components/quote-detail'

export default function QuoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const isMountedRef = useRef(true)

  const {
    quote,
    isLoading,
    refreshing,
    isDeleting,
    isSending,
    isDuplicating,
    error,
    showDeleteConfirm,
    setShowDeleteConfirm,
    refresh,
    handleDelete,
    handleConfirmDelete,
    handleSend,
    handleDuplicate,
    handleExportPdf,
    retryFetch,
  } = useQuoteDetail({ id })

  // Edit sayfasından dönüşte yenile
  useFocusEffect(
    useCallback(() => {
      if (isMountedRef.current) {
        refresh()
      }
    }, [refresh])
  )

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['#022920', '#044134', '#065f4a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.glowOrb1} />
          <View style={styles.glowOrb2} />

          <View style={[styles.headerContent, { paddingTop: insets.top + 16 }]}>
            <View style={styles.headerBar}>
              <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={styles.headerTitleSection}>
                <Text style={styles.headerName} numberOfLines={1}>Teklif Detayı</Text>
              </View>
              <View style={styles.headerActionsPlaceholder} />
            </View>
          </View>

          <View style={styles.bottomCurve} />
        </View>

        <View style={styles.content}>
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={DashboardColors.primary} />
            <Text style={styles.loadingText}>Teklif yükleniyor...</Text>
          </View>
        </View>
      </View>
    )
  }

  // Error state
  if (error || !quote) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['#022920', '#044134', '#065f4a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.glowOrb1} />
          <View style={styles.glowOrb2} />

          <View style={[styles.headerContent, { paddingTop: insets.top + 16 }]}>
            <View style={styles.headerBar}>
              <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={styles.headerTitleSection}>
                <Text style={styles.headerName} numberOfLines={1}>Teklif Detayı</Text>
              </View>
              <View style={styles.headerActionsPlaceholder} />
            </View>
          </View>

          <View style={styles.bottomCurve} />
        </View>

        <View style={styles.content}>
          <View style={styles.errorState}>
            <View style={styles.errorIcon}>
              <Ionicons name="alert-circle" size={48} color={DashboardColors.danger} />
            </View>
            <Text style={styles.errorTitle}>Bir hata oluştu</Text>
            <Text style={styles.errorText}>{error || 'Teklif bulunamadı'}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={retryFetch}>
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  // Get pricing items from quote (handle different property names)
  const pricingItems = (quote as any).pricing_items || []

  // Get cargo items - flatten from load_items if necessary
  const cargoItems = (quote as any).cargo_items || []

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={['#022920', '#044134', '#065f4a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.glowOrb1} />
        <View style={styles.glowOrb2} />

        <View style={[styles.headerContent, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerBar}>
            <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>

            <View style={styles.headerTitleSection}>
              <Text style={styles.headerName} numberOfLines={1}>
                {quote.quote_number || 'Teklif Detayı'}
              </Text>
            </View>

            {quote.can_edit && (
              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.headerButton} onPress={() => router.push(`/crm/quotes/${id}/edit`)}>
                  <Ionicons name="create-outline" size={22} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.headerButton, styles.deleteButton]}
                  onPress={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="trash-outline" size={22} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            )}
            {!quote.can_edit && <View style={styles.headerActionsPlaceholder} />}
          </View>
        </View>

        <View style={styles.bottomCurve} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={DashboardColors.primary} />
        }
      >
        <QuoteHeaderCard quote={quote} colors={colors} />

        <PricingCard quote={quote} colors={colors} />

        <DatesInfoCard quote={quote} colors={colors} />

        <PricingItemsCard
          items={pricingItems}
          defaultCurrency={quote.currency}
          colors={colors}
        />

        <CargoItemsCard items={cargoItems} colors={colors} />

        <NotesCard
          termsConditions={quote.terms_conditions}
          internalNotes={quote.internal_notes}
          customerNotes={quote.customer_notes}
          colors={colors}
        />

        <QuoteActionButtons
          status={quote.status}
          isSending={isSending}
          isDuplicating={isDuplicating}
          onSend={handleSend}
          onDuplicate={handleDuplicate}
          onExportPdf={handleExportPdf}
          colors={{ light: { success: DashboardColors.success, danger: DashboardColors.danger, textSecondary: DashboardColors.textSecondary } }}
        />

        {/* Alt boşluk */}
        <View style={{ height: insets.bottom + DashboardSpacing['3xl'] }} />
      </ScrollView>

      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Teklifi Sil"
        message="Bu teklifi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmText="Sil"
        cancelText="İptal"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        variant="danger"
        loading={isDeleting}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DashboardColors.primary
  },

  // Header
  headerContainer: {
    position: 'relative',
    overflow: 'hidden',
    paddingBottom: 24
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
    paddingHorizontal: DashboardSpacing.lg,
    paddingBottom: DashboardSpacing.lg
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DashboardSpacing.md
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitleSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    marginHorizontal: DashboardSpacing.md
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm
  },
  headerActionsPlaceholder: {
    width: 96 // 44 + 8 + 44 (iki buton + gap)
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)'
  },
  headerName: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
    flex: 1
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

  // İçerik
  content: {
    flex: 1,
    backgroundColor: DashboardColors.background
  },
  contentContainer: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: 0,
  },

  // Loading
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DashboardSpacing['2xl'],
    paddingVertical: DashboardSpacing['3xl']
  },
  loadingText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    marginTop: DashboardSpacing.md
  },

  // Hata durumu
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DashboardSpacing['2xl'],
    paddingVertical: DashboardSpacing['3xl']
  },
  errorIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: DashboardColors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.xl
  },
  errorTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.sm,
    textAlign: 'center'
  },
  errorText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    textAlign: 'center',
    marginBottom: DashboardSpacing.xl
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    backgroundColor: DashboardColors.danger,
    paddingHorizontal: DashboardSpacing.xl,
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg
  },
  retryButtonText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: '#fff'
  }
})
