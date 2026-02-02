/**
 * Loggy AI Assistant API Endpoints
 *
 * Handles AI-powered conversation system with tool execution capabilities.
 * This matches the web implementation at /loggy routes.
 */

import api, { getErrorMessage } from '../api';

/**
 * AI Conversation entity
 */
export interface AiConversation {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  is_active?: boolean;
}

/**
 * AI Message entity
 */
export interface AiMessage {
  id: number;
  conversation_id: number;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string | null;
  tool_calls: any[] | null;
  created_at: string;
}

/**
 * AI Tool Execution entity
 */
export interface AiToolExecution {
  id: number;
  conversation_id: number;
  tool_name: string;
  parameters: Record<string, any>;
  status: string;
  requires_confirmation: boolean;
  created_at: string;
}

/**
 * Available Tool entity
 */
export interface AvailableTool {
  name: string;
  description: string;
  requires_confirmation: boolean;
}

/**
 * Create conversation request
 */
export interface CreateConversationRequest {
  title?: string;
}

/**
 * Send message request
 */
export interface SendMessageRequest {
  content: string;
}

/**
 * Conversations list response
 */
interface ConversationsListResponse {
  data: AiConversation[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
}

/**
 * Conversation response
 */
interface ConversationResponse {
  conversation: AiConversation;
}

/**
 * Messages response
 */
interface MessagesResponse {
  conversation: AiConversation;
  messages: AiMessage[];
}

/**
 * Message response
 */
interface MessageResponse {
  message: AiMessage;
  conversation: AiConversation;
}

/**
 * Tool execution response
 */
interface ToolExecutionResponse {
  execution: AiToolExecution;
  message?: AiMessage;
}

/**
 * Pending executions response
 */
interface PendingExecutionsResponse {
  data: AiToolExecution[];
}

/**
 * Available tools response
 */
interface AvailableToolsResponse {
  data: AvailableTool[];
}

/**
 * Get recent conversations
 */
export async function getConversations(params?: {
  page?: number;
  per_page?: number;
  search?: string;
}): Promise<AiConversation[]> {
  try {
    const response = await api.get<ConversationsListResponse>('/loggy/conversations', {
      params,
    });
    return response.data.data || [];
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Search conversations
 */
export async function searchConversations(query: string): Promise<AiConversation[]> {
  try {
    const response = await api.get<{ data: AiConversation[] }>('/loggy/conversations/search', {
      params: { q: query },
    });
    return response.data.data || [];
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Create new conversation
 */
export async function createConversation(
  data?: CreateConversationRequest
): Promise<AiConversation> {
  try {
    const response = await api.post<ConversationResponse>('/loggy/conversations', {
      title: data?.title || 'Yeni Konuşma',
    });
    return response.data.conversation;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get conversation messages
 */
export async function getConversationMessages(
  conversationId: number
): Promise<{ conversation: AiConversation; messages: AiMessage[] }> {
  try {
    const response = await api.get<MessagesResponse>(
      `/loggy/conversations/${conversationId}/messages`
    );
    return {
      conversation: response.data.conversation,
      messages: response.data.messages || [],
    };
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Delete conversation
 */
export async function deleteConversation(conversationId: number): Promise<void> {
  try {
    await api.delete(`/loggy/conversations/${conversationId}`);
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Send message to conversation
 */
export async function sendMessage(
  conversationId: number,
  data: SendMessageRequest
): Promise<{ message: AiMessage; conversation: AiConversation }> {
  try {
    const response = await api.post<MessageResponse>(
      `/loggy/conversations/${conversationId}/messages`,
      data
    );
    return {
      message: response.data.message,
      conversation: response.data.conversation,
    };
  } catch (error: any) {
    // Handle rate limiting
    if (error.response?.status === 429) {
      throw new Error(error.response?.data?.error || 'Çok fazla mesaj gönderdiniz. Lütfen bekleyin.');
    }
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Confirm tool execution
 */
export async function confirmExecution(executionId: number): Promise<{
  execution: AiToolExecution;
  message?: AiMessage;
}> {
  try {
    const response = await api.post<ToolExecutionResponse>(
      `/loggy/executions/${executionId}/confirm`
    );
    return {
      execution: response.data.execution,
      message: response.data.message,
    };
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Cancel tool execution
 */
export async function cancelExecution(executionId: number): Promise<AiToolExecution> {
  try {
    const response = await api.post<ToolExecutionResponse>(
      `/loggy/executions/${executionId}/cancel`
    );
    return response.data.execution;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get pending executions
 */
export async function getPendingExecutions(): Promise<AiToolExecution[]> {
  try {
    const response = await api.get<PendingExecutionsResponse>('/loggy/executions/pending');
    return response.data.data || [];
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Format conversation time
 */
export function formatConversationTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Manuel saat formatı (React Native'de locale sorunu için)
  const formatTime = (d: Date) => {
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  if (diffDays === 0) {
    // Today - show time
    return `Bugün ${formatTime(date)}`;
  } else if (diffDays === 1) {
    return 'Dün';
  } else if (diffDays < 7) {
    return `${diffDays} gün önce`;
  } else {
    // Manuel tarih formatı
    const day = date.getDate();
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    const month = months[date.getMonth()];
    return `${day} ${month}`;
  }
}

/**
 * Format message time
 */
export function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}
