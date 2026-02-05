/**
 * Layout Constants
 *
 * Tüm sayfalarda tutarlı header ve content yükseklikleri için
 * merkezi layout sabitleri. Bu dosyadaki değerler STANDARTTIR.
 *
 * 🚨 KRİTİK KURAL: Sayfalar bir altta bir üstte başlamamalı!
 * Tüm header ve content alanları aynı yükseklikte olmalı.
 */

/**
 * Header Layout Değerleri
 *
 * STANDART: Tüm header'lar aynı yükseklikte olmalı!
 * Content (beyaz rounded alan) her sayfada aynı noktada başlamalı.
 *
 * Kullanılan component'lar:
 * - FormHeader: Form sayfaları (new.tsx, edit.tsx)
 * - PageHeader: Liste ve detay sayfaları (index.tsx, [id].tsx)
 */
export const HeaderLayout = {
  /**
   * Header paddingTop offset
   * Kullanım: paddingTop: insets.top + PADDING_TOP
   */
  PADDING_TOP: 16,

  /**
   * Header content area minHeight
   * FormHeader -> headerBar minHeight
   * PageHeader -> headerRow minHeight
   * Bu değer subtitle olsun olmasın header'ların aynı yükseklikte olmasını sağlar
   */
  HEADER_CONTENT_MIN_HEIGHT: 70,

  /**
   * Header bottom padding (bottomCurve öncesi)
   * FormHeader -> headerContainer paddingBottom
   * PageHeader -> content paddingBottom
   */
  HEADER_PADDING_BOTTOM: 24,

  /**
   * Bottom curve height (rounded corner beyaz alan)
   */
  BOTTOM_CURVE_HEIGHT: 24
} as const

/**
 * Buton Boyutları
 */
export const ButtonSizes = {
  /** Form sayfalarındaki header butonları (FormHeader) */
  FORM_HEADER_BUTTON: 40,

  /** Liste/Detay sayfalarındaki header butonları (PageHeader) */
  PAGE_HEADER_BUTTON: 44
} as const

/**
 * Content Layout
 */
export const ContentLayout = {
  /** Content yatay padding */
  PADDING_HORIZONTAL: 16,

  /** Content üst padding */
  PADDING_TOP: 16,

  /** Content alt padding (safe area bottom'a ek) */
  PADDING_BOTTOM: 24
} as const

/**
 * Gradient Header Renkleri
 * Tüm header'larda kullanılacak standart gradient
 */
export const HeaderGradient = {
  colors: ['#022920', '#044134', '#065f4a'] as const,
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 }
} as const

/**
 * Glow Orb Stilleri
 * Header dekoratif elementleri için standart değerler
 */
export const GlowOrbStyles = {
  orb1: {
    top: -40,
    right: -20,
    size: 140,
    color: 'rgba(16, 185, 129, 0.12)'
  },
  orb2: {
    bottom: 30,
    left: -50,
    size: 100,
    color: 'rgba(255, 255, 255, 0.04)'
  }
} as const

/**
 * Header paddingTop hesaplama helper'ı
 */
export const getHeaderPaddingTop = (insetsTop: number): number => {
  return insetsTop + HeaderLayout.PADDING_TOP
}
