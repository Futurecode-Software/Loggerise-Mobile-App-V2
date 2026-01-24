import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft,
  Clock,
  User,
  FileText,
  RotateCcw,
  AlertCircle,
  GitBranch,
} from 'lucide-react-native';
import { Card, Badge } from '@/components/ui';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import {
  getQuoteVersions,
  restoreQuoteVersion,
  formatDate,
  QuoteVersion,
  Pagination,
} from '@/services/endpoints/quote-versions';

export default function QuoteVersionsScreen() {
  const colors = Colors.light;
  const { id } = useLocalSearchParams<{ id: string }>();
  const quoteId = parseInt(id, 10);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [versions, setVersions] = useState<QuoteVersion[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  useEffect(() => {
    fetchVersions();
  }, [quoteId]);

  const fetchVersions = async (page: number = 1, append: boolean = false) => {
    try {
      if (!append) {
        setIsLoading(true);
      }
      setError(null);

      const response = await getQuoteVersions(quoteId, { page, per_page: 20 });

      if (append) {
        setVersions((prev) => [...prev, ...response.versions]);
      } else {
        setVersions(response.versions);
      }
      setPagination(response.pagination);
    } catch (err) {
      console.error('Fetch versions error:', err);
      setError(err instanceof Error ? err.message : 'Versiyonlar yüklenemedi');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVersions(1, false);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (
      pagination &&
      pagination.current_page < pagination.last_page &&
      !isLoadingMore &&
      !isLoading
    ) {
      setIsLoadingMore(true);
      fetchVersions(pagination.current_page + 1, true);
    }
  };

  const handleRestore = (version: QuoteVersion) => {
    Alert.alert(
      'Versiyonu Geri Yükle',
      `Versiyon ${version.version_number}'a geri dönmek istediğinizden emin misiniz? Mevcut durum yedeklenecek.`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Geri Yükle',
          onPress: async () => {
            try {
              await restoreQuoteVersion(quoteId, version.id);
              Alert.alert('Başarılı', 'Versiyon başarıyla geri yüklendi', [
                { text: 'Tamam', onPress: () => router.back() },
              ]);
            } catch (err) {
              Alert.alert('Hata', err instanceof Error ? err.message : 'İşlem başarısız');
            }
          },
        },
      ]
    );
  };

  const renderVersionItem = ({ item, index }: { item: QuoteVersion; index: number }) => {
    const isLatest = index === 0;

    return (
      <TouchableOpacity
        style={[
          styles.versionCard,
          { backgroundColor: isLatest ? Brand.primary + '10' : colors.surface },
        ]}
        onPress={() => router.push(`/quotes/${quoteId}/versions/${item.id}` as any)}
        activeOpacity={0.7}
      >
        <View style={styles.versionHeader}>
          <View style={[styles.versionIcon, { backgroundColor: Brand.primary + '15' }]}>
            <GitBranch size={20} color={Brand.primary} />
          </View>
          <View style={styles.versionInfo}>
            <View style={styles.versionTitleRow}>
              <Text style={[styles.versionNumber, { color: colors.text }]}>
                Versiyon {item.version_number}
              </Text>
              {isLatest && (
                <Badge label="Güncel" variant="success" size="sm" />
              )}
            </View>
            {item.created_by && (
              <View style={styles.versionMeta}>
                <User size={12} color={colors.textMuted} />
                <Text style={[styles.versionMetaText, { color: colors.textSecondary }]}>
                  {item.created_by.name}
                </Text>
              </View>
            )}
            <View style={styles.versionMeta}>
              <Clock size={12} color={colors.textMuted} />
              <Text style={[styles.versionMetaText, { color: colors.textSecondary }]}>
                {formatDate(item.created_at)}
              </Text>
            </View>
          </View>
        </View>

        {item.change_reason && (
          <View style={styles.changeReason}>
            <FileText size={14} color={colors.textMuted} />
            <Text style={[styles.changeReasonText, { color: colors.textSecondary }]}>
              {item.change_reason}
            </Text>
          </View>
        )}

        {!isLatest && (
          <TouchableOpacity
            style={[styles.restoreButton, { backgroundColor: Brand.primary + '15' }]}
            onPress={() => handleRestore(item)}
          >
            <RotateCcw size={16} color={Brand.primary} />
            <Text style={[styles.restoreButtonText, { color: Brand.primary }]}>
              Geri Yükle
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.surface }]}>
        <GitBranch size={48} color={colors.textMuted} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>Henüz versiyon yok</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Teklif güncellendiğinde otomatik olarak versiyonlar oluşturulacak
      </Text>
    </View>
  );

  const renderLoadingFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={Brand.primary} />
      </View>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Versiyon Geçmişi</Text>
        </View>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Versiyonlar yükleniyor...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Versiyon Geçmişi</Text>
        </View>
        <View style={styles.errorState}>
          <View style={[styles.errorIcon, { backgroundColor: colors.danger + '15' }]}>
            <AlertCircle size={64} color={colors.danger} />
          </View>
          <Text style={[styles.errorTitle, { color: colors.text }]}>Bir hata oluştu</Text>
          <Text style={[styles.errorSubtitle, { color: colors.textSecondary }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Brand.primary }]}
            onPress={() => {
              setIsLoading(true);
              fetchVersions();
            }}
          >
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Versiyon Geçmişi ({versions.length})
        </Text>
        <View style={styles.backButton} />
      </View>

      {/* Versions List */}
      <FlatList
        data={versions}
        renderItem={renderVersionItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Brand.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderLoadingFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.sm,
    width: 40,
  },
  headerTitle: {
    ...Typography.headingLG,
    flex: 1,
    textAlign: 'center',
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing['2xl'],
  },
  versionCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  versionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  versionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  versionInfo: {
    flex: 1,
  },
  versionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  versionNumber: {
    ...Typography.bodyLG,
    fontWeight: '700',
  },
  versionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 4,
  },
  versionMetaText: {
    ...Typography.bodyXS,
  },
  changeReason: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    paddingTop: Spacing.sm,
  },
  changeReasonText: {
    ...Typography.bodySM,
    flex: 1,
    lineHeight: 18,
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  restoreButtonText: {
    ...Typography.bodySM,
    fontWeight: '600',
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...Typography.bodyMD,
    marginTop: Spacing.md,
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  errorIcon: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  errorTitle: {
    ...Typography.headingMD,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  errorSubtitle: {
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['4xl'],
    paddingHorizontal: Spacing['2xl'],
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
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
  loadingFooter: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
});
