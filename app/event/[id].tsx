/**
 * Event Detail Screen
 *
 * Shows event details with complete functionality.
 */

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
import { router, useLocalSearchParams } from 'expo-router';
import {
  Edit,
  Trash2,
  Calendar,
  Clock,
  User,
  Building2,
  Phone,
  MessageCircle,
  Mail,
  CheckCircle,
  AlertCircle,
  Flag,
  Bell,
  FileText,
} from 'lucide-react-native';
import { Card, Badge } from '@/components/ui';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { FullScreenHeader } from '@/components/header/FullScreenHeader';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import { useToast } from '@/hooks/use-toast';
import {
  getEvent,
  deleteEvent,
  completeEvent,
  Event,
  getEventTypeLabel,
  getEventStatusLabel,
  getEventStatusColor,
  getPriorityLabel,
  getPriorityColor,
  getContactMethodLabel,
  getReminderLabel,
  formatEventTimeRange,
  ReminderMinutes,
} from '@/services/endpoints/events';
import { formatDate } from '@/utils/formatters';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = Colors.light;
  const { success, error: showError } = useToast();

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);

  // Fetch event data
  const fetchEvent = useCallback(async () => {
    if (!id) return;

    try {
      setError(null);
      const data = await getEvent(parseInt(id, 10));
      setEvent(data);
    } catch (err) {
      console.error('Event fetch error:', err);
      setError(err instanceof Error ? err.message : 'Etkinlik bilgileri yüklenemedi');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvent();
  };

  // Delete event
  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await deleteEvent(parseInt(id, 10));
      success('Başarılı', 'Etkinlik silindi.');
      router.back();
    } catch (err) {
      showError('Hata', err instanceof Error ? err.message : 'Etkinlik silinemedi.');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Complete event
  const handleComplete = () => {
    setShowCompleteConfirm(true);
  };

  const handleConfirmComplete = async () => {
    if (!id) return;
    setIsCompleting(true);
    try {
      const result = await completeEvent(parseInt(id, 10), {});
      setEvent(result.event);
      success('Başarılı', 'Etkinlik tamamlandı.');
      setShowCompleteConfirm(false);
      // Optionally show next event toast if created
      if (result.nextEvent) {
        setTimeout(() => {
          success('Bilgi', 'Yeni takip etkinliği oluşturuldu.');
        }, 1000);
      }
    } catch (err) {
      showError('Hata', err instanceof Error ? err.message : 'Etkinlik tamamlanamadı.');
    } finally {
      setIsCompleting(false);
    }
  };

  // Render info row
  const renderInfoRow = (
    label: string,
    value?: string | number | boolean | null,
    icon?: any,
    badge?: { label: string; variant: any }
  ) => {
    if (value === undefined || value === null || value === '') return null;
    const Icon = icon;
    const displayValue = typeof value === 'boolean' ? (value ? 'Evet' : 'Hayır') : String(value);

    return (
      <View style={styles.infoRow}>
        <View style={styles.infoRowLeft}>
          {Icon && <Icon size={16} color={colors.textMuted} />}
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}:</Text>
        </View>
        <View style={styles.infoRowRight}>
          {badge ? (
            <Badge label={badge.label} variant={badge.variant} size="sm" />
          ) : (
            <Text style={[styles.infoValue, { color: colors.text }]}>{displayValue}</Text>
          )}
        </View>
      </View>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: Brand.primary }]}>
        <FullScreenHeader title="Etkinlik Detayı" showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Etkinlik bilgileri yükleniyor...
          </Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error || !event) {
    return (
      <View style={[styles.container, { backgroundColor: Brand.primary }]}>
        <FullScreenHeader title="Etkinlik Detayı" showBackButton />
        <View style={styles.errorContainer}>
          <AlertCircle size={64} color={colors.danger} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Bir hata oluştu</Text>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {error || 'Etkinlik bulunamadı'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Brand.primary }]}
            onPress={fetchEvent}
          >
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const canComplete = event.status === 'pending';

  return (
    <View style={[styles.container, { backgroundColor: Brand.primary }]}>
      <FullScreenHeader
        title={event.title}
        showBackButton
        rightIcons={
          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            <TouchableOpacity
              onPress={() => router.push(`/event/${event.id}/edit` as any)}
              activeOpacity={0.7}
            >
              <Edit size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              activeOpacity={0.7}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Trash2 size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Brand.primary}
            colors={[Brand.primary]}
          />
        }
      >
        {/* Status & Priority Section */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <FileText size={20} color={Brand.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Durum</Text>
          </View>
          <View style={styles.cardContent}>
            {renderInfoRow('Durum', undefined, undefined, {
              label: getEventStatusLabel(event.status),
              variant: getEventStatusColor(event.status),
            })}
            {renderInfoRow('Öncelik', undefined, Flag, {
              label: getPriorityLabel(event.priority),
              variant: getPriorityColor(event.priority),
            })}
            {renderInfoRow('Tür', getEventTypeLabel(event.event_type))}
          </View>
        </Card>

        {/* Time Section */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Calendar size={20} color={Brand.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Tarih & Saat</Text>
          </View>
          <View style={styles.cardContent}>
            {renderInfoRow(
              'Başlangıç',
              formatDate(event.start_datetime, 'dd MMMM yyyy, HH:mm'),
              Clock
            )}
            {renderInfoRow(
              'Bitiş',
              formatDate(event.end_datetime, 'dd MMMM yyyy, HH:mm'),
              Clock
            )}
            {renderInfoRow('Süre', formatEventTimeRange(event))}
            {renderInfoRow('Tüm Gün', event.is_all_day)}
          </View>
        </Card>

        {/* Description */}
        {event.description && (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <FileText size={20} color={Brand.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Açıklama</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.description, { color: colors.text }]}>
                {event.description}
              </Text>
            </View>
          </Card>
        )}

        {/* Customer Section */}
        {event.customer && (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Building2 size={20} color={Brand.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Müşteri</Text>
            </View>
            <View style={styles.cardContent}>
              {renderInfoRow('Müşteri Adı', event.customer.name, User)}
              {event.customer.code && renderInfoRow('Müşteri Kodu', event.customer.code)}
            </View>
          </Card>
        )}

        {/* Contact Method Section */}
        {event.contact_method && (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Phone size={20} color={Brand.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>İletişim</Text>
            </View>
            <View style={styles.cardContent}>
              {renderInfoRow(
                'İletişim Yöntemi',
                getContactMethodLabel(event.contact_method)
              )}
              {event.contact_detail && renderInfoRow('Detay', event.contact_detail)}
            </View>
          </Card>
        )}

        {/* Reminder Section */}
        {event.reminder_minutes && (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Bell size={20} color={Brand.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Hatırlatıcı</Text>
            </View>
            <View style={styles.cardContent}>
              {renderInfoRow(
                'Hatırlatıcı',
                getReminderLabel(event.reminder_minutes as ReminderMinutes),
                Bell
              )}
              {event.reminder_datetime && renderInfoRow(
                'Hatırlatıcı Zamanı',
                formatDate(event.reminder_datetime, 'dd MMMM yyyy, HH:mm'),
                Clock
              )}
            </View>
          </Card>
        )}

        {/* Outcome Section (for completed events) */}
        {event.outcome && (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <CheckCircle size={20} color={Brand.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Sonuç</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.description, { color: colors.text }]}>
                {event.outcome}
              </Text>
            </View>
          </Card>
        )}

        {/* Next Action Section */}
        {event.next_action && (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <AlertCircle size={20} color={Brand.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Sonraki Adım</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.description, { color: colors.text }]}>
                {event.next_action}
              </Text>
            </View>
          </Card>
        )}

        {/* Complete Button */}
        {canComplete && (
          <TouchableOpacity
            style={[styles.completeButton, { backgroundColor: Brand.primary }]}
            onPress={handleComplete}
            disabled={isCompleting}
          >
            {isCompleting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <CheckCircle size={20} color="#FFFFFF" />
                <Text style={styles.completeButtonText}>Etkinliği Tamamla</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Timestamps */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Clock size={20} color={Brand.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Kayıt Bilgileri</Text>
          </View>
          <View style={styles.cardContent}>
            {renderInfoRow(
              'Oluşturulma',
              formatDate(event.created_at, 'dd MMMM yyyy, HH:mm'),
              Calendar
            )}
            {renderInfoRow(
              'Güncelleme',
              formatDate(event.updated_at, 'dd MMMM yyyy, HH:mm'),
              Calendar
            )}
          </View>
        </Card>
      </ScrollView>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Etkinliği Sil"
        message="Bu etkinliği silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmText="Sil"
        cancelText="İptal"
        isDestructive
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Complete Confirmation Dialog */}
      <ConfirmDialog
        visible={showCompleteConfirm}
        title="Etkinliği Tamamla"
        message="Bu etkinliği tamamlandı olarak işaretlemek istediğinizden emin misiniz?"
        confirmText="Tamamla"
        cancelText="İptal"
        isLoading={isCompleting}
        onConfirm={handleConfirmComplete}
        onCancel={() => setShowCompleteConfirm(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    paddingBottom: Spacing['3xl'],
  },
  card: {
    marginBottom: Spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardTitle: {
    ...Typography.headingSM,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  cardContent: {
    gap: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  infoRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  infoRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
    justifyContent: 'flex-end',
  },
  infoLabel: {
    ...Typography.bodySM,
  },
  infoValue: {
    ...Typography.bodyMD,
    fontWeight: '500',
    textAlign: 'right',
  },
  description: {
    ...Typography.bodyMD,
    lineHeight: 22,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  completeButtonText: {
    ...Typography.bodyLG,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.lg,
  },
  loadingText: {
    ...Typography.bodyMD,
    marginTop: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    ...Shadows.lg,
  },
  errorTitle: {
    ...Typography.headingMD,
    fontWeight: '600',
    marginTop: Spacing.md,
  },
  errorText: {
    ...Typography.bodyMD,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  retryButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  retryButtonText: {
    ...Typography.bodyMD,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
