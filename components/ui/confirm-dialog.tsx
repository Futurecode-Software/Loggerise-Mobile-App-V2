import React from 'react';
import { View, Modal, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';

interface ConfirmDialogProps {
  visible?: boolean;
  open?: boolean;  // Alias for visible
  title: string;
  message?: string;
  description?: string;  // Alias for message
  confirmText?: string;
  cancelText?: string;
  confirmButtonColor?: string;
  cancelButtonColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
  onOpenChange?: (open: boolean) => void;  // Called when dialog opens/closes
  isLoading?: boolean;
  loading?: boolean;  // Alias for isLoading
  isDangerous?: boolean;
  isDestructive?: boolean;  // Alias for isDangerous
  variant?: string;  // Can be 'danger', 'dangerous', 'destructive', etc.
}

export function ConfirmDialog({
  visible,
  open,
  title,
  message,
  description,
  confirmText = 'Evet',
  cancelText = 'İptal',
  confirmButtonColor = '#10b981',
  cancelButtonColor = '#6b7280',
  onConfirm,
  onCancel,
  onOpenChange,
  isLoading,
  loading,
  isDangerous = false,
  isDestructive = false,
  variant,
}: ConfirmDialogProps) {
  // Support both `visible` and `open` props
  const isVisible = open !== undefined ? open : visible;
  
  // Support both `message` and `description` props
  const dialogMessage = description !== undefined ? description : message;
  
  // Support `isLoading` and `loading` props
  const isActionLoading = loading !== undefined ? loading : isLoading;
  
  // Determine if this is a dangerous/destructive action
  const isDangerAction = isDangerous || isDestructive || variant === 'danger' || variant === 'dangerous' || variant === 'destructive';
  
  // Use red color for destructive actions
  const finalConfirmColor = isDangerAction ? '#ef4444' : confirmButtonColor;

  // Handle confirm with onOpenChange callback
  const handleConfirm = () => {
    onConfirm();
    // Call onOpenChange with false when dialog is closing via confirm
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  // Handle cancel with onOpenChange callback
  const handleCancel = () => {
    onCancel();
    // Call onOpenChange with false when dialog is closing via cancel
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCancel}
      presentationStyle="overFullScreen"
      statusBarTranslucent={true}
    >
      <View style={styles.container}>
        <View style={styles.backdrop} />
        <View style={styles.dialog}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity
              onPress={handleCancel}
              disabled={isActionLoading}
              style={styles.closeButton}
            >
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {dialogMessage && <Text style={styles.message}>{dialogMessage}</Text>}

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleCancel}
              disabled={isActionLoading}
              style={[
                styles.button,
                styles.cancelButton,
                { backgroundColor: cancelButtonColor },
                isActionLoading && styles.buttonDisabled,
              ]}
            >
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleConfirm}
              disabled={isActionLoading}
              style={[
                styles.button,
                styles.confirmButton,
                { backgroundColor: finalConfirmColor },
                isActionLoading && styles.buttonDisabled,
              ]}
            >
              <Text style={styles.confirmButtonText}>
                {isActionLoading ? 'Lütfen bekleyin...' : confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dialog: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    maxWidth: '85%',
    minWidth: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  closeButton: {
    padding: 4,
    marginLeft: 12,
  },
  message: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6b7280',
  },
  confirmButton: {
    backgroundColor: '#10b981',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
