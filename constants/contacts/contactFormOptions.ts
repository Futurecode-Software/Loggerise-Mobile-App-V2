/**
 * Contact Form Options ve Sabitler
 *
 * Tüm form seçenekleri merkezi bir konumda tutulur
 */

// ============================================
// FORM SABİTLERİ
// ============================================

export const TOTAL_STEPS = 5

export const STEP_TITLES = [
  'Temel Bilgiler',
  'İletişim Bilgileri',
  'Mali Bilgiler',
  'Adresler',
  'Yetkili Kişiler'
] as const

export const CONTACT_TYPES = [
  { value: 'customer', label: 'Müşteri' },
  { value: 'supplier', label: 'Tedarikçi' },
  { value: 'both', label: 'Her İkisi' },
  { value: 'potential', label: 'Potansiyel' },
  { value: 'other', label: 'Diğer' }
] as const

export const BUSINESS_TYPES = [
  { value: 'customs_agent', label: 'Gümrük Müşaviri' },
  { value: 'logistics_partner', label: 'Lojistik Partner' },
  { value: 'bank', label: 'Banka' },
  { value: 'insurance', label: 'Sigorta' },
  { value: 'other', label: 'Diğer' }
] as const

export const LEGAL_TYPES = [
  { value: 'company', label: 'Şirket' },
  { value: 'individual', label: 'Bireysel' },
  { value: 'government', label: 'Kamu' },
  { value: 'public', label: 'Resmi Kurum' }
] as const

export const CONTACT_SEGMENTS = [
  { value: 'enterprise', label: 'Kurumsal' },
  { value: 'mid_market', label: 'Orta Ölçek' },
  { value: 'small_business', label: 'Küçük İşletme' },
  { value: 'individual', label: 'Bireysel' }
] as const

export const CREDIT_RATINGS = [
  { value: 10, label: '10 - Mükemmel' },
  { value: 9, label: '9 - Çok İyi' },
  { value: 8, label: '8 - İyi' },
  { value: 7, label: '7 - Orta Üstü' },
  { value: 6, label: '6 - Orta' },
  { value: 5, label: '5 - Orta Altı' },
  { value: 4, label: '4 - Düşük' },
  { value: 3, label: '3 - Çok Düşük' },
  { value: 2, label: '2 - Kötü' },
  { value: 1, label: '1 - Çok Kötü' }
] as const

export const CONTACT_STATUSES = [
  { value: 'active', label: 'Aktif' },
  { value: 'passive', label: 'Pasif' }
] as const

export const CURRENCIES = [
  { value: 'TRY', label: 'TRY - Türk Lirası' },
  { value: 'USD', label: 'USD - Amerikan Doları' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - İngiliz Sterlini' }
] as const
