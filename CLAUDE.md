# CLAUDE.md

Bu dosya Claude Code'a rehberlik sağlar.

---

## Proje Özeti

**LoggeriseMobile** - Expo ve React Native ile geliştirilmiş cross-platform mobil uygulama.

- **Backend**: Laravel 12 - `C:\Users\Ufuk\Documents\GitHub\FlsV2`
- **Dil**: Tüm UI, yorum ve dokümantasyon **Türkçe**
- **Dokümantasyon**: Context7 kullanarak güncel Expo/React Native bilgileri al

### Mimari
- New Architecture aktif (`newArchEnabled: true`)
- React Compiler aktif
- Expo Router v6 - File-based routing, Typed Routes

---

## 🚨 KRİTİK: BACKEND SADAKAT KURALI

**EN ÖNEMLİ KURAL:** Backend'e %100 sadakat! Asla tahmin etme.

### Kontrol Edilecek Dosyalar
```
C:\Users\Ufuk\Documents\GitHub\FlsV2\
├── routes\mobile-api.php              # API endpoint'leri
├── app\Http\Controllers\Api\Mobile\   # Controller'lar
├── database\migrations\               # Tablo yapıları
├── app\Models\                        # Enum değerleri
├── resources\views\                   # Web form yapısı
└── resources\js\                      # Frontend kodları
```

### Geliştirme Workflow
1. `mobile-api.php` → endpoint URL, HTTP metot
2. Controller → request/response yapısı, validation
3. Migration → alan isimleri, tipler, nullable
4. Web panel → form alanları, enum değerler, sıralama
5. Mobil sayfayı backend'e %100 uyumlu kodla

---

## Modül Yapısı

| Modül | Route Prefix | Amaç |
|-------|-------------|------|
| Accounting | `/accounting/` | Kasa, banka, çek, senet |
| CRM | `/crm/` | Müşteri, teklif |
| Logistics | `/logistics/` | Taşıma, yük, sefer |
| HR | `/hr/` | Çalışan, ilan, başvuru |
| Inventory | `/inventory/` | Stok, depo, ürün |
| Fleet | `/fleet/` | Araç, lastik, sürücü |

### CRUD Modül Yapısı
```
app/module-name/
  _layout.tsx       # Stack, headerShown: false
  index.tsx         # Liste
  new.tsx           # Yeni kayıt
  [id].tsx          # Detay
  [id]/edit.tsx     # Düzenleme
```

---

## Kritik Kurallar

### 1. Para Formatı
```typescript
// ❌ YASAK
amount.toLocaleString('tr-TR')

// ✅ ZORUNLU
import { formatCurrency } from '@/utils/currency'
formatCurrency(1234.56, 'TRY')  // "₺ 1.234,56"
```

### 2. Bildirimler
```typescript
// ❌ YASAK
Alert.alert('Hata', 'Mesaj')

// ✅ ZORUNLU
Toast.show({ type: 'error', text1: 'Hata', position: 'top', visibilityTime: 1500 })
// Silme onayı için ConfirmDialog kullan
```

### 3. Animasyonlar
```typescript
// ❌ YASAK - Shadow'lu elementte giriş animasyonu
<Animated.View entering={FadeInDown}>
  <View style={[styles.card, DashboardShadows.md]} />
</Animated.View>

// ✅ ZORUNLU - Direkt render
<View style={[styles.card, DashboardShadows.md]} />
```

### 4. Modal
```typescript
// ❌ YASAK
import { Modal } from 'react-native'

// ✅ ZORUNLU
import { BottomSheetModal } from '@gorhom/bottom-sheet'
// snapPoints: ['92%'], enablePanDownToClose: true
```

### 5. Klavye (Form Sayfaları)
```typescript
// ❌ YASAK
import { KeyboardAvoidingView } from 'react-native'

// ✅ ZORUNLU
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
```

---

## Sayfa Yapıları

### Container Kuralları
| Sayfa Tipi | Container BG | Content BG |
|------------|-------------|------------|
| Liste | `DashboardColors.primary` | `DashboardColors.background` |
| Detay | `DashboardColors.primary` | `DashboardColors.background` |
| Form | `DashboardColors.background` | - |

### Header Farkları
| Özellik | Form Sayfası | Detay Sayfası |
|---------|-------------|---------------|
| Glow orbs | Animasyonlu | Statik |
| Buton boyutu | 40x40 | 44x44 |
| Sağ butonlar | Kaydet | Düzenle + Sil |
| Gradient | `['#022920', '#044134', '#065f4a']` | Aynı |

### Liste Sayfası
- `PageHeader` component kullan
- Filtreler content içinde ayrı chip olarak
- Animasyonlu card component oluştur
- Skeleton component oluştur
- `FlatList` + `RefreshControl` + pagination

### Form Sayfası
- LinearGradient header + animasyonlu glow orbs
- `KeyboardAwareScrollView` kullan
- `overflow: 'hidden'` headerContainer'da zorunlu
- Loading state için ActivityIndicator

### Detay Sayfası
- `SectionHeader` + `InfoRow` component pattern'i
- `useFocusEffect` ile edit'ten dönüşte yenileme
- `isMountedRef` ile memory leak önleme
- `ConfirmDialog` ile silme onayı

---

## Veri Yenileme Pattern'i

```typescript
// ZORUNLU: fetchData'yı useCallback ile sarmala
const fetchData = useCallback(async (showLoading = true) => {
  // ... fetch logic
}, [id])

useEffect(() => { fetchData() }, [fetchData])

useFocusEffect(useCallback(() => { fetchData(false) }, [fetchData]))
```

---

## Theme System

```typescript
import {
  DashboardColors,
  DashboardSpacing,
  DashboardBorderRadius,
  DashboardFontSizes,
  DashboardShadows
} from '@/constants/dashboard-theme'
```

---

## Kod Stili

### Formatlama
- Single quotes, no semicolons
- 2-space indentation
- `@/` alias kullan

### Lint
```bash
npm run lint  # Her düzenlemeden sonra ZORUNLU
```

### Naming
- Components: PascalCase
- Hooks: camelCase + `use` prefix
- Route components: default export

---

## Temel Komutlar

```bash
npx expo start           # Dev server
npx expo start -c        # Cache temizle
npx expo run:android     # Native build
npm run lint             # Lint kontrolü
```

---

## Detaylı Dokümantasyon

Aşağıdaki dosyalarda detaylı kurallar ve kod örnekleri bulunur:

### Kurallar (`docs/rules/`)
- `currency.md` - Para formatı kuralları
- `notifications.md` - Toast ve ConfirmDialog
- `animations.md` - Shadow'lu element kuralları

### Pattern'ler (`docs/patterns/`)
- `crud-pages.md` - CRUD sayfa yapısı, layout standardı
- `forms.md` - Form header, animasyonlu orbs, klavye
- `components.md` - Card yapısı, SectionHeader, InfoRow

---

## Checklist: Yeni Sayfa

### Backend Uyumu
- [ ] mobile-api.php endpoint kontrol
- [ ] Controller request/response
- [ ] Migration alan isimleri
- [ ] Web panel form yapısı
- [ ] Enum değerler uyumu

### Liste Sayfası
- [ ] `PageHeader` + filter chips
- [ ] `useCallback` ile `fetchData`
- [ ] `useFocusEffect` ile yenileme
- [ ] Skeleton + Empty/Error state

### Form Sayfası
- [ ] Animasyonlu header (glow orbs)
- [ ] `KeyboardAwareScrollView`
- [ ] Toast bildirimleri
- [ ] Web form ile aynı inputlar

### Detay Sayfası
- [ ] Statik glow orbs
- [ ] `useFocusEffect` + `useCallback`
- [ ] `ConfirmDialog` ile silme
- [ ] `isMountedRef` memory leak

---

## Bağımlılıklar

| Paket | Versiyon |
|-------|----------|
| expo | ~54.0.32 |
| react | 19.1.0 |
| react-native | 0.81.5 |
| expo-router | ~6.0.22 |
| react-native-reanimated | ~4.1.1 |
