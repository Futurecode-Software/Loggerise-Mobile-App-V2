/**
 * Yeni Mobil Bildirim Oluşturma Sayfası
 *
 * Backend'e notification broadcast kaydı oluşturur
 * Target selection, scheduling, deep link özellikleri
 */

import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import Toast from 'react-native-toast-message'
import * as Haptics from 'expo-haptics'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius
} from '@/constants/dashboard-theme'
import { Input } from '@/components/ui'
import { FormHeader } from '@/components/navigation/FormHeader'
import { SearchableSelectModal, SearchableSelectModalRef, SelectOption } from '@/components/modals/SearchableSelectModal'
import { SearchableSelect, SearchableSelectOption } from '@/components/ui/searchable-select'
import {
  createBroadcast,
  BroadcastCreateData,
  TargetType,
  getUsers,
  getRoles,
  getRoutes,
  User,
  Role,
  Route
} from '@/services/endpoints/notification-broadcasts'
import { getErrorMessage } from '@/services/api'

// Target type seçenekleri
const TARGET_TYPE_OPTIONS: SelectOption[] = [
  { label: 'Tüm Kullanıcılar', value: 'all' },
  { label: 'Belirli Kullanıcılar', value: 'specific_users' },
  { label: 'Rol Bazlı', value: 'role' }
]

export default function NewNotificationBroadcastScreen() {
  const targetTypeModalRef = useRef<SearchableSelectModalRef>(null)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    target_type: 'all' as TargetType,
    target_user_ids: [] as number[],
    target_role: null as string | null,
    deep_link_route: null as string | null,
    is_scheduled: false,
    scheduled_at: null as string | null
  })

  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Input değişiklik handler'ı
  const handleInputChange = useCallback((field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Bu alan için hatayı temizle
    if (errors[field]) {
      setErrors(prevErrors => {
        const newErrors = { ...prevErrors }
        delete newErrors[field]
        return newErrors
      })
    }
  }, [errors])

  // Target type değiştiğinde ilgili alanları temizle
  useEffect(() => {
    if (formData.target_type === 'all') {
      setFormData(prev => ({
        ...prev,
        target_user_ids: [],
        target_role: null
      }))
      setSelectedUsers([])
      setSelectedRole(null)
    } else if (formData.target_type === 'specific_users') {
      setFormData(prev => ({ ...prev, target_role: null }))
      setSelectedRole(null)
    } else if (formData.target_type === 'role') {
      setFormData(prev => ({ ...prev, target_user_ids: [] }))
      setSelectedUsers([])
    }
  }, [formData.target_type])

  // Kullanıcı yükleme (async search)
  const loadUsers = useCallback(async (searchQuery: string): Promise<SearchableSelectOption[]> => {
    try {
      const users = await getUsers(searchQuery)
      return users.map(user => ({
        label: user.name,
        value: user.id,
        subtitle: user.email
      }))
    } catch (err: any) {
      console.error('Kullanıcılar yüklenirken hata:', err)
      return []
    }
  }, [])

  // Rol yükleme
  const loadRoles = useCallback(async (): Promise<SearchableSelectOption[]> => {
    try {
      const roles = await getRoles()
      return roles.map(role => ({
        label: role.name,
        value: role.id
      }))
    } catch (err: any) {
      console.error('Roller yüklenirken hata:', err)
      return []
    }
  }, [])

  // Route yükleme
  const loadRoutes = useCallback(async (): Promise<SearchableSelectOption[]> => {
    try {
      const routes = await getRoutes()
      return routes.map(route => ({
        label: route.label,
        value: route.route
      }))
    } catch (err: any) {
      console.error('Route\'lar yüklenirken hata:', err)
      return []
    }
  }, [])

  // Kullanıcı kaldırma
  const handleUserRemove = useCallback((userId: number) => {
    const updatedUsers = selectedUsers.filter(u => u.id !== userId)
    setSelectedUsers(updatedUsers)
    setFormData(prev => ({
      ...prev,
      target_user_ids: updatedUsers.map(u => u.id)
    }))
  }, [selectedUsers])

  // Rol seçimi
  const handleRoleChange = useCallback((roleId: string | number | null) => {
    setFormData(prev => ({ ...prev, target_role: roleId as string | null }))
  }, [])

  // Route seçimi
  const handleRouteChange = useCallback((routePath: string | number | null) => {
    setFormData(prev => ({ ...prev, deep_link_route: routePath as string | null }))
  }, [])

  // Target type seçimi
  const handleTargetTypeSelect = useCallback((option: SelectOption) => {
    handleInputChange('target_type', option.value)
  }, [handleInputChange])

  // Hedef kitle label
  const getTargetLabel = useCallback(() => {
    const option = TARGET_TYPE_OPTIONS.find(o => o.value === formData.target_type)
    return option?.label || 'Seçiniz'
  }, [formData.target_type])

    // Form doğrulama
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title?.trim()) {
      newErrors.title = 'Başlık zorunludur'
    }
    if (!formData.body?.trim()) {
      newErrors.body = 'Mesaj zorunludur'
    }
    if (formData.target_type === 'specific_users' && formData.target_user_ids.length === 0) {
      newErrors.target_user_ids = 'En az bir kullanıcı seçmelisiniz'
    }
    if (formData.target_type === 'role' && !formData.target_role) {
      newErrors.target_role = 'Rol seçmelisiniz'
    }
    if (formData.is_scheduled && !formData.scheduled_at) {
      newErrors.scheduled_at = 'Zamanlı gönderim için tarih seçmelisiniz'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  // Geri butonu
  const handleBack = useCallback(() => {
    router.back()
  }, [])

  // Form gönderimi
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: 'Lütfen zorunlu alanları doldurunuz',
        position: 'top',
        visibilityTime: 1500
      })
      return
    }

    try {
      setIsSubmitting(true)

      const createData: BroadcastCreateData = {
        title: formData.title,
        body: formData.body,
        target_type: formData.target_type,
        is_scheduled: formData.is_scheduled
      }

      if (formData.target_type === 'specific_users') {
        createData.target_user_ids = formData.target_user_ids
      }

      if (formData.target_type === 'role') {
        createData.target_role = formData.target_role!
      }

      if (formData.deep_link_route) {
        createData.deep_link_route = formData.deep_link_route
      }

      if (formData.is_scheduled && formData.scheduled_at) {
        createData.scheduled_at = formData.scheduled_at
      }

      await createBroadcast(createData)

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Toast.show({
        type: 'success',
        text1: 'Başarılı',
        text2: formData.is_scheduled ? 'Bildirim zamanlandı' : 'Bildirim oluşturuldu',
        position: 'top',
        visibilityTime: 1500
      })

      router.back()
    } catch (err: any) {
      console.error('Bildirim oluşturulurken hata:', err)
      const errorMessage = getErrorMessage(err)
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: errorMessage,
        position: 'top',
        visibilityTime: 2000
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, validateForm])

  return (
    <View style={styles.container}>
      {/* Header */}
      <FormHeader
        title="Yeni Bildirim"
        onBackPress={handleBack}
        onSavePress={handleSubmit}
        isSaving={isSubmitting}
      />

      {/* Form */}
      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Başlık */}
        <View style={styles.section}>
          <Input
            label="Başlık"
            placeholder="Bildirim başlığı"
            value={formData.title}
            onChangeText={(text) => handleInputChange('title', text)}
            error={errors.title}
            required
            editable={!isSubmitting}
          />
        </View>

        {/* Mesaj */}
        <View style={styles.section}>
          <Input
            label="Mesaj"
            placeholder="Bildirim mesajı"
            value={formData.body}
            onChangeText={(text) => handleInputChange('body', text)}
            error={errors.body}
            required
            multiline
            numberOfLines={4}
            style={{ minHeight: 100 }}
            editable={!isSubmitting}
          />
        </View>

        {/* Hedef Tip - SearchableSelectModal */}
        <View style={styles.section}>
          <Text style={styles.inputLabel}>Hedef Kitle *</Text>
          <TouchableOpacity
            onPress={() => targetTypeModalRef.current?.present()}
            style={styles.selectButton}
            disabled={isSubmitting}
          >
            <Text style={[
              styles.selectButtonText,
              formData.target_type && styles.selectButtonTextActive
            ]}>
              {getTargetLabel()}
            </Text>
            <Ionicons name="chevron-down" size={20} color={DashboardColors.textMuted} />
          </TouchableOpacity>

          <SearchableSelectModal
            ref={targetTypeModalRef}
            title="Hedef Kitle Seçimi"
            options={TARGET_TYPE_OPTIONS}
            selectedValue={formData.target_type}
            onSelect={handleTargetTypeSelect}
          />
        </View>

        {/* Kullanıcı Seçimi (specific_users için) */}
        {formData.target_type === 'specific_users' && (
          <View style={styles.section}>
            <Text style={styles.inputLabel}>Kullanıcılar</Text>
            <SearchableSelect
              placeholder="Kullanıcı ara ve ekle"
              loadOptions={loadUsers}
              value={null}
              onValueChange={(userId) => {
                // Kullanıcı seçildiğinde listede mevcut değilse ekle
                if (userId && !selectedUsers.find(u => u.id === userId)) {
                  getUsers().then(users => {
                    const user = users.find(u => u.id === userId)
                    if (user) {
                      const updatedUsers = [...selectedUsers, user]
                      setSelectedUsers(updatedUsers)
                      setFormData(prev => ({
                        ...prev,
                        target_user_ids: updatedUsers.map(u => u.id)
                      }))
                    }
                  })
                }
              }}
              searchPlaceholder="Kullanıcı ara..."
            />

            {/* Seçili Kullanıcılar */}
            {selectedUsers.length > 0 && (
              <View style={styles.selectedItemsContainer}>
                {selectedUsers.map(user => (
                  <View key={user.id} style={styles.selectedItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.selectedItemText}>{user.name}</Text>
                      <Text style={styles.selectedItemSubtext}>{user.email}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleUserRemove(user.id)}
                      hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                    >
                      <Ionicons name="close-circle" size={20} color={DashboardColors.danger} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {errors.target_user_ids && (
              <Text style={styles.errorText}>{errors.target_user_ids}</Text>
            )}
          </View>
        )}

        {/* Rol Seçimi (role için) */}
        {formData.target_type === 'role' && (
          <View style={styles.section}>
            <SearchableSelect
              label="Rol"
              placeholder="Rol seçiniz"
              loadOptions={loadRoles}
              value={formData.target_role}
              onValueChange={handleRoleChange}
              error={errors.target_role}
              searchPlaceholder="Rol ara..."
            />
          </View>
        )}

        {/* Deep Link Route (opsiyonel) */}
        <View style={styles.section}>
          <SearchableSelect
            label="Deep Link (Opsiyonel)"
            placeholder="Sayfa seçiniz"
            loadOptions={loadRoutes}
            value={formData.deep_link_route}
            onValueChange={handleRouteChange}
            searchPlaceholder="Sayfa ara..."
          />
          <Text style={styles.helperText}>
            Kullanıcı bildirime tıkladığında açılacak sayfa
          </Text>
        </View>

        {/* Zamanlı Gönderim */}
        <View style={styles.section}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>Zamanlı Gönderim</Text>
              <Text style={styles.helperText}>Bildirimi belirli bir tarihte gönder</Text>
            </View>
            <Switch
              value={formData.is_scheduled}
              onValueChange={(value) => handleInputChange('is_scheduled', value)}
              trackColor={{ false: DashboardColors.border, true: DashboardColors.primary }}
              thumbColor={DashboardColors.surface}
              disabled={isSubmitting}
            />
          </View>

          {formData.is_scheduled && (
            <View style={{ marginTop: DashboardSpacing.md }}>
              <Input
                label="Gönderim Tarihi"
                placeholder="YYYY-MM-DD HH:mm"
                value={formData.scheduled_at || ''}
                onChangeText={(text) => handleInputChange('scheduled_at', text)}
                error={errors.scheduled_at}
                editable={!isSubmitting}
              />
              <Text style={styles.helperText}>
                Format: 2025-02-10 14:30
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </KeyboardAwareScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DashboardColors.background
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: 0,
    paddingBottom: DashboardSpacing['3xl']
  },
  section: {
    marginBottom: DashboardSpacing.xl
  },
  inputLabel: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.sm
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DashboardSpacing.lg,
    paddingVertical: DashboardSpacing.md,
    backgroundColor: DashboardColors.background,
    borderRadius: DashboardBorderRadius.lg,
    borderWidth: 1,
    borderColor: DashboardColors.border
  },
  selectButtonText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textMuted
  },
  selectButtonTextActive: {
    color: DashboardColors.textPrimary
  },
  selectedItemsContainer: {
    marginTop: DashboardSpacing.md,
    gap: DashboardSpacing.sm
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    padding: DashboardSpacing.md,
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.md,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight
  },
  selectedItemText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: DashboardColors.textPrimary
  },
  selectedItemSubtext: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textSecondary,
    marginTop: 2
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.md
  },
  switchLabel: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textPrimary
  },
  helperText: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textSecondary,
    marginTop: DashboardSpacing.xs
  },
  errorText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.danger,
    marginTop: DashboardSpacing.xs
  }
})
