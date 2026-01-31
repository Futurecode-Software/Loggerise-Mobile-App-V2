# Para Formatı Kuralları

> **Merkezi Para Formatı Modülü**: `utils/currency.ts`

## Temel Kural

Tüm para ve sayı formatlaması için **merkezi utility modülü** kullanılmalıdır. Lokal `toLocaleString` veya manuel formatlama **YASAKTIR**.

```typescript
// YANLIŞ - Lokal formatlama
const formatted = amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })

// DOĞRU - Merkezi utility kullan
import { formatCurrency, formatNumber } from '@/utils/currency'
const formatted = formatCurrency(amount, 'TRY')
```

## Mevcut Fonksiyonlar

### `formatCurrency(amount, currency, options?)`
Para tutarını sembol ile formatlar.

```typescript
formatCurrency(1234.56, 'TRY')                    // "₺ 1.234,56"
formatCurrency(-500, 'USD')                        // "-$ 500,00"
formatCurrency(1000, 'EUR', { showSign: true })   // "+€ 1.000,00"
formatCurrency(1500, 'TRY', { symbolPosition: 'after' }) // "1.500,00 ₺"
formatCurrency(1500, 'TRY', { decimals: 0 })      // "₺ 1.500"
```

**Options:**
- `showSign`: Pozitif değerler için + işareti
- `decimals`: Ondalık basamak sayısı (varsayılan: 2)
- `symbolPosition`: 'before' | 'after' (varsayılan: 'before')

### `formatNumber(amount, decimals?)`
Sayıyı Türk formatında formatlar (binlik ayraç: nokta, ondalık: virgül).

```typescript
formatNumber(1234.56)      // "1.234,56"
formatNumber(1234.56, 0)   // "1.234"
formatNumber(1234.56, 3)   // "1.234,560"
```

### `formatBalance(amount, currency)`
Kısa bakiye formatı (sembol bitişik).

```typescript
formatBalance(1234.56, 'TRY')  // "₺1.234,56"
formatBalance(-500, 'USD')      // "-$500,00"
```

### `formatCompactCurrency(amount, currency)`
Büyük sayılar için kompakt format (K, M, B).

```typescript
formatCompactCurrency(1500, 'TRY')      // "₺1,5K"
formatCompactCurrency(2500000, 'USD')   // "$2,5M"
formatCompactCurrency(500, 'EUR')       // "€500,00"
```

### `formatCompactNumber(amount)`
Sembolsüz kompakt sayı formatı.

```typescript
formatCompactNumber(1500)      // "1,5K"
formatCompactNumber(2500000)   // "2,5M"
formatCompactNumber(500)       // "500"
```

### `formatDashboardCurrency(amount, currency?)`
Dashboard kartları için kompakt para formatı.

```typescript
formatDashboardCurrency(1500)           // "₺1,5K"
formatDashboardCurrency(2500000, 'USD') // "$2,5M"
```

### `getCurrencySymbol(currency)`
Para birimi sembolünü döndürür.

```typescript
getCurrencySymbol('TRY')  // "₺"
getCurrencySymbol('USD')  // "$"
getCurrencySymbol('EUR')  // "€"
```

### `isPositiveAmount(amount)` / `isNegativeAmount(amount)`
Tutar kontrolü.

```typescript
isPositiveAmount(100)   // true
isPositiveAmount(-50)   // false
isNegativeAmount(-50)   // true
```

## Kullanım Senaryoları

| Senaryo | Fonksiyon | Örnek |
|---------|-----------|-------|
| Liste kartı bakiye | `formatCurrency` | "₺ 1.234,56" |
| Detay sayfası tutar | `formatCurrency` | "₺ 1.234,56" |
| Dashboard metrik | `formatDashboardCurrency` | "₺1,5K" |
| Form input display | `formatNumber` | "1.234,56" |
| Carousel toplam | `formatCurrency` | "₺ 12.345,67" |
| Kompakt gösterim | `formatCompactCurrency` | "₺2,5M" |

## Desteklenen Para Birimleri

```typescript
type CurrencyType =
  | 'TRY' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CHF' | 'CAD' | 'AUD'
  | 'CNY' | 'INR' | 'RUB' | 'BRL' | 'ZAR' | 'MXN' | 'SEK' | 'NOK'
  | 'DKK' | 'PLN' | 'THB' | 'IDR' | 'MYR' | 'PHP' | 'SGD' | 'HKD'
  | 'NZD' | 'KRW' | 'CLP' | 'ARS' | 'EGP' | 'SAR' | 'AED' | 'KWD'
```

## Service Layer Re-export

Modül bazlı servislerde re-export kullanılabilir:

```typescript
// services/endpoints/banks.ts
export { formatBalance } from '@/utils/currency'

// Kullanım
import { getBank, formatBalance } from '@/services/endpoints/banks'
```

## Neden Merkezi Modül?

1. **Tutarlılık**: Tüm sayfa ve bileşenlerde aynı format
2. **Android Uyumluluğu**: `toLocaleString` Android'de sorunlu olabilir
3. **Türk Formatı**: Binlik ayraç nokta, ondalık virgül (1.234,56)
4. **Bakım Kolaylığı**: Tek noktadan güncelleme
5. **Tip Güvenliği**: TypeScript desteği
