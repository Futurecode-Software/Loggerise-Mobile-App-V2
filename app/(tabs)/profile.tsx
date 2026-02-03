/**
 * Profil Sayfası
 *
 * Kullanıcı profil bilgileri ve hesap ayarları
 * %100 Backend uyumlu
 */

import React, { useState, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import * as ImagePicker from 'expo-image-picker'
import Constants from 'expo-constants'
import Toast from 'react-native-toast-message'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import { PageHeader } from '@/components/navigation'
import CustomBottomSheet from '@/components/modals/CustomBottomSheet'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius,
  DashboardShadows
} from '@/constants/dashboard-theme'
import { useAuth } from '@/context/auth-context'
import { uploadAvatar, deleteAvatar } from '@/services/endpoints/profile'

export default function ProfileScreen(): React.ReactElement {
  const { user, logout, refreshUser } = useAuth()
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [avatarTimestamp, setAvatarTimestamp] = useState(Date.now())
  const avatarSheetRef = useRef<BottomSheetModal>(null)

  const handleLogout = (): void => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    logout()
    router.replace('/(auth)/login')
  }

  const handleEditProfile = (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push('/profile/edit')
  }

  const handleChangePassword = (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push('/profile/change-password')
  }

  const handleNotifications = (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push('/notifications')
  }

  const handleAbout = (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push('/about')
  }

  const handleAvatarPress = (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    avatarSheetRef.current?.present()
  }

  const handlePickImage = async (source: 'camera' | 'gallery'): Promise<void> => {
    try {
      // İzin kontrolü
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync()
        if (status !== 'granted') {
          Toast.show({
            type: 'error',
            text1: 'Kamera izni gerekli',
            text2: 'Lütfen ayarlardan kamera iznini açın',
            position: 'top',
            visibilityTime: 2000
          })
          return
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (status !== 'granted') {
          Toast.show({
            type: 'error',
            text1: 'Galeri izni gerekli',
            text2: 'Lütfen ayarlardan galeri iznini açın',
            position: 'top',
            visibilityTime: 2000
          })
          return
        }
      }

      // Resim seç
      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8
          })

      if (!result.canceled && result.assets[0]) {
        await handleUploadAvatar(result.assets[0].uri)
      }
    } catch (error) {
      console.error('Image picker error:', error)
      Toast.show({
        type: 'error',
        text1: 'Resim seçilemedi',
        position: 'top',
        visibilityTime: 1500
      })
    }
  }

  const handleUploadAvatar = async (uri: string): Promise<void> => {
    setIsUploadingAvatar(true)
    try {
      // FormData oluştur
      const formData = new FormData()
      const filename = uri.split('/').pop() || 'avatar.jpg'
      const match = /\.(\w+)$/.exec(filename)
      const type = match ? `image/${match[1]}` : 'image/jpeg'

      formData.append('avatar', {
        uri,
        name: filename,
        type
      } as any)

      // Upload
      await uploadAvatar(formData)

      // Kullanıcı bilgilerini yenile
      await refreshUser()

      // Avatar cache'ini temizle
      setAvatarTimestamp(Date.now())

      Toast.show({
        type: 'success',
        text1: 'Profil fotoğrafınız güncellendi',
        position: 'top',
        visibilityTime: 1500
      })
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: error.message || 'Fotoğraf yüklenirken bir hata oluştu',
        position: 'top',
        visibilityTime: 1500
      })
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleDeleteAvatar = async (): Promise<void> => {
    setIsUploadingAvatar(true)
    try {
      await deleteAvatar()
      await refreshUser()

      // Avatar cache'ini temizle
      setAvatarTimestamp(Date.now())

      Toast.show({
        type: 'success',
        text1: 'Profil fotoğrafınız kaldırıldı',
        position: 'top',
        visibilityTime: 1500
      })
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: error.message || 'Fotoğraf silinirken bir hata oluştu',
        position: 'top',
        visibilityTime: 1500
      })
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const appVersion = Constants.expoConfig?.version || '1.0.0'

  return (
    <View style={styles.container}>
      <PageHeader
        title="Profil"
        icon="person-outline"
        subtitle="Hesap bilgileriniz"
        showBackButton
        onBackPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          router.back()
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Card */}
        <View style={[styles.userCard, DashboardShadows.md]}>
          <View style={styles.avatarContainer}>
            {user?.avatar ? (
              <Image
                key={`avatar-${avatarTimestamp}`}
                source={{ uri: user.avatar }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={handleAvatarPress}
              disabled={isUploadingAvatar}
              activeOpacity={0.7}
            >
              {isUploadingAvatar ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="camera" size={16} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.fullName || 'Kullanıcı'}</Text>

            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={14} color={DashboardColors.textSecondary} />
              <Text style={styles.infoText}>{user?.email || 'email@example.com'}</Text>
            </View>

            {user?.phone && (
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={14} color={DashboardColors.textSecondary} />
                <Text style={styles.infoText}>{user.phone}</Text>
              </View>
            )}

            {user?.tenantName && (
              <View style={styles.infoRow}>
                <Ionicons name="business-outline" size={14} color={DashboardColors.textSecondary} />
                <Text style={styles.infoText}>{user.tenantName}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditProfile}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={18} color={DashboardColors.primary} />
            <Text style={styles.editButtonText}>Profili Düzenle</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>HESAP</Text>
          <View style={[styles.menuCard, DashboardShadows.md]}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleChangePassword}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color={DashboardColors.primary} />
                </View>
                <Text style={styles.menuItemText}>Şifre Değiştir</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={DashboardColors.textSecondary} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleNotifications}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconContainer}>
                  <Ionicons name="notifications-outline" size={20} color={DashboardColors.primary} />
                </View>
                <Text style={styles.menuItemText}>Bildirimler</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={DashboardColors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>UYGULAMA</Text>
          <View style={[styles.menuCard, DashboardShadows.md]}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleAbout}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconContainer}>
                  <Ionicons name="information-circle-outline" size={20} color={DashboardColors.primary} />
                </View>
                <Text style={styles.menuItemText}>Hakkında</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={DashboardColors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.versionText}>Versiyon {appVersion}</Text>
      </ScrollView>

      {/* Avatar Bottom Sheet */}
      <CustomBottomSheet
        ref={avatarSheetRef}
        snapPoints={['35%']}
        enableDynamicSizing={false}
      >
        <View style={styles.sheetContainer}>
          <Text style={styles.sheetTitle}>Profil Fotoğrafı</Text>

          <View style={styles.sheetOptions}>
            {user?.avatar && (
              <TouchableOpacity
                style={styles.sheetOption}
                onPress={() => {
                  avatarSheetRef.current?.dismiss()
                  handleDeleteAvatar()
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.sheetOptionIcon, { backgroundColor: '#FEE2E2' }]}>
                  <Ionicons name="trash-outline" size={24} color="#EF4444" />
                </View>
                <Text style={[styles.sheetOptionText, { color: '#EF4444' }]}>
                  Fotoğrafı Kaldır
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.sheetOption}
              onPress={() => {
                avatarSheetRef.current?.dismiss()
                handlePickImage('camera')
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.sheetOptionIcon, { backgroundColor: `${DashboardColors.primary}15` }]}>
                <Ionicons name="camera-outline" size={24} color={DashboardColors.primary} />
              </View>
              <Text style={styles.sheetOptionText}>Fotoğraf Çek</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetOption}
              onPress={() => {
                avatarSheetRef.current?.dismiss()
                handlePickImage('gallery')
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.sheetOptionIcon, { backgroundColor: `${DashboardColors.primary}15` }]}>
                <Ionicons name="images-outline" size={24} color={DashboardColors.primary} />
              </View>
              <Text style={styles.sheetOptionText}>Galeriden Seç</Text>
            </TouchableOpacity>
          </View>
        </View>
      </CustomBottomSheet>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DashboardColors.primary
  },
  scrollView: {
    flex: 1,
    backgroundColor: DashboardColors.background
  },
  scrollContent: {
    paddingHorizontal: DashboardSpacing['2xl'],
    paddingTop: DashboardSpacing.xl
  },
  userCard: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.xl,
    marginBottom: DashboardSpacing.lg,
    alignItems: 'center'
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: DashboardSpacing.md
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: `${DashboardColors.primary}30`
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: DashboardColors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: DashboardColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: DashboardColors.surface
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: DashboardSpacing.lg,
    width: '100%'
  },
  userName: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.sm
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.xs,
    marginBottom: DashboardSpacing.xs
  },
  infoText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.xs,
    paddingVertical: DashboardSpacing.sm,
    paddingHorizontal: DashboardSpacing.lg,
    borderRadius: DashboardBorderRadius.full,
    borderWidth: 1,
    borderColor: DashboardColors.primary
  },
  editButtonText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: DashboardColors.primary
  },
  menuSection: {
    marginBottom: DashboardSpacing.lg
  },
  sectionTitle: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600',
    color: DashboardColors.textMuted,
    marginBottom: DashboardSpacing.sm,
    letterSpacing: 0.5,
    paddingHorizontal: DashboardSpacing.xs
  },
  menuCard: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    overflow: 'hidden'
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: DashboardSpacing.lg
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.md
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${DashboardColors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center'
  },
  menuItemText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '500',
    color: DashboardColors.textPrimary
  },
  divider: {
    height: 1,
    backgroundColor: DashboardColors.borderLight,
    marginHorizontal: DashboardSpacing.lg
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DashboardSpacing.sm,
    paddingVertical: DashboardSpacing.md,
    marginTop: DashboardSpacing.xl,
    marginBottom: DashboardSpacing.md
  },
  logoutButtonText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: '#EF4444'
  },
  versionText: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textMuted,
    textAlign: 'center',
    marginBottom: DashboardSpacing['3xl']
  },
  sheetContainer: {
    paddingHorizontal: DashboardSpacing.xl,
    paddingBottom: DashboardSpacing.xl
  },
  sheetTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.lg
  },
  sheetOptions: {
    gap: DashboardSpacing.sm
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.md,
    paddingHorizontal: DashboardSpacing.lg,
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.lg,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight
  },
  sheetOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sheetOptionText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    flex: 1
  }
})
