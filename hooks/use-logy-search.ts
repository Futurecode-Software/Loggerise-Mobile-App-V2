/**
 * useLoggySearch Hook
 *
 * Custom hook for managing Loggy AI conversations search functionality.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { searchConversations, AiConversation } from '@/services/endpoints/loggy';

interface UseLoggySearchReturn {
  // Data
  searchQuery: string;
  searchResults: AiConversation[];

  // State
  isSearching: boolean;

  // Actions
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
}

export function useLoggySearch(): UseLoggySearchReturn {
  const [searchQuery, setSearchQueryState] = useState('');
  const [searchResults, setSearchResults] = useState<AiConversation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle search
  const handleSearch = useCallback(async (query: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchConversations(query);
        setSearchResults(results);
      } catch (err) {
        if (__DEV__) console.error('Search error:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  // Set search query
  const setSearchQuery = useCallback(
    (query: string) => {
      setSearchQueryState(query);
      handleSearch(query);
    },
    [handleSearch]
  );

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQueryState('');
    setSearchResults([]);
    setIsSearching(false);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return {
    searchQuery,
    searchResults,
    isSearching,
    setSearchQuery,
    clearSearch,
  };
}
