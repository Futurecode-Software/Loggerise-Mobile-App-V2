/**
 * Custom Hook for Quote Detail Operations
 *
 * Manages quote fetching, delete, send, duplicate, and export operations.
 * Following React patterns from Context7 documentation.
 */

import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useToast } from './use-toast';
import {
  getQuote,
  deleteQuote,
  sendQuote,
  duplicateQuote,
  exportQuotePdf,
  Quote,
} from '@/services/endpoints/quotes';

interface UseQuoteDetailOptions {
  id: string | undefined;
}

interface UseQuoteDetailReturn {
  // Data
  quote: Quote | null;
  // Loading states
  isLoading: boolean;
  refreshing: boolean;
  isDeleting: boolean;
  isSending: boolean;
  isDuplicating: boolean;
  // Error state
  error: string | null;
  // Dialog state
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (show: boolean) => void;
  // Actions
  refresh: () => void;
  handleDelete: () => void;
  handleConfirmDelete: () => Promise<void>;
  handleSend: () => Promise<void>;
  handleDuplicate: () => Promise<void>;
  handleExportPdf: () => Promise<void>;
  retryFetch: () => void;
}

export function useQuoteDetail({ id }: UseQuoteDetailOptions): UseQuoteDetailReturn {
  const { success, error: showError } = useToast();

  // Data state
  const [quote, setQuote] = useState<Quote | null>(null);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch quote data
  const fetchQuote = useCallback(async () => {
    if (!id) return;

    try {
      setError(null);
      const data = await getQuote(parseInt(id, 10));
      setQuote(data);
    } catch (err) {
      console.error('Quote fetch error:', err);
      setError(err instanceof Error ? err.message : 'Teklif bilgileri yüklenemedi');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  // Initial fetch
  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  // Refresh handler
  const refresh = useCallback(() => {
    setRefreshing(true);
    fetchQuote();
  }, [fetchQuote]);

  // Retry fetch handler
  const retryFetch = useCallback(() => {
    setIsLoading(true);
    fetchQuote();
  }, [fetchQuote]);

  // Delete handler
  const handleDelete = useCallback(() => {
    if (quote && !quote.can_delete) {
      Alert.alert(
        'Silinemez',
        'Bu teklif silinemez. Yüklere dönüştürülmüş teklifler silinemez.',
        [{ text: 'Tamam' }]
      );
      return;
    }
    setShowDeleteConfirm(true);
  }, [quote]);

  // Confirm delete handler
  const handleConfirmDelete = useCallback(async () => {
    if (!id) return;

    setIsDeleting(true);
    try {
      await deleteQuote(parseInt(id, 10));
      success('Başarılı', 'Teklif silindi.');
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (err) {
      showError('Hata', err instanceof Error ? err.message : 'Teklif silinemedi.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [id, success, showError]);

  // Send handler
  const handleSend = useCallback(async () => {
    if (!quote || !id) return;

    if (!quote.can_convert_to_loads) {
      Alert.alert(
        'Gönderilemez',
        'Bu teklif gönderilemez. Teklifin taslak durumunda olması ve yük kalemi içermesi gerekir.',
        [{ text: 'Tamam' }]
      );
      return;
    }

    setIsSending(true);
    try {
      const updated = await sendQuote(parseInt(id, 10));
      setQuote(updated);
      success('Başarılı', 'Teklif müşteriye gönderildi.');
    } catch (err) {
      showError('Hata', err instanceof Error ? err.message : 'Teklif gönderilemedi.');
    } finally {
      setIsSending(false);
    }
  }, [quote, id, success, showError]);

  // Duplicate handler
  const handleDuplicate = useCallback(async () => {
    if (!id) return;

    setIsDuplicating(true);
    try {
      const duplicated = await duplicateQuote(parseInt(id, 10));
      success('Başarılı', 'Teklif kopyalandı.');
      setTimeout(() => {
        router.replace(`/quote/${duplicated.id}` as any);
      }, 1500);
    } catch (err) {
      showError('Hata', err instanceof Error ? err.message : 'Teklif kopyalanamadı.');
    } finally {
      setIsDuplicating(false);
    }
  }, [id, success, showError]);

  // Export PDF handler
  const handleExportPdf = useCallback(async () => {
    if (!id) return;

    try {
      success('İndiriliyor', 'PDF hazırlanıyor...');
      const { fileName } = await exportQuotePdf(parseInt(id, 10));
      success('Başarılı', `PDF indirildi: ${fileName}`);
    } catch (err) {
      showError('Hata', err instanceof Error ? err.message : 'PDF oluşturulamadı.');
    }
  }, [id, success, showError]);

  return {
    // Data
    quote,
    // Loading states
    isLoading,
    refreshing,
    isDeleting,
    isSending,
    isDuplicating,
    // Error state
    error,
    // Dialog state
    showDeleteConfirm,
    setShowDeleteConfirm,
    // Actions
    refresh,
    handleDelete,
    handleConfirmDelete,
    handleSend,
    handleDuplicate,
    handleExportPdf,
    retryFetch,
  };
}
