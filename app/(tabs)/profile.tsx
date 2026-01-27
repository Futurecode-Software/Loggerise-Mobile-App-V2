import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  User,
  Lock,
  Bell,
  Info,
  HelpCircle,
  FileText,
  LogOut,
  Trash2,
  ChevronRight,
  Camera,
  Image as ImageIcon,
} from 'lucide-react-native';
import { Card, Avatar, ConfirmDialog, ActionSheet } from '@/components/ui';
import { FullScreenHeader } from '@/components/header';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useNotificationContext } from '@/context/notification-context';
import { uploadAvatar, deleteAvatar } from '@/services/endpoints/profile';
import { useToast } from '@/hooks/use-toast';

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  route?: string;
  value?: string;
  onPress?: () => void;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export default function ProfileScreen() {
  const colors = Colors.light;
  const { user, logout, refreshUser } = useAuth();
  const { isInitialized: notificationsInitialized, initialize: initializeNotifications } = useNotificationContext();
  const { success, error: showError, info } = useToast();

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Dialog states
  const [showAvatarSheet, setShowAvatarSheet] = useState(false);
  const [showDeleteAvatarDialog, setShowDeleteAvatarDialog] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false);

  // Refresh user data when screen is focused
  useFocusEffect(
    useCallback(() => {
      refreshUser?.();
    }, [refreshUser])
  );

  const handleNotificationPermission = async () => {
    if (!notificationsInitialized) {
      await initializeNotifications();
      info('Bildirimler', 'Bildirim izni istendi. Ayarlardan kontrol edebilirsiniz.');
    } else {
      router.push('/notifications');
    }
  };

  const handleAvatarPress = () => {
    setShowAvatarSheet(true);
  };

  const getAvatarOptions = () => {
    const options = [
      {
        label: 'Galeriden Seç',
        icon: <ImageIcon size={20} color="#374151" />,
        onPress: () => pickImage('library'),
      },
      {
        label: 'Kamera ile Çek',
        icon: <Camera size={20} color="#374151" />,
        onPress: () => pickImage('camera'),
      },
    ];

    if (user?.avatar) {
      options.push({
        label: 'Fotoğrafı Sil',
        icon: <Trash2 size={20} color="#ef4444" />,
        onPress: () => setShowDeleteAvatarDialog(true),
        destructive: true,
      } as any);
    }

    return options;
  };

  const pickImage = async (source: 'library' | 'camera') => {
    try {
      let result;

      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          showError('İzin Gerekli', 'Kamera izni gereklidir.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: 'images',
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          showError('İzin Gerekli', 'Galeri izni gereklidir.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: 'images',
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        await handleUploadAvatar(result.assets[0]);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      showError('Hata', 'Fotoğraf seçilirken bir hata oluştu.');
    }
  };

  const handleUploadAvatar = async (asset: ImagePicker.ImagePickerAsset) => {
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', {
        uri: asset.uri,
        type: asset.mimeType || 'image/jpeg',
        name: asset.fileName || 'avatar.jpg',
      } as any);

      await uploadAvatar(formData);
      await refreshUser?.();
      success('Başarılı', 'Profil fotoğrafınız güncellendi.');
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      showError('Hata', error.message || 'Fotoğraf yüklenirken bir hata oluştu.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const confirmDeleteAvatar = async () => {
    setIsDeletingAvatar(true);
    try {
      await deleteAvatar();
      await refreshUser?.();
      setShowDeleteAvatarDialog(false);
      success('Başarılı', 'Profil fotoğrafınız silindi.');
    } catch (error: any) {
      console.error('Avatar delete error:', error);
      showError('Hata', error.message || 'Fotoğraf silinirken bir hata oluştu.');
    } finally {
      setIsDeletingAvatar(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = () => {
    setShowLogoutDialog(false);
    logout();
    router.replace('/(auth)/login');
  };

  const handleDeleteAccount = () => {
    setShowDeleteAccountDialog(true);
  };

  const confirmDeleteAccount = () => {
    setShowDeleteAccountDialog(false);
    // TODO: Implement account deletion
    info('Bilgi', 'Hesap silme işlemi için destek ile iletişime geçin.');
  };

  const MENU_SECTIONS: MenuSection[] = [
    {
      title: 'Hesap',
      items: [
        {
          id: 'edit-profile',
          label: 'Profil Bilgilerini Düzenle',
          icon: User,
          route: '/profile/edit',
        },
        {
          id: 'change-password',
          label: 'Şifre Değiştir',
          icon: Lock,
          route: '/profile/change-password',
        },
      ],
    },
    {
      title: 'Tercihler',
      items: [
        {
          id: 'notifications',
          label: 'Bildirimler',
          icon: Bell,
          value: notificationsInitialized ? 'Aktif' : 'İzin Ver',
          onPress: handleNotificationPermission,
        },
      ],
    },
    {
      title: 'Uygulama',
      items: [
        {
          id: 'about',
          label: 'Hakkinda',
          icon: Info,
          route: '/about',
        },
        {
          id: 'help',
          label: 'Yardım ve Destek',
          icon: HelpCircle,
          route: '/help',
        },
        {
          id: 'privacy',
          label: 'Gizlilik Politikası',
          icon: FileText,
          route: '/privacy',
        },
      ],
    },
  ];

  const handleItemPress = (item: MenuItem) => {
    if (item.onPress) {
      item.onPress();
    } else if (item.route) {
      router.push(item.route as any);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Brand.primary }]}>
      {/* Full Screen Header */}
      <FullScreenHeader
        title="Profil"
        rightIcons={
          <TouchableOpacity onPress={handleLogout} activeOpacity={0.7}>
            <LogOut size={22} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      {/* Content Area with White Background and Rounded Corners */}
      <View style={styles.contentArea}>
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
        {/* Profile Hero */}
        <View style={styles.heroSection}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handleAvatarPress}
            disabled={uploadingAvatar}
          >
            {uploadingAvatar ? (
              <View style={[styles.avatarLoading, { backgroundColor: colors.surface }]}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <>
                <Avatar name={user?.fullName} imageUrl={user?.avatar} size="xl" />
                <View
                  style={[styles.editAvatarButton, { backgroundColor: Brand.primary }]}
                >
                  <Camera size={16} color="#FFFFFF" />
                </View>
              </>
            )}
          </TouchableOpacity>
          <Text style={[styles.userName, { color: colors.text }]}>
            {user?.fullName || 'Kullanıcı'}
          </Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
            {user?.email || 'email@example.com'}
          </Text>
          <Text style={[styles.tenantName, { color: colors.textMuted }]}>
            {user?.tenantName || 'Şirket'}
          </Text>
        </View>

        {/* Menu Sections */}
        {MENU_SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              {section.title}
            </Text>
            <Card variant="outlined" padding="none">
              {section.items.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuItem,
                    index !== section.items.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    },
                  ]}
                  onPress={() => handleItemPress(item)}
                >
                  <View style={[styles.menuIcon, { backgroundColor: colors.surface }]}>
                    <item.icon size={20} color={colors.icon} />
                  </View>
                  <Text style={[styles.menuLabel, { color: colors.text }]}>
                    {item.label}
                  </Text>
                  {item.value && (
                    <Text style={[styles.menuValue, { color: colors.textSecondary }]}>
                      {item.value}
                    </Text>
                  )}
                  <ChevronRight size={20} color={colors.icon} />
                </TouchableOpacity>
              ))}
            </Card>
          </View>
        ))}

        {/* Delete Account */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteAccount}
        >
          <Trash2 size={18} color={colors.danger} />
          <Text style={[styles.deleteButtonText, { color: colors.danger }]}>
            Hesabi Sil
          </Text>
        </TouchableOpacity>

        {/* Version Info */}
        <Text style={[styles.versionText, { color: colors.textMuted }]}>
          Versiyon 1.0.0
        </Text>
        </ScrollView>
      </View>

      {/* Avatar Action Sheet */}
      <ActionSheet
        visible={showAvatarSheet}
        title="Profil Fotoğrafı"
        options={getAvatarOptions()}
        onCancel={() => setShowAvatarSheet(false)}
      />

      {/* Delete Avatar Confirmation */}
      <ConfirmDialog
        visible={showDeleteAvatarDialog}
        title="Fotoğrafı Sil"
        message="Profil fotoğrafınızı silmek istediğinize emin misiniz?"
        confirmText="Sil"
        cancelText="İptal"
        isDangerous={true}
        isLoading={isDeletingAvatar}
        onConfirm={confirmDeleteAvatar}
        onCancel={() => setShowDeleteAvatarDialog(false)}
      />

      {/* Logout Confirmation */}
      <ConfirmDialog
        visible={showLogoutDialog}
        title="Çıkış Yap"
        message="Hesabınızdan çıkış yapmak istediğinize emin misiniz?"
        confirmText="Çıkış Yap"
        cancelText="İptal"
        isDangerous={true}
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutDialog(false)}
      />

      {/* Delete Account Confirmation */}
      <ConfirmDialog
        visible={showDeleteAccountDialog}
        title="Hesabı Sil"
        message="Bu işlem geri alınamaz. Hesabınızı silmek istediğinize emin misiniz?"
        confirmText="Hesabı Sil"
        cancelText="İptal"
        isDangerous={true}
        onConfirm={confirmDeleteAccount}
        onCancel={() => setShowDeleteAccountDialog(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    ...Shadows.lg,
  },
  // Header styles removed - using FullScreenHeader component
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  avatarLoading: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userName: {
    ...Typography.headingMD,
    marginBottom: Spacing.xs,
  },
  userEmail: {
    ...Typography.bodyMD,
    marginBottom: Spacing.xs,
  },
  tenantName: {
    ...Typography.bodySM,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.bodySM,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    minHeight: 56,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  menuLabel: {
    ...Typography.bodyMD,
    flex: 1,
  },
  menuValue: {
    ...Typography.bodyMD,
    marginRight: Spacing.sm,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    marginBottom: Spacing['2xl'],
  },
  deleteButtonText: {
    ...Typography.bodyMD,
    fontWeight: '500',
  },
  versionText: {
    ...Typography.bodySM,
    textAlign: 'center',
  },
});
