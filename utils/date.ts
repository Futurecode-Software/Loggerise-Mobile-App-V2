/**
 * Tarih Formatlama Yardımcıları
 *
 * Tüm uygulama genelinde tutarlı tarih formatı sağlar.
 */

/**
 * Tarih string'ini Türkçe formatla formatlar
 *
 * @param dateString - ISO tarih string'i
 * @returns Formatlanmış tarih (örn: "15 Oca 2024")
 *
 * @example
 * formatDate('2024-01-15T10:30:00Z') // "15 Oca 2024"
 * formatDate(undefined) // "-"
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return dateString
  }
}

/**
 * Tarih ve saati formatlar
 *
 * @param dateString - ISO tarih string'i
 * @returns Formatlanmış tarih ve saat (örn: "15 Oca 2024 10:30")
 *
 * @example
 * formatDateTime('2024-01-15T10:30:00Z') // "15 Oca 2024 10:30"
 */
export function formatDateTime(dateString?: string): string {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toLocaleString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateString
  }
}

/**
 * Sadece saati formatlar
 *
 * @param dateString - ISO tarih string'i
 * @returns Formatlanmış saat (örn: "10:30")
 *
 * @example
 * formatTime('2024-01-15T10:30:00Z') // "10:30"
 */
export function formatTime(dateString?: string): string {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateString
  }
}

/**
 * Göreceli tarih formatı (örn: "2 gün önce")
 *
 * @param dateString - ISO tarih string'i
 * @returns Göreceli tarih string'i
 *
 * @example
 * formatRelativeDate('2024-01-13T10:30:00Z') // "2 gün önce"
 */
export function formatRelativeDate(dateString?: string): string {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSecs < 60) return 'Az önce'
    if (diffMins < 60) return `${diffMins} dakika önce`
    if (diffHours < 24) return `${diffHours} saat önce`
    if (diffDays < 7) return `${diffDays} gün önce`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} hafta önce`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} ay önce`
    return `${Math.floor(diffDays / 365)} yıl önce`
  } catch {
    return dateString
  }
}
