import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Package, CheckCircle, Circle, AlertCircle } from 'lucide-react-native';
import { Card, Button, Badge } from '@/components/ui';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import {
  getQuote,
  convertQuoteToLoads,
  getQuoteStatusLabel,
  formatAmount,
} from '@/services/endpoints/quotes';
import type { Quote } from '@/services/endpoints/quotes';

interface CargoItemSelection {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  weight?: number;
  volume?: number;
  selected: boolean;
}

export default function ConvertQuoteToLoadsScreen() {
  const colors = Colors.light;
  const { id } = useLocalSearchParams<{ id: string }>();
  const quoteId = parseInt(id, 10);

  const [isLoading, setIsLoading] = useState(true);
  const [isConverting, setIsConverting] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargoItems, setCargoItems] = useState<CargoItemSelection[]>([]);

  useEffect(() => {
    fetchQuote();
  }, [quoteId]);

  const fetchQuote = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getQuote(quoteId);
      setQuote(data);

      // Mock cargo items - in real implementation, these would come from quote.cargo_items
      // For now, creating sample items based on quote
      setCargoItems([
        {
          id: '1',
          description: 'Yük Kalemi 1',
          quantity: 10,
          unit: 'palet',
          weight: 500,
          volume: 12,
          selected: true,
        },
      ]);
    } catch (err) {
      console.error('Fetch quote error:', err);
      setError(err instanceof Error ? err.message : 'Teklif bilgileri yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleItemSelection = (itemId: string) => {
    setCargoItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleConvert = async () => {
    const selectedItems = cargoItems.filter((item) => item.selected);

    if (selectedItems.length === 0) {
      Alert.alert('Uyarı', 'Lütfen en az bir yük kalemi seçiniz');
      return;
    }

    Alert.alert(
      'Yüklemeye Dönüştür',
      `${selectedItems.length} adet yük kalemi yüklemeye dönüştürülecek. Onaylıyor musunuz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Dönüştür',
          onPress: async () => {
            setIsConverting(true);
            try {
              const result = await convertQuoteToLoads(quoteId);
              Alert.alert(
                'Başarılı',
                `${result.loads_count} adet yükleme oluşturuldu`,
                [
                  {
                    text: 'Tamam',
                    onPress: () => router.back(),
                  },
                ]
              );
            } catch (err) {
              Alert.alert('Hata', err instanceof Error ? err.message : 'Dönüştürme başarısız');
            } finally {
              setIsConverting(false);
            }
          },
        },
      ]
    );
  };

  const renderCargoItem = ({ item }: { item: CargoItemSelection }) => (
    <TouchableOpacity
      style={[
        styles.cargoItemCard,
        {
          backgroundColor: item.selected ? Brand.primary + '10' : colors.surface,
          borderColor: item.selected ? Brand.primary : colors.border,
        },
      ]}
      onPress={() => toggleItemSelection(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.cargoItemHeader}>
        <View style={[styles.cargoItemIcon, { backgroundColor: Brand.primary + '15' }]}>
          <Package size={20} color={Brand.primary} />
        </View>
        <View style={styles.cargoItemInfo}>
          <Text style={[styles.cargoItemDescription, { color: colors.text }]} numberOfLines={2}>
            {item.description}
          </Text>
          <Text style={[styles.cargoItemDetails, { color: colors.textSecondary }]}>
            {item.quantity} {item.unit}
            {item.weight && ` • ${item.weight} kg`}
            {item.volume && ` • ${item.volume} m³`}
          </Text>
        </View>
        <View style={styles.checkboxContainer}>
          {item.selected ? (
            <CheckCircle size={24} color={Brand.primary} />
          ) : (
            <Circle size={24} color={colors.border} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Yüklemeye Dönüştür</Text>
        </View>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Teklif yükleniyor...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !quote) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Yüklemeye Dönüştür</Text>
        </View>
        <View style={styles.errorState}>
          <View style={[styles.errorIcon, { backgroundColor: colors.danger + '15' }]}>
            <AlertCircle size={64} color={colors.danger} />
          </View>
          <Text style={[styles.errorTitle, { color: colors.text }]}>Bir hata oluştu</Text>
          <Text style={[styles.errorSubtitle, { color: colors.textSecondary }]}>
            {error || 'Teklif bulunamadı'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Brand.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Geri Dön</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const selectedCount = cargoItems.filter((item) => item.selected).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Yüklemeye Dönüştür</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Quote Info */}
        <Card style={styles.section}>
          <View style={styles.quoteHeader}>
            <Text style={[styles.quoteNumber, { color: colors.text }]}>{quote.quote_number}</Text>
            <Badge
              label={getQuoteStatusLabel(quote.status)}
              variant="success"
              size="md"
            />
          </View>
          {quote.customer && (
            <Text style={[styles.customerName, { color: colors.textSecondary }]}>
              {quote.customer.name}
            </Text>
          )}
          <Text style={[styles.quoteAmount, { color: Brand.primary }]}>
            {formatAmount(quote.grand_total, quote.currency_type)}
          </Text>
        </Card>

        {/* Instructions */}
        <Card style={[styles.infoCard, { backgroundColor: colors.info + '10' }]}>
          <Text style={[styles.infoText, { color: colors.info }]}>
            Dönüştürmek istediğiniz yük kalemlerini seçiniz. Seçilen her kalem için bir yükleme
            kaydı oluşturulacaktır.
          </Text>
        </Card>

        {/* Cargo Items Selection */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Yük Kalemleri ({selectedCount}/{cargoItems.length})
            </Text>
          </View>

          <FlatList
            data={cargoItems}
            renderItem={renderCargoItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.cargoItemsList}
            scrollEnabled={false}
          />
        </Card>

        {/* Summary */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Özet</Text>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              Seçili Kalem
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {selectedCount} adet
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              Oluşturulacak Yükleme
            </Text>
            <Text style={[styles.summaryValue, { color: Brand.primary }]}>
              {selectedCount} adet
            </Text>
          </View>
        </Card>

        {/* Convert Button */}
        <Button
          label={isConverting ? 'Dönüştürülüyor...' : `${selectedCount} Yükleme Oluştur`}
          onPress={handleConvert}
          disabled={isConverting || selectedCount === 0}
          variant="primary"
          style={styles.convertButton}
        />
      </ScrollView>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing['4xl'],
  },
  section: {
    padding: Spacing.lg,
  },
  quoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  quoteNumber: {
    ...Typography.headingMD,
    fontWeight: '700',
  },
  customerName: {
    ...Typography.bodyMD,
    marginBottom: Spacing.sm,
  },
  quoteAmount: {
    ...Typography.headingLG,
    fontWeight: '700',
  },
  infoCard: {
    padding: Spacing.md,
  },
  infoText: {
    ...Typography.bodySM,
    lineHeight: 20,
  },
  sectionHeader: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.headingMD,
  },
  cargoItemsList: {
    gap: Spacing.md,
  },
  cargoItemCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
  },
  cargoItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  cargoItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cargoItemInfo: {
    flex: 1,
  },
  cargoItemDescription: {
    ...Typography.bodyMD,
    fontWeight: '600',
    marginBottom: 4,
  },
  cargoItemDetails: {
    ...Typography.bodySM,
  },
  checkboxContainer: {
    padding: Spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  summaryLabel: {
    ...Typography.bodyMD,
  },
  summaryValue: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  convertButton: {
    marginTop: Spacing.lg,
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
