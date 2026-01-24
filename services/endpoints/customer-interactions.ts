/**
 * Customer Interactions API Endpoints
 *
 * Handles customer interaction tracking and management operations.
 */

import api, { getErrorMessage } from '../api';

/**
 * Interaction type enum
 */
export type InteractionType = 'meeting' | 'call' | 'email' | 'follow_up';

/**
 * Interaction status enum
 */
export type InteractionStatus = 'pending' | 'completed' | 'cancelled';

/**
 * Customer Interaction entity
 */
export interface CustomerInteraction {
  id: number;
  contact_id: number;
  contact?: { id: number; name: string; code: string } | null;
  user_id: number;
  user?: { id: number; name: string; email: string } | null;
  interaction_type: InteractionType;
  subject: string;
  description?: string;
  interaction_date: string;
  next_followup_date?: string | null;
  status: InteractionStatus;

  // Computed properties
  is_overdue?: boolean;
  has_upcoming_followup?: boolean;

  // Timestamps
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

/**
 * Customer Interaction list filters
 */
export interface InteractionFilters {
  interaction_type?: InteractionType;
  status?: InteractionStatus;
  date_from?: string;
  date_to?: string;
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
 * Interactions list response
 */
interface InteractionsListResponse {
  success: boolean;
  data: {
    interactions: CustomerInteraction[];
    pagination: Pagination;
  };
}

/**
 * Single interaction response
 */
interface InteractionResponse {
  success: boolean;
  data: {
    interaction: CustomerInteraction;
  };
}

/**
 * Create/Update interaction data
 */
export interface InteractionFormData {
  interaction_type: InteractionType;
  subject: string;
  description?: string;
  interaction_date: string;
  next_followup_date?: string;
  status?: InteractionStatus;
}

/**
 * Get interactions list for a customer
 */
export async function getCustomerInteractions(
  customerId: number,
  filters?: InteractionFilters
): Promise<{ interactions: CustomerInteraction[]; pagination: Pagination }> {
  try {
    const response = await api.get<InteractionsListResponse>(
      `/crm/customers/${customerId}/interactions`,
      { params: filters }
    );
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get single interaction by ID
 */
export async function getCustomerInteraction(
  customerId: number,
  interactionId: number
): Promise<CustomerInteraction> {
  try {
    const response = await api.get<InteractionResponse>(
      `/crm/customers/${customerId}/interactions/${interactionId}`
    );
    return response.data.data.interaction;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Create new interaction
 */
export async function createInteraction(
  customerId: number,
  data: InteractionFormData
): Promise<CustomerInteraction> {
  try {
    const response = await api.post<InteractionResponse>(
      `/crm/customers/${customerId}/interactions`,
      data
    );
    return response.data.data.interaction;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Update existing interaction
 */
export async function updateInteraction(
  customerId: number,
  interactionId: number,
  data: Partial<InteractionFormData>
): Promise<CustomerInteraction> {
  try {
    const response = await api.put<InteractionResponse>(
      `/crm/customers/${customerId}/interactions/${interactionId}`,
      data
    );
    return response.data.data.interaction;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Delete interaction
 */
export async function deleteInteraction(
  customerId: number,
  interactionId: number
): Promise<void> {
  try {
    await api.delete(`/crm/customers/${customerId}/interactions/${interactionId}`);
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Mark interaction as completed
 */
export async function completeInteraction(
  customerId: number,
  interactionId: number
): Promise<CustomerInteraction> {
  try {
    const response = await api.patch<InteractionResponse>(
      `/crm/customers/${customerId}/interactions/${interactionId}/complete`
    );
    return response.data.data.interaction;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Mark interaction as cancelled
 */
export async function cancelInteraction(
  customerId: number,
  interactionId: number
): Promise<CustomerInteraction> {
  try {
    const response = await api.patch<InteractionResponse>(
      `/crm/customers/${customerId}/interactions/${interactionId}/cancel`
    );
    return response.data.data.interaction;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get interaction type label in Turkish
 */
export function getInteractionTypeLabel(type: InteractionType): string {
  const labels: Record<InteractionType, string> = {
    meeting: 'Toplantı',
    call: 'Arama',
    email: 'E-posta',
    follow_up: 'Takip',
  };
  return labels[type] || type;
}

/**
 * Get interaction type icon name
 */
export function getInteractionTypeIcon(type: InteractionType): string {
  const icons: Record<InteractionType, string> = {
    meeting: 'users',
    call: 'phone',
    email: 'mail',
    follow_up: 'clock',
  };
  return icons[type] || 'message-circle';
}

/**
 * Get interaction status label in Turkish
 */
export function getInteractionStatusLabel(status: InteractionStatus): string {
  const labels: Record<InteractionStatus, string> = {
    pending: 'Beklemede',
    completed: 'Tamamlandı',
    cancelled: 'İptal Edildi',
  };
  return labels[status] || status;
}

/**
 * Get interaction status variant for Badge component
 */
export function getInteractionStatusVariant(
  status: InteractionStatus
): 'default' | 'info' | 'success' | 'danger' | 'warning' {
  const variants: Record<InteractionStatus, 'default' | 'info' | 'success' | 'danger' | 'warning'> = {
    pending: 'warning',
    completed: 'success',
    cancelled: 'default',
  };
  return variants[status] || 'default';
}

/**
 * Format date for display
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Format datetime for display
 */
export function formatDateTime(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

/**
 * Check if date is overdue
 */
export function isDateOverdue(dateString?: string | null): boolean {
  if (!dateString) return false;
  try {
    const date = new Date(dateString);
    return date < new Date();
  } catch {
    return false;
  }
}
