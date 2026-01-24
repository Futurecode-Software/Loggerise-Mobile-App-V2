import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Building,
  FileText,
  MessageSquare,
  User,
  Calendar,
  AlertCircle,
  PhoneCall,
  Send,
} from 'lucide-react-native';
import { Card, Badge, Button } from '@/components/ui';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import {
  getCrmCustomer,
  deleteCrmCustomer,
  CrmCustomer,
  getCrmCustomerStatusLabel,
  getCrmCustomerStatusVariant,
  getCustomerSegmentLabel,
  formatDate,
} from '@/services/endpoints/crm-customers';

type TabType = 'general' | 'interactions' | 'quotes';

export default function CrmCustomerDetailScreen() {
  const colors = Colors.light;
  const { id } = useLocalSearchParams<{ id: string }>();
  const customerId = parseInt(id);

  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [customer, setCustomer] = useState<CrmCustomer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomer = useCallback(async () => {
    try {
      setError(null);
      const data = await getCrmCustomer(customerId);
      setCustomer(data);
    } catch (err) {
      console.error('Customer fetch error:', err);
      setError(err instanceof Error ? err.message : 'Müşteri bilgisi yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCustomer();
    setRefreshing(false);
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handleDelete = () => {
    Alert.alert(
      'Müşteriyi Sil',
      'Bu müşteriyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCrmCustomer(customerId);
              router.back();
            } catch (err) {
              Alert.alert(
                'Hata',
                err instanceof Error ? err.message : 'Müşteri silinemedi'
              );
            }
          },
        },
      ]
    );
  };

  const renderGeneralTab = () => (
    <View style={styles.tabContent}>
      {/* Contact Information */}
      <Card style={styles.infoCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>İletişim Bilgileri</Text>

        {customer?.phone && (
          <TouchableOpacity
            style={styles.infoRow}
            onPress={() => handleCall(customer.phone!)}
          >
            <Phone size={18} color={colors.textMuted} />
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Telefon</Text>
            <Text style={[styles.infoValue, { color: Brand.primary }]}>{customer.phone}</Text>
          </TouchableOpacity>
        )}

        {customer?.email && (
          <TouchableOpacity
            style={styles.infoRow}
            onPress={() => handleEmail(customer.email!)}
          >
            <Mail size={18} color={colors.textMuted} />
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>E-posta</Text>
            <Text style={[styles.infoValue, { color: Brand.primary }]}>{customer.email}</Text>
          </TouchableOpacity>
        )}

        {customer?.fax && (
          <View style={styles.infoRow}>
            <PhoneCall size={18} color={colors.textMuted} />
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Faks</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{customer.fax}</Text>
          </View>
        )}
      </Card>

      {/* Company Information */}
      <Card style={styles.infoCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Firma Bilgileri</Text>

        <View style={styles.infoRow}>
          <Building size={18} color={colors.textMuted} />
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Tip</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {customer?.legal_type === 'company' ? 'Şirket' : 'Bireysel'}
          </Text>
        </View>

        {customer?.tax_number && (
          <View style={styles.infoRow}>
            <FileText size={18} color={colors.textMuted} />
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Vergi No</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{customer.tax_number}</Text>
          </View>
        )}

        {customer?.tax_office && (
          <View style={styles.infoRow}>
            <Building size={18} color={colors.textMuted} />
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Vergi Dairesi</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{customer.tax_office.name}</Text>
          </View>
        )}

        {customer?.category && (
          <View style={styles.infoRow}>
            <FileText size={18} color={colors.textMuted} />
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Kategori</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{customer.category}</Text>
          </View>
        )}

        {customer?.customer_segment && (
          <View style={styles.infoRow}>
            <User size={18} color={colors.textMuted} />
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Segment</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {getCustomerSegmentLabel(customer.customer_segment)}
            </Text>
          </View>
        )}
      </Card>

      {/* Last Interaction */}
      {customer?.last_interaction && (
        <Card style={styles.infoCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Son Görüşme</Text>
          <View style={styles.lastInteraction}>
            <View style={styles.interactionHeader}>
              <MessageSquare size={16} color={Brand.primary} />
              <Text style={[styles.interactionSubject, { color: colors.text }]}>
                {customer.last_interaction.subject || 'Görüşme'}
              </Text>
            </View>
            <Text style={[styles.interactionDate, { color: colors.textSecondary }]}>
              {formatDate(customer.last_interaction.interaction_date)}
            </Text>
          </View>
        </Card>
      )}

      {/* Stats */}
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <MessageSquare size={24} color={Brand.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {customer?.interactions_count || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Görüşme</Text>
        </Card>
        <Card style={styles.statCard}>
          <FileText size={24} color={Brand.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {customer?.quotes_count || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Teklif</Text>
        </Card>
      </View>

      {/* Creation Date */}
      <Card style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Calendar size={18} color={colors.textMuted} />
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Oluşturma</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {formatDate(customer?.created_at)}
          </Text>
        </View>
      </Card>
    </View>
  );

  const renderInteractionsTab = () => (
    <View style={styles.tabContent}>
      <Card style={styles.emptyCard}>
        <MessageSquare size={48} color={colors.textMuted} />
        <Text style={[styles.emptyText, { color: colors.text }]}>Görüşme Yönetimi</Text>
        <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
          Bu müşteriyle yapılan görüşmeleri burada görebilirsiniz
        </Text>
        <Button
          title="Yeni Görüşme Ekle"
          onPress={() => router.push(`/crm/customers/${customerId}/interactions/new` as any)}
          variant="primary"
          style={styles.emptyButton}
        />
      </Card>
    </View>
  );

  const renderQuotesTab = () => (
    <View style={styles.tabContent}>
      <Card style={styles.emptyCard}>
        <FileText size={48} color={colors.textMuted} />
        <Text style={[styles.emptyText, { color: colors.text }]}>Teklifler</Text>
        <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
          Bu müşteriye ait teklifleri burada görebilirsiniz
        </Text>
        <Button
          title="Teklif Listesine Git"
          onPress={() => router.push('/quotes' as any)}
          variant="outline"
          style={styles.emptyButton}
        />
      </Card>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Müşteri Detayı</Text>
        </View>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Müşteri bilgisi yükleniyor...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !customer) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Müşteri Detayı</Text>
        </View>
        <View style={styles.errorState}>
          <View style={[styles.errorIcon, { backgroundColor: colors.danger + '15' }]}>
            <AlertCircle size={64} color={colors.danger} />
          </View>
          <Text style={[styles.errorTitle, { color: colors.text }]}>Bir hata oluştu</Text>
          <Text style={[styles.errorSubtitle, { color: colors.textSecondary }]}>
            {error || 'Müşteri bulunamadı'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Brand.primary }]}
            onPress={() => {
              setIsLoading(true);
              fetchCustomer();
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
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {customer.name}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push(`/crm/customers/${customerId}/edit` as any)}
          >
            <Edit size={20} color={Brand.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleDelete}>
            <Trash2 size={20} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Customer Summary Card */}
      <View style={[styles.summaryCard, { backgroundColor: Brand.primary }]}>
        <View style={styles.summaryHeader}>
          <View style={styles.summaryAvatar}>
            <User size={32} color="#FFFFFF" />
          </View>
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryName}>{customer.name}</Text>
            <Text style={styles.summaryCode}>{customer.code}</Text>
          </View>
        </View>
        <View style={styles.summaryBadges}>
          <Badge
            label={getCrmCustomerStatusLabel(customer.status)}
            variant={getCrmCustomerStatusVariant(customer.status)}
            size="md"
          />
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'general' && [
              styles.activeTab,
              { borderBottomColor: Brand.primary },
            ],
          ]}
          onPress={() => setActiveTab('general')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'general' ? Brand.primary : colors.textMuted },
            ]}
          >
            Genel
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'interactions' && [
              styles.activeTab,
              { borderBottomColor: Brand.primary },
            ],
          ]}
          onPress={() => setActiveTab('interactions')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'interactions' ? Brand.primary : colors.textMuted },
            ]}
          >
            Görüşmeler
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'quotes' && [
              styles.activeTab,
              { borderBottomColor: Brand.primary },
            ],
          ]}
          onPress={() => setActiveTab('quotes')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'quotes' ? Brand.primary : colors.textMuted },
            ]}
          >
            Teklifler
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
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
        {activeTab === 'general' && renderGeneralTab()}
        {activeTab === 'interactions' && renderInteractionsTab()}
        {activeTab === 'quotes' && renderQuotesTab()}
      </ScrollView>

      {/* Quick Actions */}
      {customer.phone && (
        <View style={[styles.quickActions, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: Brand.primary }]}
            onPress={() => handleCall(customer.phone!)}
          >
            <Phone size={20} color="#FFFFFF" />
            <Text style={styles.quickActionText}>Ara</Text>
          </TouchableOpacity>
          {customer.email && (
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: colors.info }]}
              onPress={() => handleEmail(customer.email!)}
            >
              <Send size={20} color="#FFFFFF" />
              <Text style={styles.quickActionText}>E-posta</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
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
    marginLeft: -Spacing.sm,
  },
  headerTitle: {
    ...Typography.headingMD,
    flex: 1,
    marginLeft: Spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerButton: {
    padding: Spacing.sm,
  },
  summaryCard: {
    padding: Spacing.xl,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  summaryAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryName: {
    ...Typography.headingLG,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  summaryCode: {
    ...Typography.bodyMD,
    color: 'rgba(255,255,255,0.8)',
  },
  summaryBadges: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    backgroundColor: Colors.light.surface,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing['4xl'],
  },
  tabContent: {
    gap: Spacing.md,
  },
  infoCard: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.headingMD,
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  infoLabel: {
    ...Typography.bodySM,
    flex: 1,
  },
  infoValue: {
    ...Typography.bodyMD,
    fontWeight: '500',
  },
  lastInteraction: {
    gap: Spacing.sm,
  },
  interactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  interactionSubject: {
    ...Typography.bodyMD,
    fontWeight: '500',
  },
  interactionDate: {
    ...Typography.bodySM,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.lg,
  },
  statValue: {
    ...Typography.headingXL,
    marginTop: Spacing.sm,
  },
  statLabel: {
    ...Typography.bodyXS,
    marginTop: Spacing.xs,
  },
  emptyCard: {
    alignItems: 'center',
    padding: Spacing['2xl'],
  },
  emptyText: {
    ...Typography.headingMD,
    marginTop: Spacing.lg,
  },
  emptySubtext: {
    ...Typography.bodyMD,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  emptyButton: {
    marginTop: Spacing.xl,
  },
  quickActions: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  quickActionText: {
    color: '#FFFFFF',
    ...Typography.bodyMD,
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
});
