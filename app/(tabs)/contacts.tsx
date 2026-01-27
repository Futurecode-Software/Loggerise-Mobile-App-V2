import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  Search,
  Filter,
  Plus,
  User,
  AlertCircle,
} from 'lucide-react-native';
import { Card, Badge, Avatar, Input, SkeletonList } from '@/components/ui';
import { FullScreenHeader } from '@/components/header';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
// useColorScheme kaldirildi - her zaman light mode kullanilir
import {
  getContacts,
  Contact,
  ContactFilters,
  Pagination,
} from '@/services/endpoints/contacts';

const FILTER_CHIPS = [
  { id: 'all', label: 'Tümü' },
  { id: 'customer', label: 'Müşteri' },
  { id: 'supplier', label: 'Tedarikçi' },
  { id: 'company', label: 'Şirket' },
  { id: 'individual', label: 'Bireysel' },
];

export default function ContactsScreen() {
  // Her zaman light mode kullanilir
  const colors = Colors.light;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // API state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs to prevent duplicate calls
  const isMountedRef = useRef(true);
  const fetchIdRef = useRef(0);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const hasInitialFetchRef = useRef(false);
  const isFirstFocusRef = useRef(true);

  // Core fetch function - doesn't depend on search/filter state
  const executeFetch = useCallback(
    async (
      search: string,
      filter: string,
      page: number = 1,
      append: boolean = false,
      isRefresh: boolean = false
    ) => {
      const currentFetchId = ++fetchIdRef.current;

      try {
        setError(null);

        // Build filters
        const filters: ContactFilters = {
          page,
          per_page: 20,
          is_active: true,
        };

        // Add search filter
        if (search.trim()) {
          filters.search = search.trim();
        }

        // Add type/role filter
        if (filter === 'customer') {
          // is_customer filter not available, use type filter logic in UI
        } else if (filter === 'supplier') {
          // is_supplier filter not available, use type filter logic in UI
        } else if (filter === 'company') {
          filters.type = 'company';
        } else if (filter === 'individual') {
          filters.type = 'individual';
        }

        const response = await getContacts(filters);

        // Only update if this is still the latest request
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (append) {
            setContacts((prev) => [...prev, ...response.contacts]);
          } else {
            setContacts(response.contacts);
          }
          setPagination(response.pagination);
          hasInitialFetchRef.current = true;
        }
      } catch (err) {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          console.error('Contacts fetch error:', err);
          setError(err instanceof Error ? err.message : 'Cariler yüklenemedi');
        }
      } finally {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          setIsLoading(false);
          setIsLoadingMore(false);
          setRefreshing(false);
        }
      }
    },
    []
  );

  // Initial fetch - only once on mount
  useEffect(() => {
    isMountedRef.current = true;
    executeFetch(searchQuery, activeFilter, 1, false);

    return () => {
      isMountedRef.current = false;
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []); // Empty deps - only run on mount

  // Filter change - immediate fetch
  useEffect(() => {
    if (!hasInitialFetchRef.current) return;

    setIsLoading(true);
    executeFetch(searchQuery, activeFilter, 1, false);
  }, [activeFilter]); // Only activeFilter

  // Search with debounce
  useEffect(() => {
    if (!hasInitialFetchRef.current) return;

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setIsLoading(true);
      executeFetch(searchQuery, activeFilter, 1, false);
    }, 500);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery]); // Only searchQuery

  // Sayfa odaklandığında listeyi yenile (detay sayfasından dönüşte)
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocusRef.current) {
        isFirstFocusRef.current = false;
        return;
      }

      // Only refresh if we've already fetched once
      if (hasInitialFetchRef.current) {
        // Loading göstermeden sessizce yenile
        executeFetch(searchQuery, activeFilter, 1, false);
      }
    }, [searchQuery, activeFilter, executeFetch])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await executeFetch(searchQuery, activeFilter, 1, false, true);
  };

  const loadMore = () => {
    if (
      !isLoadingMore &&
      pagination &&
      pagination.current_page < pagination.last_page
    ) {
      setIsLoadingMore(true);
      executeFetch(searchQuery, activeFilter, pagination.current_page + 1, true);
    }
  };

  // Filter contacts client-side for customer/supplier filter
  const filteredContacts = contacts.filter((contact) => {
    if (activeFilter === 'customer') {
      return contact.is_customer;
    }
    if (activeFilter === 'supplier') {
      return contact.is_supplier;
    }
    return true;
  });

  const getRoleBadge = (contact: Contact) => {
    if (contact.is_customer && contact.is_supplier) {
      return <Badge label="Her İkisi" variant="default" size="sm" />;
    }
    if (contact.is_customer) {
      return <Badge label="Müşteri" variant="success" size="sm" />;
    }
    if (contact.is_supplier) {
      return <Badge label="Tedarikçi" variant="info" size="sm" />;
    }
    return null;
  };

  const renderContact = ({ item }: { item: Contact }) => (
    <Card
      style={styles.contactCard}
      onPress={() => router.push(`/contact/${item.id}` as any)}
    >
      <View style={styles.contactContent}>
        <Avatar
          name={item.name}
          size="md"
          backgroundColor={
            item.type === 'company' ? colors.successLight : colors.infoLight
          }
        />
        <View style={styles.contactInfo}>
          <View style={styles.contactHeader}>
            <Text
              style={[styles.contactName, { color: colors.text }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            {getRoleBadge(item)}
          </View>
          <Text style={[styles.contactDetail, { color: colors.textSecondary }]}>
            {item.type === 'company'
              ? `VKN: ${item.tax_number || '-'}`
              : `TC: ${item.identity_number || '-'}`}
          </Text>
          {item.email && (
            <Text
              style={[styles.contactEmail, { color: colors.textMuted }]}
              numberOfLines={1}
            >
              {item.email}
            </Text>
          )}
        </View>
      </View>
    </Card>
  );

  const renderEmptyState = () => {
    if (isLoading) {
      return <SkeletonList count={8} type="listItem" />;
    }

    if (error) {
      return (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.danger + '15' }]}>
            <AlertCircle size={64} color={colors.danger} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Bir hata oluştu
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Brand.primary }]}
            onPress={() => {
              setIsLoading(true);
              executeFetch(searchQuery, activeFilter, 1, false);
            }}
          >
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <View style={[styles.emptyIcon, { backgroundColor: colors.surface }]}>
          <User size={64} color={colors.textMuted} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          {searchQuery ? 'Sonuç bulunamadı' : 'Henüz cari eklenmemiş'}
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          {searchQuery
            ? 'Farklı bir arama terimi deneyin'
            : 'Yeni cari eklemek için + butonuna tıklayın'}
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={Brand.primary} />
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: Brand.primary }]}>
      {/* Full Screen Header */}
      <FullScreenHeader
        title="Cariler"
        subtitle={pagination ? `${pagination.total} kayıt` : undefined}
        rightIcons={
          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            <TouchableOpacity
              onPress={() => router.push('/contact/new' as any)}
              activeOpacity={0.7}
            >
              <Plus size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7}>
              <Filter size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Content Area with White Background and Rounded Corners */}
      <View style={styles.contentArea}>
        {/* Search */}
        <View style={styles.searchContainer}>
        <Input
          placeholder="İsim, vergi no veya e-posta ile ara..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={20} color={colors.icon} />}
          containerStyle={styles.searchInput}
        />
      </View>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={FILTER_CHIPS}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                {
                  backgroundColor:
                    activeFilter === item.id ? Brand.primary : colors.card,
                  borderColor:
                    activeFilter === item.id ? Brand.primary : colors.border,
                },
              ]}
              onPress={() => setActiveFilter(item.id)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color:
                      activeFilter === item.id ? '#FFFFFF' : colors.textSecondary,
                  },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Contact List */}
      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderContact}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Brand.primary}
          />
        }
      />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    ...Shadows.lg,
  },
  // Header styles removed - using FullScreenHeader component
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerButton: {
    padding: Spacing.sm,
  },
  countText: {
    ...Typography.bodySM,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  searchInput: {
    marginBottom: 0,
  },
  filterContainer: {
    paddingVertical: Spacing.md,
  },
  filterContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filterChipText: {
    ...Typography.bodySM,
    fontWeight: '500',
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
    flexGrow: 1,
  },
  contactCard: {
    marginBottom: 0,
  },
  contactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  contactInfo: {
    flex: 1,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 2,
  },
  contactName: {
    ...Typography.bodyMD,
    fontWeight: '600',
    flex: 1,
  },
  contactDetail: {
    ...Typography.bodySM,
    marginBottom: 2,
  },
  contactEmail: {
    ...Typography.bodySM,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['4xl'],
  },
  loadingText: {
    ...Typography.bodyMD,
    marginTop: Spacing.md,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing['4xl'],
  },
  emptyIcon: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.headingMD,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...Typography.bodyMD,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: '#FFFFFF',
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  loadingMore: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
});
