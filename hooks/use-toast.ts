import Toast from 'react-native-toast-message';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  duration?: number;
  position?: 'top' | 'bottom';
}

export function useToast() {
  const show = (type: ToastType, title: string, message?: string, options?: ToastOptions) => {
    Toast.show({
      type,
      text1: title,
      text2: message,
      duration: options?.duration ?? 3000,
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

  return { show, success, error, info, warning };
}
