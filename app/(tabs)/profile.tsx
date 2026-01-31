import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { PageHeader } from '@/components/navigation'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius,
  DashboardShadows
} from '@/constants/dashboard-theme'
import { useAuth } from '@/context/auth-context'

export default function ProfileScreen() {
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    router.replace('/(auth)/login')
  }

  const handleEditProfile = () => {
    router.push('/profile/edit')
  }

  const stats = [
    { label: 'Aktif Yükler', value: '12', icon: 'cube-outline' as const },
    { label: 'Tamamlanan', value: '48', icon: 'checkmark-circle-outline' as const },
    { label: 'Toplam Kazanç', value: '₺124.5K', icon: 'trending-up-outline' as const }
  ]

  return (
    <View style={styles.container}>
      <PageHeader
        title="Profil"
        variant="compact"
        leftAction={{
          icon: 'arrow-back',
          onPress: () => router.back()
        }}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* User Card */}
        <View style={[styles.userCard, DashboardShadows.md]}>
          <View style={styles.avatarContainer}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.cameraButton} activeOpacity={0.7}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.fullName || 'Kullanıcı'}</Text>
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={14} color={DashboardColors.textSecondary} />
              <Text style={styles.infoText}>{user?.email || 'email@example.com'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={14} color={DashboardColors.textSecondary} />
              <Text style={styles.infoText}>{user?.phone || 'Telefon ekle'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="business-outline" size={14} color={DashboardColors.textSecondary} />
              <Text style={styles.infoText}>{user?.tenantName || 'Şirket'}</Text>
            </View>
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

        {/* Statistics */}
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View key={index} style={[styles.statCard, DashboardShadows.sm]}>
              <View style={[styles.statIconContainer, { backgroundColor: `${DashboardColors.primary}20` }]}>
                <Ionicons name={stat.icon} size={20} color={DashboardColors.primary} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>HESAP</Text>
          <View style={[styles.menuCard, DashboardShadows.md]}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/profile/change-password')}
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
              onPress={() => router.push('/notifications')}
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
              onPress={() => router.push('/about')}
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

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/help')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconContainer}>
                  <Ionicons name="help-circle-outline" size={20} color={DashboardColors.primary} />
                </View>
                <Text style={styles.menuItemText}>Yardım ve Destek</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={DashboardColors.textSecondary} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/privacy')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconContainer}>
                  <Ionicons name="document-text-outline" size={20} color={DashboardColors.primary} />
                </View>
                <Text style={styles.menuItemText}>Gizlilik Politikası</Text>
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
        <Text style={styles.versionText}>Versiyon 1.0.0</Text>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DashboardColors.background
  },
  content: {
    flex: 1
  },
  contentContainer: {
    padding: DashboardSpacing.lg,
    paddingBottom: DashboardSpacing['3xl']
  },
  userCard: {
    backgroundColor: '#FFFFFF',
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
    borderRadius: 40
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
    borderColor: '#FFFFFF'
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: DashboardSpacing.lg,
    width: '100%'
  },
  userName: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '700',
    color: DashboardColors.text,
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
  statsContainer: {
    flexDirection: 'row',
    gap: DashboardSpacing.md,
    marginBottom: DashboardSpacing.lg
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: DashboardBorderRadius.lg,
    padding: DashboardSpacing.md,
    alignItems: 'center'
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.sm
  },
  statValue: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: DashboardColors.text,
    marginBottom: DashboardSpacing.xs
  },
  statLabel: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textSecondary,
    textAlign: 'center'
  },
  menuSection: {
    marginBottom: DashboardSpacing.lg
  },
  sectionTitle: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600',
    color: DashboardColors.textSecondary,
    marginBottom: DashboardSpacing.sm,
    letterSpacing: 0.5
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: DashboardBorderRadius.lg,
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
    fontSize: DashboardFontSizes.md,
    color: DashboardColors.text
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
    marginTop: DashboardSpacing.lg,
    marginBottom: DashboardSpacing.md
  },
  logoutButtonText: {
    fontSize: DashboardFontSizes.md,
    fontWeight: '600',
    color: '#EF4444'
  },
  versionText: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textMuted,
    textAlign: 'center',
    marginBottom: DashboardSpacing.lg
  }
})
