/**
 * WebSocket Service for Real-time Messaging
 *
 * Uses Pusher.js to connect to Laravel Reverb (Pusher-compatible) WebSocket server.
 * Handles authentication with Sanctum Bearer tokens.
 */

import Pusher, { Channel } from 'pusher-js';
import { secureStorage } from './storage';
import {
  API_BASE_URL,
  REVERB_APP_KEY,
  REVERB_HOST,
  REVERB_PORT,
  REVERB_SCHEME,
} from './config';

// WebSocket instance
let pusher: Pusher | null = null;
let isConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// Active channel subscriptions
const activeChannels: Map<string, Channel> = new Map();

// Connection state callbacks
type ConnectionCallback = (state: 'connected' | 'disconnected' | 'error') => void;
const connectionCallbacks: Set<ConnectionCallback> = new Set();

/**
 * Initialize Pusher connection with authentication
 */
export async function initializeWebSocket(): Promise<boolean> {
  if (pusher && isConnected) {
    return true;
  }

  try {
    const token = await secureStorage.getToken();
    if (!token) {
      return false;
    }

    // Extract base URL without /api/v1/mobile suffix
    const baseUrl = API_BASE_URL.replace(/\/api\/v1\/mobile\/?$/, '');

    pusher = new Pusher(REVERB_APP_KEY, {
      wsHost: REVERB_HOST,
      wsPort: REVERB_PORT,
      wssPort: REVERB_PORT,
      forceTLS: REVERB_SCHEME === 'https',
      disableStats: true,
      enabledTransports: ['ws', 'wss'],
      cluster: 'mt1', // Required but not used with custom host

      // Channel authorization for private channels
      channelAuthorization: {
        endpoint: `${baseUrl}/broadcasting/auth`,
        transport: 'ajax',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      },
    });

    // Connection state bindings
    pusher.connection.bind('connected', () => {
      isConnected = true;
      reconnectAttempts = 0;
      notifyConnectionState('connected');
    });

    pusher.connection.bind('disconnected', () => {
      isConnected = false;
      notifyConnectionState('disconnected');
    });

    pusher.connection.bind('error', () => {
      isConnected = false;
      notifyConnectionState('error');
      handleReconnect();
    });

    pusher.connection.bind('state_change', () => {
      // State change handled by connected/disconnected events
    });

    return true;
  } catch {
    return false;
  }
}

/**
 * Handle reconnection attempts
 */
function handleReconnect(): void {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    return;
  }

  reconnectAttempts++;
  const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);

  setTimeout(async () => {
    await initializeWebSocket();
  }, delay);
}

/**
 * Disconnect WebSocket
 */
export function disconnectWebSocket(): void {
  if (pusher) {
    // Unsubscribe from all channels
    activeChannels.forEach((channel, name) => {
      pusher?.unsubscribe(name);
    });
    activeChannels.clear();

    pusher.disconnect();
    pusher = null;
    isConnected = false;
  }
}

/**
 * Subscribe to a private conversation channel
 */
export function subscribeToConversation(
  conversationId: number,
  onMessage: (message: any) => void,
  onTyping?: (data: { user_id: number; user_name: string; is_typing: boolean }) => void
): () => void {
  const channelName = `private-conversation.${conversationId}`;

  if (!pusher) {
    return () => {};
  }

  // Check if already subscribed
  let channel = activeChannels.get(channelName);
  if (!channel) {
    channel = pusher.subscribe(channelName);
    activeChannels.set(channelName, channel);
  }

  // Bind to message events
  const messageHandler = (data: { message: any }) => {
    onMessage(data.message);
  };
  channel.bind('message.sent', messageHandler);

  // Bind to typing events
  const typingHandler = (data: { user_id: number; user_name: string; is_typing: boolean }) => {
    onTyping?.(data);
  };
  if (onTyping) {
    channel.bind('user.typing', typingHandler);
  }

  // Return unsubscribe function
  return () => {
    channel?.unbind('message.sent', messageHandler);
    if (onTyping) {
      channel?.unbind('user.typing', typingHandler);
    }
  };
}

/**
 * Subscribe to user channel for cross-conversation notifications
 */
export function subscribeToUserChannel(
  userId: number,
  onMessage: (message: any, conversationId: number) => void,
  onParticipantAdded?: (data: any) => void,
  onGroupAvatarUpdated?: (data: any) => void
): () => void {
  const channelName = `private-user.${userId}`;

  if (!pusher) {
    return () => {};
  }

  // Check if already subscribed
  let channel = activeChannels.get(channelName);
  if (!channel) {
    channel = pusher.subscribe(channelName);
    activeChannels.set(channelName, channel);
  }

  // Bind to message events
  const messageHandler = (data: { message: any }) => {
    onMessage(data.message, data.message.conversation_id);
  };
  channel.bind('message.sent', messageHandler);

  // Bind to participant added events
  const participantHandler = (data: any) => {
    onParticipantAdded?.(data);
  };
  if (onParticipantAdded) {
    channel.bind('participant.added', participantHandler);
  }

  // Bind to group avatar updated events
  const avatarHandler = (data: any) => {
    onGroupAvatarUpdated?.(data);
  };
  if (onGroupAvatarUpdated) {
    channel.bind('group.avatar.updated', avatarHandler);
  }

  // Return unsubscribe function
  return () => {
    channel?.unbind('message.sent', messageHandler);
    if (onParticipantAdded) {
      channel?.unbind('participant.added', participantHandler);
    }
    if (onGroupAvatarUpdated) {
      channel?.unbind('group.avatar.updated', avatarHandler);
    }
  };
}

/**
 * Unsubscribe from a channel
 */
export function unsubscribeFromChannel(channelName: string): void {
  if (pusher && activeChannels.has(channelName)) {
    pusher.unsubscribe(channelName);
    activeChannels.delete(channelName);
  }
}

/**
 * Register connection state callback
 */
export function onConnectionStateChange(callback: ConnectionCallback): () => void {
  connectionCallbacks.add(callback);
  return () => {
    connectionCallbacks.delete(callback);
  };
}

/**
 * Notify all callbacks of connection state change
 */
function notifyConnectionState(state: 'connected' | 'disconnected' | 'error'): void {
  connectionCallbacks.forEach((callback) => callback(state));
}

/**
 * Check if WebSocket is connected
 */
export function isWebSocketConnected(): boolean {
  return isConnected;
}

/**
 * Get current connection state
 */
export function getConnectionState(): string {
  return pusher?.connection.state || 'disconnected';
}
