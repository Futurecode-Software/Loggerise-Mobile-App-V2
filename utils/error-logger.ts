/**
 * Merkezi Hata Loglama Yardımcısı
 *
 * Tüm uygulama hatalarını yakalar, cihaz bilgisi toplar,
 * offline queue yönetir ve backend'e gönderir.
 *
 * Kullanım:
 *   import { logError, flushErrorQueue } from '@/utils/error-logger'
 *   logError(error, { screen: 'BankList' })
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import NetInfo from '@react-native-community/netinfo'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { secureStorage } from '@/services/storage'
import { logErrorToApi, LogErrorPayload, ErrorType, DeviceInfo } from '@/services/endpoints/error-logs'

// Queue sabitleri
const QUEUE_KEY = '@loggerise/error_queue'
const MAX_QUEUE_SIZE = 50
const QUEUE_RETENTION_DAYS = 7

interface QueuedError {
  id: string
  data: LogErrorPayload
  timestamp: number
}

interface ErrorContext {
  screen?: string
  errorType?: ErrorType
  apiEndpoint?: string
  apiMethod?: string
  apiStatusCode?: number
  additionalData?: Record<string, unknown>
}

/**
 * Cihaz bilgilerini topla
 */
function getDeviceInfo(): DeviceInfo {
  return {
    platform: Platform.OS,
    os_version: Platform.Version?.toString() ?? 'unknown',
    app_version: Constants.expoConfig?.version ?? '1.0.0',
    device_model: Device.modelName ?? undefined,
    device_brand: Device.brand ?? undefined,
  }
}

/**
 * Basit UUID üret
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}

/**
 * Hata mesajı ve stack trace çıkar
 */
function parseError(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return {
      message: error.message.substring(0, 1000),
      stack: error.stack?.substring(0, 10000),
    }
  }
  if (typeof error === 'string') {
    return { message: error.substring(0, 1000) }
  }
  return { message: String(error).substring(0, 1000) }
}

/**
 * Hata tipini belirle
 */
function resolveErrorType(error: unknown, context?: ErrorContext): ErrorType {
  if (context?.errorType) return context.errorType
  if (context?.apiEndpoint) return 'api_error'
  return 'js_error'
}

/**
 * Queue'yu oku
 */
async function readQueue(): Promise<QueuedError[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/**
 * Queue'yu yaz
 */
async function writeQueue(queue: QueuedError[]): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  } catch {
    // Queue yazılamadıysa sessizce geç
  }
}

/**
 * Hatayı queue'ya ekle (offline durumlar için)
 */
async function saveToQueue(data: LogErrorPayload): Promise<void> {
  const queue = await readQueue()

  const entry: QueuedError = {
    id: generateId(),
    data,
    timestamp: Date.now(),
  }

  queue.push(entry)

  // Max boyutu aş - en eski hataları at (FIFO)
  while (queue.length > MAX_QUEUE_SIZE) {
    queue.shift()
  }

  await writeQueue(queue)
}

/**
 * Ana hata loglama fonksiyonu
 *
 * Hatayı yakalar, cihaz bilgisi toplar ve backend'e gönderir.
 * Offline ise queue'ya ekler. Auth yoksa sadece console'a yazar.
 */
export async function logError(error: unknown, context?: ErrorContext): Promise<void> {
  try {
    // Her zaman console'a yaz
    if (__DEV__) {
      console.error('[ErrorLogger]', error)
    }

    // Auth kontrolü - sadece giriş yapmış kullanıcılar
    const token = await secureStorage.getToken()
    if (!token) return

    const { message, stack } = parseError(error)
    const errorType = resolveErrorType(error, context)

    const payload: LogErrorPayload = {
      error_type: errorType,
      message,
      stack_trace: stack,
      screen: context?.screen,
      api_endpoint: context?.apiEndpoint?.substring(0, 500),
      api_method: context?.apiMethod,
      api_status_code: context?.apiStatusCode,
      device_info: getDeviceInfo(),
      additional_data: context?.additionalData,
    }

    // Network durumu kontrol
    const netState = await NetInfo.fetch()
    const isOnline = netState.isConnected && netState.isInternetReachable

    if (isOnline) {
      try {
        await logErrorToApi(payload)
      } catch {
        // API çağrısı başarısız - queue'ya ekle
        await saveToQueue(payload)
      }
    } else {
      // Offline - queue'ya ekle
      await saveToQueue(payload)
    }
  } catch {
    // logError'ın kendisi asla hata fırlatmamalı
  }
}

/**
 * Queue'daki hataları gönder (network geri geldiğinde çağrılır)
 */
export async function flushErrorQueue(): Promise<void> {
  try {
    const token = await secureStorage.getToken()
    if (!token) return

    const queue = await readQueue()
    if (queue.length === 0) return

    const remaining: QueuedError[] = []

    for (let i = 0; i < queue.length; i++) {
      try {
        await logErrorToApi(queue[i].data)
      } catch {
        // Gönderim başarısız - kalan tüm kayıtları sakla, devam etme (spam önle)
        remaining.push(...queue.slice(i))
        break
      }
    }

    await writeQueue(remaining)
  } catch {
    // Sessizce geç
  }
}

/**
 * Eski hataları temizle (7 günden eski)
 */
export async function clearOldErrors(): Promise<void> {
  try {
    const queue = await readQueue()
    const cutoff = Date.now() - QUEUE_RETENTION_DAYS * 24 * 60 * 60 * 1000
    const filtered = queue.filter((e) => e.timestamp > cutoff)

    if (filtered.length !== queue.length) {
      await writeQueue(filtered)
    }
  } catch {
    // Sessizce geç
  }
}
