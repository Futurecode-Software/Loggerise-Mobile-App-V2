# CLAUDE.md

Bu dosya Claude Code'a rehberlik sağlar.

---

## 🚨 KRİTİK: BACKEND SADAKAT KURALI

**EN ÖNEMLİ KURAL:** Backend'e %100 sadakat!

### Zorunlu Kurallar
- ✅ **Backend**: `C:\Users\Ufuk\Documents\GitHub\FlsV2` (Laravel 12)
- ✅ **API kontrolü için `mobile-api.php` dosyasını MUTLAKA incele**
- ✅ **Veritabanı alanları için migration dosyalarını kontrol et**
- ✅ **Web panel frontend kodlarını incele (formlar, inputlar, enum değerler)**
- ❌ **Asla tahmin etme, backend'de ne varsa onu kullan**

---

## Proje Özeti

**LoggeriseMobile** - Expo ve React Native ile geliştirilmiş cross-platform mobil uygulama.

### Temel Bilgiler
- **Backend**: Laravel 12 - `C:\Users\Ufuk\Documents\GitHub\FlsV2`
- **Dil**: Tüm UI, yorum ve dokümantasyon **Türkçe**
- **Dokümantasyon**: Context7 kullanarak güncel Expo/React Native bilgileri al

---

## 🔗 Backend Sadakat Kuralları

### 1. API Endpoint Kontrolü (ZORUNLU)

Bir özellik kodlanmadan önce **MUTLAKA** şunları kontrol et:

```bash
# API controller'ları kontrol et
C:\Users\Ufuk\Documents\GitHub\FlsV2\routes\mobile-api.php

# İlgili controller dosyasını bul ve oku
C:\Users\Ufuk\Documents\GitHub\FlsV2\app\Http\Controllers\Api\Mobile\
```

**Kontrol Edilecekler:**
- ✅ Endpoint URL'leri
- ✅ HTTP metotları (GET, POST, PUT, DELETE)
- ✅ Request parametreleri
- ✅ Response yapısı
- ✅ Validation kuralları

### 2. Veritabanı Alanları (ZORUNLU)

Migration dosyalarını kontrol ederek doğru alanları kullan:

```bash
# Migration dosyaları
C:\Users\Ufuk\Documents\GitHub\FlsV2\database\migrations\
```

**Kontrol Edilecekler:**
- ✅ Tablo adları
- ✅ Alan isimleri (column names)
- ✅ Alan tipleri (string, integer, decimal, enum, vb.)
- ✅ Nullable alanlar
- ✅ Default değerler
- ✅ Foreign key ilişkileri

### 3. Web Panel Frontend Kodları (ZORUNLU)

Bir form sayfası kodlanırken **MUTLAKA** web paneldeki karşılığını incele:

```bash
# Web panel frontend (Blade/Vue/React dosyaları)
C:\Users\Ufuk\Documents\GitHub\FlsV2\resources\views\
C:\Users\Ufuk\Documents\GitHub\FlsV2\resources\js\
```

**Web'den Alınacaklar:**
- ✅ **Tüm input alanları** - Web'de hangi inputlar varsa mobilde de AYNI olmalı
- ✅ **Enum değerleri** - Dropdown/select alanlarındaki seçenekler
- ✅ **Validation kuralları** - Zorunlu alanlar, min/max değerler
- ✅ **Input davranışları** - Mask, format, placeholder
- ✅ **Alan sıralaması** - Form alanlarının sırası
- ✅ **Bağımlı alanlar** - Bir alan değişince diğerinin değişmesi

### 4. Özellik Geliştirme Workflow

Yeni bir özellik kodlanırken şu sırayı takip et:

```
1. mobile-api.php dosyasında ilgili endpoint'i bul
2. Controller dosyasını oku (request/response yapısı)
3. Migration dosyasından tablo yapısını öğren
4. Web panel frontend'inden form yapısını al
5. Enum değerlerini ve validation kurallarını not et
6. Mobil sayfayı backend'e %100 uyumlu şekilde kodla
7. API çağrılarını test et
```

### 5. Enum ve Sabit Değerler

Backend'deki enum değerlerini kullan:

```bash
# Model dosyalarındaki enum tanımları
C:\Users\Ufuk\Documents\GitHub\FlsV2\app\Models\

# Veya config dosyaları
C:\Users\Ufuk\Documents\GitHub\FlsV2\config\
```

**Örnek Kontrol:**
```typescript
// Backend'de status enum'u varsa:
// 'pending', 'approved', 'rejected'

// Mobilde AYNI değerler kullanılmalı:
const STATUS_OPTIONS = [
  { value: 'pending', label: 'Beklemede' },
  { value: 'approved', label: 'Onaylandı' },
  { value: 'rejected', label: 'Reddedildi' }
]
```

### 6. Her Commit Öncesi Checklist

- [ ] mobile-api.php endpoint'i kontrol edildi mi?
- [ ] Migration'daki alan isimleri doğru kullanıldı mı?
- [ ] Web paneldeki tüm inputlar mobilde var mı?
- [ ] Enum değerleri backend ile uyumlu mu?
- [ ] Validation kuralları aynı mı?
- [ ] API request/response yapısı doğru mu?

---

## Mimari

- New Architecture aktif (`newArchEnabled: true`)
- React Compiler aktif
- Expo Router v6 - File-based routing
- Typed Routes

## Temel Komutlar

```bash
# Geliştirme
npx expo start           # Dev server
npx expo start -c        # Cache temizle + başlat
npx expo run:android     # Native Android build

# Kod Kalitesi
npm run lint
npx expo lint
```

## Detaylı Dokümantasyon

Aşağıdaki dosyalarda detaylı kurallar ve pattern'ler bulunur:

### Kurallar (`docs/rules/`)
- **[currency.md](docs/rules/currency.md)** - Para formatı kuralları ve `utils/currency.ts` kullanımı
- **[notifications.md](docs/rules/notifications.md)** - Toast ve ConfirmDialog kuralları (Alert YASAK)
- **[animations.md](docs/rules/animations.md)** - Shadow'lu elementlerde animasyon yasağı

### Pattern'ler (`docs/patterns/`)
- **[crud-pages.md](docs/patterns/crud-pages.md)** - CRUD sayfa yapısı, layout, container standardı
- **[forms.md](docs/patterns/forms.md)** - Form sayfaları, multi-step wizard, state yönetimi
- **[components.md](docs/patterns/components.md)** - Yeniden kullanılabilir component pattern'leri
  - ⭐ **Standart Liste Card Yapısı** - Tüm card componentleri için zorunlu pattern

---

## Kritik Kurallar (Özet)

### 1. Para Formatı
```typescript
// YASAK - Lokal formatlama
amount.toLocaleString('tr-TR')

// ZORUNLU - Merkezi utility
import { formatCurrency, formatNumber } from '@/utils/currency'
formatCurrency(1234.56, 'TRY')  // "₺ 1.234,56"
```
📖 Detay: [docs/rules/currency.md](docs/rules/currency.md)

### 2. Bildirimler
```typescript
// YASAK
Alert.alert('Hata', 'Mesaj')

// ZORUNLU - Toast
Toast.show({ type: 'error', text1: 'Hata', position: 'top', visibilityTime: 1500 })

// Silme onayı için ConfirmDialog kullan
```
📖 Detay: [docs/rules/notifications.md](docs/rules/notifications.md)

### 3. Animasyonlar
```typescript
// YASAK - Shadow'lu elementte giriş animasyonu
<Animated.View entering={FadeInDown}>
  <View style={[styles.card, DashboardShadows.md]} />
</Animated.View>

// ZORUNLU - Direkt render
<View style={[styles.card, DashboardShadows.md]} />
```
📖 Detay: [docs/rules/animations.md](docs/rules/animations.md)

### 4. Container Yapısı
```typescript
// Liste ve Detay sayfaları
container: { flex: 1, backgroundColor: DashboardColors.primary }
content: { flex: 1, backgroundColor: DashboardColors.background }

// Form sayfaları (KeyboardAvoidingView ile)
container: { flex: 1, backgroundColor: DashboardColors.background }
// Header: LinearGradient ile yeşil arka plan
```
📖 Detay: [docs/patterns/crud-pages.md](docs/patterns/crud-pages.md)

### 5. PageHeader Kullanımı
```typescript
// Liste sayfası
<PageHeader title="Modül" rightAction={{ icon: 'add', onPress: handleNew }} />

// Form sayfası
<PageHeader
  title="Yeni Kayıt"
  variant="compact"
  rightAction={{ icon: 'checkmark', onPress: handleSubmit, isLoading }}
/>
```
📖 Detay: [docs/patterns/forms.md](docs/patterns/forms.md)

### 6. Standart Card Yapısı
```typescript
// ZORUNLU - Tüm liste card'ları bu pattern'i izlemeli
<TouchableOpacity style={[styles.card, DashboardShadows.md]}>
  {/* Header: 48x48 icon + başlık */}
  <View style={styles.header}>
    <View style={styles.iconContainer}> {/* 48x48, yarı saydam bg */}
    <View style={styles.headerContent}>
      <Text style={styles.name}>        {/* 700 weight, lg size */}

  {/* Info Container: Detaylar */}
  <View style={styles.infoContainer}>
    <View style={styles.infoRow}>      {/* Icon + Text */}

  {/* Footer: Tutar + Badge */}
  <View style={styles.footer}>
    <View style={styles.amountContainer}>
      <Text style={styles.amountLabel}>  {/* UPPERCASE, xs */}
      <Text style={styles.amount}>       {/* 2xl, 800 weight */}
    <View style={styles.badge}>          {/* Full rounded pill */}
</TouchableOpacity>
```
📖 Detay: [docs/patterns/components.md](docs/patterns/components.md#standart-liste-card-yapısı-)

### 7. Form Sayfaları Header Standardı
```typescript
// ZORUNLU - Tüm form sayfalarında (new.tsx, edit.tsx) bu header yapısı kullanılmalı

// 1. Import'lar
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing
} from 'react-native-reanimated'

// 2. Animasyon setup (component içinde)
const orb1TranslateY = useSharedValue(0)
const orb2TranslateX = useSharedValue(0)
const orb1Scale = useSharedValue(1)
const orb2Scale = useSharedValue(1)

useEffect(() => {
  orb1TranslateY.value = withRepeat(
    withTiming(15, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
    -1, true
  )
  orb1Scale.value = withRepeat(
    withTiming(1.1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
    -1, true
  )
  orb2TranslateX.value = withRepeat(
    withTiming(20, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
    -1, true
  )
  orb2Scale.value = withRepeat(
    withTiming(1.15, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
    -1, true
  )
}, [])

const orb1AnimatedStyle = useAnimatedStyle(() => ({
  transform: [
    { translateY: orb1TranslateY.value },
    { scale: orb1Scale.value }
  ]
}))

const orb2AnimatedStyle = useAnimatedStyle(() => ({
  transform: [
    { translateX: orb2TranslateX.value },
    { scale: orb2Scale.value }
  ]
}))

// 3. Header JSX
<View style={styles.headerContainer}>
  <LinearGradient
    colors={['#022920', '#044134', '#065f4a']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={StyleSheet.absoluteFill}
  />

  {/* Dekoratif ışık efektleri - Animasyonlu */}
  <Animated.View style={[styles.glowOrb1, orb1AnimatedStyle]} />
  <Animated.View style={[styles.glowOrb2, orb2AnimatedStyle]} />

  <View style={[styles.headerContent, { paddingTop: insets.top + 16 }]}>
    <View style={styles.headerBar}>
      {/* Sol: Geri Butonu */}
      <TouchableOpacity onPress={handleBack} style={styles.backButton}>
        <Ionicons name="chevron-back" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Orta: Başlık */}
      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle}>Başlık</Text>
      </View>

      {/* Sağ: Kaydet/Aksiyon Butonu */}
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={isSubmitting}
        style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons name="checkmark" size={24} color="#fff" />
        )}
      </TouchableOpacity>
    </View>
  </View>

  <View style={styles.bottomCurve} />
</View>

// 4. Styles
headerContainer: {
  position: 'relative',
  paddingBottom: 24,
  overflow: 'hidden'  // ZORUNLU - Dairelerin taşmasını önler
},
glowOrb1: {
  position: 'absolute',
  top: -40,
  right: -20,
  width: 140,
  height: 140,
  borderRadius: 70,
  backgroundColor: 'rgba(16, 185, 129, 0.12)'
},
glowOrb2: {
  position: 'absolute',
  bottom: 30,
  left: -50,
  width: 100,
  height: 100,
  borderRadius: 50,
  backgroundColor: 'rgba(255, 255, 255, 0.04)'
},
backButton: {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  alignItems: 'center',
  justifyContent: 'center'
},
saveButton: {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  alignItems: 'center',
  justifyContent: 'center'
},
saveButtonDisabled: {
  opacity: 0.5
},
bottomCurve: {
  position: 'absolute',
  bottom: -1,
  left: 0,
  right: 0,
  height: 24,
  backgroundColor: DashboardColors.background,
  borderTopLeftRadius: DashboardBorderRadius['2xl'],
  borderTopRightRadius: DashboardBorderRadius['2xl']
}
```

**Önemli Noktalar:**
- ✅ Her iki buton (geri/kaydet) **aynı style** kullanmalı (40x40, yuvarlak, yarı saydam)
- ✅ **Hareketli dekoratif daireler** (glowOrb1, glowOrb2) **ZORUNLU**
- ✅ `overflow: 'hidden'` headerContainer'da **MUTLAKA** olmalı
- ✅ Animasyon süreleri ve easing değerleri **değiştirilmemeli**
- ✅ LinearGradient renkleri **sabit**: `['#022920', '#044134', '#065f4a']`

---

## Routing

### Navigation Flow
```
index.tsx → splash.tsx → login.tsx → /(tabs)/
```

### CRUD Modül Yapısı
```
app/module-name/
  _layout.tsx       # Stack, headerShown: false
  index.tsx         # Liste
  new.tsx           # Yeni kayıt
  [id]/
    _layout.tsx
    index.tsx       # Detay
    edit.tsx        # Düzenleme
```

### Önemli
- `index.tsx` asla `null` döndürmemeli - `<Redirect>` kullan
- **Detay sayfalarında `fetchData` fonksiyonunu `useCallback` ile sarmala**
- `useFocusEffect` ile düzenleme sayfasından dönüşte veri yenile (detaylı örnek aşağıda)

---

## Kod Stili

### Lint Kontrolü
**ZORUNLU**: Her kod düzenlemesinden sonra lint kontrolü yapılmalıdır.
```bash
npm run lint
```
- ❌ Error olmamalı
- ❌ Warning olmamalı
- ✅ Tüm lint kurallarına uygun, temiz kod

### Formatlama
- Single quotes
- No semicolons
- 2-space indentation
- Trailing commas only in arrays

### Import
```typescript
import { Component } from '@/components/path'  // @ alias kullan
```

### Naming
- Components: PascalCase (`ThemedText.tsx`)
- Hooks: camelCase + use prefix (`use-theme-color.ts`)
- Files: kebab-case veya PascalCase

### Exports
- Named exports tercih et
- Route components default export

---

## Theme System

```typescript
import { useThemeColor } from '@/hooks/use-theme-color'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardBorderRadius,
  DashboardFontSizes,
  DashboardShadows
} from '@/constants/dashboard-theme'
```

---

## Checklist: Yeni Sayfa

### 🔗 Backend Uyumu (HER SAYFA İÇİN ZORUNLU)
- [ ] **mobile-api.php endpoint'i kontrol edildi**
- [ ] **Controller dosyası okundu (request/response)**
- [ ] **Migration'dan alan isimleri alındı**
- [ ] **Web panel formu incelendi**
- [ ] **Tüm inputlar ve enum değerler backend ile uyumlu**
- [ ] **Validation kuralları aynı**

### Liste Sayfası
- [ ] Container: `DashboardColors.primary`
- [ ] Content: `DashboardColors.background`
- [ ] `PageHeader` component
- [ ] **`fetchData` fonksiyonunu `useCallback` ile sarmalama (ZORUNLU)**
- [ ] `useFocusEffect` ile veri yenileme (new/edit'ten dönüşte)
- [ ] RefreshControl, Pagination
- [ ] Empty/Error state

### Form Sayfası
- [ ] **Web paneldeki form ile karşılaştırıldı**
- [ ] **Tüm inputlar web ile aynı**
- [ ] Container: `DashboardColors.background` (primary DEĞİL!)
- [ ] **Header: Standart form header yapısı (LinearGradient + animasyonlu daireler + tutarlı butonlar) - ZORUNLU**
- [ ] Hareketli dekoratif daireler (glowOrb1, glowOrb2) eklendi
- [ ] Geri ve kaydet butonları aynı stil (40x40, yuvarlak, yarı saydam)
- [ ] `overflow: 'hidden'` headerContainer'da var
- [ ] `rightAction.isLoading` desteği (ActivityIndicator)
- [ ] Klavye yapısı (aşağıdaki pattern)
- [ ] Toast bildirimleri

#### Klavye Kullanım Standardı (Form Sayfaları)
```typescript
// react-native-keyboard-controller kullan (KeyboardAvoidingView KULLANMA!)
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'

// Container
container: { flex: 1, backgroundColor: DashboardColors.background }

// KeyboardAwareScrollView - Tek component, hem iOS hem Android'de çalışır
<KeyboardAwareScrollView
  style={styles.content}
  contentContainerStyle={styles.contentContainer}
  bottomOffset={20}
>
  {/* Form içeriği */}
</KeyboardAwareScrollView>

// Styles
content: { flex: 1 }
contentContainer: { padding: DashboardSpacing.lg, paddingBottom: DashboardSpacing.xl }
```

**Root Layout'ta KeyboardProvider gerekli:**
```typescript
import { KeyboardProvider } from 'react-native-keyboard-controller'
// GestureHandlerRootView içinde wrap et
```

### Detay Sayfası
- [ ] **Backend API response yapısına uygun**
- [ ] LinearGradient header
- [ ] Skeleton loading
- [ ] ConfirmDialog ile silme
- [ ] `isMountedRef` ile memory leak önleme
- [ ] **`fetchData` fonksiyonunu `useCallback` ile sarmalama (ZORUNLU)**
- [ ] `useFocusEffect` ile düzenleme sayfasından dönüşte veri yenileme

#### useFocusEffect ile Veri Yenileme Standardı (Detay Sayfaları)
```typescript
// ZORUNLU: fetchData fonksiyonunu useCallback ile sarmala
const fetchData = useCallback(async (showLoading = true) => {
  try {
    if (showLoading) {
      setIsLoading(true)
      setError(null)
    }

    const data = await getData(parseInt(id, 10))

    if (isMountedRef.current) {
      setData(data)
    }
  } catch (err: any) {
    if (isMountedRef.current) {
      setError(err.message)
      Toast.show({
        type: 'error',
        text1: err.message,
        position: 'top',
        visibilityTime: 1500
      })
    }
  } finally {
    if (isMountedRef.current) {
      setIsLoading(false)
      setRefreshing(false)
    }
  }
}, [id])

// useEffect - İlk yükleme
useEffect(() => {
  fetchData()
}, [fetchData])

// useFocusEffect - Düzenleme sayfasından dönüşte yenileme
useFocusEffect(
  useCallback(() => {
    fetchData(false)
  }, [fetchData])
)
```

**Önemli:**
- `fetchData` fonksiyonunu `useCallback` ile **mutlaka** sarmalayın
- `useFocusEffect` içinde `fetchData` dependency'sini kullanın
- Aksi takdirde her focus'ta eski veri referansı kullanılır ve güncel veri gelmez

---

## Bağımlılıklar

| Paket | Versiyon |
|-------|----------|
| expo | ~54.0.32 |
| react | 19.1.0 |
| react-native | 0.81.5 |
| expo-router | ~6.0.22 |
| react-native-reanimated | ~4.1.1 |
