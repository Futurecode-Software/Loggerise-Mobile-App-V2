import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import {
  Plus,
  Sparkles,
  Send,
  Trash2,
  Copy,
  RefreshCw,
  FileText,
  MessageSquare,
  AlertCircle,
  ChevronRight,
} from 'lucide-react-native';
import { Card } from '@/components/ui';
import { FullScreenHeader } from '@/components/header';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
// useColorScheme kaldirildi - her zaman light mode kullanilir
import {
  getReports,
  getReport,
  createReport,
  addMessage,
  deleteReport,
  AiReport,
  AiReportMessage,
  AiReportFilters,
  Pagination,
  formatReportTime,
  getReportPreview,
  isErrorMessage,
  parseSqlResult,
  EXAMPLE_QUESTIONS,
} from '@/services/endpoints/ai-reports';

type ViewMode = 'list' | 'chat';

const SUGGESTED_QUERIES = [
  { id: '1', icon: '📊', text: 'Son 30 günün satış raporu' },
  { id: '2', icon: '🚚', text: 'Bu ayki teslim edilen yükler' },
  { id: '3', icon: '💰', text: 'En çok gelir getiren müşteriler' },
  { id: '4', icon: '📦', text: 'Stok durumu özeti' },
];

export default function AIReportsScreen() {
  // Her zaman light mode kullanilir
  const colors = Colors.light;
  const scrollViewRef = useRef<ScrollView>(null);

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // List state
  const [reports, setReports] = useState<AiReport[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Chat state
  const [currentReport, setCurrentReport] = useState<AiReport | null>(null);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Fetch reports list
  const fetchReports = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      setListError(null);

      const filters: AiReportFilters = {
        page,
        per_page: 20,
        sort_by: 'created_at',
        sort_order: 'desc',
      };

      const response = await getReports(filters);

      if (append) {
        setReports((prev) => [...prev, ...response.reports]);
      } else {
        setReports(response.reports);
      }
      setPagination(response.pagination);
    } catch (err) {
      console.error('Reports fetch error:', err);
      setListError(err instanceof Error ? err.message : 'Raporlar yüklenemedi');
    } finally {
      setIsLoadingList(false);
      setIsLoadingMore(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    setIsLoadingList(true);
    fetchReports(1, false);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReports(1, false);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (
      !isLoadingMore &&
      pagination &&
      pagination.current_page < pagination.last_page
    ) {
      setIsLoadingMore(true);
      fetchReports(pagination.current_page + 1, true);
    }
  };

  // Start new chat
  const startNewChat = () => {
    setCurrentReport(null);
    setChatError(null);
    setInputText('');
    setViewMode('chat');
  };

  // Open existing report
  const openReport = async (reportId: number) => {
    try {
      setIsProcessing(true);
      setChatError(null);
      const report = await getReport(reportId);
      setCurrentReport(report);
      setViewMode('chat');
    } catch (err) {
      console.error('Report fetch error:', err);
      setChatError(err instanceof Error ? err.message : 'Rapor yüklenemedi');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle send message
  const handleSend = async () => {
    if (!inputText.trim() || isProcessing) return;

    const message = inputText.trim();
    setInputText('');
    setIsProcessing(true);
    setChatError(null);

    try {
      if (currentReport) {
        // Add message to existing report
        const result = await addMessage(currentReport.id, { message });
        setCurrentReport(result.report);
        if (!result.success && result.error) {
          setChatError(result.error);
        }
      } else {
        // Create new report
        const title = message.length > 50 ? message.substring(0, 50) + '...' : message;
        const result = await createReport({ title, message });
        setCurrentReport(result.report);
        if (!result.success && result.error) {
          setChatError(result.error);
        }
        // Refresh list in background
        fetchReports(1, false);
      }
    } catch (err) {
      console.error('Send message error:', err);
      setChatError(err instanceof Error ? err.message : 'Mesaj gönderilemedi');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle delete report
  const handleDelete = async (reportId: number) => {
    try {
      await deleteReport(reportId);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      if (currentReport?.id === reportId) {
        setCurrentReport(null);
        setViewMode('list');
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Handle suggestion
  const handleSuggestion = (text: string) => {
    setInputText(text);
  };

  // Go back to list
  const goBackToList = () => {
    setViewMode('list');
    setCurrentReport(null);
    setChatError(null);
    // Refresh list to show any new reports
    fetchReports(1, false);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  // Render message
  const renderMessage = (message: AiReportMessage) => {
    const isUser = message.role === 'user';
    const hasError = isErrorMessage(message);
    const sqlResult = parseSqlResult(message);

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.aiMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isUser
              ? [styles.userBubble, { backgroundColor: Brand.primary }]
              : [
                  styles.aiBubble,
                  {
                    backgroundColor: hasError
                      ? colors.danger + '15'
                      : colors.surface,
                  },
                ],
          ]}
        >
          {!isUser && (
            <View style={styles.aiHeader}>
              <Sparkles size={14} color={hasError ? colors.danger : Brand.primary} />
              <Text
                style={[
                  styles.aiLabel,
                  { color: hasError ? colors.danger : Brand.primary },
                ]}
              >
                Loggy AI
              </Text>
            </View>
          )}
          <Text
            style={[
              styles.messageText,
              { color: isUser ? '#FFFFFF' : colors.text },
            ]}
          >
            {message.content}
          </Text>

          {/* SQL Result Table */}
          {sqlResult && sqlResult.length > 0 && (
            <View style={[styles.dataTable, { borderColor: colors.border }]}>
              {/* Table Header */}
              {Object.keys(sqlResult[0]).length > 0 && (
                <View
                  style={[
                    styles.dataRow,
                    styles.dataHeader,
                    { backgroundColor: colors.background },
                  ]}
                >
                  {Object.keys(sqlResult[0]).slice(0, 3).map((key) => (
                    <Text
                      key={key}
                      style={[styles.dataHeaderCell, { color: colors.textSecondary }]}
                    >
                      {key}
                    </Text>
                  ))}
                </View>
              )}
              {/* Table Rows (limit to 5) */}
              {sqlResult.slice(0, 5).map((row: any, index: number) => (
                <View
                  key={index}
                  style={[
                    styles.dataRow,
                    index !== Math.min(sqlResult.length, 5) - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  {Object.values(row).slice(0, 3).map((value: any, i: number) => (
                    <Text key={i} style={[styles.dataCell, { color: colors.text }]}>
                      {String(value ?? '-')}
                    </Text>
                  ))}
                </View>
              ))}
              {sqlResult.length > 5 && (
                <Text style={[styles.moreResults, { color: colors.textMuted }]}>
                  +{sqlResult.length - 5} daha fazla sonuç
                </Text>
              )}
            </View>
          )}

          {/* Actions */}
          {!isUser && (
            <View style={styles.messageActions}>
              <TouchableOpacity style={styles.messageAction}>
                <Copy size={14} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          )}
        </View>
        <Text
          style={[
            styles.timestamp,
            { color: colors.textMuted },
            isUser && styles.userTimestamp,
          ]}
        >
          {formatTime(message.created_at)}
        </Text>
      </View>
    );
  };

  // Render report list item
  const renderReportItem = ({ item }: { item: AiReport }) => (
    <TouchableOpacity
      style={[styles.reportItem, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
      onPress={() => openReport(item.id)}
    >
      <View style={[styles.reportIcon, { backgroundColor: Brand.primary + '15' }]}>
        <MessageSquare size={20} color={Brand.primary} />
      </View>
      <View style={styles.reportContent}>
        <Text style={[styles.reportTitle, { color: colors.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.reportTime, { color: colors.textMuted }]}>
          {formatReportTime(item.created_at)}
        </Text>
      </View>
      <ChevronRight size={18} color={colors.icon} />
    </TouchableOpacity>
  );

  // Render list empty state
  const renderListEmpty = () => {
    if (isLoadingList) {
      return (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.stateText, { color: colors.textSecondary }]}>
            Raporlar yükleniyor...
          </Text>
        </View>
      );
    }

    if (listError) {
      return (
        <View style={styles.centerState}>
          <View style={[styles.stateIcon, { backgroundColor: colors.danger + '15' }]}>
            <AlertCircle size={48} color={colors.danger} />
          </View>
          <Text style={[styles.stateTitle, { color: colors.text }]}>
            Bir hata oluştu
          </Text>
          <Text style={[styles.stateText, { color: colors.textSecondary }]}>
            {listError}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Brand.primary }]}
            onPress={() => {
              setIsLoadingList(true);
              fetchReports(1, false);
            }}
          >
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.centerState}>
        <View style={[styles.stateIcon, { backgroundColor: Brand.primary + '15' }]}>
          <Sparkles size={48} color={Brand.primary} />
        </View>
        <Text style={[styles.stateTitle, { color: colors.text }]}>
          Henüz rapor yok
        </Text>
        <Text style={[styles.stateText, { color: colors.textSecondary }]}>
          Loggy AI ile verilerinizi doğal dille sorgulayabilirsiniz
        </Text>
        <TouchableOpacity
          style={[styles.startButton, { backgroundColor: Brand.primary }]}
          onPress={startNewChat}
        >
          <Sparkles size={18} color="#FFFFFF" />
          <Text style={styles.startButtonText}>Yeni Sorgu Başlat</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderListFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={Brand.primary} />
      </View>
    );
  };

  // ============ LIST VIEW ============
  if (viewMode === 'list') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <FullScreenHeader
          title="Loggy AI"
          subtitle={pagination ? `${pagination.total} rapor` : 'Verilerinizi doğal dille sorgula'}
          showBackButton
          leftIcon={<Sparkles size={20} color="#FFFFFF" />}
          rightIcons={
            <TouchableOpacity onPress={startNewChat} activeOpacity={0.7}>
              <Plus size={22} color="#FFFFFF" />
            </TouchableOpacity>
          }
        />

        {/* Report List */}
        <FlatList
          data={reports}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderReportItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderListEmpty}
          ListFooterComponent={renderListFooter}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Brand.primary}
            />
          }
        />
      </View>
    );
  }

  // ============ CHAT VIEW ============
  const messages = currentReport?.messages || [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <FullScreenHeader
        title={currentReport?.title || 'Yeni Sorgu'}
        subtitle={currentReport ? formatReportTime(currentReport.created_at) : 'Doğal dille sorgula'}
        showBackButton
        onBackPress={goBackToList}
        leftIcon={<Sparkles size={20} color="#FFFFFF" />}
        rightIcons={
          currentReport ? (
            <TouchableOpacity onPress={() => handleDelete(currentReport.id)} activeOpacity={0.7}>
              <Trash2 size={20} color="#FFFFFF" />
            </TouchableOpacity>
          ) : undefined
        }
      />

      {/* Chat Content */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        >
          {/* Welcome message for new chat */}
          {messages.length === 0 && !isProcessing && (
            <View style={[styles.messageContainer, styles.aiMessageContainer]}>
              <View style={[styles.messageBubble, styles.aiBubble, { backgroundColor: colors.surface }]}>
                <View style={styles.aiHeader}>
                  <Sparkles size={14} color={Brand.primary} />
                  <Text style={[styles.aiLabel, { color: Brand.primary }]}>Loggy AI</Text>
                </View>
                <Text style={[styles.messageText, { color: colors.text }]}>
                  Merhaba! Ben Loggy AI. Verileriniz hakkında sorular sorabilirsiniz.{'\n\n'}
                  Örneğin:{'\n'}
                  • "Kaç tane aktif araç var?"{'\n'}
                  • "Bu ayki toplam fatura tutarı?"{'\n'}
                  • "Son 30 günde eklenen cariler"
                </Text>
              </View>
            </View>
          )}

          {/* Messages */}
          {messages.map(renderMessage)}

          {/* Processing indicator */}
          {isProcessing && (
            <View style={[styles.messageContainer, styles.aiMessageContainer]}>
              <View style={[styles.messageBubble, styles.aiBubble, { backgroundColor: colors.surface }]}>
                <View style={styles.loadingDots}>
                  <View style={[styles.dot, { backgroundColor: Brand.primary }]} />
                  <View style={[styles.dot, { backgroundColor: Brand.primary, opacity: 0.7 }]} />
                  <View style={[styles.dot, { backgroundColor: Brand.primary, opacity: 0.4 }]} />
                </View>
              </View>
            </View>
          )}

          {/* Error message */}
          {chatError && !isProcessing && (
            <View style={[styles.errorBanner, { backgroundColor: colors.danger + '15' }]}>
              <AlertCircle size={16} color={colors.danger} />
              <Text style={[styles.errorText, { color: colors.danger }]}>{chatError}</Text>
            </View>
          )}

          {/* Suggested Queries (only for new chat) */}
          {messages.length === 0 && !isProcessing && (
            <View style={styles.suggestionsContainer}>
              <Text style={[styles.suggestionsTitle, { color: colors.textSecondary }]}>
                Sık Kullanılan Sorgular
              </Text>
              <View style={styles.suggestionsGrid}>
                {SUGGESTED_QUERIES.map((query) => (
                  <TouchableOpacity
                    key={query.id}
                    style={[styles.suggestionCard, { backgroundColor: colors.card, ...Shadows.sm }]}
                    onPress={() => handleSuggestion(query.text)}
                  >
                    <Text style={styles.suggestionIcon}>{query.icon}</Text>
                    <Text style={[styles.suggestionText, { color: colors.text }]}>
                      {query.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Bar */}
        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.surface }]}
            placeholder="Bir şey sorun..."
            placeholderTextColor={colors.placeholder}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!isProcessing}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: inputText.trim() && !isProcessing ? Brand.primary : colors.surface },
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isProcessing}
          >
            <Send size={18} color={inputText.trim() && !isProcessing ? '#FFFFFF' : colors.textMuted} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // List styles
  listContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  reportIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  reportContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  reportTitle: {
    ...Typography.bodyMD,
    fontWeight: '500',
  },
  reportTime: {
    ...Typography.bodyXS,
    marginTop: 2,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing['4xl'],
  },
  stateIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  stateTitle: {
    ...Typography.headingMD,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  stateText: {
    ...Typography.bodyMD,
    textAlign: 'center',
    marginTop: Spacing.sm,
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
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  startButtonText: {
    color: '#FFFFFF',
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  loadingMore: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  // Chat styles
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['2xl'],
  },
  messageContainer: {
    marginBottom: Spacing.md,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  aiMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  userBubble: {
    borderBottomRightRadius: BorderRadius.sm,
  },
  aiBubble: {
    borderBottomLeftRadius: BorderRadius.sm,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  aiLabel: {
    ...Typography.bodySM,
    fontWeight: '600',
  },
  messageText: {
    ...Typography.bodyMD,
    lineHeight: 22,
  },
  timestamp: {
    ...Typography.bodyXS,
    marginTop: Spacing.xs,
  },
  userTimestamp: {
    textAlign: 'right',
  },
  dataTable: {
    marginTop: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  dataHeader: {
    borderBottomWidth: 1,
  },
  dataRow: {
    flexDirection: 'row',
    padding: Spacing.sm,
  },
  dataHeaderCell: {
    ...Typography.bodyXS,
    fontWeight: '600',
    flex: 1,
  },
  dataCell: {
    ...Typography.bodySM,
    flex: 1,
  },
  moreResults: {
    ...Typography.bodyXS,
    textAlign: 'center',
    padding: Spacing.sm,
  },
  messageActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
  },
  messageAction: {
    padding: Spacing.xs,
  },
  loadingDots: {
    flexDirection: 'row',
    gap: Spacing.xs,
    padding: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    ...Typography.bodySM,
    flex: 1,
  },
  suggestionsContainer: {
    marginTop: Spacing.xl,
  },
  suggestionsTitle: {
    ...Typography.headingSM,
    marginBottom: Spacing.md,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  suggestionCard: {
    width: '47%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  suggestionIcon: {
    fontSize: 24,
    marginBottom: Spacing.sm,
  },
  suggestionText: {
    ...Typography.bodySM,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    ...Typography.bodyMD,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
