# CLAUDE.md

Bu dosya Claude Code'a rehberlik sağlar.

---

# 📁 UYGULAMA MODÜL YAPISI

Bu bölüm, uygulamadaki tüm modüllerin konumlarını ve amaçlarını açıklar.

## 🗂️ Ana Klasör Yapısı

```
app/
├── (auth)/                          # Kimlik doğrulama sayfaları
│   ├── login.tsx                    # Giriş sayfası
│   ├── register.tsx                 # Kayıt sayfası
│   ├── forgot-password.tsx          # Şifre sıfırlama
│   └── setup-status.tsx             # Kurulum durumu
│
├── (tabs)/                          # Ana tab bar sayfaları
│   ├── index.tsx                    # Ana sayfa/Dashboard
│   ├── positions.tsx                # Pozisyonlar
│   ├── loads.tsx                    # Yükler
│   ├── contacts.tsx                 # Kontaklar
│   ├── messages.tsx                 # Mesajlar
│   ├── more.tsx                     # Daha fazla (modül menüsü)
│   └── profile.tsx                  # Profil
│
├── accounting/                      # 💰 MUHASEBE MODÜLÜ
│   ├── index.tsx                    # Muhasebe dashboard
│   ├── _layout.tsx                  # Stack layout
│   │
│   ├── cash-register/               # Kasa yönetimi
│   │   ├── index.tsx                # Kasa listesi
│   │   ├── new.tsx                  # Yeni kasa
│   │   ├── [id].tsx                 # Kasa detay
│   │   └── [id]/edit.tsx            # Kasa düzenle
│   │
│   ├── bank/                        # Banka hesapları
│   │   ├── index.tsx                # Banka listesi
│   │   ├── new.tsx                  # Yeni banka hesabı
│   │   ├── [id].tsx                 # Banka detay
│   │   └── [id]/edit.tsx            # Banka düzenle
│   │
│   ├── check/                       # Çek yönetimi
│   │   ├── index.tsx                # Çek listesi
│   │   ├── new.tsx                  # Yeni çek
│   │   ├── [id].tsx                 # Çek detay
│   │   └── [id]/edit.tsx            # Çek düzenle
│   │
│   ├── promissory-note/             # Senet yönetimi
│   │   ├── index.tsx                # Senet listesi
│   │   ├── new.tsx                  # Yeni senet
│   │   ├── [id].tsx                 # Senet detay
│   │   └── [id]/edit.tsx            # Senet düzenle
│   │
│   └── transactions/                # Mali işlemler
│       ├── index.tsx                # İşlem listesi
│       └── [id].tsx                 # İşlem detay
│
├── crm/                             # 👥 CRM MODÜLÜ
│   ├── index.tsx                    # CRM dashboard
│   ├── _layout.tsx                  # Stack layout
│   │
│   ├── customers/                   # Müşteri yönetimi
│   │   ├── index.tsx                # Müşteri listesi
│   │   ├── new.tsx                  # Yeni müşteri
│   │   ├── [id].tsx                 # Müşteri detay
│   │   ├── [id]/edit.tsx            # Müşteri düzenle
│   │   └── [id]/interactions/       # Müşteri etkileşimleri
│   │       ├── new.tsx              # Yeni etkileşim
│   │       └── [interactionId].tsx  # Etkileşim detay
│   │
│   └── quotes/                      # Teklif yönetimi
│       ├── new.tsx                  # Yeni teklif
│       └── [id].tsx                 # Teklif detay
│
├── logistics/                       # 🚚 LOJİSTİK MODÜLÜ
│   ├── index.tsx                    # Lojistik dashboard
│   ├── _layout.tsx                  # Stack layout
│   │
│   ├── domestic/                    # Yurtiçi taşıma
│   │   ├── index.tsx                # Yurtiçi listesi
│   │   ├── new.tsx                  # Yeni yurtiçi sipariş
│   │   └── [id].tsx                 # Yurtiçi detay
│   │
│   ├── exports/                     # İhracat operasyonları
│   │   ├── operations/              # İhracat operasyonları
│   │   │   └── index.tsx
│   │   ├── disposition/             # İhracat dispozisyonu
│   │   │   └── index.tsx
│   │   ├── positions/               # İhracat pozisyonları
│   │   │   ├── index.tsx
│   │   │   └── [id].tsx
│   │   └── loads/                   # İhracat yükleri
│   │       └── index.tsx
│   │
│   ├── imports/                     # İthalat operasyonları
│   │   ├── operations/              # İthalat operasyonları
│   │   │   └── index.tsx
│   │   ├── disposition/             # İthalat dispozisyonu
│   │   │   └── index.tsx
│   │   ├── positions/               # İthalat pozisyonları
│   │   │   ├── index.tsx
│   │   │   └── [id].tsx
│   │   └── loads/                   # İthalat yükleri
│   │       └── index.tsx
│   │
│   ├── load/                        # Yük yönetimi
│   │   ├── new.tsx                  # Yeni yük
│   │   ├── [id].tsx                 # Yük detay
│   │   └── [id]/edit.tsx            # Yük düzenle
│   │
│   └── trip/                        # Sefer yönetimi
│       ├── index.tsx                # Sefer listesi
│       └── [id].tsx                 # Sefer detay
│
├── hr/                              # 👔 İNSAN KAYNAKLARI MODÜLÜ
│   ├── index.tsx                    # İK dashboard
│   ├── _layout.tsx                  # Stack layout
│   │
│   ├── employee/                    # Çalışan yönetimi
│   │   ├── index.tsx                # Çalışan listesi
│   │   ├── new.tsx                  # Yeni çalışan
│   │   ├── [id].tsx                 # Çalışan detay
│   │   └── [id]/edit.tsx            # Çalışan düzenle
│   │
│   ├── job-postings/                # İş ilanları
│   │   ├── index.tsx                # İlan listesi
│   │   ├── new.tsx                  # Yeni ilan
│   │   ├── [id].tsx                 # İlan detay
│   │   └── [id]/edit.tsx            # İlan düzenle
│   │
│   └── job-applications/            # İş başvuruları
│       ├── index.tsx                # Başvuru listesi
│       ├── new.tsx                  # Yeni başvuru
│       ├── [id].tsx                 # Başvuru detay
│       └── [id]/edit.tsx            # Başvuru düzenle
│
├── inventory/                       # 📦 ENVANTER MODÜLÜ
│   ├── index.tsx                    # Envanter dashboard
│   ├── _layout.tsx                  # Stack layout
│   │
│   ├── stock/                       # Stok yönetimi
│   │   ├── index.tsx                # Stok dashboard
│   │   ├── _layout.tsx              # Stock layout
│   │   │
│   │   ├── products/                # Ürün yönetimi
│   │   │   ├── index.tsx            # Ürün listesi
│   │   │   ├── new.tsx              # Yeni ürün
│   │   │   ├── [id]/index.tsx       # Ürün detay
│   │   │   └── [id]/edit.tsx        # Ürün düzenle
│   │   │
│   │   ├── brands/                  # Marka yönetimi
│   │   │   ├── index.tsx            # Marka listesi
│   │   │   ├── new.tsx              # Yeni marka
│   │   │   ├── [id]/index.tsx       # Marka detay
│   │   │   └── [id]/edit.tsx        # Marka düzenle
│   │   │
│   │   ├── models/                  # Model yönetimi
│   │   │   ├── index.tsx            # Model listesi
│   │   │   ├── new.tsx              # Yeni model
│   │   │   └── [id].tsx             # Model detay
│   │   │
│   │   ├── categories/              # Kategori yönetimi
│   │   │   ├── index.tsx            # Kategori listesi
│   │   │   ├── new.tsx              # Yeni kategori
│   │   │   ├── [id]/index.tsx       # Kategori detay
│   │   │   └── [id]/edit.tsx        # Kategori düzenle
│   │   │
│   │   └── movements/               # Stok hareketleri
│   │       ├── index.tsx            # Hareket listesi
│   │       ├── new.tsx              # Yeni hareket
│   │       └── [id].tsx             # Hareket detay
│   │
│   └── warehouse/                   # Depo yönetimi
│       ├── index.tsx                # Depo listesi
│       ├── new.tsx                  # Yeni depo
│       ├── [id].tsx                 # Depo detay
│       └── [id]/edit.tsx            # Depo düzenle
│
└── fleet/                           # 🚛 FİLO YÖNETİMİ MODÜLÜ
    ├── index.tsx                    # Filo dashboard
    ├── _layout.tsx                  # Stack layout
    │
    ├── vehicle/                     # Araç yönetimi
    │   ├── index.tsx                # Araç listesi
    │   ├── new.tsx                  # Yeni araç
    │   ├── [id].tsx                 # Araç detay
    │   └── [id]/edit.tsx            # Araç düzenle
    │
    ├── tire-warehouse/              # Lastik deposu
    │   ├── index.tsx                # Lastik listesi
    │   ├── new.tsx                  # Yeni lastik kaydı
    │   └── [id].tsx                 # Lastik detay
    │
    ├── driver-tractor/              # Sürücü-Çekici eşleştirme
    │   ├── index.tsx                # Eşleştirme listesi
    │   ├── new.tsx                  # Yeni eşleştirme
    │   └── [id].tsx                 # Eşleştirme detay
    │
    ├── tractor-trailer/             # Çekici-Dorse eşleştirme
    │   ├── index.tsx                # Eşleştirme listesi
    │   ├── new.tsx                  # Yeni eşleştirme
    │   └── [id].tsx                 # Eşleştirme detay
    │
    └── fault-reports/               # Arıza bildirimleri
        └── index.tsx                # Arıza listesi
```

## 🎯 Modül Grupları

### 💰 Accounting (Muhasebe)
**Route Prefix:** `/accounting/`
**Amaç:** Finansal işlemler, kasa, banka, çek ve senet yönetimi

### 👥 CRM
**Route Prefix:** `/crm/`
**Amaç:** Müşteri ilişkileri yönetimi, teklif oluşturma

### 🚚 Logistics (Lojistik)
**Route Prefix:** `/logistics/`
**Amaç:** Yurtiçi/yurtdışı taşıma operasyonları, yük ve sefer yönetimi

### 👔 HR (İnsan Kaynakları)
**Route Prefix:** `/hr/`
**Amaç:** Çalışan yönetimi, iş ilanları ve başvuru takibi

### 📦 Inventory (Envanter)
**Route Prefix:** `/inventory/`
**Amaç:** Stok, depo ve ürün yönetimi

### 🚛 Fleet (Filo Yönetimi)
**Route Prefix:** `/fleet/`
**Amaç:** Araç, lastik ve sürücü yönetimi

## 📍 Hızlı Erişim Rehberi

### Örnek Route'lar
```
# Muhasebe
/accounting/cash-register          → Kasa listesi
/accounting/bank/123                → Banka detay
/accounting/check/new               → Yeni çek

# CRM
/crm/customers                      → Müşteri listesi
/crm/customers/456/edit             → Müşteri düzenle
/crm/quotes/789                     → Teklif detay

# Lojistik
/logistics/domestic                 → Yurtiçi listesi
/logistics/exports/operations       → İhracat operasyonları
/logistics/load/123                 → Yük detay

# İK
/hr/employee                        → Çalışan listesi
/hr/job-postings/new                → Yeni iş ilanı

# Envanter
/inventory/stock/products           → Ürün listesi
/inventory/warehouse/456            → Depo detay

# Filo
/fleet/vehicle                      → Araç listesi
/fleet/tire-warehouse/123           → Lastik kaydı detay
```

## 🔍 Modül Arama Kılavuzu

Bir özellik ararken:

1. **Finansal işlemler** → `accounting/`
2. **Müşteri/Teklif** → `crm/`
3. **Taşıma/Yük/Sefer** → `logistics/`
4. **Personel/İlan** → `hr/`
5. **Stok/Ürün/Depo** → `inventory/`
6. **Araç/Lastik** → `fleet/`


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

#### Sistemde Kullanılan Döviz Kodları
```typescript
// Desteklenen para birimleri
const SUPPORTED_CURRENCIES = [
  'TRY',  // Türk Lirası
  'USD',  // Amerikan Doları
  'EUR',  // Euro
  'GBP',  // İngiliz Sterlini
  'AUD',  // Avustralya Doları
  'DKK',  // Danimarka Kronu
  'CHF',  // İsviçre Frangı
  'SEK',  // İsveç Kronu
  'CAD',  // Kanada Doları
  'KWD',  // Kuveyt Dinarı
  'NOK',  // Norveç Kronu
  'SAR',  // Suudi Arabistan Riyali
  'JPY',  // Japon Yeni
  'BGN',  // Bulgar Levası
  'RON',  // Rumen Leyi
  'RUB',  // Rus Rublesi
  'CNY',  // Çin Yuanı
  'PKR',  // Pakistan Rupisi
  'QAR',  // Katar Riyali
  'KRW',  // Güney Kore Wonu
  'AZN',  // Azerbaycan Manatı
  'AED',  // BAE Dirhemi
  'XDR'   // IMF Özel Çekme Hakkı
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

### 8. Detay Sayfası Header Standardı (load/[id].tsx referans)
```typescript
// ZORUNLU - Tüm detay sayfalarında ([id]/index.tsx) bu header yapısı kullanılmalı

// 1. Container - DashboardColors.primary arka plan
container: { flex: 1, backgroundColor: DashboardColors.primary }

// 2. Header yapısı - Statik glow orbs (animasyonsuz)
<View style={styles.headerContainer}>
  <LinearGradient
    colors={['#022920', '#044134', '#065f4a']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={StyleSheet.absoluteFill}
  />
  <View style={styles.glowOrb1} />
  <View style={styles.glowOrb2} />

  <View style={[styles.headerContent, { paddingTop: insets.top + 16 }]}>
    <View style={styles.headerBar}>
      {/* Sol: Geri Butonu */}
      <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
        <Ionicons name="chevron-back" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Sağ: Düzenle + Sil Butonları */}
      {!isLoading && data && (
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleEdit}>
            <Ionicons name="create-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, styles.deleteButton]}
            onPress={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="trash-outline" size={22} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>

    {/* Header içeriği: Başlık, badge'ler vb. */}
    {renderHeaderContent()}
  </View>

  <View style={styles.bottomCurve} />
</View>

// 3. Content - ScrollView ile background renk
<ScrollView
  style={styles.content}
  contentContainerStyle={styles.contentContainer}
  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
>
  {/* İçerik */}
</ScrollView>

// 4. Styles
headerContainer: {
  position: 'relative',
  overflow: 'hidden',
  paddingBottom: 24
},
headerButton: {
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: 'rgba(255, 255, 255, 0.12)',
  alignItems: 'center',
  justifyContent: 'center'
},
headerActions: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: DashboardSpacing.sm
},
deleteButton: {
  backgroundColor: 'rgba(239, 68, 68, 0.2)'  // Kırmızı yarı saydam
},
content: {
  flex: 1,
  backgroundColor: DashboardColors.background
},
contentContainer: {
  paddingHorizontal: DashboardSpacing.lg,
  paddingTop: DashboardSpacing.md
}
```

**Detay Sayfası vs Form Sayfası Farkları:**
| Özellik | Detay Sayfası | Form Sayfası |
|---------|---------------|--------------|
| Container bg | `DashboardColors.primary` | `DashboardColors.background` |
| Glow orbs | Statik `<View>` | Animasyonlu `<Animated.View>` |
| Header butonları | 44x44 | 40x40 |
| Sağ butonlar | Düzenle + Sil | Kaydet |
| Silme butonu | Kırmızı yarı saydam bg | - |

### 9. Detay Sayfası İçerik Yapısı (SectionHeader + InfoRow)
```typescript
// ZORUNLU - Tüm detay sayfalarında bu component yapısını kullan

// SectionHeader Component
interface SectionHeaderProps {
  title: string
  icon: keyof typeof Ionicons.glyphMap
  count?: number           // Opsiyonel: Liste sayısı
  isExpanded?: boolean     // Opsiyonel: Açılır/kapanır bölüm
  onToggle?: () => void    // Opsiyonel: Toggle handler
}

function SectionHeader({ title, icon, count, isExpanded, onToggle }: SectionHeaderProps) {
  return (
    <TouchableOpacity
      style={styles.sectionHeader}
      onPress={onToggle}
      disabled={!onToggle}
      activeOpacity={onToggle ? 0.7 : 1}
    >
      <View style={styles.sectionHeaderLeft}>
        <View style={styles.sectionIcon}>
          <Ionicons name={icon} size={16} color={DashboardColors.primary} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
        {count !== undefined && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{count}</Text>
          </View>
        )}
      </View>
      {onToggle && (
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={DashboardColors.textMuted}
        />
      )}
    </TouchableOpacity>
  )
}

// InfoRow Component
interface InfoRowProps {
  label: string
  value: string
  icon?: keyof typeof Ionicons.glyphMap
  highlight?: boolean  // Önemli değerler için primary renk
}

function InfoRow({ label, value, icon, highlight }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLabel}>
        {icon && (
          <Ionicons
            name={icon}
            size={14}
            color={DashboardColors.textMuted}
            style={styles.infoIcon}
          />
        )}
        <Text style={styles.infoLabelText}>{label}</Text>
      </View>
      <Text style={[styles.infoValue, highlight && styles.infoValueHighlight]}>
        {value}
      </Text>
    </View>
  )
}

// Card Yapısı
<View style={styles.card}>
  <SectionHeader title="Bölüm Başlığı" icon="information-circle-outline" />
  <View style={styles.cardContent}>
    <InfoRow label="Alan" value="Değer" icon="car-outline" />
    <InfoRow label="Önemli Alan" value="Değer" highlight />
  </View>
</View>

// Styles
card: {
  backgroundColor: DashboardColors.surface,
  borderRadius: DashboardBorderRadius.xl,
  marginBottom: DashboardSpacing.md,
  ...DashboardShadows.sm
},
sectionHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: DashboardSpacing.lg,
  borderBottomWidth: 1,
  borderBottomColor: DashboardColors.borderLight
},
sectionHeaderLeft: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: DashboardSpacing.sm
},
sectionIcon: {
  width: 32,
  height: 32,
  borderRadius: 10,
  backgroundColor: DashboardColors.primaryGlow,
  alignItems: 'center',
  justifyContent: 'center'
},
sectionTitle: {
  fontSize: DashboardFontSizes.base,
  fontWeight: '600',
  color: DashboardColors.textPrimary
},
countBadge: {
  backgroundColor: DashboardColors.primary,
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderRadius: 10
},
countText: {
  fontSize: DashboardFontSizes.xs,
  fontWeight: '600',
  color: '#fff'
},
cardContent: {
  paddingHorizontal: DashboardSpacing.lg,
  paddingBottom: DashboardSpacing.lg
},
infoRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingVertical: DashboardSpacing.sm,
  borderBottomWidth: 1,
  borderBottomColor: DashboardColors.borderLight
},
infoLabel: {
  flexDirection: 'row',
  alignItems: 'center'
},
infoIcon: {
  marginRight: DashboardSpacing.sm
},
infoLabelText: {
  fontSize: DashboardFontSizes.sm,
  color: DashboardColors.textSecondary
},
infoValue: {
  fontSize: DashboardFontSizes.sm,
  fontWeight: '500',
  color: DashboardColors.textPrimary,
  maxWidth: '50%',
  textAlign: 'right'
},
infoValueHighlight: {
  color: DashboardColors.primary,
  fontWeight: '600'
}
```

### 10. Hata Durumu (Error State) Standardı
```typescript
// ZORUNLU - Tüm detay sayfalarında bu error state yapısını kullan

<View style={styles.errorState}>
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

// Styles
errorState: {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: DashboardSpacing['2xl'],
  paddingVertical: DashboardSpacing['3xl']
},
errorIcon: {
  width: 96,
  height: 96,
  borderRadius: 48,
  backgroundColor: DashboardColors.dangerBg,
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: DashboardSpacing.xl
},
errorTitle: {
  fontSize: DashboardFontSizes.xl,
  fontWeight: '600',
  color: DashboardColors.textPrimary,
  marginBottom: DashboardSpacing.sm,
  textAlign: 'center'
},
errorText: {
  fontSize: DashboardFontSizes.base,
  color: DashboardColors.textSecondary,
  textAlign: 'center',
  marginBottom: DashboardSpacing.xl
},
retryButton: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: DashboardSpacing.sm,
  backgroundColor: DashboardColors.danger,  // DANGER renk - primary DEĞİL
  paddingHorizontal: DashboardSpacing.xl,
  paddingVertical: DashboardSpacing.md,
  borderRadius: DashboardBorderRadius.lg
},
retryButtonText: {
  fontSize: DashboardFontSizes.base,
  fontWeight: '600',
  color: '#fff'
}
```

### 11. Liste Sayfası Header Standardı (PageHeader)
```typescript
// ZORUNLU - Tüm liste sayfalarında (index.tsx) bu yapı kullanılmalı
// Referans: app/(tabs)/contacts.tsx, app/cash-register/index.tsx

// 1. Import'lar
import { PageHeader } from '@/components/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import * as Haptics from 'expo-haptics'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring
} from 'react-native-reanimated'

// 2. Container Yapısı
container: { flex: 1, backgroundColor: DashboardColors.primary }
content: { flex: 1, backgroundColor: DashboardColors.background }

// 3. PageHeader Kullanımı
<PageHeader
  title="Modül Adı"
  icon="wallet-outline"           // Ionicons ismi
  subtitle={`${count} kayıt`}     // Opsiyonel
  rightAction={{
    icon: 'add',
    onPress: handleNewPress
  }}
  // Birden fazla aksiyon için:
  rightActions={[
    { icon: 'add', onPress: handleNew },
    { icon: 'filter-outline', onPress: handleFilter }
  ]}
/>

// 4. Filter Chips (Content içinde, header'dan AYRI)
<ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={styles.filterContainer}
>
  {FILTERS.map((filter) => (
    <TouchableOpacity
      key={filter.id}
      style={[styles.filterChip, isActive && styles.filterChipActive]}
      onPress={() => handleFilterPress(filter.id)}
    >
      <Ionicons name={filter.icon} size={16} color={...} />
      <Text style={styles.filterLabel}>{filter.label}</Text>
    </TouchableOpacity>
  ))}
</ScrollView>

// 5. Özel Card Component (Animasyonlu)
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

function ItemCard({ item, onPress }: Props) {
  const scale = useSharedValue(1)

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }))

  const handlePressIn = () => {
    scale.value = withSpring(0.98, DashboardAnimations.springBouncy)
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, DashboardAnimations.springBouncy)
  }

  return (
    <AnimatedPressable
      style={[styles.card, animStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {/* Card içeriği */}
    </AnimatedPressable>
  )
}

// 6. Skeleton Component
function ItemCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Skeleton width={48} height={48} borderRadius={12} />
        <View style={{ flex: 1, marginLeft: DashboardSpacing.sm }}>
          <Skeleton width={160} height={18} />
          <Skeleton width={80} height={14} style={{ marginTop: 4 }} />
        </View>
      </View>
    </View>
  )
}

// 7. FlatList ile Liste
{isLoading ? (
  <View style={styles.listContent}>
    <ItemCardSkeleton />
    <ItemCardSkeleton />
    <ItemCardSkeleton />
  </View>
) : (
  <FlatList
    data={items}
    keyExtractor={(item) => String(item.id)}
    renderItem={({ item }) => (
      <ItemCard item={item} onPress={() => handlePress(item)} />
    )}
    contentContainerStyle={styles.listContent}
    ListEmptyComponent={<EmptyState />}
    refreshControl={
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        tintColor={DashboardColors.primary}
      />
    }
    onEndReached={loadMore}
    onEndReachedThreshold={0.5}
    showsVerticalScrollIndicator={false}
  />
)}

// 8. Styles
filterContainer: {
  paddingHorizontal: DashboardSpacing.lg,
  paddingVertical: DashboardSpacing.md,
  gap: DashboardSpacing.sm
},
filterChip: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: DashboardSpacing.lg,
  paddingVertical: DashboardSpacing.sm,
  borderRadius: DashboardBorderRadius.full,
  backgroundColor: DashboardColors.surface,
  borderWidth: 1,
  borderColor: DashboardColors.borderLight,
  gap: DashboardSpacing.xs,
  marginRight: DashboardSpacing.sm
},
filterChipActive: {
  backgroundColor: DashboardColors.primary,
  borderColor: DashboardColors.primary
},
listContent: {
  paddingHorizontal: DashboardSpacing.lg,
  paddingBottom: DashboardSpacing.xl
},
card: {
  backgroundColor: DashboardColors.surface,
  borderRadius: DashboardBorderRadius.xl,
  padding: DashboardSpacing.lg,
  marginBottom: DashboardSpacing.md,
  ...DashboardShadows.md
}
```

**PageHeader vs FullScreenHeader Karşılaştırması:**
| Özellik | PageHeader (STANDART) | FullScreenHeader |
|---------|----------------------|------------------|
| Kullanım | Liste sayfaları | Tab sayfaları (opsiyonel) |
| Animasyonlu orb'lar | ✅ Var | ❌ Yok |
| Başlık konumu | Ortalanmış | Sol hizalı |
| İkon desteği | ✅ Başlık yanında | ❌ Yok |
| Tabs desteği | ❌ Yok (content'te filter chip) | ✅ Header içinde |
| Bottom curve | ✅ Var | ❌ Yok |

**Önemli Kurallar:**
- ✅ Liste sayfalarında **PageHeader** kullan
- ✅ Filtreler **content içinde** ayrı filter chip olarak
- ✅ Kendi **Card component**'i oluştur (animasyonlu)
- ✅ **Skeleton** component oluştur
- ✅ **Haptics** kullan (selectionAsync, impactAsync)
- ❌ FullScreenHeader'daki tabs özelliğini KULLANMA

### 12. BottomSheetModal Kullanımı (iOS Tarzı Modal)
```typescript
// ZORUNLU - Filtre, seçim ve aksiyonlar için iOS tarzı bottom sheet modal
// Referans: app/cash-register/index.tsx, app/(tabs)/loads.tsx

// 1. Import'lar
import { useRef, useMemo } from 'react'
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetView
} from '@gorhom/bottom-sheet'

// 2. Ref ve SnapPoints
const bottomSheetRef = useRef<BottomSheetModal>(null)
const snapPoints = useMemo(() => ['92%'], [])  // iOS tarzı: ekranın %92'si

// 3. Backdrop Component (component dışında tanımla)
const renderBackdrop = (props: BottomSheetBackdropProps) => (
  <BottomSheetBackdrop
    {...props}
    disappearsOnIndex={-1}
    appearsOnIndex={0}
    opacity={0.5}
  />
)

// 4. Modal Açma/Kapama
const handleOpenModal = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  bottomSheetRef.current?.present()
}

const handleCloseModal = () => {
  bottomSheetRef.current?.dismiss()
}

// 5. BottomSheetModal JSX
<BottomSheetModal
  ref={bottomSheetRef}
  snapPoints={snapPoints}
  backdropComponent={renderBackdrop}
  handleIndicatorStyle={styles.bottomSheetIndicator}
  backgroundStyle={styles.bottomSheetBackground}
  enablePanDownToClose={true}           // Handle'dan aşağı çekerek kapanır
  enableContentPanningGesture={false}   // İçerik scroll'u modal'ı etkilemez
  enableDynamicSizing={false}           // Sabit yükseklik
>
  <BottomSheetView style={styles.bottomSheetContent}>
    {/* Header */}
    <View style={styles.bottomSheetHeader}>
      <View style={styles.bottomSheetHeaderIcon}>
        <Ionicons name="funnel" size={20} color={DashboardColors.primary} />
      </View>
      <Text style={styles.bottomSheetTitle}>Modal Başlığı</Text>
      <TouchableOpacity
        onPress={handleCloseModal}
        style={styles.bottomSheetCloseButton}
      >
        <Ionicons name="close" size={24} color={DashboardColors.textSecondary} />
      </TouchableOpacity>
    </View>

    {/* Body */}
    <View style={styles.bottomSheetBody}>
      {/* Modal içeriği */}
    </View>
  </BottomSheetView>
</BottomSheetModal>

// 6. Styles
bottomSheetIndicator: {
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  width: 36,
  height: 5,
  borderRadius: 3
},
bottomSheetBackground: {
  backgroundColor: DashboardColors.surface,
  borderTopLeftRadius: 12,
  borderTopRightRadius: 12
},
bottomSheetContent: {
  flex: 1,
  paddingBottom: DashboardSpacing['3xl']
},
bottomSheetHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: DashboardSpacing.lg,
  borderBottomWidth: 1,
  borderBottomColor: DashboardColors.borderLight
},
bottomSheetHeaderIcon: {
  width: 40,
  height: 40,
  borderRadius: DashboardBorderRadius.lg,
  backgroundColor: DashboardColors.primaryGlow,
  alignItems: 'center',
  justifyContent: 'center'
},
bottomSheetTitle: {
  flex: 1,
  fontSize: DashboardFontSizes.xl,
  fontWeight: '700',
  color: DashboardColors.textPrimary,
  marginLeft: DashboardSpacing.md
},
bottomSheetCloseButton: {
  padding: DashboardSpacing.xs
},
bottomSheetBody: {
  padding: DashboardSpacing.lg,
  gap: DashboardSpacing.sm
}
```

**Önemli Prop'lar:**
| Prop | Değer | Açıklama |
|------|-------|----------|
| `snapPoints` | `['92%']` | iOS tarzı tam ekran modal |
| `enablePanDownToClose` | `true` | Handle'dan aşağı çekerek kapanır |
| `enableContentPanningGesture` | `false` | İçerik scroll'u modal'ı etkilemez |
| `enableDynamicSizing` | `false` | Sabit yükseklik, dinamik boyut kapalı |

**Kullanım Senaryoları:**
- ✅ Filtre seçimi (döviz, tarih, durum vb.)
- ✅ Aksiyon menüsü (düzenle, sil, paylaş vb.)
- ✅ Detaylı seçim listeleri
- ✅ Form içi yardımcı modallar

**React Native Modal KULLANMA:**
```typescript
// ❌ YASAK - React Native Modal
import { Modal } from 'react-native'
<Modal visible={visible} animationType="slide">

// ✅ ZORUNLU - BottomSheetModal
import { BottomSheetModal } from '@gorhom/bottom-sheet'
<BottomSheetModal ref={ref} snapPoints={snapPoints}>
```

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
