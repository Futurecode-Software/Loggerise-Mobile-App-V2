/**
 * Onay Dialog Bileşeni
 *
 * Alert yerine kullanılan bottom sheet tabanlı onay dialogu
 * Silme, iptal ve diğer onay gerektiren işlemler için kullanılır
 */

import React, { forwardRef, useCallback, useMemo, useRef, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetView
} from '@gorhom/bottom-sheet'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius
} from '@/constants/dashboard-theme'

export type ConfirmDialogType = 'danger' | 'warning' | 'info' | 'success'

export interface ConfirmDialogProps {
  visible?: boolean
  title: string
  message: string
  type?: ConfirmDialogType
  confirmText?: string
  cancelText?: string
  confirmColor?: string
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

export interface ConfirmDialogRef {
  present: () => void
  dismiss: () => void
}

const typeConfig = {
  danger: {
    icon: 'trash-outline' as const,
    color: DashboardColors.danger,
    bgColor: DashboardColors.dangerBg
  },
  warning: {
    icon: 'warning-outline' as const,
    color: DashboardColors.warning,
    bgColor: DashboardColors.warningBg
  },
  info: {
    icon: 'information-circle-outline' as const,
    color: DashboardColors.info,
    bgColor: DashboardColors.infoBg
  },
  success: {
    icon: 'checkmark-circle-outline' as const,
    color: DashboardColors.success,
    bgColor: DashboardColors.successBg
  }
}

const ConfirmDialog = forwardRef<BottomSheetModal, ConfirmDialogProps>(
  (
    {
      visible = false,
      title,
      message,
      type = 'danger',
      confirmText = 'Onayla',
      cancelText = 'İptal',
      confirmColor,
      onConfirm,
      onCancel,
      isLoading = false
    },
    ref
  ) => {
    const config = typeConfig[type]
    const snapPoints = useMemo(() => ['35%'], [])
    const bottomSheetRef = useRef<BottomSheetModal>(null)
    const effectiveRef = (ref as React.RefObject<BottomSheetModal>) || bottomSheetRef

    // visible prop değiştiğinde modal'ı aç/kapat
    useEffect(() => {
      if (visible) {
        effectiveRef.current?.present()
      } else {
        effectiveRef.current?.dismiss()
      }
    }, [visible, effectiveRef])

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
          pressBehavior="close"
        />
      ),
      []
    )

    const handleConfirm = async () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      await onConfirm()
    }

    const handleCancel = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      effectiveRef.current?.dismiss()
      onCancel?.()
    }

    const buttonColor = confirmColor || config.color

    return (
      <BottomSheetModal
        ref={effectiveRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose={!isLoading}
        enableDynamicSizing={false}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.background}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <BottomSheetView style={styles.container}>
          {/* İkon */}
          <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
            <Ionicons name={config.icon} size={32} color={config.color} />
          </View>

          {/* Başlık */}
          <Text style={styles.title}>{title}</Text>

          {/* Mesaj */}
          <Text style={styles.message}>{message}</Text>

          {/* Butonlar */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmButton,
                { backgroundColor: buttonColor },
                isLoading && styles.buttonDisabled
              ]}
              onPress={handleConfirm}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              {isLoading ? (
                <Text style={styles.confirmButtonText}>Bekleyin...</Text>
              ) : (
                <Text style={styles.confirmButtonText}>{confirmText}</Text>
              )}
            </TouchableOpacity>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    )
  }
)

ConfirmDialog.displayName = 'ConfirmDialog'

const styles = StyleSheet.create({
  background: {
    backgroundColor: DashboardColors.surface,
    borderTopLeftRadius: DashboardBorderRadius['2xl'],
    borderTopRightRadius: DashboardBorderRadius['2xl']
  },
  handleIndicator: {
    backgroundColor: DashboardColors.borderLight,
    width: 40,
    height: 4,
    borderRadius: 2
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: DashboardSpacing.xl,
    paddingTop: DashboardSpacing.md,
    paddingBottom: DashboardSpacing.xl
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.lg
  },
  title: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
    textAlign: 'center',
    marginBottom: DashboardSpacing.sm
  },
  message: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: DashboardSpacing.xl
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: DashboardSpacing.md,
    width: '100%'
  },
  cancelButton: {
    flex: 1,
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
    backgroundColor: DashboardColors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: DashboardColors.border
  },
  cancelButtonText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textSecondary
  },
  confirmButton: {
    flex: 1,
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center'
  },
  confirmButtonText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: '#FFFFFF'
  },
  buttonDisabled: {
    opacity: 0.6
  }
})

export default ConfirmDialog
