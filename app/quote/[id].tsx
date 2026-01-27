/**
 * Quote Detail Screen
 *
 * Shows quote details with load items, pricing, and actions.
 * Refactored using custom hooks and reusable components following React patterns.
 * Updated to match DESIGN_STANDARDS.md
 */

import React from 'react';
import { View, ScrollView, RefreshControl, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Colors, Spacing, Brand, Shadows } from '@/constants/theme';
import { FullScreenHeader } from '@/components/header';
import { useQuoteDetail } from '@/hooks/use-quote-detail';
import { Edit, Trash2 } from 'lucide-react-native';
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
} from '@/components/quote-detail';

export default function QuoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = Colors.light;

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
  } = useQuoteDetail({ id });

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <FullScreenHeader title="Teklif Detayı" showBackButton />
        <View style={styles.content}>
          <LoadingState message="Teklif yükleniyor..." colors={colors} />
        </View>
      </View>
    );
  }

  // Error state
  if (error || !quote) {
    return (
      <View style={styles.container}>
        <FullScreenHeader title="Teklif Detayı" showBackButton />
        <View style={styles.content}>
          <ErrorState
            title="Bir hata oluştu"
            message={error || 'Teklif bulunamadı'}
            onRetry={retryFetch}
            colors={colors}
          />
        </View>
      </View>
    );
  }

  // Get pricing items from quote (handle different property names)
  const pricingItems = (quote as any).pricing_items || [];

  // Get cargo items - flatten from load_items if necessary
  const cargoItems = (quote as any).cargo_items || [];

  return (
    <View style={styles.container}>
      <FullScreenHeader
        title={quote.quote_number || 'Teklif Detayı'}
        subtitle={quote.contact?.name || quote.customer_name}
        showBackButton
        rightIcons={
          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            {quote.can_edit && (
              <TouchableOpacity
                onPress={() => router.push(`/quote/${id}/edit`)}
                activeOpacity={0.7}
              >
                <Edit size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleDelete}
              activeOpacity={0.7}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Trash2 size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Brand.primary} />
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
          colors={colors}
        />
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
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing['4xl'],
  },
});
