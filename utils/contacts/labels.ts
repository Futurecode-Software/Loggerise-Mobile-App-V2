import type { ContactType, LegalType, ContactSegment } from '@/types/contact'

export function getContactTypeLabel(type: ContactType): string {
  const labels: Record<ContactType, string> = {
    customer: 'Müşteri',
    supplier: 'Tedarikçi',
    both: 'Her İkisi',
    self: 'Kendimiz',
    potential: 'Potansiyel',
    other: 'Diğer'
  }
  return labels[type] || type
}

export function getLegalTypeLabel(legalType: LegalType): string {
  const labels: Record<LegalType, string> = {
    company: 'Şirket',
    individual: 'Bireysel',
    government: 'Kamu',
    public: 'Resmi Kurum'
  }
  return labels[legalType] || legalType
}

export function getSegmentLabel(segment: ContactSegment): string {
  const labels: Record<ContactSegment, string> = {
    enterprise: 'Kurumsal',
    mid_market: 'Orta Ölçekli',
    small_business: 'Küçük İşletme',
    individual: 'Bireysel'
  }
  return labels[segment] || segment
}

export function getCreditRatingLabel(rating: number): string {
  if (rating >= 90) return 'Mükemmel'
  if (rating >= 75) return 'Çok İyi'
  if (rating >= 60) return 'İyi'
  if (rating >= 45) return 'Orta'
  if (rating >= 30) return 'Zayıf'
  return 'Çok Zayıf'
}
