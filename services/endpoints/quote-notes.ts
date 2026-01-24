/**
 * Quote Notes API Endpoints
 *
 * Handles quote notes and collaboration features.
 */

import api, { getErrorMessage } from '../api';

/**
 * Quote Note entity
 */
export interface QuoteNote {
  id: number;
  quote_id: number;
  user_id: number;
  user?: {
    id: number;
    name: string;
    email: string;
  } | null;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Note form data
 */
export interface NoteFormData {
  content: string;
  is_pinned?: boolean;
}

/**
 * Single note response
 */
interface NoteResponse {
  success: boolean;
  message: string;
  data: {
    note: QuoteNote;
  };
}

/**
 * Delete response
 */
interface DeleteResponse {
  success: boolean;
  message: string;
}

/**
 * Create a new note
 */
export async function createQuoteNote(
  quoteId: number,
  data: NoteFormData
): Promise<QuoteNote> {
  try {
    const response = await api.post<NoteResponse>(
      `/quotes/${quoteId}/notes`,
      data
    );
    return response.data.data.note;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Update an existing note
 */
export async function updateQuoteNote(
  quoteId: number,
  noteId: number,
  data: NoteFormData
): Promise<QuoteNote> {
  try {
    const response = await api.put<NoteResponse>(
      `/quotes/${quoteId}/notes/${noteId}`,
      data
    );
    return response.data.data.note;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Delete a note
 */
export async function deleteQuoteNote(
  quoteId: number,
  noteId: number
): Promise<void> {
  try {
    await api.delete<DeleteResponse>(`/quotes/${quoteId}/notes/${noteId}`);
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Toggle pin status of a note
 */
export async function toggleNotePin(
  quoteId: number,
  noteId: number
): Promise<QuoteNote> {
  try {
    const response = await api.patch<NoteResponse>(
      `/quotes/${quoteId}/notes/${noteId}/pin`
    );
    return response.data.data.note;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
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
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Az önce';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} dakika önce`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} saat önce`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} gün önce`;
    } else {
      return formatDate(dateString);
    }
  } catch {
    return dateString;
  }
}
