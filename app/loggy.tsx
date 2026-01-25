import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ChevronLeft,
  Plus,
  Sparkles,
  Send,
  Trash2,
  Search,
  Loader2,
  Bot,
  User,
  CheckCircle,
  XCircle,
  MessageSquare,
  AlertCircle,
  ChevronRight,
  Building2,
  Package,
  Receipt,
  Banknote,
  Truck,
  Warehouse,
  Car,
  BarChart3,
  Users,
  FileText,
  Bell,
  ArrowRight,
  KeyRound,
  Settings,
} from 'lucide-react-native';
import { Card } from '@/components/ui';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import {
  getConversations,
  searchConversations,
  createConversation,
  getConversationMessages,
  deleteConversation,
  sendMessage,
  confirmExecution,
  cancelExecution,
  getPendingExecutions,
  formatConversationTime,
  formatMessageTime,
  AiConversation,
  AiMessage,
  AiToolExecution,
} from '@/services/endpoints/loggy';

type ViewMode = 'list' | 'chat';

const STORAGE_KEY = 'loggy_last_conversation_id';

// Kategorili Öneriler
interface SuggestionCategory {
  id: string;
  label: string;
  icon: any;
  color: string;
  suggestions: {
    title: string;
    prompt: string;
    description: string;
  }[];
}

const suggestionCategories: SuggestionCategory[] = [
  {
    id: 'contact',
    label: 'Cari',
    icon: Building2,
    color: '#3b82f6',
    suggestions: [
      {
        title: 'Cari Ara',
        prompt: 'ABC firmasını ara',
        description: 'Müşteri veya tedarikçi arama',
      },
      {
        title: 'Yeni Cari Ekle',
        prompt: 'XYZ Ltd. Şti. adında yeni bir müşteri ekle',
        description: 'Yeni müşteri/tedarikçi oluştur',
      },
      {
        title: 'Cari Bakiye',
        prompt: 'ABC firmasının bakiyesi ne kadar?',
        description: 'Alacak/borç durumu sorgula',
      },
    ],
  },
  {
    id: 'product',
    label: 'Ürün',
    icon: Package,
    color: '#10b981',
    suggestions: [
      {
        title: 'Ürün Ara',
        prompt: 'Monitör ürününü ara',
        description: 'Stok kalemlerinde arama',
      },
      {
        title: 'Stokta Ara',
        prompt: 'Stokta olan ürünleri listele',
        description: 'Sadece stokta olanlar',
      },
    ],
  },
  {
    id: 'invoice',
    label: 'Fatura',
    icon: Receipt,
    color: '#8b5cf6',
    suggestions: [
      {
        title: 'Fatura Ara',
        prompt: 'Son 10 satış faturasını göster',
        description: 'Fatura listesi ve filtreleme',
      },
      {
        title: 'Fatura Bakiye',
        prompt: 'FTR-2025-001 faturasının bakiyesi ne kadar?',
        description: 'Ödenen/kalan tutar sorgula',
      },
      {
        title: 'Satış Faturası Kes',
        prompt: 'ABC firmasına 100 adet kalem için satış faturası kes',
        description: 'Yeni satış faturası oluştur',
      },
      {
        title: 'Alış Faturası',
        prompt: 'XYZ firmasından 50 adet monitör aldım, alış faturası oluştur',
        description: 'Yeni alış faturası oluştur',
      },
    ],
  },
  {
    id: 'payment',
    label: 'Ödeme',
    icon: Banknote,
    color: '#f59e0b',
    suggestions: [
      {
        title: 'Tahsilat Kaydet',
        prompt: 'FTR-2025-001 faturasına 5000 TL tahsilat kaydet',
        description: 'Satış faturası ödemesi al',
      },
      {
        title: 'Ödeme Yap',
        prompt: 'FTR-2025-002 faturasının tamamını öde',
        description: 'Alış faturası ödemesi yap',
      },
    ],
  },
  {
    id: 'logistics',
    label: 'Lojistik',
    icon: Truck,
    color: '#ef4444',
    suggestions: [
      {
        title: 'Yük Ara',
        prompt: 'YK-2025-001 numaralı yükü ara',
        description: 'Yük numarası veya detay ile arama',
      },
      {
        title: 'Yük Oluştur',
        prompt: "ABC firması için Almanya'ya ihracat yükü oluştur",
        description: 'Yeni sevkiyat kaydı',
      },
      {
        title: 'İthalat Yükü',
        prompt: 'XYZ firmasından ithalat yükü oluştur',
        description: 'İthalat sevkiyat kaydı',
      },
      {
        title: 'Planlanmamış Yükler',
        prompt: 'Araca atanmamış yükleri listele',
        description: 'Henüz planlanmamış sevkiyatlar',
      },
      {
        title: 'Yüke Kalem Ekle',
        prompt: 'YK-2025-001 yüküne 50 adet monitör ekle',
        description: 'Mevcut yüke ürün ekle',
      },
    ],
  },
  {
    id: 'stock',
    label: 'Stok',
    icon: Warehouse,
    color: '#14b8a6',
    suggestions: [
      {
        title: 'Stok Durumu',
        prompt: 'Laptop ürününün stok durumu nedir?',
        description: 'Anlık stok miktarı sorgula',
      },
      {
        title: 'Stok Hareketleri',
        prompt: 'Son 7 günde stok hareketlerini göster',
        description: 'Stok giriş/çıkış listesi',
      },
      {
        title: 'Stok Transferi',
        prompt: 'Ana depodan şube deposuna 50 adet monitör transfer et',
        description: 'Depolar arası transfer',
      },
    ],
  },
  {
    id: 'vehicle',
    label: 'Araç',
    icon: Car,
    color: '#f97316',
    suggestions: [
      {
        title: 'Araç Ara',
        prompt: '34 ABC plakalı aracı ara',
        description: 'Plaka veya marka ile arama',
      },
      {
        title: 'Araç Ekle',
        prompt: '34 XYZ 789 plakalı Mercedes Actros 2023 model çekici ekle',
        description: 'Yeni araç kaydı oluştur',
      },
      {
        title: 'Araç Durumu',
        prompt: '34 ABC 123 plakalı aracın durumu nedir?',
        description: 'Sigorta, muayene, bakım bilgileri',
      },
      {
        title: 'Bakım Kaydı',
        prompt: '34 ABC 123 plakalı araç için 150.000 km bakım kaydı oluştur',
        description: 'Yeni bakım kaydı ekle',
      },
    ],
  },
  {
    id: 'finance',
    label: 'Finans',
    icon: BarChart3,
    color: '#6366f1',
    suggestions: [
      {
        title: 'Gelir-Gider Raporu',
        prompt: 'Bu ayın gelir-gider raporunu göster',
        description: 'Aylık finansal özet',
      },
      {
        title: 'Kar-Zarar Raporu',
        prompt: '2025 yılının kar-zarar raporunu oluştur',
        description: 'Detaylı kar/zarar analizi',
      },
      {
        title: 'Vadesi Geçen Alacaklar',
        prompt: 'Vadesi geçmiş alacaklarımız ne kadar?',
        description: 'Yaşlandırma raporu',
      },
      {
        title: 'Nakit Akışı',
        prompt: 'Bu ayın nakit akış raporunu göster',
        description: 'Banka/kasa hareketleri',
      },
    ],
  },
  {
    id: 'hr',
    label: 'İK',
    icon: Users,
    color: '#ec4899',
    suggestions: [
      {
        title: 'Personel Ara',
        prompt: 'Ahmet Yılmaz adlı personeli ara',
        description: 'Ad veya pozisyona göre arama',
      },
      {
        title: 'Personel Ekle',
        prompt: 'Ali Veli adında yeni bir sürücü ekle. TC: 12345678901, Tel: 05551234567, E-posta: ali@firma.com',
        description: 'Yeni personel kaydı oluştur',
      },
      {
        title: 'Sürücü Belgeleri',
        prompt: "Ahmet Yılmaz'ın belge durumunu kontrol et",
        description: 'Ehliyet, SRC, ADR, vize durumu',
      },
      {
        title: 'Aktif Sürücüler',
        prompt: 'Aktif sürücüleri listele',
        description: 'Sürücü pozisyonundaki personeller',
      },
    ],
  },
  {
    id: 'uninvoiced',
    label: 'Faturasız Yük',
    icon: FileText,
    color: '#dc2626',
    suggestions: [
      {
        title: 'Faturasız Yükler',
        prompt: 'Faturası kesilmemiş yüklerimiz var mı?',
        description: 'Tamamlanmış ama faturalanmamış yükler',
      },
      {
        title: 'Kritik Yükler',
        prompt: '30 gündür faturalanmamış yükleri göster',
        description: 'Uzun süredir bekleyen yükler',
      },
      {
        title: 'Toplu Faturala',
        prompt: "ABC Lojistik'in tüm faturalanmamış yüklerini faturala",
        description: 'Müşterinin yüklerini toplu faturala',
      },
      {
        title: 'Gelir Raporu',
        prompt: 'Faturalanmamış toplam gelir ne kadar?',
        description: 'Faturalanmayı bekleyen gelir analizi',
      },
    ],
  },
  {
    id: 'reminder',
    label: 'Hatırlatıcı',
    icon: Bell,
    color: '#06b6d4',
    suggestions: [
      {
        title: 'Hatırlatıcı Oluştur',
        prompt: 'Yarın saat 14:00\'de ABC firmasını aramayı hatırlat',
        description: 'Belirli bir zaman için hatırlatıcı kur',
      },
      {
        title: 'Aktif Hatırlatıcılar',
        prompt: 'Aktif hatırlatıcılarımı göster',
        description: 'Bekleyen hatırlatıcıları listele',
      },
      {
        title: 'Hatırlatıcı İptal',
        prompt: '3 numaralı hatırlatıcıyı iptal et',
        description: 'Bir hatırlatıcıyı kaldır',
      },
      {
        title: 'Bugünkü Hatırlatıcılar',
        prompt: 'Bugün için hatırlatıcılarım var mı?',
        description: 'Günlük hatırlatıcı özeti',
      },
      {
        title: 'Fatura Hatırlatıcı',
        prompt: '1 hafta sonra FTR-2025-001 faturasının ödemesini hatırlat',
        description: 'Fatura takibi için hatırlatıcı',
      },
    ],
  },
];

export default function LoggyScreen() {
  const colors = Colors.light;
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // List state
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AiConversation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Chat state
  const [currentConversation, setCurrentConversation] = useState<AiConversation | null>(null);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // AI Configuration
  const [isAiConfigured, setIsAiConfigured] = useState(true); // TODO: Get from API
  const [pendingConfirmations, setPendingConfirmations] = useState<AiToolExecution[]>([]);
  const [draftCount, setDraftCount] = useState(0);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      setListError(null);
      const data = await getConversations({ per_page: 20 });
      setConversations(data);
    } catch (err) {
      console.error('Conversations fetch error:', err);
      setListError(err instanceof Error ? err.message : 'Konuşmalar yüklenemedi');
    } finally {
      setIsLoadingList(false);
      setRefreshing(false);
    }
  }, []);

  // Search conversations
  const handleSearch = useCallback((query: string) => {
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
        console.error('Search error:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  // Initial load
  useEffect(() => {
    setIsLoadingList(true);
    fetchConversations();
  }, [fetchConversations]);

  // Load last conversation
  useEffect(() => {
    const loadLastConversation = async () => {
      const lastConversationId = await AsyncStorage.getItem(STORAGE_KEY);
      if (lastConversationId && conversations.length > 0) {
        const lastConversation = conversations.find(
          (c) => c.id === parseInt(lastConversationId)
        );
        if (lastConversation) {
          selectConversation(lastConversation);
        }
      }
    };
    if (conversations.length > 0) {
      loadLastConversation();
    }
  }, [conversations]);

  // Inverted messages for FlatList (newest first)
  const invertedMessages = useMemo(() => [...messages].reverse(), [messages]);

  // Animated style for keyboard
  const animatedListStyle = useAnimatedStyle(() => ({
    paddingBottom: -keyboardHeight.value,
  }));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchConversations();
  };

  // Create new conversation
  const createNewConversation = async () => {
    setIsLoading(true);
    try {
      const newConversation = await createConversation({ title: 'Yeni Konuşma' });
      setConversations([newConversation, ...conversations]);
      setCurrentConversation(newConversation);
      setMessages([]);
      await AsyncStorage.setItem(STORAGE_KEY, newConversation.id.toString());
      setViewMode('chat');
    } catch (err) {
      Alert.alert('Hata', err instanceof Error ? err.message : 'Konuşma oluşturulamadı');
    } finally {
      setIsLoading(false);
    }
  };

  // Select conversation
  const selectConversation = async (conversation: AiConversation) => {
    setCurrentConversation(conversation);
    setIsLoading(true);
    setChatError(null);
    await AsyncStorage.setItem(STORAGE_KEY, conversation.id.toString());
    try {
      const data = await getConversationMessages(conversation.id);
      setMessages(data.messages);
      setCurrentConversation(data.conversation);
    } catch (err: any) {
      if (err.response?.status === 403 || err.response?.status === 404) {
        await AsyncStorage.removeItem(STORAGE_KEY);
        setCurrentConversation(null);
        setMessages([]);
        Alert.alert('Hata', 'Bu konuşmaya erişim yetkiniz yok');
      } else {
        Alert.alert('Hata', 'Konuşma yüklenemedi');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Delete conversation
  const handleDelete = async (conversationId: number) => {
    Alert.alert(
      'Konuşmayı Sil',
      'Bu işlem geri alınamaz. Konuşma ve tüm mesajları kalıcı olarak silinecektir.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteConversation(conversationId);
              setConversations((prev) => prev.filter((c) => c.id !== conversationId));
              if (currentConversation?.id === conversationId) {
                setCurrentConversation(null);
                setMessages([]);
                setViewMode('list');
                await AsyncStorage.removeItem(STORAGE_KEY);
              }
            } catch (err) {
              Alert.alert('Hata', 'Konuşma silinemedi');
            }
          },
        },
      ]
    );
  };

  // Send message
  const handleSend = async () => {
    if (!inputValue.trim() || !currentConversation || isSending) return;

    const messageContent = inputValue;
    const userMessage: AiMessage = {
      id: Date.now(),
      conversation_id: currentConversation.id,
      role: 'user',
      content: messageContent,
      tool_calls: null,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsSending(true);
    setChatError(null);

    try {
      const result = await sendMessage(currentConversation.id, { content: messageContent });
      setMessages((prev) => [...prev, result.message]);
      if (result.conversation) {
        setCurrentConversation(result.conversation);
        setConversations((prev) =>
          prev.map((c) => (c.id === result.conversation.id ? result.conversation : c))
        );
      }
    } catch (err: any) {
      setChatError(err instanceof Error ? err.message : 'Mesaj gönderilemedi');
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
    } finally {
      setIsSending(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = async (prompt: string) => {
    if (isLoading || !isAiConfigured) return;

    setIsLoading(true);
    try {
      const newConversation = await createConversation({ title: 'Yeni Konuşma' });
      setConversations([newConversation, ...conversations]);
      setCurrentConversation(newConversation);
      setMessages([]);
      await AsyncStorage.setItem(STORAGE_KEY, newConversation.id.toString());
      setViewMode('chat');

      // Send the prompt
      setInputValue(prompt);
      setTimeout(async () => {
        const userMessage: AiMessage = {
          id: Date.now(),
          conversation_id: newConversation.id,
          role: 'user',
          content: prompt,
          tool_calls: null,
          created_at: new Date().toISOString(),
        };
        setMessages([userMessage]);
        setInputValue('');
        setIsSending(true);

        try {
          const result = await sendMessage(newConversation.id, { content: prompt });
          setMessages((prev) => [...prev, result.message]);
          if (result.conversation) {
            setCurrentConversation(result.conversation);
          }
        } catch (err: any) {
          setChatError(err instanceof Error ? err.message : 'Mesaj gönderilemedi');
        } finally {
          setIsSending(false);
          setIsLoading(false);
        }
      }, 100);
    } catch (err) {
      Alert.alert('Hata', 'Konuşma oluşturulamadı');
      setIsLoading(false);
    }
  };

  // Go back to list
  const goBackToList = () => {
    setViewMode('list');
    setCurrentConversation(null);
    setChatError(null);
    setSearchQuery('');
    setSearchResults([]);
    fetchConversations();
  };

  // Render message
  const renderMessage = useCallback(({ item: message }: { item: AiMessage }) => {
    const isUser = message.role === 'user';
    const isAssistant = message.role === 'assistant';
    const hasConfirmation = message.content?.includes('onayınız gerekiyor');

    return (
      <View
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
              : [styles.aiBubble, { backgroundColor: colors.surface }],
          ]}
        >
          {!isUser && (
            <View style={styles.aiHeader}>
              <Bot size={14} color={Brand.primary} />
              <Text style={[styles.aiLabel, { color: Brand.primary }]}>Loggy AI</Text>
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

          {/* Confirmation buttons */}
          {hasConfirmation && isAssistant && (
            <View style={styles.confirmationButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: '#10b981' }]}
                onPress={() => {
                  // TODO: Get execution ID from message
                  Alert.alert('Bilgi', 'Onay özelliği yakında eklenecek');
                }}
              >
                <CheckCircle size={14} color="#FFFFFF" />
                <Text style={styles.confirmButtonText}>Onayla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => {
                  Alert.alert('Bilgi', 'İptal özelliği yakında eklenecek');
                }}
              >
                <XCircle size={14} color={colors.danger} />
                <Text style={[styles.cancelButtonText, { color: colors.danger }]}>İptal</Text>
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
          {formatMessageTime(message.created_at)}
        </Text>
      </View>
    );
  }, [colors]);

  // Render conversation list item
  const renderConversationItem = ({ item }: { item: AiConversation }) => (
    <TouchableOpacity
      style={[
        styles.conversationItem,
        {
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
        },
        currentConversation?.id === item.id && {
          backgroundColor: Brand.primary + '15',
        },
      ]}
      onPress={() => {
        selectConversation(item);
        setViewMode('chat');
      }}
    >
      <View style={[styles.conversationIcon, { backgroundColor: Brand.primary + '15' }]}>
        <MessageSquare size={20} color={Brand.primary} />
      </View>
      <View style={styles.conversationContent}>
        <Text style={[styles.conversationTitle, { color: colors.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.conversationTime, { color: colors.textMuted }]}>
          {formatConversationTime(item.created_at)}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={(e) => {
          e.stopPropagation();
          handleDelete(item.id);
        }}
      >
        <Trash2 size={18} color={colors.danger} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Render list empty state
  const renderListEmpty = () => {
    if (isLoadingList) {
      return (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.stateText, { color: colors.textSecondary }]}>
            Konuşmalar yükleniyor...
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
          <Text style={[styles.stateTitle, { color: colors.text }]}>Bir hata oluştu</Text>
          <Text style={[styles.stateText, { color: colors.textSecondary }]}>{listError}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Brand.primary }]}
            onPress={() => {
              setIsLoadingList(true);
              fetchConversations();
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
        <Text style={[styles.stateTitle, { color: colors.text }]}>Henüz konuşma yok</Text>
        <Text style={[styles.stateText, { color: colors.textSecondary }]}>
          Loggy AI ile yük oluşturma, cari arama gibi işlemler için bana yazabilirsiniz.
        </Text>
        <TouchableOpacity
          style={[styles.startButton, { backgroundColor: Brand.primary }]}
          onPress={createNewConversation}
        >
          <Sparkles size={18} color="#FFFFFF" />
          <Text style={styles.startButtonText}>Yeni Konuşma Başlat</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ============ LIST VIEW ============
  if (viewMode === 'list') {
    const displayConversations = searchQuery.length >= 2 ? searchResults : conversations;

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.headerTitleRow}>
              <Sparkles size={20} color={Brand.primary} />
              <Text style={[styles.headerTitle, { color: colors.text }]}>Loggy</Text>
            </View>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              AI Asistan
            </Text>
          </View>
          <TouchableOpacity style={styles.newChatButton} onPress={createNewConversation}>
            <Plus size={22} color={Brand.primary} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Sohbetlerde ara..."
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              handleSearch(text);
            }}
          />
          {isSearching && <ActivityIndicator size="small" color={Brand.primary} />}
        </View>

        {/* Conversations List */}
        <FlatList
          data={displayConversations}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderConversationItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderListEmpty}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Brand.primary}
            />
          }
        />

        {/* FAB */}
        {conversations.length > 0 && (
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: Brand.primary, ...Shadows.lg }]}
            onPress={createNewConversation}
          >
            <Plus size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </SafeAreaView>
    );
  }

  // ============ CHAT VIEW ============
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={goBackToList} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.headerTitleRow}>
            <Bot size={20} color={Brand.primary} />
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              {currentConversation?.title || 'Yeni Konuşma'}
            </Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {currentConversation
              ? formatConversationTime(currentConversation.created_at)
              : 'Doğal dille sorgula'}
          </Text>
        </View>
        {currentConversation && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(currentConversation.id)}
          >
            <Trash2 size={20} color={colors.danger} />
          </TouchableOpacity>
        )}
      </View>

      {/* API Not Configured Overlay */}
      {!isAiConfigured && (
        <View style={styles.overlay}>
          <View style={[styles.overlayContent, { backgroundColor: colors.card }]}>
            <View style={[styles.overlayIcon, { backgroundColor: '#fbbf24' + '15' }]}>
              <KeyRound size={32} color="#f59e0b" />
            </View>
            <Text style={[styles.overlayTitle, { color: colors.text }]}>
              API Anahtarı Gerekli
            </Text>
            <Text style={[styles.overlayText, { color: colors.textSecondary }]}>
              Loggy AI asistanını kullanabilmek için önce API ayarlarınızı yapılandırmanız
              gerekiyor. Sistem ayarlarından API anahtarınızı ve model bilgilerinizi girin.
            </Text>
            <TouchableOpacity
              style={[styles.overlayButton, { backgroundColor: Brand.primary }]}
              onPress={() => router.push('/settings' as any)}
            >
              <Settings size={18} color="#FFFFFF" />
              <Text style={styles.overlayButtonText}>Sistem Ayarlarına Git</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Chat Content */}
      <View style={styles.chatContainer}>
        {/* Messages */}
        {isLoading && messages.length === 0 ? (
          <View style={[styles.messagesContainer, styles.centerContainer]}>
            <ActivityIndicator size="large" color={Brand.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Mesajlar yükleniyor...
            </Text>
          </View>
        ) : chatError ? (
          <View style={[styles.messagesContainer, styles.centerContainer]}>
            <AlertCircle size={64} color={colors.danger} />
            <Text style={[styles.errorTitle, { color: colors.text }]}>Bir hata oluştu</Text>
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>{chatError}</Text>
          </View>
        ) : invertedMessages.length === 0 && !isSending ? (
          <View style={[styles.messagesContainer, styles.centerContainer]}>
            <Sparkles size={64} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Henüz mesaj yok</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Merhaba! Ben Loggy, sizin AI asistanınızım. Yük oluşturma, cari arama gibi
              işlemlerde size yardımcı olabilirim.
            </Text>
            {/* Quick Suggestions */}
            <QuickSuggestions
              onSuggestionClick={handleSuggestionClick}
              isLoading={isLoading}
              isAiConfigured={isAiConfigured}
            />
          </View>
        ) : (
          <Animated.View style={[styles.messagesContainer, animatedListStyle]}>
            <FlatList
              ref={flatListRef}
              data={invertedMessages}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderMessage}
              inverted
              contentContainerStyle={styles.messagesList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              removeClippedSubviews={Platform.OS === 'android'}
              maxToRenderPerBatch={15}
              windowSize={21}
              initialNumToRender={20}
              maintainVisibleContentPosition={{
                minIndexForVisible: 0,
                autoscrollToTopThreshold: 100,
              }}
              style={styles.flatList}
              ListHeaderComponent={
                isSending ? (
                  <TypingIndicator />
                ) : chatError ? (
                  <View style={[styles.errorBanner, { backgroundColor: colors.danger + '15' }]}>
                    <AlertCircle size={16} color={colors.danger} />
                    <Text style={[styles.errorText, { color: colors.danger }]}>{chatError}</Text>
                  </View>
                ) : null
              }
            />
          </Animated.View>
        )}

        {/* Input Bar */}
        <KeyboardStickyView 
          offset={{ closed: 0, opened: 0 }}
          style={styles.stickyContainer}
        >
          <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <TextInput
              ref={inputRef}
              style={[styles.input, { color: colors.text, backgroundColor: colors.surface }]}
              placeholder="Mesajınızı yazın..."
              placeholderTextColor={colors.placeholder}
              value={inputValue}
              onChangeText={setInputValue}
              multiline
              maxLength={1000}
              editable={!isSending && isAiConfigured}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  backgroundColor:
                    inputValue.trim() && !isSending && isAiConfigured
                      ? Brand.primary
                      : colors.surface,
                },
              ]}
              onPress={handleSend}
              disabled={!inputValue.trim() || isSending || !isAiConfigured}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Send size={18} color={inputValue.trim() && isAiConfigured ? '#FFFFFF' : colors.textMuted} />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardStickyView>
      </View>
    </SafeAreaView>
  );
}

// Typing Indicator Component with Animated Dots
function TypingIndicator() {
  const colors = Colors.light;
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    // Her nokta için sıralı animasyon
    dot1.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 400, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 400, easing: Easing.in(Easing.quad) })
      ),
      -1,
      false
    );

    dot2.value = withDelay(
      150,
      withRepeat(
        withSequence(
          withTiming(-8, { duration: 400, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 400, easing: Easing.in(Easing.quad) })
        ),
        -1,
        false
      )
    );

    dot3.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(-8, { duration: 400, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 400, easing: Easing.in(Easing.quad) })
        ),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle1 = useAnimatedStyle(() => ({
    transform: [{ translateY: dot1.value }],
  }));

  const animatedStyle2 = useAnimatedStyle(() => ({
    transform: [{ translateY: dot2.value }],
  }));

  const animatedStyle3 = useAnimatedStyle(() => ({
    transform: [{ translateY: dot3.value }],
  }));

  return (
    <View style={[styles.messageContainer, styles.aiMessageContainer]}>
      <View style={[styles.messageBubble, styles.aiBubble, { backgroundColor: colors.surface }]}>
        <View style={styles.aiHeader}>
          <Bot size={14} color={Brand.primary} />
          <Text style={[styles.aiLabel, { color: Brand.primary }]}>Loggy AI</Text>
        </View>
        <View style={styles.loadingDots}>
          <Animated.View
            style={[
              styles.dot,
              { backgroundColor: Brand.primary },
              animatedStyle1,
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              { backgroundColor: Brand.primary },
              animatedStyle2,
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              { backgroundColor: Brand.primary },
              animatedStyle3,
            ]}
          />
        </View>
      </View>
    </View>
  );
}

// Quick Suggestions Component
function QuickSuggestions({
  onSuggestionClick,
  isLoading,
  isAiConfigured,
}: {
  onSuggestionClick: (prompt: string) => void;
  isLoading: boolean;
  isAiConfigured: boolean;
}) {
  const colors = Colors.light;
  const [activeCategory, setActiveCategory] = useState(suggestionCategories[0].id);

  return (
    <View style={styles.suggestionsContainer}>
      <Text style={[styles.suggestionsTitle, { color: colors.textSecondary }]}>
        Yapabileceklerim:
      </Text>

      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryTabs}
        contentContainerStyle={styles.categoryTabsContent}
      >
        {suggestionCategories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryTab,
                {
                  backgroundColor: isActive ? Brand.primary + '15' : colors.surface,
                  borderColor: isActive ? Brand.primary : colors.border,
                },
              ]}
              onPress={() => setActiveCategory(cat.id)}
            >
              <Icon size={14} color={isActive ? Brand.primary : colors.textMuted} />
              <Text
                style={[
                  styles.categoryTabText,
                  { color: isActive ? Brand.primary : colors.textMuted },
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Suggestions List */}
      <View style={styles.suggestionsList}>
        {suggestionCategories
          .find((cat) => cat.id === activeCategory)
          ?.suggestions.map((suggestion, idx) => {
            const Icon = suggestionCategories.find((cat) => cat.id === activeCategory)?.icon;
            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.suggestionCard,
                  { backgroundColor: colors.card, ...Shadows.sm },
                ]}
                onPress={() => onSuggestionClick(suggestion.prompt)}
                disabled={isLoading || !isAiConfigured}
              >
                <View style={[styles.suggestionIcon, { backgroundColor: activeCategory ? suggestionCategories.find((cat) => cat.id === activeCategory)?.color + '15' : Brand.primary + '15' }]}>
                  {Icon && <Icon size={18} color={suggestionCategories.find((cat) => cat.id === activeCategory)?.color || Brand.primary} />}
                </View>
                <View style={styles.suggestionContent}>
                  <Text style={[styles.suggestionTitle, { color: colors.text }]}>
                    {suggestion.title}
                  </Text>
                  <Text style={[styles.suggestionDescription, { color: colors.textMuted }]}>
                    {suggestion.description}
                  </Text>
                  <Text style={[styles.suggestionPrompt, { color: colors.textMuted }]} numberOfLines={1}>
                    "{suggestion.prompt}"
                  </Text>
                </View>
                <ArrowRight size={16} color={colors.textMuted} />
              </TouchableOpacity>
            );
          })}
      </View>
    </View>
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
  headerContent: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    ...Typography.headingMD,
    flex: 1,
  },
  headerSubtitle: {
    ...Typography.bodySM,
    marginTop: 2,
  },
  newChatButton: {
    padding: Spacing.sm,
  },
  deleteButton: {
    padding: Spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.bodyMD,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  conversationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  conversationContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  conversationTitle: {
    ...Typography.bodyMD,
    fontWeight: '500',
  },
  conversationTime: {
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
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  flatList: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  loadingContainer: {
    paddingVertical: Spacing['2xl'],
    alignItems: 'center',
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
  confirmationButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    ...Typography.bodySM,
    fontWeight: '600',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  cancelButtonText: {
    ...Typography.bodySM,
    fontWeight: '600',
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
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
  loadingText: {
    ...Typography.bodyMD,
    marginTop: Spacing.md,
  },
  errorTitle: {
    ...Typography.headingMD,
    marginTop: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.headingMD,
    marginTop: Spacing.lg,
  },
  emptyText: {
    ...Typography.bodyMD,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: Spacing.xl,
  },
  overlayContent: {
    maxWidth: 400,
    borderRadius: BorderRadius.xl,
    padding: Spacing['2xl'],
    alignItems: 'center',
    ...Shadows.lg,
  },
  overlayIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  overlayTitle: {
    ...Typography.headingMD,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  overlayText: {
    ...Typography.bodyMD,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  overlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  overlayButtonText: {
    color: '#FFFFFF',
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  suggestionsContainer: {
    marginTop: Spacing.xl,
  },
  suggestionsTitle: {
    ...Typography.headingSM,
    marginBottom: Spacing.md,
  },
  categoryTabs: {
    marginBottom: Spacing.md,
  },
  categoryTabsContent: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  categoryTabText: {
    ...Typography.bodyXS,
    fontWeight: '500',
  },
  suggestionsList: {
    gap: Spacing.md,
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  suggestionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTitle: {
    ...Typography.bodyMD,
    fontWeight: '600',
    marginBottom: 2,
  },
  suggestionDescription: {
    ...Typography.bodyXS,
    marginBottom: 4,
  },
  suggestionPrompt: {
    ...Typography.bodyXS,
    fontStyle: 'italic',
  },
  stickyContainer: {
    backgroundColor: '#FFFFFF',
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
