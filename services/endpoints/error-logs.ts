/**
 * Hata Loglama Servisi
 *
 * Mobil uygulama hatalarını backend'e kaydeder.
 * POST /error-logs endpoint'ini kullanır.
 */

import api from '../api'

export type ErrorType = 'js_error' | 'api_error' | 'network_error' | 'unhandled_rejection' | 'route_not_found'

export interface DeviceInfo {
  platform: string
  os_version: string
  app_version: string
  device_model?: string
  device_brand?: string
}

export interface LogErrorPayload {
  error_type: ErrorType
  message: string
  stack_trace?: string
  screen?: string
  api_endpoint?: string
  api_method?: string
  api_status_code?: number
  device_info: DeviceInfo
  additional_data?: Record<string, unknown>
}

/**
 * Hata kaydını backend'e gönder
 * Başarısız olursa hata fırlatır (queue mekanizması yakalar)
 */
export async function logErrorToApi(data: LogErrorPayload): Promise<void> {
  await api.post('/error-logs', data)
}
