/**
 * Messaging API Endpoints
 *
 * Handles conversations, messages, and real-time messaging operations.
 * Backend-compatible with Loggerise web application.
 */

import api, { getErrorMessage } from '../api';

/**
 * Conversation type enum - MUST match backend ('dm' | 'group')
 */
export type ConversationType = 'dm' | 'group';

/**
 * User basic info (matches UserBasicResource from backend)
 */
export interface UserBasic {
  id: number;
  name: string;
  email: string;
  avatar_initials: string;
  profile_photo_url?: string | null;
}

/**
 * Participant entity (matches backend response)
 */
export interface Participant {
  id: number;
  name: string;
  email: string;
  avatar_initials: string;
  profile_photo_url?: string | null;
  role: 'admin' | 'member';
  is_creator: boolean;
}

/**
 * Message entity (matches MessageResource from backend)
 */
export interface Message {
  id: number;
  conversation_id: number;
  user_id: number;
  message: string;
  created_at: string;
  formatted_time: string;
  formatted_date: string;
  is_mine: boolean;
  user: {
    id: number;
    name: string;
    avatar_initials: string;
    profile_photo_url?: string | null;
  };
}

/**
 * Last message in conversation list
 */
export interface LastMessage {
  message: string;
  created_at: string; // diffForHumans format
  sender_name: string;
}

/**
 * Conversation entity (matches ConversationResource from backend)
 */
export interface Conversation {
  id: number;
  type: ConversationType;
  name: string | null;
  description?: string | null;
  participant_count?: number;
  avatar_url?: string | null;
  other_user?: UserBasic | null;
  last_message: LastMessage | null;
  last_message_at?: string;
  unread_count: number;
  role?: 'admin' | 'member';
  is_admin?: boolean;
  is_creator?: boolean;
  updated_at: string;
}

/**
 * Conversation detail (matches ConversationDetailResource from backend)
 */
export interface ConversationDetail {
  id: number;
  type: ConversationType;
  name: string | null;
  description?: string | null;
  avatar_url?: string | null;
  other_user?: UserBasic | null;
  created_by?: number;
  created_at: string;
  updated_at: string;
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
  page?: number;
  per_page?: number;
}

/**
 * Conversations list response (matches backend index response)
 */
interface ConversationsListResponse {
  success: boolean;
  data: {
    conversations: Conversation[];
    total_unread_count: number;
  };
}

/**
 * Single conversation response (matches backend show response)
 */
interface ConversationShowResponse {
  success: boolean;
  data: {
    conversation: ConversationDetail;
    messages: {
      data: Message[];
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
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
    conversation: ConversationDetail;
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
 * Group details response
 */
interface GroupDetailsResponse {
  success: boolean;
  data: {
    conversation: {
      id: number;
      type: string;
      name: string;
      description: string | null;
      avatar_url: string | null;
      created_by: number;
    };
    participants: Participant[];
    available_users: UserBasic[];
    current_user_role: 'admin' | 'member';
    is_admin: boolean;
    is_creator: boolean;
  };
}

/**
 * Create group request
 */
export interface CreateGroupRequest {
  name: string;
  description?: string;
  user_ids: number[];
}

/**
 * Create group response
 */
interface CreateGroupResponse {
  success: boolean;
  message: string;
  data: {
    conversation: {
      id: number;
      type: string;
      name: string;
      description: string | null;
    };
  };
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
  page: number = 1,
  perPage: number = 50
): Promise<{
  conversation: ConversationDetail;
  messages: Message[];
  participants: Participant[];
  pagination: Pagination;
}> {
  try {
    const response = await api.get<ConversationShowResponse>(`/conversations/${id}`, {
      params: { page, per_page: perPage },
    });
    return {
      conversation: response.data.data.conversation,
      messages: response.data.data.messages.data,
      participants: response.data.data.participants,
      pagination: {
        current_page: response.data.data.messages.current_page,
        last_page: response.data.data.messages.last_page,
        per_page: response.data.data.messages.per_page,
        total: response.data.data.messages.total,
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
): Promise<{ conversation: ConversationDetail; messages: Message[] }> {
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
 * Send a message
 */
export async function sendMessage(data: {
  conversation_id: number;
  message: string;
}): Promise<Message> {
  try {
    const response = await api.post<MessageResponse>('/messages', {
      conversation_id: data.conversation_id,
      message: data.message,
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
 * Create a group conversation
 */
export async function createGroup(data: CreateGroupRequest): Promise<{
  id: number;
  type: string;
  name: string;
  description: string | null;
}> {
  try {
    const response = await api.post<CreateGroupResponse>('/groups', data);
    return response.data.data.conversation;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get group details
 */
export async function getGroupDetails(groupId: number): Promise<{
  conversation: {
    id: number;
    type: string;
    name: string;
    description: string | null;
    avatar_url: string | null;
    created_by: number;
  };
  participants: Participant[];
  availableUsers: UserBasic[];
  currentUserRole: 'admin' | 'member';
  isAdmin: boolean;
  isCreator: boolean;
}> {
  try {
    const response = await api.get<GroupDetailsResponse>(`/groups/${groupId}/details`);
    return {
      conversation: response.data.data.conversation,
      participants: response.data.data.participants,
      availableUsers: response.data.data.available_users,
      currentUserRole: response.data.data.current_user_role,
      isAdmin: response.data.data.is_admin,
      isCreator: response.data.data.is_creator,
    };
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Update group info
 */
export async function updateGroup(
  groupId: number,
  data: { name?: string; description?: string }
): Promise<void> {
  try {
    await api.put(`/groups/${groupId}`, data);
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Update group avatar
 */
export async function updateGroupAvatar(groupId: number, avatar: FormData): Promise<void> {
  try {
    await api.post(`/groups/${groupId}/avatar`, avatar, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Add participants to group
 */
export async function addParticipants(groupId: number, userIds: number[]): Promise<void> {
  try {
    await api.post(`/groups/${groupId}/participants`, {
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
export async function removeParticipant(groupId: number, userId: number): Promise<void> {
  try {
    await api.delete(`/groups/${groupId}/participants/${userId}`);
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
    await api.post(`/groups/${groupId}/leave`);
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get available users for messaging
 */
export async function getAvailableUsers(): Promise<UserBasic[]> {
  try {
    const response = await api.get<{ success: boolean; data: UserBasic[] }>('/users/available');
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Format message time for display
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
    return 'Dün';
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
    return conversation.name || 'İsimsiz Grup';
  }

  // For direct messages, show the other user's name
  if (conversation.other_user) {
    return conversation.other_user.name;
  }

  return conversation.name || 'Bilinmeyen';
}

/**
 * Get conversation avatar initials or URL
 */
export function getConversationAvatar(
  conversation: Conversation,
  currentUserId: number
): { initials: string; url?: string | null } {
  if (conversation.type === 'group') {
    const initials = conversation.name
      ? conversation.name
          .split(' ')
          .map((w) => w[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
      : 'GR';
    return { initials, url: conversation.avatar_url };
  }

  // For direct messages, show the other user's avatar
  if (conversation.other_user) {
    return {
      initials: conversation.other_user.avatar_initials,
      url: conversation.other_user.profile_photo_url,
    };
  }

  return { initials: '??' };
}

/**
 * Get message preview text for conversation list
 */
export function getMessagePreview(lastMessage: LastMessage | null): string {
  if (!lastMessage) return '';
  return lastMessage.message;
}

/**
 * Get last message time
 */
export function getLastMessageTime(lastMessage: LastMessage | null): string {
  if (!lastMessage) return '';
  return lastMessage.created_at;
}
