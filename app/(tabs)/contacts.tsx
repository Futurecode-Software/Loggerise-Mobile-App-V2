import { StatusBadge } from '@/components/contacts/StatusBadge'
import { PageHeader } from '@/components/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DashboardAnimations,
  DashboardBorderRadius,
  DashboardColors,
  DashboardFontSizes,
  DashboardShadows,
  DashboardSpacing
} from '@/constants/dashboard-theme'
import { getContacts } from '@/services/endpoints/contacts'
import type { Contact } from '@/types/contact'
import { getContactTypeLabel } from '@/utils/contacts/labels'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

function ContactCardSkeleton() {
  return (
    <View style={styles.contactCard}>
      <View style={styles.cardHeader}>
        <Skeleton width={48} height={48} borderRadius={12} />
        <View style={{ flex: 1, marginLeft: DashboardSpacing.sm }}>
          <Skeleton width={180} height={20} />
          <Skeleton width={80} height={14} style={{ marginTop: 4 }} />
        </View>
        <Skeleton width={60} height={24} borderRadius={12} />
      </View>
      <Skeleton width={120} height={20} borderRadius={16} style={{ marginTop: 8 }} />
      <View style={{ marginTop: DashboardSpacing.md, gap: DashboardSpacing.xs }}>
        <Skeleton width="100%" height={16} />
        <Skeleton width="80%" height={16} />
      </View>
    </View>
  )
}

// Contact Card Component
interface ContactCardProps {
  item: Contact
  onPress: () => void
}

function ContactCard({ item, onPress }: ContactCardProps) {
  const scale = useSharedValue(1)

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }))

  const handlePressIn = () => {
    scale.value = withSpring(0.98, DashboardAnimations.springBouncy)
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, DashboardAnimations.springBouncy)
  }

  return (
    <View>
      <AnimatedPressable
        style={[styles.contactCard, animStyle]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {/* Üst kısım - Icon, İsim ve Durum */}
        <View style={styles.cardHeader}>
          <View style={styles.contactNameContainer}>
            <View style={styles.contactIcon}>
              <Ionicons
                name="person"
                size={20}
                color={DashboardColors.primary}
              />
            </View>
            <View style={styles.headerContent}>
              <Text style={styles.contactName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.contactCode}>{item.code}</Text>
            </View>
          </View>

          <StatusBadge status={item.status} />
        </View>

        {/* Cari Tipi Badge */}
        <View style={styles.typeBadge}>
          <Ionicons
            name="briefcase-outline"
            size={12}
            color={DashboardColors.primary}
          />
          <Text style={styles.typeText}>
            {getContactTypeLabel(item.type)}
          </Text>
        </View>

        {/* Bilgi Container */}
        <View style={styles.infoContainer}>
          {item.email && (
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={14} color={DashboardColors.textSecondary} />
              <Text style={styles.infoText} numberOfLines={1}>
                {item.email}
              </Text>
            </View>
          )}
          {item.phone && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={14} color={DashboardColors.textSecondary} />
              <Text style={styles.infoText} numberOfLines={1}>
                {item.phone}
              </Text>
            </View>
          )}
          {item.tax_number && (
            <View style={styles.infoRow}>
              <Ionicons name="document-text-outline" size={14} color={DashboardColors.textSecondary} />
              <Text style={styles.infoText} numberOfLines={1}>
                VKN: {item.tax_number}
              </Text>
            </View>
          )}
        </View>

        {/* Sağ ok */}
        <View style={styles.cardArrow}>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={DashboardColors.textMuted}
          />
        </View>
      </AnimatedPressable>
    </View>
  )
}

function EmptyState({ searchQuery }: { searchQuery: string }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="people-outline" size={64} color={DashboardColors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'Cari bulunamadı' : 'Henüz cari yok'}
      </Text>
      <Text style={styles.emptyText}>
        {searchQuery
          ? 'Arama kriterlerinize uygun cari bulunamadı.'
          : 'Yeni cari eklemek için sağ üstteki + butonuna tıklayın.'}
      </Text>
    </View>
  )
}

export default function ContactsScreen() {
  const router = useRouter()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const isMountedRef = useRef(true)

  const fetchContacts = useCallback(async (search?: string) => {
    try {
      const response = await getContacts({
        search,
        perPage: 50
      })
      if (isMountedRef.current) {
        setContacts(response.contacts)
        setIsLoading(false)
      }
    } catch {
      if (isMountedRef.current) {
        setContacts([])
        setIsLoading(false)
      }
    }
  }, [])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchContacts(searchQuery)
    setRefreshing(false)
  }, [fetchContacts, searchQuery])

  useEffect(() => {
    isMountedRef.current = true
    fetchContacts()

    return () => {
      isMountedRef.current = false
    }
  }, [fetchContacts])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchContacts(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, fetchContacts])

  const handleContactPress = (contact: Contact) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/accounting/contacts/${contact.id}`)
  }

  return (
    <View style={styles.container}>
      <PageHeader
        title="Cariler"
        icon="people-outline"
        subtitle="Cari yönetimi"
        rightAction={{
          icon: 'add',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
            router.push('/accounting/contacts/new')
          }
        }}
      />

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={DashboardColors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari ara..."
            placeholderTextColor={DashboardColors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync()
                setSearchQuery('')
              }}
            >
              <Ionicons name="close-circle" size={20} color={DashboardColors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Contact List */}
        {isLoading ? (
          <View style={styles.listContent}>
            <ContactCardSkeleton />
            <ContactCardSkeleton />
            <ContactCardSkeleton />
            <ContactCardSkeleton />
          </View>
        ) : (
          <FlatList
            data={contacts}
            renderItem={({ item }) => (
              <ContactCard
                item={item}
                onPress={() => handleContactPress(item)}
              />
            )}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={DashboardColors.primary}
              />
            }
            ListEmptyComponent={<EmptyState searchQuery={searchQuery} />}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DashboardColors.primary
  },
  content: {
    flex: 1,
    backgroundColor: DashboardColors.background
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DashboardColors.surface,
    marginHorizontal: DashboardSpacing.lg,
    marginTop: 0,
    marginBottom: DashboardSpacing.md,
    paddingHorizontal: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
    height: 48,
    gap: DashboardSpacing.sm
  },
  searchInput: {
    flex: 1,
    fontSize: DashboardFontSizes.md,
    color: DashboardColors.text,
    height: '100%'
  },
  listContent: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingBottom: DashboardSpacing.xl
  },
  contactCard: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.lg,
    marginBottom: DashboardSpacing.md,
    position: 'relative',
    ...DashboardShadows.md
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: DashboardSpacing.md
  },
  contactNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    flex: 1,
    marginRight: DashboardSpacing.md
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: DashboardColors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerContent: {
    flex: 1
  },
  contactName: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
    letterSpacing: 0.3,
    marginBottom: 2
  },
  contactCode: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textSecondary,
    fontWeight: '500'
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 4,
    borderRadius: DashboardBorderRadius.full,
    backgroundColor: `${DashboardColors.primary}15`,
    gap: 4,
    marginBottom: DashboardSpacing.md
  },
  typeText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600',
    color: DashboardColors.primary
  },
  infoContainer: {
    gap: DashboardSpacing.xs,
    paddingTop: DashboardSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: DashboardColors.borderLight
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm
  },
  infoText: {
    flex: 1,
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary
  },
  cardArrow: {
    position: 'absolute',
    right: DashboardSpacing.md,
    top: '50%',
    marginTop: -10
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DashboardSpacing['3xl'],
    paddingHorizontal: DashboardSpacing.xl
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: DashboardColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.xl
  },
  emptyTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '700',
    color: DashboardColors.text,
    marginBottom: DashboardSpacing.sm,
    textAlign: 'center'
  },
  emptyText: {
    fontSize: DashboardFontSizes.md,
    color: DashboardColors.textMuted,
    textAlign: 'center',
    lineHeight: 24
  }
})
