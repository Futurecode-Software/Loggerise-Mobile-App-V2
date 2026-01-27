import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import {
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  Target,
  UserPlus,
} from 'lucide-react-native';
import { Card, Badge } from '@/components/ui';
import { FullScreenHeader } from '@/components/header';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import {
  getCrmDashboard,
  CrmDashboardData,
  RecentQuote,
  formatCurrency,
  formatPercentage,
  formatDate,
  getQuoteStatusLabel,
} from '@/services/endpoints/crm';

export default function CrmScreen() {
  const colors = Colors.light;

  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<CrmDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setError(null);
      const response = await getCrmDashboard();
      setData(response);
    } catch (err) {
      console.error('CRM dashboard fetch error:', err);
      setError(err instanceof Error ? err.message : 'CRM verileri yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  };

  const getStatusVariant = (status: string): 'default' | 'info' | 'success' | 'danger' | 'warning' => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'sent':
        return 'info';
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'expired':
        return 'warning';
      default:
        return 'default';
    }
  };

  const renderQuoteItem = (quote: RecentQuote) => (
    <TouchableOpacity
      key={quote.id}
      style={[styles.quoteItem, { backgroundColor: colors.surface }]}
      onPress={() => router.push(`/quote/${quote.id}` as any)}
    >
      <View style={styles.quoteInfo}>
        <Text style={[styles.quoteNumber, { color: colors.text }]}>{quote.quote_number}</Text>
        <Text style={[styles.quoteCustomer, { color: colors.textSecondary }]} numberOfLines={1}>
          {quote.customer_name}
        </Text>
      </View>
      <View style={styles.quoteRight}>
        <Text style={[styles.quoteAmount, { color: colors.text }]}>
          {formatCurrency(quote.total_amount, quote.currency)}
        </Text>
        <Badge
          label={getQuoteStatusLabel(quote.status)}
          variant={getStatusVariant(quote.status)}
          size="sm"
        />
      </View>
    </TouchableOpacity>
  );

  const headerRightIcons = (
    <View style={styles.headerActions}>
      <TouchableOpacity
        onPress={() => router.push('/crm/customers' as any)}
        style={styles.headerActionButton}
        activeOpacity={0.7}
      >
        <Users size={20} color="#FFFFFF" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => router.push('/crm/customers/new' as any)}
        style={styles.headerActionButton}
        activeOpacity={0.7}
      >
        <UserPlus size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: Brand.primary }]}>
        <FullScreenHeader title="CRM" showBackButton rightIcons={headerRightIcons} />
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            CRM verileri yükleniyor...
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: Brand.primary }]}>
        <FullScreenHeader title="CRM" showBackButton rightIcons={headerRightIcons} />
        <View style={styles.errorState}>
          <View style={[styles.errorIcon, { backgroundColor: colors.danger + '15' }]}>
            <AlertCircle size={64} color={colors.danger} />
          </View>
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            Bir hata oluştu
          </Text>
          <Text style={[styles.errorSubtitle, { color: colors.textSecondary }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Brand.primary }]}
            onPress={() => {
              setIsLoading(true);
              fetchDashboard();
            }}
          >
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Brand.primary }]}>
      <FullScreenHeader title="CRM" showBackButton rightIcons={headerRightIcons} />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Brand.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Won Quotes Card */}
        {data?.wonQuotes && (
          <Card style={[styles.highlightCard, { backgroundColor: Brand.primary }]}>
            <View style={styles.highlightHeader}>
              <View style={styles.highlightIcon}>
                <Target size={24} color="#FFFFFF" />
              </View>
              <View style={styles.highlightInfo}>
                <Text style={styles.highlightLabel}>Kazanılan Teklifler</Text>
                <Text style={styles.highlightValue}>
                  {formatCurrency(data.wonQuotes.amount, data.currency || data.wonQuotes.currency)}
                </Text>
              </View>
              <View style={styles.growthBadge}>
                {data.wonQuotes.growthPercentage >= 0 ? (
                  <TrendingUp size={14} color="#FFFFFF" />
                ) : (
                  <TrendingDown size={14} color="#FFFFFF" />
                )}
                <Text style={styles.growthText}>
                  {formatPercentage(data.wonQuotes.growthPercentage)}
                </Text>
              </View>
            </View>
            <Text style={styles.highlightCount}>
              {data.wonQuotes.count} teklif kabul edildi
            </Text>

            {/* Currency breakdown if multiple currencies exist */}
            {data.wonQuotes.breakdown && data.wonQuotes.breakdown.length > 1 && (
              <View style={styles.breakdownContainer}>
                {data.wonQuotes.breakdown.map((item, index) => (
                  <Text key={index} style={styles.breakdownText}>
                    {formatCurrency(item.amount, item.currency)} ({item.count} teklif)
                  </Text>
                ))}
              </View>
            )}
          </Card>
        )}

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.info + '15' }]}>
              <FileText size={20} color={colors.info} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {data?.quoteStats?.total || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Toplam Teklif</Text>
          </Card>

          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.success + '15' }]}>
              <CheckCircle size={20} color={colors.success} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {data?.quoteStats?.accepted || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Kabul Edilen</Text>
          </Card>

          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.warning + '15' }]}>
              <Clock size={20} color={colors.warning} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {data?.quoteStats?.sent || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Bekleyen</Text>
          </Card>

          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.danger + '15' }]}>
              <XCircle size={20} color={colors.danger} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {data?.quoteStats?.rejected || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Reddedilen</Text>
          </Card>
        </View>

        {/* Conversion Rate & Customer Stats */}
        <View style={styles.metricsRow}>
          <Card style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Target size={18} color={Brand.primary} />
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                Dönüşüm Oranı
              </Text>
            </View>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              %{data?.conversionRate?.toFixed(1) || 0}
            </Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Users size={18} color={Brand.primary} />
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                Aktif Müşteriler
              </Text>
            </View>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {data?.customerStats?.activeThisMonth || 0}
            </Text>
          </Card>
        </View>

        {/* Quick Actions - CRM Customers */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>CRM Müşterileri</Text>
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => router.push('/crm/customers' as any)}
            >
              <Text style={[styles.seeAllText, { color: Brand.primary }]}>Tümünü Gör</Text>
              <ChevronRight size={16} color={Brand.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={[styles.quickActionCard, { backgroundColor: colors.surface }]}
              onPress={() => router.push('/crm/customers' as any)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: Brand.primary + '15' }]}>
                <Users size={24} color={Brand.primary} />
              </View>
              <Text style={[styles.quickActionLabel, { color: colors.text }]}>
                Müşteri Listesi
              </Text>
              <Text style={[styles.quickActionCount, { color: colors.textMuted }]}>
                {data?.customerStats?.activeThisMonth || 0} aktif
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickActionCard, { backgroundColor: colors.surface }]}
              onPress={() => router.push('/crm/customers/new' as any)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.success + '15' }]}>
                <UserPlus size={24} color={colors.success} />
              </View>
              <Text style={[styles.quickActionLabel, { color: colors.text }]}>
                Yeni Müşteri
              </Text>
              <Text style={[styles.quickActionCount, { color: colors.textMuted }]}>
                Müşteri ekle
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Recent Quotes */}
        {data?.recentQuotes && data.recentQuotes.length > 0 && (
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Son Teklifler</Text>
              <TouchableOpacity
                style={styles.seeAllButton}
                onPress={() => router.push('/quotes' as any)}
              >
                <Text style={[styles.seeAllText, { color: Brand.primary }]}>Tümünü Gör</Text>
                <ChevronRight size={16} color={Brand.primary} />
              </TouchableOpacity>
            </View>
            {data.recentQuotes.slice(0, 5).map(renderQuoteItem)}
          </Card>
        )}

        {/* Pending Quotes */}
        {data?.pendingQuotes && data.pendingQuotes.length > 0 && (
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Bekleyen Teklifler</Text>
            </View>
            {data.pendingQuotes.slice(0, 5).map(renderQuoteItem)}
          </Card>
        )}

        {/* Expiring Quotes */}
        {data?.expiringQuotes && data.expiringQuotes.length > 0 && (
          <Card style={[styles.sectionCard, { borderColor: colors.warning, borderWidth: 1 }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <AlertCircle size={18} color={colors.warning} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Süresi Dolacak Teklifler
                </Text>
              </View>
            </View>
            {data.expiringQuotes.slice(0, 5).map(renderQuoteItem)}
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.primary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerActionButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Brand.primary + '15',
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
    paddingBottom: Spacing['2xl'],
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
  highlightCard: {
    padding: Spacing.xl,
  },
  highlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  highlightIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  highlightInfo: {
    flex: 1,
  },
  highlightLabel: {
    ...Typography.bodySM,
    color: 'rgba(255,255,255,0.8)',
  },
  highlightValue: {
    ...Typography.headingXL,
    color: '#FFFFFF',
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  growthText: {
    ...Typography.bodySM,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  highlightCount: {
    ...Typography.bodySM,
    color: 'rgba(255,255,255,0.8)',
  },
  breakdownContainer: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    gap: Spacing.xs,
  },
  breakdownText: {
    ...Typography.bodyXS,
    color: 'rgba(255,255,255,0.7)',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    ...Typography.headingLG,
  },
  statLabel: {
    ...Typography.bodyXS,
    textAlign: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  metricCard: {
    flex: 1,
    padding: Spacing.lg,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  metricLabel: {
    ...Typography.bodySM,
  },
  metricValue: {
    ...Typography.headingXL,
  },
  sectionCard: {
    padding: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.headingMD,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    ...Typography.bodySM,
    fontWeight: '600',
  },
  quoteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  quoteInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  quoteNumber: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  quoteCustomer: {
    ...Typography.bodySM,
  },
  quoteRight: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  quoteAmount: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  quickActionCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  quickActionLabel: {
    ...Typography.bodyMD,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  quickActionCount: {
    ...Typography.bodyXS,
  },
});
