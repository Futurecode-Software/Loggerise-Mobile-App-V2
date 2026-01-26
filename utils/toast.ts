/**
 * Toast notification utility
 * Wrapper around react-native-toast-message for consistent toast messages
 */

import Toast from 'react-native-toast-message';

interface ToastOptions {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

export function showToast({ type, message, duration = 3000 }: ToastOptions) {
  Toast.show({
    type,
    text1: message,
    duration,
    position: 'top',
  });
}
