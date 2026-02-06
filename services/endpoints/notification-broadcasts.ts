import api from '../api'

// Types
export type TargetType = 'all' | 'specific_users' | 'role'
export type BroadcastStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'

export interface NotificationBroadcast {
  id: number
  sender_id: number
  sender?: {
    id: number
    name: string
  }
  target_type: TargetType
  target_user_ids: number[] | null
  target_role: string | null
  title: string
  message: string
  deep_link_route: string | null
  deep_link_params: Record<string, any> | null
  is_scheduled: boolean
  scheduled_at: string | null
  status: BroadcastStatus
  total_recipients: number
  success_count: number
  failure_count: number
  sent_at: string | null
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface BroadcastCreateData {
  title: string
  message: string
  target_type: TargetType
  target_user_ids?: number[]
  target_role?: string
  deep_link_route?: string
  deep_link_params?: Record<string, any>
  is_scheduled: boolean
  scheduled_at?: string
}

export interface User {
  id: number
  name: string
  email: string
}

export interface Role {
  id: string
  name: string
}

export interface Route {
  route: string
  label: string
}

// API Calls
export async function getBroadcasts(params?: {
  page?: number
  per_page?: number
  status?: BroadcastStatus | 'all'
}) {
  const response = await api.get<{
    success: boolean
    data: NotificationBroadcast[]
    meta: {
      current_page: number
      last_page: number
      per_page: number
      total: number
    }
  }>('/notification-broadcasts', { params })
  return { data: response.data.data, meta: response.data.meta }
}

export async function getBroadcast(id: number) {
  const response = await api.get<{ success: boolean, data: NotificationBroadcast }>(`/notification-broadcasts/${id}`)
  return response.data.data
}

export async function createBroadcast(data: BroadcastCreateData) {
  const response = await api.post<{ success: boolean, data: NotificationBroadcast }>('/notification-broadcasts', data)
  return response.data.data
}

export async function deleteBroadcast(id: number) {
  const response = await api.delete<{ success: boolean, message: string }>(`/notification-broadcasts/${id}`)
  return response.data
}

export async function getUsers(search?: string) {
  const response = await api.get<{ success: boolean, data: User[] }>('/notification-broadcasts/targets/users', {
    params: { search }
  })
  return response.data.data
}

export async function getRoles() {
  const response = await api.get<{ success: boolean, data: Role[] }>('/notification-broadcasts/targets/roles')
  return response.data.data
}

export async function getRoutes() {
  const response = await api.get<{ success: boolean, data: Route[] }>('/notification-broadcasts/targets/routes')
  return response.data.data
}

// Helper functions
export function getStatusLabel(status: BroadcastStatus): string {
  const labels: Record<BroadcastStatus, string> = {
    draft: 'Taslak',
    scheduled: 'Zamanlandı',
    sending: 'Gönderiliyor',
    sent: 'Gönderildi',
    failed: 'Başarısız'
  }
  return labels[status]
}

export function getStatusColor(status: BroadcastStatus): string {
  const colors: Record<BroadcastStatus, string> = {
    draft: '#6B7280',
    scheduled: '#F59E0B',
    sending: '#3B82F6',
    sent: '#10B981',
    failed: '#EF4444'
  }
  return colors[status]
}

export function getTargetTypeLabel(targetType: TargetType): string {
  const labels: Record<TargetType, string> = {
    all: 'Tüm Kullanıcılar',
    specific_users: 'Belirli Kullanıcılar',
    role: 'Rol Bazlı'
  }
  return labels[targetType]
}
