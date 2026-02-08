/**
 * Custom Hook for Quote Detail Operations
 *
 * Manages quote fetching, delete, send, duplicate, and export operations.
 * Following React patterns from Context7 documentation.
 *
 * FIXED: Prevents duplicate API calls using proper useEffect dependency tracking.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
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

  // Refs to prevent duplicate calls and track mount state
  const isMountedRef = useRef(true);
  const fetchIdRef = useRef(0);
  const hasFetchedRef = useRef(false);

  // Fetch quote data - using ref pattern to avoid stale closures
  const fetchQuote = useCallback(async (isRefresh = false) => {
    if (!id) return;

    const currentFetchId = ++fetchIdRef.current;

    try {
      setError(null);
      if (isRefresh) {
        setRefreshing(true);
      }

      const data = await getQuote(parseInt(id, 10));

      // Only update state if this is the latest fetch and component is mounted
      if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
        setQuote(data);
        hasFetchedRef.current = true;
      }
    } catch (err) {
      if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
        if (__DEV__) console.error('Quote fetch error:', err);
        setError(err instanceof Error ? err.message : 'Teklif bilgileri yüklenemedi');
      }
    } finally {
      if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
        setIsLoading(false);
        setRefreshing(false);
      }
    }
  }, [id]);

  // Initial fetch - only run once when id is available
  // Using id directly as dependency, not the callback function
  useEffect(() => {
    if (!id) return;

    // Prevent duplicate fetch in StrictMode
    if (hasFetchedRef.current) return;

    isMountedRef.current = true;
    fetchQuote();

    return () => {
      isMountedRef.current = false;
    };
  }, [id]); // Only depend on id, not fetchQuote

  // Refresh handler
  const refresh = useCallback(() => {
    fetchQuote(true);
  }, [fetchQuote]);

  // Retry fetch handler
  const retryFetch = useCallback(() => {
    hasFetchedRef.current = false; // Allow refetch
    setIsLoading(true);
    fetchQuote();
  }, [fetchQuote]);

  // Delete handler
  const handleDelete = useCallback(() => {
    if (quote && !quote.can_delete) {
      showError('Silinemez', 'Bu teklif silinemez. Yüklere dönüştürülmüş teklifler silinemez.');
      return;
    }
    setShowDeleteConfirm(true);
  }, [quote, showError]);

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
      showError('Gönderilemez', 'Bu teklif gönderilemez. Teklifin taslak durumunda olması ve yük kalemi içermesi gerekir.');
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
