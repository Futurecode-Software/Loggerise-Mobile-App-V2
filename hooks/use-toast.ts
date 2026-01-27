import Toast from 'react-native-toast-message';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  visibilityTime?: number;
  position?: 'top' | 'bottom';
  duration?: number;
}

export function useToast() {
  const show = (type: ToastType, title: string, message?: string, options?: ToastOptions) => {
    Toast.show({
      type,
      text1: title,
      text2: message,
      visibilityTime: options?.duration ?? options?.visibilityTime ?? 3000,
      position: options?.position ?? 'top',
    });
  };

  const success = (title: string, message?: string, options?: ToastOptions) => {
    show('success', title, message, options);
  };

  const error = (title: string, message?: string, options?: ToastOptions) => {
    show('error', title, message, options);
  };

  const info = (title: string, message?: string, options?: ToastOptions) => {
    show('info', title, message, options);
  };

  const warning = (title: string, message?: string, options?: ToastOptions) => {
    show('warning', title, message, options);
  };

  return { show, success, error, info, warning, showError: error };
}
