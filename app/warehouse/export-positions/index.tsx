/**
 * İhracat Deposu Pozisyon Durumları Sayfası
 *
 * CLAUDE.md ilkelerine uygun
 * PageHeader + FlatList + Genişletilebilir Kartlar
 * Workflow Stage Indicator + Yük Durum Listesi
 * Backend: GET /export-warehouses/positions
 *          GET /positions/{id}/status?detailed=true
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
  TextInput
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { PageHeader } from '@/components/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardBorderRadius,
  DashboardFontSizes,
  DashboardShadows
} from '@/constants/dashboard-theme'
import {
  getPositions,
  getPositionStatus,
  getLoadStatusInfo,
  PositionListItem,
  PositionCompletionStatus,
  LoadStatusDetail
} from '@/services/endpoints/export-warehouse-items'


// ─── Tarih Formatlama ────────────────────────────────────

const formatDate = (dateString?: string | null): string => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${day}/${month} ${hours}:${minutes}`
  } catch {
    return dateString
  }
}

// ─── Workflow Aşamaları ─────────────────────────────────

interface WorkflowStage {
  key: string
  label: string
  description: string
  icon: keyof typeof Ionicons.glyphMap
  isComplete: boolean
  isCurrent: boolean
}

function getWorkflowStages(
  position: PositionListItem,
  status?: PositionCompletionStatus
): WorkflowStage[] {
  const hasDriver = !!position.driver && (!!position.truck_tractor || !!position.trailer)
  const hasArrived = (status?.completion_percentage ?? 0) > 0
  const canShip = status?.can_ship ?? false

  // Mevcut aşamayı belirle
  const currentStage = canShip ? 3 : hasArrived ? 2 : hasDriver ? 1 : 0

  return [
    {
      key: 'planning',
      label: 'Planlama',
      description: 'Pozisyon oluşturuldu',
      icon: 'checkmark-circle',
      isComplete: true,
      isCurrent: currentStage === 0,
    },
    {
      key: 'driver',
      label: 'Sürücü Atandı',
      description: hasDriver ? 'Sürücü ve araçlar atandı' : 'Bekleniyor...',
      icon: hasDriver ? 'checkmark-circle' : 'time-outline',
      isComplete: hasDriver,
      isCurrent: currentStage === 1,
    },
    {
      key: 'warehouse',
      label: 'Depoda',
      description: hasArrived
        ? `${status?.arrived_loads ?? 0}/${status?.total_loads ?? 0}`
        : 'Bekleniyor...',
      icon: hasArrived ? 'checkmark-circle' : 'time-outline',
      isComplete: hasArrived,
      isCurrent: currentStage === 2,
    },
    {
      key: 'ready',
      label: 'Sevk Hazır',
      description: canShip ? 'Sevkiyata hazır' : 'Bekleniyor...',
      icon: canShip ? 'checkmark-circle' : 'time-outline',
      isComplete: canShip,
      isCurrent: currentStage === 3,
    },
  ]
}

// ─── Workflow Stage Indicator ───────────────────────────

function WorkflowStageIndicator({
  position,
  status,
}: {
  position: PositionListItem
  status?: PositionCompletionStatus
}) {
  const stages = getWorkflowStages(position, status)

  return (
    <View style={wfStyles.container}>
      {/* Timeline */}
      <View style={wfStyles.timeline}>
        {stages.map((stage, index) => {
          const color = stage.isComplete
            ? DashboardColors.success
            : stage.isCurrent
              ? '#3B82F6'
              : DashboardColors.textMuted

          return (
            <View key={stage.key} style={wfStyles.stageContainer}>
              {/* Bağlantı çizgisi */}
              {index > 0 && (
                <View
                  style={[
                    wfStyles.connector,
                    {
                      backgroundColor: stages[index - 1].isComplete
                        ? DashboardColors.success
                        : DashboardColors.borderLight,
                    },
                  ]}
                />
              )}

              {/* Aşama dairesi */}
              <View
                style={[
                  wfStyles.circle,
                  {
                    backgroundColor: stage.isComplete
                      ? DashboardColors.success
                      : stage.isCurrent
                        ? '#3B82F6'
                        : DashboardColors.background,
                    borderColor: color,
                  },
                ]}
              >
                <Ionicons
                  name={stage.icon}
                  size={14}
                  color={stage.isComplete || stage.isCurrent ? '#fff' : color}
                />
              </View>

              {/* Etiket */}
              <Text
                style={[wfStyles.stageLabel, { color }]}
                numberOfLines={1}
              >
                {stage.label}
              </Text>
            </View>
          )
        })}
      </View>

      {/* Aşama Chip'leri */}
      <View style={wfStyles.chips}>
        {stages.map((stage) => {
          const bgColor = stage.isComplete
            ? 'rgba(16, 185, 129, 0.1)'
            : stage.isCurrent
              ? 'rgba(59, 130, 246, 0.1)'
              : 'rgba(107, 114, 128, 0.06)'
          const textColor = stage.isComplete
            ? DashboardColors.success
            : stage.isCurrent
              ? '#3B82F6'
              : DashboardColors.textMuted

          return (
            <View
              key={stage.key}
              style={[wfStyles.chip, { backgroundColor: bgColor }]}
            >
              <Ionicons name={stage.icon} size={12} color={textColor} />
              <Text style={[wfStyles.chipText, { color: textColor }]}>
                {stage.description}
              </Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

const wfStyles = StyleSheet.create({
  container: {
    marginBottom: DashboardSpacing.md,
  },
  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: DashboardSpacing.sm,
    paddingHorizontal: DashboardSpacing.xs,
  },
  stageContainer: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  connector: {
    position: 'absolute',
    top: 13,
    right: '50%',
    left: '-50%',
    height: 2,
    zIndex: -1,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  stageLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DashboardSpacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 4,
    borderRadius: DashboardBorderRadius.full,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '500',
  },
})

// ─── Load Status Row ────────────────────────────────────

function LoadStatusRow({ load }: { load: LoadStatusDetail }) {
  const statusInfo = getLoadStatusInfo(load.status)
  const isOverdue = load.is_overdue

  return (
    <View style={[loadStyles.row, isOverdue && loadStyles.rowOverdue]}>
      {/* Yük No + Durum */}
      <View style={loadStyles.topRow}>
        <Text style={loadStyles.loadNumber}>{load.load_number}</Text>
        <View style={[loadStyles.statusBadge, { backgroundColor: statusInfo.bg }]}>
          <Ionicons
            name={statusInfo.icon as keyof typeof Ionicons.glyphMap}
            size={12}
            color={statusInfo.color}
          />
          <Text style={[loadStyles.statusText, { color: statusInfo.color }]}>
            {statusInfo.label}
          </Text>
        </View>
      </View>

      {/* Alt bilgiler */}
      <View style={loadStyles.bottomRow}>
        {/* Beklenen varış */}
        {load.expected_arrival_date && (
          <View style={loadStyles.infoItem}>
            <Ionicons
              name="calendar-outline"
              size={12}
              color={isOverdue ? DashboardColors.danger : DashboardColors.textMuted}
            />
            <Text
              style={[
                loadStyles.infoText,
                isOverdue && { color: DashboardColors.danger, fontWeight: '600' },
              ]}
            >
              {formatDate(load.expected_arrival_date)}
            </Text>
            {isOverdue && (
              <View style={loadStyles.overdueBadge}>
                <Text style={loadStyles.overdueText}>Gecikmiş</Text>
              </View>
            )}
          </View>
        )}

        {/* Göstergeler */}
        <View style={loadStyles.indicators}>
          {load.has_damage && (
            <View style={[loadStyles.indicatorBadge, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
              <Ionicons name="warning-outline" size={11} color="#EF4444" />
              <Text style={[loadStyles.indicatorText, { color: '#EF4444' }]}>Hasarlı</Text>
            </View>
          )}
          {load.has_quantity_discrepancy && (
            <View style={[loadStyles.indicatorBadge, { backgroundColor: 'rgba(249, 115, 22, 0.1)' }]}>
              <Ionicons name="alert-circle-outline" size={11} color="#F97316" />
              <Text style={[loadStyles.indicatorText, { color: '#F97316' }]}>
                {load.received_package_count ?? '?'}/{load.expected_package_count ?? '?'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Ön taşıma bilgisi */}
      {load.domestic_transport_order && (
        <View style={loadStyles.transportRow}>
          <Ionicons name="swap-horizontal-outline" size={12} color={DashboardColors.textMuted} />
          <Text style={loadStyles.transportText}>
            {load.domestic_transport_order.order_number}
          </Text>
          {load.domestic_transport_order.vehicle_plate && (
            <>
              <Ionicons name="car-outline" size={12} color={DashboardColors.textMuted} />
              <Text style={loadStyles.transportText}>
                {load.domestic_transport_order.vehicle_plate}
              </Text>
            </>
          )}
          {load.domestic_transport_order.driver_name && (
            <>
              <Ionicons name="person-outline" size={12} color={DashboardColors.textMuted} />
              <Text style={loadStyles.transportText} numberOfLines={1}>
                {load.domestic_transport_order.driver_name}
              </Text>
            </>
          )}
        </View>
      )}
    </View>
  )
}

const loadStyles = StyleSheet.create({
  row: {
    paddingVertical: DashboardSpacing.sm,
    paddingHorizontal: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
    backgroundColor: DashboardColors.background,
    marginBottom: DashboardSpacing.xs,
  },
  rowOverdue: {
    backgroundColor: 'rgba(239, 68, 68, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.15)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  loadNumber: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
    fontFamily: 'monospace',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 2,
    borderRadius: DashboardBorderRadius.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textMuted,
  },
  overdueBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: DashboardBorderRadius.full,
  },
  overdueText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#EF4444',
  },
  indicators: {
    flexDirection: 'row',
    gap: DashboardSpacing.xs,
  },
  indicatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: DashboardBorderRadius.full,
  },
  indicatorText: {
    fontSize: 10,
    fontWeight: '600',
  },
  transportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: DashboardColors.borderLight,
  },
  transportText: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textMuted,
    fontFamily: 'monospace',
  },
})

// ─── Progress Bar ───────────────────────────────────────

function ProgressBar({ percentage }: { percentage: number }) {
  const barWidth = useSharedValue(0)

  useEffect(() => {
    barWidth.value = withTiming(percentage, { duration: 600 })
  }, [percentage, barWidth])

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value}%`,
  }))

  const barColor = percentage >= 100
    ? DashboardColors.success
    : percentage >= 50
      ? '#3B82F6'
      : '#F59E0B'

  return (
    <View style={progressStyles.container}>
      <View style={progressStyles.track}>
        <Animated.View
          style={[progressStyles.bar, { backgroundColor: barColor }, animatedStyle]}
        />
      </View>
      <Text style={[progressStyles.label, { color: barColor }]}>
        %{Math.round(percentage)}
      </Text>
    </View>
  )
}

const progressStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
  },
  track: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: DashboardColors.borderLight,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 3,
  },
  label: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '700',
    minWidth: 32,
    textAlign: 'right',
  },
})

// ─── Position Card ──────────────────────────────────────

interface PositionCardProps {
  position: PositionListItem
  status?: PositionCompletionStatus
  isStatusLoading: boolean
}

function PositionCard({ position, status, isStatusLoading }: PositionCardProps) {
  const [expanded, setExpanded] = useState(false)

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setExpanded(!expanded)
  }

  const canShip = status?.can_ship ?? false
  const completionPct = status?.completion_percentage ?? 0

  // Özet etiketi
  const getSummaryLabel = (): string => {
    if (!status) return 'Yükleniyor...'
    const parts: string[] = []
    if (status.missing_loads > 0) parts.push(`${status.missing_loads} yolda`)
    if (status.arrived_loads > 0) parts.push(`${status.arrived_loads} depoda`)
    const damaged = status.load_details?.filter(l => l.has_damage).length ?? 0
    if (damaged > 0) parts.push(`${damaged} hasarlı`)
    return parts.length > 0 ? parts.join(', ') : 'Bilgi yok'
  }

  return (
    <Pressable
      style={[
        styles.card,
        canShip && styles.cardReady,
      ]}
      onPress={handlePress}
    >
      {/* Collapsed Header */}
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.cardIcon,
            {
              backgroundColor: canShip
                ? 'rgba(16, 185, 129, 0.1)'
                : 'rgba(107, 114, 128, 0.08)',
            },
          ]}
        >
          <Ionicons
            name="bus-outline"
            size={20}
            color={canShip ? DashboardColors.success : DashboardColors.textMuted}
          />
        </View>

        <View style={styles.cardHeaderContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {position.position_number}
          </Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {getSummaryLabel()}
          </Text>
        </View>

        {/* Durum badge */}
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: canShip
                ? 'rgba(16, 185, 129, 0.1)'
                : 'rgba(249, 115, 22, 0.1)',
            },
          ]}
        >
          <Ionicons
            name={canShip ? 'checkmark-circle' : 'time-outline'}
            size={14}
            color={canShip ? DashboardColors.success : '#F97316'}
          />
          <Text
            style={[
              styles.statusBadgeText,
              { color: canShip ? DashboardColors.success : '#F97316' },
            ]}
          >
            {canShip ? 'Hazır' : 'Bekliyor'}
          </Text>
        </View>

        {/* Expand ikonu */}
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={DashboardColors.textMuted}
          style={{ marginLeft: DashboardSpacing.xs }}
        />
      </View>

      {/* Progress Bar */}
      {!isStatusLoading && status && (
        <View style={{ marginTop: DashboardSpacing.sm }}>
          <ProgressBar percentage={completionPct} />
        </View>
      )}

      {/* İstatistikler (her zaman görünür) */}
      {!isStatusLoading && status && (
        <View style={styles.statsRow}>
          <View style={[styles.statChip, { backgroundColor: 'rgba(107, 114, 128, 0.06)' }]}>
            <Ionicons name="layers-outline" size={13} color={DashboardColors.textMuted} />
            <Text style={[styles.statValue, { color: DashboardColors.textPrimary }]}>
              {status.total_loads}
            </Text>
            <Text style={styles.statLabel}>Toplam</Text>
          </View>
          <View style={[styles.statChip, { backgroundColor: 'rgba(16, 185, 129, 0.08)' }]}>
            <Ionicons name="checkmark-circle-outline" size={13} color={DashboardColors.success} />
            <Text style={[styles.statValue, { color: DashboardColors.success }]}>
              {status.arrived_loads}
            </Text>
            <Text style={styles.statLabel}>Gelmiş</Text>
          </View>
          <View style={[styles.statChip, { backgroundColor: 'rgba(249, 115, 22, 0.08)' }]}>
            <Ionicons name="time-outline" size={13} color="#F97316" />
            <Text style={[styles.statValue, { color: '#F97316' }]}>
              {status.missing_loads}
            </Text>
            <Text style={styles.statLabel}>Bekliyor</Text>
          </View>
        </View>
      )}

      {/* Loading state */}
      {isStatusLoading && (
        <View style={styles.cardLoadingRow}>
          <ActivityIndicator size="small" color={DashboardColors.primary} />
          <Text style={styles.cardLoadingText}>Durum yükleniyor...</Text>
        </View>
      )}

      {/* Expanded Content */}
      {expanded && status && (
        <View style={styles.expandedContent}>
          {/* Workflow */}
          <WorkflowStageIndicator position={position} status={status} />

          {/* Sevk Hazır Mesajı */}
          {canShip && (
            <View style={styles.successMessage}>
              <Ionicons name="checkmark-circle" size={18} color={DashboardColors.success} />
              <Text style={styles.successText}>
                Sevkiyat Hazır — Tüm yükler depoya gelmiş
              </Text>
            </View>
          )}

          {/* Yük Listesi */}
          {status.load_details && status.load_details.length > 0 && (
            <View style={styles.loadSection}>
              <View style={styles.loadSectionHeader}>
                <Ionicons name="cube-outline" size={16} color={DashboardColors.textSecondary} />
                <Text style={styles.loadSectionTitle}>
                  Yükler ({status.load_details.length})
                </Text>
              </View>
              {status.load_details.map((load) => (
                <LoadStatusRow key={load.load_id} load={load} />
              ))}
            </View>
          )}
        </View>
      )}
    </Pressable>
  )
}

// ─── Skeleton ───────────────────────────────────────────

function PositionCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Skeleton width={44} height={44} borderRadius={12} />
        <View style={{ flex: 1, marginLeft: DashboardSpacing.sm }}>
          <Skeleton width={140} height={18} />
          <Skeleton width={180} height={14} style={{ marginTop: 4 }} />
        </View>
        <Skeleton width={72} height={28} borderRadius={14} />
      </View>
      <View style={{ marginTop: DashboardSpacing.sm }}>
        <Skeleton width="100%" height={6} borderRadius={3} />
      </View>
      <View style={[styles.statsRow, { marginTop: DashboardSpacing.sm }]}>
        <Skeleton width="30%" height={32} borderRadius={8} />
        <Skeleton width="30%" height={32} borderRadius={8} />
        <Skeleton width="30%" height={32} borderRadius={8} />
      </View>
    </View>
  )
}

// ─── Empty State ────────────────────────────────────────

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="bus-outline" size={64} color={DashboardColors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>
        {hasSearch ? 'Sonuç bulunamadı' : 'Henüz pozisyon yok'}
      </Text>
      <Text style={styles.emptyText}>
        {hasSearch
          ? 'Arama kriterlerinize uygun pozisyon bulunamadı.'
          : 'Depoya gönderilmiş pozisyon bulunmuyor.'}
      </Text>
    </View>
  )
}

// ─── Ana Sayfa ──────────────────────────────────────────

export default function PositionStatusScreen() {
  const [positions, setPositions] = useState<PositionListItem[]>([])
  const [completionStatuses, setCompletionStatuses] = useState<
    Record<number, PositionCompletionStatus>
  >({})
  const [statusLoadingIds, setStatusLoadingIds] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')

  const isMountedRef = useRef(true)
  const fetchIdRef = useRef(0)
  const hasInitialFetchRef = useRef(false)

  // Pozisyonları ve durumları çek
  const executeFetch = useCallback(async () => {
    const currentFetchId = ++fetchIdRef.current

    try {
      // 1. Pozisyon listesi
      const positionList = await getPositions()

      if (currentFetchId !== fetchIdRef.current || !isMountedRef.current) return

      setPositions(positionList)
      hasInitialFetchRef.current = true

      // 2. Her pozisyon için detaylı durum çek
      const loadingIds = new Set(positionList.map(p => p.id))
      setStatusLoadingIds(loadingIds)

      const statuses: Record<number, PositionCompletionStatus> = {}

      // Paralel çek (Promise.allSettled ile)
      const results = await Promise.allSettled(
        positionList.map(async (pos) => {
          const detail = await getPositionStatus(pos.id, true)
          return { id: pos.id, detail }
        })
      )

      if (currentFetchId !== fetchIdRef.current || !isMountedRef.current) return

      for (const result of results) {
        if (result.status === 'fulfilled') {
          statuses[result.value.id] = result.value.detail
        }
      }

      setCompletionStatuses(statuses)
      setStatusLoadingIds(new Set())
    } catch (err) {
      if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
        if (__DEV__) console.error('Positions fetch error:', err)
      }
    } finally {
      if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
        setIsLoading(false)
        setRefreshing(false)
      }
    }
  }, [])

  // İlk yükleme
  useEffect(() => {
    isMountedRef.current = true
    executeFetch()

    return () => {
      isMountedRef.current = false
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Focus yenileme
  const executeFetchRef = useRef(executeFetch)
  useEffect(() => {
    executeFetchRef.current = executeFetch
  }, [executeFetch])

  useFocusEffect(
    useCallback(() => {
      if (hasInitialFetchRef.current) {
        executeFetchRef.current()
      }
    }, [])
  )

  const onRefresh = async () => {
    setRefreshing(true)
    await executeFetch()
  }

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.back()
  }

  // Filtrelenmiş pozisyonlar
  const filteredPositions = search.trim()
    ? positions.filter(
        (p) =>
          p.position_number?.toLowerCase().includes(search.toLowerCase()) ||
          p.description?.toLowerCase().includes(search.toLowerCase()) ||
          p.name?.toLowerCase().includes(search.toLowerCase())
      )
    : positions

  // İstatistikler
  const readyCount = Object.values(completionStatuses).filter(s => s.can_ship).length
  const waitingCount = positions.length - readyCount

  return (
    <View style={styles.container}>
      <PageHeader
        title="Pozisyon Durumları"
        icon="bus-outline"
        subtitle={`${positions.length} pozisyon`}
        showBackButton
        onBackPress={handleBackPress}
      />

      <View style={styles.content}>
        {/* Arama */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Ionicons
              name="search-outline"
              size={16}
              color={DashboardColors.textMuted}
            />
            <TextInput
              style={styles.searchTextInput}
              placeholder="Pozisyon ara..."
              placeholderTextColor={DashboardColors.textMuted}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color={DashboardColors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Stat Chip'leri */}
        {!isLoading && (
          <View style={styles.statsBar}>
            <View style={[styles.topStatChip, { borderColor: DashboardColors.borderLight }]}>
              <Ionicons name="bus-outline" size={14} color="#3B82F6" />
              <Text style={styles.topStatLabel}>Toplam</Text>
              <Text style={[styles.topStatValue, { color: DashboardColors.textPrimary }]}>
                {positions.length}
              </Text>
            </View>
            <View style={[styles.topStatChip, { borderColor: 'rgba(16, 185, 129, 0.3)', backgroundColor: 'rgba(16, 185, 129, 0.05)' }]}>
              <Ionicons name="checkmark-circle-outline" size={14} color={DashboardColors.success} />
              <Text style={[styles.topStatLabel, { color: DashboardColors.success }]}>Hazır</Text>
              <Text style={[styles.topStatValue, { color: DashboardColors.success }]}>
                {readyCount}
              </Text>
            </View>
            <View style={[styles.topStatChip, { borderColor: 'rgba(249, 115, 22, 0.3)', backgroundColor: 'rgba(249, 115, 22, 0.05)' }]}>
              <Ionicons name="time-outline" size={14} color="#F97316" />
              <Text style={[styles.topStatLabel, { color: '#F97316' }]}>Bekliyor</Text>
              <Text style={[styles.topStatValue, { color: '#F97316' }]}>
                {waitingCount}
              </Text>
            </View>
          </View>
        )}

        {/* Liste */}
        {isLoading ? (
          <View style={styles.listContent}>
            <PositionCardSkeleton />
            <PositionCardSkeleton />
            <PositionCardSkeleton />
          </View>
        ) : (
          <FlatList
            data={filteredPositions}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <PositionCard
                position={item}
                status={completionStatuses[item.id]}
                isStatusLoading={statusLoadingIds.has(item.id)}
              />
            )}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<EmptyState hasSearch={search.trim().length > 0} />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={DashboardColors.primary}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  )
}

// ─── Ana Stiller ────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DashboardColors.primary,
  },
  content: {
    flex: 1,
    backgroundColor: DashboardColors.background,
  },

  // Arama
  searchContainer: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: DashboardSpacing.md,
    paddingBottom: DashboardSpacing.xs,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.lg,
    paddingHorizontal: DashboardSpacing.md,
    height: 40,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight,
  },
  searchTextInput: {
    flex: 1,
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textPrimary,
    padding: 0,
  },

  // Stat Bar
  statsBar: {
    flexDirection: 'row',
    gap: DashboardSpacing.sm,
    paddingHorizontal: DashboardSpacing.lg,
    paddingVertical: DashboardSpacing.md,
  },
  topStatChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.lg,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight,
    backgroundColor: DashboardColors.surface,
  },
  topStatLabel: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textMuted,
    fontWeight: '500',
  },
  topStatValue: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '800',
  },

  // Card
  card: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.lg,
    marginBottom: DashboardSpacing.md,
    ...DashboardShadows.md,
  },
  cardReady: {
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderContent: {
    flex: 1,
    marginLeft: DashboardSpacing.sm,
    marginRight: DashboardSpacing.sm,
  },
  cardTitle: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
    letterSpacing: 0.3,
  },
  cardSubtitle: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 4,
    borderRadius: DashboardBorderRadius.full,
  },
  statusBadgeText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '700',
  },

  // Stats Row (kart içi)
  statsRow: {
    flexDirection: 'row',
    gap: DashboardSpacing.sm,
    marginTop: DashboardSpacing.sm,
  },
  statChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    borderRadius: DashboardBorderRadius.md,
  },
  statValue: {
    fontSize: DashboardFontSizes.md,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 10,
    color: DashboardColors.textMuted,
    fontWeight: '500',
  },

  // Card loading
  cardLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    marginTop: DashboardSpacing.sm,
    justifyContent: 'center',
  },
  cardLoadingText: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textMuted,
  },

  // Expanded
  expandedContent: {
    marginTop: DashboardSpacing.lg,
    paddingTop: DashboardSpacing.lg,
    borderTopWidth: 1,
    borderTopColor: DashboardColors.borderLight,
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.lg,
    marginBottom: DashboardSpacing.md,
  },
  successText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: DashboardColors.success,
    flex: 1,
  },

  // Load Section
  loadSection: {
    marginTop: DashboardSpacing.xs,
  },
  loadSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    marginBottom: DashboardSpacing.sm,
  },
  loadSectionTitle: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: DashboardColors.textSecondary,
  },

  // List
  listContent: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingBottom: DashboardSpacing.xl,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DashboardSpacing['3xl'],
    paddingHorizontal: DashboardSpacing.xl,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: DashboardColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.xl,
  },
  emptyTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '700',
    color: DashboardColors.text,
    marginBottom: DashboardSpacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: DashboardFontSizes.md,
    color: DashboardColors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
})
