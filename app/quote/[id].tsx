/**
 * Quote Detail Screen
 *
 * Shows quote details with load items, pricing, and actions.
 * Refactored using custom hooks and reusable components following React patterns.
 */

import React from 'react';
import { ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Colors, Spacing, Brand } from '@/constants/theme';
import { useQuoteDetail } from '@/hooks/use-quote-detail';
import {
  DetailHeader,
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
    return <LoadingState message="Teklif yükleniyor..." colors={colors} />;
  }

  // Error state
  if (error || !quote) {
    return (
      <ErrorState
        title="Bir hata oluştu"
        message={error || 'Teklif bulunamadı'}
        onRetry={retryFetch}
        colors={colors}
      />
    );
  }

  // Get pricing items from quote (handle different property names)
  const pricingItems = (quote as any).pricing_items || [];

  // Get cargo items - flatten from load_items if necessary
  const cargoItems = (quote as any).cargo_items || [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <DetailHeader
        title="Teklif Detayı"
        canEdit={quote.can_edit}
        onDelete={handleDelete}
        colors={colors}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
});
