import React, { forwardRef, useMemo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  useBottomSheetSpringConfigs,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { BorderRadius, Shadows } from '@/constants/theme';

interface CustomBottomSheetProps {
  children: React.ReactNode;
  snapPoints?: (string | number)[];
  index?: number;
  onDismiss?: () => void;
  onChange?: (index: number) => void;
  enableDynamicSizing?: boolean;
  animateOnMount?: boolean;
}

/**
 * iOS-Style Bottom Sheet Modal Component
 *
 * Features:
 * - Smooth spring animations
 * - Rounded corners (16px)
 * - Swipe indicator handle
 * - Swipe down to dismiss
 * - Tap outside to close
 * - Dimmed backdrop
 * - Identical on iOS & Android
 */
const CustomBottomSheet = forwardRef<BottomSheetModal, CustomBottomSheetProps>(
  ({ children, snapPoints, index, onDismiss, onChange, enableDynamicSizing = false, animateOnMount = true }, ref) => {
    // Snap points - defaults to dynamic sizing if not provided
    const points = useMemo(
      () => snapPoints || ['50%', '75%'],
      [snapPoints]
    );

    // iOS-like spring animation config
    const animationConfigs = useBottomSheetSpringConfigs({
      damping: 80,
      overshootClamping: true,
      restDisplacementThreshold: 0.1,
      restSpeedThreshold: 0.1,
      stiffness: 500,
    });

    // Custom backdrop with dimmed background
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
    );

    return (
      <BottomSheetModal
        ref={ref}
        index={index}
        snapPoints={points}
        enableDynamicSizing={enableDynamicSizing}
        enablePanDownToClose={true}
        animateOnMount={animateOnMount}
        animationConfigs={animationConfigs}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.background}
        handleIndicatorStyle={styles.handleIndicator}
        onChange={onChange}
        onDismiss={onDismiss}
        style={styles.shadow}
      >
        <BottomSheetView style={styles.contentContainer}>
          {children}
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

CustomBottomSheet.displayName = 'CustomBottomSheet';

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  handleIndicator: {
    backgroundColor: '#D1D5DB',
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  contentContainer: {
    flex: 1,
  },
  shadow: {
    ...Shadows.lg,
  },
});

export default CustomBottomSheet;
