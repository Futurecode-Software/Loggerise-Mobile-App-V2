# Component Pattern'leri

## Standart Liste Card Yapısı ⭐

**Referans**: `components/cash-register/CashRegisterCard.tsx`

Tüm liste card componentleri (örn: TransactionCard, InvoiceCard, ProductCard) bu standart yapıyı izlemelidir:

### Temel Özellikler
- **Shadow & Border**: `DashboardShadows.md` + `borderWidth: 1, borderColor: DashboardColors.borderLight`
- **TouchableOpacity**: `activeOpacity={0.8}` ile tutarlı tıklama efekti
- **Padding**: `DashboardSpacing.xl` (20px) - daha geniş iç boşluk

### Yapı Pattern'i

```typescript
export function StandardCard({ item }: { item: DataType }) {
  const router = useRouter()

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/path/${item.id}`)
  }

  return (
    <TouchableOpacity
      style={[styles.card, DashboardShadows.md]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {/* 1. HEADER: Icon + İsim/Başlık */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, {
          backgroundColor: `${color}15`,
          borderColor: `${color}25`
        }]}>
          <Ionicons name="icon-name" size={20} color={color} />
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.code} numberOfLines={1}>
            {item.code}
          </Text>
        </View>
      </View>

      {/* 2. INFO CONTAINER: Opsiyonel detaylar */}
      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <Ionicons name="info-icon" size={14} color={DashboardColors.textMuted} />
          <Text style={styles.infoText} numberOfLines={1}>
            {item.info}
          </Text>
        </View>
      </View>

      {/* 3. FOOTER: Tutar/Badge */}
      <View style={styles.footer}>
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>LABEL</Text>
          <Text style={styles.amount}>
            {formatCurrency(item.amount, item.currency)}
          </Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}
```

### Standart Styles

```typescript
const styles = StyleSheet.create({
  card: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.xl,              // 20px
    marginBottom: DashboardSpacing.md,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DashboardSpacing.md,
    gap: DashboardSpacing.sm
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: DashboardBorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1
    // backgroundColor ve borderColor dinamik
  },
  headerContent: {
    flex: 1
  },
  name: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.2
  },
  code: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textMuted
  },
  infoContainer: {
    marginBottom: DashboardSpacing.md,
    gap: DashboardSpacing.xs
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.xs
  },
  infoText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textMuted,
    flex: 1
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end'
  },
  amountContainer: {
    flex: 1
  },
  amountLabel: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '500',
    color: DashboardColors.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  amount: {
    fontSize: DashboardFontSizes['2xl'],
    fontWeight: '800',
    letterSpacing: -0.3,
    color: DashboardColors.primary  // veya dinamik renk
  },
  badge: {
    backgroundColor: `${color}15`,
    paddingHorizontal: DashboardSpacing.lg,
    paddingVertical: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.full,
    borderWidth: 1,
    borderColor: `${color}25`
  },
  badgeText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '700',
    color: color,  // dinamik
    letterSpacing: 0.5
  }
})
```

### Renk Paletleri

```typescript
// Pozitif/Negatif (Gelir/Gider)
const positive = '#10b981'  // green-500
const negative = '#ef4444'  // red-500

// Durum renkleri
const approved = '#10b981'  // green-500
const pending = '#f59e0b'   // amber-500
const rejected = '#ef4444'  // red-500

// Yarı saydam background pattern
backgroundColor: `${color}15`  // 15% opacity
borderColor: `${color}25`      // 25% opacity
```

### Önemli Notlar

1. **Shadow ile Animasyon**: Shadow'lu card'larda giriş animasyonu (FadeInDown vb.) KULLANMA
2. **Icon Boyutu**: 48x48 standart, icon içinde 20px
3. **Typography**: Başlık 700 weight, alt bilgiler muted
4. **Amount**: 2xl font, 800 weight, -0.3 letter spacing
5. **Badge**: Full rounded, yarı saydam background + border
6. **Haptics**: `Light` impact feedback

---

## Generic Card Component

Statik içerik için kullanılır (liste card'ları değil):

```typescript
interface CardProps {
  title: string
  description?: string
  icon?: keyof typeof Ionicons.glyphMap
  children: React.ReactNode
}

export function Card({ title, description, icon, children }: CardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {icon && (
          <View style={styles.iconContainer}>
            <Ionicons name={icon} size={18} color={DashboardColors.primary} />
          </View>
        )}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          {description && <Text style={styles.description}>{description}</Text>}
        </View>
      </View>
      <View style={styles.cardContent}>
        {children}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    ...DashboardShadows.sm
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    padding: DashboardSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight
  },
  cardContent: {
    padding: DashboardSpacing.lg,
    gap: DashboardSpacing.md
  }
})
```

## Section Header (Expandable)

```typescript
interface SectionHeaderProps {
  title: string
  icon: keyof typeof Ionicons.glyphMap
  count?: number
  isExpanded?: boolean
  onToggle?: () => void
}

function SectionHeader({ title, icon, count, isExpanded, onToggle }: SectionHeaderProps) {
  return (
    <TouchableOpacity style={styles.sectionHeader} onPress={onToggle}>
      <View style={styles.sectionIcon}>
        <Ionicons name={icon} size={16} color={DashboardColors.primary} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
      {count !== undefined && (
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{count}</Text>
        </View>
      )}
      {onToggle && (
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={DashboardColors.textMuted}
        />
      )}
    </TouchableOpacity>
  )
}
```

## Info Row (Key-Value)

```typescript
interface InfoRowProps {
  label: string
  value: string
  icon?: keyof typeof Ionicons.glyphMap
  highlight?: boolean
}

function InfoRow({ label, value, icon, highlight }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLabel}>
        {icon && <Ionicons name={icon} size={14} color={DashboardColors.textMuted} />}
        <Text style={styles.infoLabelText}>{label}</Text>
      </View>
      <Text style={[styles.infoValue, highlight && styles.infoValueHighlight]}>
        {value}
      </Text>
    </View>
  )
}
```

## ChipSelector

```typescript
interface ChipSelectorProps {
  label: string
  options: Array<{ value: string; label: string }>
  selectedValue: string
  onSelect: (value: string) => void
}

export function ChipSelector({ label, options, selectedValue, onSelect }: ChipSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chipsContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.chip,
              selectedValue === option.value && styles.chipSelected
            ]}
            onPress={() => {
              Haptics.selectionAsync()
              onSelect(option.value)
            }}
          >
            <Text style={[
              styles.chipText,
              selectedValue === option.value && styles.chipTextSelected
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}
```

## Error State

```typescript
function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <View style={styles.errorContainer}>
      <View style={styles.errorIcon}>
        <Ionicons name="alert-circle" size={48} color={DashboardColors.danger} />
      </View>
      <Text style={styles.errorTitle}>Bir hata oluştu</Text>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Ionicons name="refresh" size={18} color="#fff" />
        <Text style={styles.retryButtonText}>Tekrar Dene</Text>
      </TouchableOpacity>
    </View>
  )
}
```

## Skeleton Loading

```typescript
import { Skeleton } from '@/components/ui/Skeleton'

// Header skeleton
<View style={styles.loadInfo}>
  <View style={styles.loadNumberRow}>
    <Skeleton width={140} height={24} />
    <Skeleton width={80} height={24} borderRadius={12} />
  </View>
</View>

// Custom detail skeleton
export function DetailSkeleton() {
  return (
    <View style={styles.skeletonContainer}>
      <Skeleton width="100%" height={120} style={{ marginBottom: 16 }} />
      <Skeleton width="100%" height={200} style={{ marginBottom: 16 }} />
    </View>
  )
}
```

## Haptic Feedback Pattern

| Durum | Fonksiyon |
|-------|-----------|
| Navigation butonları | `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)` |
| Seçim (select/chip) | `Haptics.selectionAsync()` |
| Silme butonu | `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)` |
| Başarılı işlem | `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)` |
| Hata | `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)` |

## Component Organization

```
components/
  module-name/
    Card.tsx
    index.ts           # Re-exports
    steps/
      Step1BasicInfo.tsx
      Step2Details.tsx

hooks/
  module-name/
    useFormReducer.ts
    useFormSubmit.ts

constants/
  module-name/
    formOptions.ts

types/
  module-name.ts
```
