/**
 * Events API Endpoints
 *
 * Handles event (ajanda) management operations.
 */

import api, { getErrorMessage } from '../api';
import { formatDate } from '@/utils/formatters';

/**
 * Event status enum
 */
export type EventStatus = 'pending' | 'completed' | 'cancelled' | 'rescheduled';

/**
 * Event type enum
 */
export type EventType = 'call' | 'meeting' | 'whatsapp' | 'email' | 'task' | 'deadline';

/**
 * Event priority enum
 */
export type EventPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Contact method enum
 */
export type ContactMethod = 'phone' | 'whatsapp' | 'video_call' | 'in_person' | 'email';

/**
 * Reminder minutes enum
 */
export type ReminderMinutes = 15 | 30 | 60 | 1440; // 15min, 30min, 1h, 1day

/**
 * User entity (simplified for relation)
 */
export interface User {
  id: number;
  name: string;
  email: string;
}

/**
 * Customer/Contact entity (simplified for relation)
 */
export interface Customer {
  id: number;
  name: string;
  code?: string;
}

/**
 * Event entity
 */
export interface Event {
  id: number;
  user_id: number;
  customer_id?: number | null;
  title: string;
  description?: string | null;
  start_datetime: string; // ISO string
  end_datetime: string; // ISO string
  is_all_day: boolean;
  event_type: EventType;
  contact_method?: ContactMethod | null;
  contact_detail?: string | null;
  status: EventStatus;
  priority: EventPriority;
  outcome?: string | null;
  next_action?: string | null;
  reminder_minutes?: ReminderMinutes | null;
  color?: string | null; // Hex color
  created_at: string;
  updated_at: string;

  // Relationships
  user?: User;
  customer?: Customer | null;

  // Helper attributes
  is_completed: boolean;
  is_cancelled: boolean;
  reminder_datetime?: string | null; // ISO string
}

/**
 * Event list filters
 */
export interface EventFilters {
  search?: string;
  status?: EventStatus;
  priority?: EventPriority;
  event_type?: EventType;
  customer_id?: number;
  start_date?: string; // For date range
  end_date?: string; // For date range
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

/**
 * Pagination info
 */
export interface Pagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number | null;
  to: number | null;
}

/**
 * Events list response
 */
interface EventsListResponse {
  success: boolean;
  data: {
    events: Event[];
    pagination: Pagination;
  };
}

/**
 * Single event response
 */
interface EventResponse {
  success: boolean;
  message?: string;
  data: {
    event: Event;
    next_event?: Event | null; // For complete action
  };
}

/**
 * Create/Update event data
 */
export interface EventFormData {
  customer_id?: number | null;
  title: string;
  description?: string | null;
  start_datetime: string; // ISO string
  end_datetime: string; // ISO string
  is_all_day?: boolean;
  event_type: EventType;
  contact_method?: ContactMethod | null;
  contact_detail?: string | null;
  status?: EventStatus;
  priority?: EventPriority;
  outcome?: string | null;
  next_action?: string | null;
  reminder_minutes?: ReminderMinutes | null;
  color?: string | null;
}

/**
 * Update schedule data (for drag & drop)
 */
export interface UpdateScheduleData {
  start_datetime: string;
  end_datetime: string;
  is_all_day?: boolean;
}

/**
 * Complete event data
 */
export interface CompleteEventData {
  outcome?: string | null;
  next_action?: string | null;
}

/**
 * Get events list with optional filters
 */
export async function getEvents(
  filters?: EventFilters
): Promise<{ events: Event[]; pagination: Pagination }> {
  try {
    const response = await api.get<EventsListResponse>('/events', {
      params: filters,
    });
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get single event by ID
 */
export async function getEvent(id: number): Promise<Event> {
  try {
    const response = await api.get<EventResponse>(`/events/${id}`);
    return response.data.data.event;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get upcoming events (pending and future)
 */
export async function getUpcomingEvents(
  filters?: Omit<EventFilters, 'status'>
): Promise<{ events: Event[]; pagination: Pagination }> {
  try {
    const response = await api.get<EventsListResponse>('/events/upcoming', {
      params: filters,
    });
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get past events
 */
export async function getPastEvents(
  filters?: EventFilters
): Promise<{ events: Event[]; pagination: Pagination }> {
  try {
    const response = await api.get<EventsListResponse>('/events/past', {
      params: filters,
    });
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get events by date range
 */
export async function getEventsByDateRange(
  startDate: string,
  endDate: string,
  filters?: Omit<EventFilters, 'start_date' | 'end_date'>
): Promise<{ events: Event[]; pagination: Pagination }> {
  try {
    const response = await api.get<EventsListResponse>('/events/date-range', {
      params: {
        start_date: startDate,
        end_date: endDate,
        ...filters,
      },
    });
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Create new event
 */
export async function createEvent(data: EventFormData): Promise<Event> {
  try {
    const response = await api.post<EventResponse>('/events', data);
    return response.data.data.event;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Update event
 */
export async function updateEvent(id: number, data: EventFormData): Promise<Event> {
  try {
    const response = await api.put<EventResponse>(`/events/${id}`, data);
    return response.data.data.event;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Delete event
 */
export async function deleteEvent(id: number): Promise<void> {
  try {
    await api.delete(`/events/${id}`);
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Update event schedule (for drag & drop)
 */
export async function updateEventSchedule(
  id: number,
  data: UpdateScheduleData
): Promise<Event> {
  try {
    const response = await api.patch<EventResponse>(`/events/${id}/schedule`, data);
    return response.data.data.event;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Complete event with outcome and optional next action
 */
export async function completeEvent(
  id: number,
  data: CompleteEventData
): Promise<{ event: Event; nextEvent?: Event | null }> {
  try {
    const response = await api.patch<EventResponse>(`/events/${id}/complete`, data);
    return {
      event: response.data.data.event,
      nextEvent: response.data.data.next_event || null,
    };
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Helper: Get event type label (Turkish)
 */
export function getEventTypeLabel(type: EventType): string {
  const labels: Record<EventType, string> = {
    call: 'Arama',
    meeting: 'Toplantı',
    whatsapp: 'WhatsApp',
    email: 'E-posta',
    task: 'Görev',
    deadline: 'Son Tarih',
  };
  return labels[type] || type;
}

/**
 * Helper: Get event type icon name
 */
export function getEventTypeIcon(type: EventType): string {
  const icons: Record<EventType, string> = {
    call: 'Phone',
    meeting: 'Users',
    whatsapp: 'MessageCircle',
    email: 'Mail',
    task: 'CheckSquare',
    deadline: 'AlertCircle',
  };
  return icons[type] || 'Calendar';
}

/**
 * Helper: Get event status label (Turkish)
 */
export function getEventStatusLabel(status: EventStatus): string {
  const labels: Record<EventStatus, string> = {
    pending: 'Beklemede',
    completed: 'Tamamlandı',
    cancelled: 'İptal',
    rescheduled: 'Ertelendi',
  };
  return labels[status] || status;
}

/**
 * Helper: Get event status color variant
 */
export function getEventStatusColor(
  status: EventStatus
): 'success' | 'warning' | 'error' | 'info' | 'default' {
  const colors: Record<EventStatus, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
    pending: 'warning',
    completed: 'success',
    cancelled: 'error',
    rescheduled: 'info',
  };
  return colors[status] || 'default';
}

/**
 * Helper: Get priority label (Turkish)
 */
export function getPriorityLabel(priority: EventPriority): string {
  const labels: Record<EventPriority, string> = {
    low: 'Düşük',
    normal: 'Normal',
    high: 'Yüksek',
    urgent: 'Acil',
  };
  return labels[priority] || priority;
}

/**
 * Helper: Get priority color
 */
export function getPriorityColor(
  priority: EventPriority
): 'success' | 'warning' | 'error' | 'info' | 'default' {
  const colors: Record<EventPriority, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
    low: 'info',
    normal: 'default',
    high: 'warning',
    urgent: 'error',
  };
  return colors[priority] || 'default';
}

/**
 * Helper: Get contact method label (Turkish)
 */
export function getContactMethodLabel(method: ContactMethod): string {
  const labels: Record<ContactMethod, string> = {
    phone: 'Telefon',
    whatsapp: 'WhatsApp',
    video_call: 'Video Görüşme',
    in_person: 'Yüz Yüze',
    email: 'E-posta',
  };
  return labels[method] || method;
}

/**
 * Helper: Get reminder label (Turkish)
 */
export function getReminderLabel(minutes: ReminderMinutes): string {
  const labels: Record<ReminderMinutes, string> = {
    15: '15 dakika önce',
    30: '30 dakika önce',
    60: '1 saat önce',
    1440: '1 gün önce',
  };
  return labels[minutes] || `${minutes} dakika önce`;
}

/**
 * Helper: Format event time range
 */
export function formatEventTimeRange(event: Event): string {
  if (event.is_all_day) {
    return 'Tüm gün';
  }

  const startTime = formatDate(event.start_datetime, 'HH:mm');
  const endTime = formatDate(event.end_datetime, 'HH:mm');

  return `${startTime} - ${endTime}`;
}

/**
 * Helper: Check if event is today
 */
export function isEventToday(event: Event): boolean {
  const today = new Date();
  const eventDate = new Date(event.start_datetime);

  return (
    today.getDate() === eventDate.getDate() &&
    today.getMonth() === eventDate.getMonth() &&
    today.getFullYear() === eventDate.getFullYear()
  );
}

/**
 * Helper: Check if event is upcoming (today or future)
 */
export function isEventUpcoming(event: Event): boolean {
  const now = new Date();
  const eventDate = new Date(event.start_datetime);

  return eventDate >= now && event.status === 'pending';
}

/**
 * Helper: Check if event is past
 */
export function isEventPast(event: Event): boolean {
  const now = new Date();
  const eventDate = new Date(event.start_datetime);

  return eventDate < now;
}

/**
 * Helper: Group events by date
 */
export function groupEventsByDate(events: Event[]): Record<string, Event[]> {
  const grouped: Record<string, Event[]> = {};

  events.forEach((event) => {
    const dateKey = formatDate(event.start_datetime, 'yyyy-MM-dd');

    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }

    grouped[dateKey].push(event);
  });

  // Sort events within each date by start time
  Object.keys(grouped).forEach((dateKey) => {
    grouped[dateKey].sort(
      (a, b) =>
        new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
    );
  });

  return grouped;
}
