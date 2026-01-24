/**
 * Notifications API Service
 *
 * API endpoints for notifications management in mobile app.
 */

import api, { PaginatedResponse } from '../api';

/**
 * Notification types that match backend notification classes
 */
export type NotificationType =
  | 'public_load_offer'
  | 'public_load_offer_status'
  | 'new_public_load'
  | 'document_expiry'
  | 'license_expiry'
  | 'insurance_expiry'
  | 'inspection_due'
  | 'roro_cutoff'
  | 'quote_accepted'
  | 'event_reminder'
  | 'message'
  | 'welcome';

/**
 * Notification data structure
 */
export interface NotificationData {
  type?: NotificationType;
  message?: string;
  url?: string;

  // Public load offer related
  load_number?: string;
  encrypted_id?: string;
  status?: 'pending' | 'accepted' | 'rejected';
  offer_amount?: number;
  currency?: string;
  offerer_name?: string;
  rejection_reason?: string;

  // Document/License expiry related
  employee_id?: number;
  employee_name?: string;
  document_type?: string;
  expiry_date?: string;
  days_until?: number;
  urgency?: 'low' | 'medium' | 'high';

  // Vehicle related
  vehicle_id?: number;
  vehicle_plate?: string;
  insurance_type?: string;
  inspection_date?: string;

  // Position related (RoRo)
  position_id?: number;
  position_number?: string;
  cutoff_date?: string;
  vessel_name?: string;
  port_name?: string;

  // Quote related
  quote_id?: number;
  quote_number?: string;
  customer_name?: string;
  total_amount?: number;

  // Event related
  event_id?: number;
  title?: string;
  event_time?: string;
  minutes_before?: number;

  // Conversation related
  conversation_id?: number;
  sender_name?: string;
}

/**
 * Notification item from API
 */
export interface Notification {
  id: string;
  type: string;
  data: NotificationData;
  read_at: string | null;
  created_at: string;
  created_at_human?: string;
}

/**
 * Notification list response
 */
export interface NotificationListResponse {
  data: Notification[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

/**
 * Recent notifications response
 */
export interface RecentNotificationsResponse {
  notifications: Notification[];
  unread_count: number;
}

/**
 * Unread count response
 */
export interface UnreadCountResponse {
  count: number;
}

/**
 * Mark as read response
 */
export interface MarkAsReadResponse {
  success: boolean;
  message: string;
  count?: number;
}

/**
 * Get paginated notifications list
 */
export async function getNotifications(params?: {
  page?: number;
  per_page?: number;
  status?: 'all' | 'unread' | 'read';
}): Promise<NotificationListResponse> {
  const response = await api.get<NotificationListResponse>('/notifications', {
    params,
  });
  return response.data;
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(): Promise<number> {
  const response = await api.get<UnreadCountResponse>('/notifications/unread-count');
  return response.data.count;
}

/**
 * Get recent notifications (for dropdown/quick view)
 */
export async function getRecentNotifications(): Promise<RecentNotificationsResponse> {
  const response = await api.get<RecentNotificationsResponse>('/notifications/recent');
  return response.data;
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string): Promise<MarkAsReadResponse> {
  const response = await api.post<MarkAsReadResponse>(
    `/notifications/${notificationId}/mark-as-read`
  );
  return response.data;
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<MarkAsReadResponse> {
  const response = await api.post<MarkAsReadResponse>('/notifications/mark-all-as-read');
  return response.data;
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<MarkAsReadResponse> {
  const response = await api.delete<MarkAsReadResponse>(`/notifications/${notificationId}`);
  return response.data;
}

/**
 * Get notification URL for navigation
 */
export function getNotificationUrl(data: NotificationData): string | null {
  if (data.url) return data.url;

  switch (data.type) {
    case 'public_load_offer':
    case 'new_public_load':
      return data.encrypted_id ? `/load/${data.encrypted_id}` : '/loads';
    case 'public_load_offer_status':
      return data.status === 'accepted' ? '/loads' : '/loads';
    case 'document_expiry':
    case 'license_expiry':
      return data.employee_id ? `/employee/${data.employee_id}` : '/employees';
    case 'insurance_expiry':
    case 'inspection_due':
      return data.vehicle_id ? `/vehicle/${data.vehicle_id}` : '/vehicles';
    case 'roro_cutoff':
      return data.position_id ? `/position/${data.position_id}` : '/positions';
    case 'quote_accepted':
      return data.quote_id ? `/quote/${data.quote_id}` : '/quotes';
    case 'event_reminder':
      return data.event_id ? `/event/${data.event_id}` : '/events';
    case 'message':
      return data.conversation_id ? `/message/${data.conversation_id}` : '/messages';
    default:
      return '/notifications';
  }
}

/**
 * Get notification icon name for display
 */
export function getNotificationIcon(type?: NotificationType): string {
  switch (type) {
    case 'public_load_offer':
    case 'new_public_load':
      return 'package';
    case 'public_load_offer_status':
      return 'file-check';
    case 'document_expiry':
      return 'file-warning';
    case 'license_expiry':
      return 'user-check';
    case 'insurance_expiry':
      return 'shield-alert';
    case 'inspection_due':
      return 'car';
    case 'roro_cutoff':
      return 'ship';
    case 'quote_accepted':
      return 'check-circle';
    case 'event_reminder':
      return 'calendar-clock';
    case 'message':
      return 'message-circle';
    default:
      return 'bell';
  }
}
