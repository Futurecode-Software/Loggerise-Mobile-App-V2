/**
 * useFetchData Hook
 *
 * A robust data fetching hook that prevents duplicate API calls.
 * Uses proper dependency tracking and race condition handling.
 *
 * Key features:
 * - Prevents duplicate calls on mount (React StrictMode safe)
 * - Proper cleanup on unmount
 * - Race condition handling with AbortController
 * - Separate tracking for initial load vs filter changes
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseFetchDataOptions<T, F> {
  /** Fetch function that returns data */
  fetchFn: (filters: F, signal?: AbortSignal) => Promise<T>;
  /** Initial filters */
  initialFilters: F;
  /** Dependencies that should trigger a fresh fetch (not append) */
  dependencies?: any[];
  /** Whether to fetch on mount */
  fetchOnMount?: boolean;
  /** Debounce delay for filter changes (ms) */
  debounceMs?: number;
}

interface UseFetchDataReturn<T, F> {
  data: T | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  filters: F;
  setFilters: (filters: F | ((prev: F) => F)) => void;
  refresh: () => Promise<void>;
  retry: () => void;
}

export function useFetchData<T, F extends Record<string, any>>({
  fetchFn,
  initialFilters,
  dependencies = [],
  fetchOnMount = true,
  debounceMs = 0,
}: UseFetchDataOptions<T, F>): UseFetchDataReturn<T, F> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(fetchOnMount);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<F>(initialFilters);

  // Refs to prevent duplicate calls and handle race conditions
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fetchIdRef = useRef(0);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasInitialFetchRef = useRef(false);

  // Store fetchFn in ref to avoid dependency issues
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  // Core fetch function
  const executeFetch = useCallback(async (currentFilters: F, isRefresh = false) => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Track this specific fetch
    const currentFetchId = ++fetchIdRef.current;

    try {
      setError(null);

      if (isRefresh) {
        setIsRefreshing(true);
      } else if (!hasInitialFetchRef.current) {
        setIsLoading(true);
      }

      const result = await fetchFnRef.current(currentFilters, abortController.signal);

      // Only update state if this is still the latest fetch and component is mounted
      if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
        setData(result);
        hasInitialFetchRef.current = true;
      }
    } catch (err: any) {
      // Ignore abort errors
      if (err.name === 'AbortError') {
        return;
      }

      // Only update error if this is still the latest fetch
      if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
        if (__DEV__) console.error('[useFetchData] Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Veri yüklenemedi');
      }
    } finally {
      // Only update loading state if this is still the latest fetch
      if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  // Set filters with optional callback form
  const setFilters = useCallback((newFilters: F | ((prev: F) => F)) => {
    setFiltersState((prev) => {
      if (typeof newFilters === 'function') {
        return (newFilters as (prev: F) => F)(prev);
      }
      return newFilters;
    });
  }, []);

  // Initial fetch - only run once on mount
  useEffect(() => {
    if (!fetchOnMount) return;

    // Prevent double fetch in StrictMode
    if (hasInitialFetchRef.current) return;

    executeFetch(filters);

    return () => {
      // Cleanup on unmount
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []); // Empty deps - only run on mount

  // Filter changes - with optional debounce
  useEffect(() => {
    // Skip initial render (handled by mount effect)
    if (!hasInitialFetchRef.current) return;

    // Clear existing debounce
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (debounceMs > 0) {
      debounceTimeoutRef.current = setTimeout(() => {
        setIsLoading(true);
        executeFetch(filters);
      }, debounceMs);
    } else {
      setIsLoading(true);
      executeFetch(filters);
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [filters, debounceMs, executeFetch]);

  // External dependency changes
  useEffect(() => {
    // Skip if initial fetch hasn't happened yet
    if (!hasInitialFetchRef.current) return;

    setIsLoading(true);
    executeFetch(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  // Refresh function
  const refresh = useCallback(async () => {
    await executeFetch(filters, true);
  }, [filters, executeFetch]);

  // Retry function
  const retry = useCallback(() => {
    setIsLoading(true);
    executeFetch(filters);
  }, [filters, executeFetch]);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    filters,
    setFilters,
    refresh,
    retry,
  };
}

/**
 * useFetchList Hook
 *
 * Extended version for paginated lists with load more support.
 */

interface PaginationInfo {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

interface UseFetchListOptions<T, F> {
  /** Fetch function that returns paginated data */
  fetchFn: (filters: F & { page: number }, signal?: AbortSignal) => Promise<{
    items: T[];
    pagination: PaginationInfo;
  }>;
  /** Initial filters (without page) */
  initialFilters: F;
  /** Items per page */
  perPage?: number;
  /** Debounce delay for search/filter changes */
  debounceMs?: number;
}

interface UseFetchListReturn<T, F> {
  items: T[];
  pagination: PaginationInfo | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  error: string | null;
  filters: F;
  setFilters: (filters: F | ((prev: F) => F)) => void;
  refresh: () => Promise<void>;
  loadMore: () => void;
  retry: () => void;
}

export function useFetchList<T, F extends Record<string, any>>({
  fetchFn,
  initialFilters,
  perPage = 20,
  debounceMs = 0,
}: UseFetchListOptions<T, F>): UseFetchListReturn<T, F> {
  const [items, setItems] = useState<T[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<F>(initialFilters);

  // Refs
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fetchIdRef = useRef(0);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasInitialFetchRef = useRef(false);
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  // Core fetch function
  const executeFetch = useCallback(
    async (currentFilters: F, page: number, append: boolean, isRefresh = false) => {
      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      const currentFetchId = ++fetchIdRef.current;

      try {
        setError(null);

        if (isRefresh) {
          setIsRefreshing(true);
        } else if (append) {
          setIsLoadingMore(true);
        } else if (!hasInitialFetchRef.current) {
          setIsLoading(true);
        }

        const result = await fetchFnRef.current(
          { ...currentFilters, page, per_page: perPage } as F & { page: number },
          abortController.signal
        );

        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (append) {
            setItems((prev) => [...prev, ...result.items]);
          } else {
            setItems(result.items);
          }
          setPagination(result.pagination);
          hasInitialFetchRef.current = true;
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;

        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (__DEV__) console.error('[useFetchList] Fetch error:', err);
          setError(err instanceof Error ? err.message : 'Veri yüklenemedi');
        }
      } finally {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          setIsLoading(false);
          setIsLoadingMore(false);
          setIsRefreshing(false);
        }
      }
    },
    [perPage]
  );

  // Set filters
  const setFilters = useCallback((newFilters: F | ((prev: F) => F)) => {
    setFiltersState((prev) => {
      if (typeof newFilters === 'function') {
        return (newFilters as (prev: F) => F)(prev);
      }
      return newFilters;
    });
  }, []);

  // Initial fetch
  useEffect(() => {
    if (hasInitialFetchRef.current) return;
    executeFetch(filters, 1, false);

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Filter changes with debounce
  useEffect(() => {
    if (!hasInitialFetchRef.current) return;

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (debounceMs > 0) {
      debounceTimeoutRef.current = setTimeout(() => {
        setIsLoading(true);
        executeFetch(filters, 1, false);
      }, debounceMs);
    } else {
      setIsLoading(true);
      executeFetch(filters, 1, false);
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [filters, debounceMs, executeFetch]);

  // Refresh
  const refresh = useCallback(async () => {
    await executeFetch(filters, 1, false, true);
  }, [filters, executeFetch]);

  // Load more
  const loadMore = useCallback(() => {
    if (
      !isLoadingMore &&
      !isLoading &&
      pagination &&
      pagination.current_page < pagination.last_page
    ) {
      executeFetch(filters, pagination.current_page + 1, true);
    }
  }, [filters, pagination, isLoading, isLoadingMore, executeFetch]);

  // Retry
  const retry = useCallback(() => {
    setIsLoading(true);
    executeFetch(filters, 1, false);
  }, [filters, executeFetch]);

  return {
    items,
    pagination,
    isLoading,
    isLoadingMore,
    isRefreshing,
    error,
    filters,
    setFilters,
    refresh,
    loadMore,
    retry,
  };
}
