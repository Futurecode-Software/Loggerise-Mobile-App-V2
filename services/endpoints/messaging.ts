/**
 * Messaging API Endpoints
 *
 * Handles conversations, messages, and real-time messaging operations.
 */

import api, { getErrorMessage } from '../api';

/**
 * Message type enum
 */
export type MessageType = 'text' | 'image' | 'file' | 'voice' | 'location' | 'system';

/**
 * Conversation type enum
 */
export type ConversationType = 'direct' | 'group';

/**
 * Participant entity
 */
export interface Participant {
  id: number;
  user_id: number;
  conversation_id: number;
  nickname?: string;
  is_admin: boolean;
  is_muted: boolean;
  joined_at: string;
  last_read_at?: string;
  user: {
    id: number;
    name: string;
    email: string;
    profile_photo_url?: string;
  };
}

/**
 * Message entity
 */
export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  message_type: MessageType;
  content?: string;
  file_path?: string;
  file_name?: string;
  file_size?: number;
  file_mime_type?: string;
  latitude?: number;
  longitude?: number;
  is_edited: boolean;
  is_deleted: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
  sender?: {
    id: number;
    name: string;
    profile_photo_url?: string;
  };
}

/**
 * Conversation entity
 */
export interface Conversation {
  id: number;
  type: ConversationType;
  name?: string;
  avatar_url?: string;
  last_message_id?: number;
  last_message_at?: string;
  created_by: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  last_message?: Message;
  participants?: Participant[];
  unread_count?: number;
  // Computed for direct messages
  other_user?: {
    id: number;
    name: string;
    profile_photo_url?: string;
  };
}

/**
 * Pagination info
 */
export interface Pagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

/**
 * Conversations list filters
 */
export interface ConversationFilters {
  search?: string;
  type?: ConversationType;
  page?: number;
  per_page?: number;
}

/**
 * Conversations list response
 */
interface ConversationsListResponse {
  success: boolean;
  data: {
    conversations: Conversation[];
    total_unread_count: number;
  };
}

/**
 * Single conversation response
 */
interface ConversationResponse {
  success: boolean;
  data: {
    conversation: Conversation;
    messages: {
      data: Message[];
      pagination: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
      };
    };
    participants: Participant[];
  };
}

/**
 * Find or create conversation response
 */
interface FindOrCreateResponse {
  success: boolean;
  data: {
    conversation: Conversation;
    messages: Message[];
  };
}

/**
 * Message send response
 */
interface MessageResponse {
  success: boolean;
  message: string;
  data: {
    message: Message;
  };
}

/**
 * Create group request
 */
export interface CreateGroupRequest {
  name: string;
  participant_ids: number[];
  avatar?: File;
}

/**
 * Get conversations list
 */
export async function getConversations(
  filters?: ConversationFilters
): Promise<{ conversations: Conversation[]; totalUnreadCount: number }> {
  try {
    const response = await api.get<ConversationsListResponse>('/conversations', {
      params: filters,
    });
    return {
      conversations: response.data.data.conversations,
      totalUnreadCount: response.data.data.total_unread_count,
    };
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get single conversation with messages
 */
export async function getConversation(
  id: number,
  page: number = 1
): Promise<{
  conversation: Conversation;
  messages: Message[];
  participants: Participant[];
  pagination: Pagination;
}> {
  try {
    const response = await api.get<ConversationResponse>(`/conversations/${id}`, {
      params: { page },
    });
    return {
      conversation: response.data.data.conversation,
      messages: response.data.data.messages.data,
      participants: response.data.data.participants,
      pagination: {
        current_page: response.data.data.messages.pagination.current_page,
        last_page: response.data.data.messages.pagination.last_page,
        per_page: response.data.data.messages.pagination.per_page,
        total: response.data.data.messages.pagination.total,
      },
    };
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Find or create a direct message conversation
 */
export async function findOrCreateConversation(
  userId: number
): Promise<{ conversation: Conversation; messages: Message[] }> {
  try {
    const response = await api.post<FindOrCreateResponse>('/conversations/find-or-create', {
      user_id: userId,
    });
    return {
      conversation: response.data.data.conversation,
      messages: response.data.data.messages,
    };
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Mark conversation as read
 */
export async function markConversationAsRead(conversationId: number): Promise<void> {
  try {
    await api.post(`/conversations/${conversationId}/mark-as-read`);
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Create a group conversation
 */
export async function createGroup(data: CreateGroupRequest): Promise<Conversation> {
  try {
    const formData = new FormData();
    formData.append('name', data.name);
    data.participant_ids.forEach((id, index) => {
      formData.append(`participant_ids[${index}]`, String(id));
    });
    if (data.avatar) {
      formData.append('avatar', data.avatar);
    }

    const response = await api.post<{ success: boolean; data: { group: Conversation } }>(
      '/conversations/groups',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data.group;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get group details
 */
export async function getGroupDetails(groupId: number): Promise<{
  group: Conversation;
  participants: Participant[];
}> {
  try {
    const response = await api.get<{
      success: boolean;
      data: { group: Conversation; participants: Participant[] };
    }>(`/conversations/groups/${groupId}`);
    return {
      group: response.data.data.group,
      participants: response.data.data.participants,
    };
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Update group
 */
export async function updateGroup(
  groupId: number,
  data: { name?: string }
): Promise<Conversation> {
  try {
    const response = await api.put<{ success: boolean; data: { group: Conversation } }>(
      `/conversations/groups/${groupId}`,
      data
    );
    return response.data.data.group;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Add participants to group
 */
export async function addParticipants(
  groupId: number,
  userIds: number[]
): Promise<void> {
  try {
    await api.post(`/conversations/groups/${groupId}/participants`, {
      user_ids: userIds,
    });
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Remove participant from group
 */
export async function removeParticipant(
  groupId: number,
  userId: number
): Promise<void> {
  try {
    await api.delete(`/conversations/groups/${groupId}/participants/${userId}`);
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Leave group
 */
export async function leaveGroup(groupId: number): Promise<void> {
  try {
    await api.post(`/conversations/groups/${groupId}/leave`);
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Send a message
 */
export async function sendMessage(data: {
  conversation_id: number;
  message_type?: MessageType;
  content?: string;
  file?: File;
  latitude?: number;
  longitude?: number;
}): Promise<Message> {
  try {
    const formData = new FormData();
    formData.append('conversation_id', String(data.conversation_id));
    formData.append('message_type', data.message_type || 'text');

    if (data.content) {
      formData.append('content', data.content);
    }
    if (data.file) {
      formData.append('file', data.file);
    }
    if (data.latitude !== undefined) {
      formData.append('latitude', String(data.latitude));
    }
    if (data.longitude !== undefined) {
      formData.append('longitude', String(data.longitude));
    }

    const response = await api.post<MessageResponse>('/messages', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data.message;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Send typing indicator
 */
export async function sendTypingIndicator(
  conversationId: number,
  isTyping: boolean
): Promise<void> {
  try {
    await api.post('/typing', {
      conversation_id: conversationId,
      is_typing: isTyping,
    });
  } catch (error) {
    // Silently fail for typing indicators
    console.warn('Typing indicator failed:', error);
  }
}

/**
 * Format message time
 */
export function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Today - show time only
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Dun';
  } else if (diffDays < 7) {
    // This week - show day name
    return date.toLocaleDateString('tr-TR', { weekday: 'short' });
  } else {
    // Older - show date
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  }
}

/**
 * Get conversation display name
 */
export function getConversationName(conversation: Conversation, currentUserId: number): string {
  if (conversation.type === 'group') {
    return conversation.name || 'Isimsiz Grup';
  }

  // For direct messages, show the other user's name
  if (conversation.other_user) {
    return conversation.other_user.name;
  }

  // Fallback: find other participant
  const otherParticipant = conversation.participants?.find(
    (p) => p.user_id !== currentUserId
  );
  return otherParticipant?.user?.name || 'Bilinmeyen';
}

/**
 * Get conversation avatar URL
 */
export function getConversationAvatar(
  conversation: Conversation,
  currentUserId: number
): string | undefined {
  if (conversation.type === 'group') {
    return conversation.avatar_url;
  }

  // For direct messages, show the other user's avatar
  if (conversation.other_user) {
    return conversation.other_user.profile_photo_url;
  }

  // Fallback: find other participant
  const otherParticipant = conversation.participants?.find(
    (p) => p.user_id !== currentUserId
  );
  return otherParticipant?.user?.profile_photo_url;
}

/**
 * Get message preview text
 */
export function getMessagePreview(message: Message | undefined): string {
  if (!message) return '';

  if (message.is_deleted) {
    return 'Bu mesaj silindi';
  }

  switch (message.message_type) {
    case 'text':
      return message.content || '';
    case 'image':
      return '📷 Fotograf';
    case 'file':
      return `📎 ${message.file_name || 'Dosya'}`;
    case 'voice':
      return '🎤 Sesli mesaj';
    case 'location':
      return '📍 Konum';
    case 'system':
      return message.content || 'Sistem mesaji';
    default:
      return '';
  }
}
