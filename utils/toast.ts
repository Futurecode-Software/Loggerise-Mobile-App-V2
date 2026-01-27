/**
 * Toast notification utility
 * Wrapper around react-native-toast-message for consistent toast messages
 */

import Toast from 'react-native-toast-message';

interface ToastOptions {
  type: 'success' | 'error' | 'info';
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

export function showError(title: string, message: string) {
  Toast.show({
    type: 'error',
    text1: title,
    text2: message,
    duration: 4000,
    position: 'top',
  });
}

export function showSuccess(title: string, message?: string) {
  Toast.show({
    type: 'success',
    text1: title,
    text2: message,
    duration: 3000,
    position: 'top',
  });
}
