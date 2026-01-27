/**
 * Toast notification utility
 * Wrapper around react-native-toast-message for consistent toast messages
 */

import Toast from 'react-native-toast-message';

interface ToastOptions {
  type: 'success' | 'error' | 'info';
  message: string;
  visibilityTime?: number;
}

export function showToast({ type, message, visibilityTime = 3000 }: ToastOptions) {
  Toast.show({
    type,
    text1: message,
    visibilityTime,
    position: 'top',
  });
}

export function showError(title: string, message: string) {
  Toast.show({
    type: 'error',
    text1: title,
    text2: message,
    visibilityTime: 4000,
    position: 'top',
  });
}

export function showSuccess(title: string, message?: string) {
  Toast.show({
    type: 'success',
    text1: title,
    text2: message,
    visibilityTime: 3000,
    position: 'top',
  });
}
