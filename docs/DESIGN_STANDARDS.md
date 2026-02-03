# Loggerise Mobile - Tasarım Standartları

## Dashboard & Screen Layout Standardı

Tüm dashboard ve içerik ekranlarında tutarlı bir tasarım dili kullanılmalıdır.

### ✅ Tasarım Kuralları

#### 1. **Container (Ana Wrapper)**
```tsx
<View style={styles.container}>
  <FullScreenHeader ... />
  <ScrollView style={styles.content} ... >
    {/* İçerik */}
  </ScrollView>
</View>
```

**Style:**
```typescript
container: {
  flex: 1,
  backgroundColor: Brand.primary, // Solid yeşil - gradient YOK
},
```

#### 2. **Content Area (İçerik Alanı)**
```tsx
<ScrollView style={styles.content} ... >
  {/* İçerik */}
</ScrollView>
```

**Style:**
```typescript
content: {
  flex: 1,
  backgroundColor: '#FFFFFF',
  borderTopLeftRadius: 32,
  borderTopRightRadius: 32,
  ...Shadows.lg,
},
```

#### 3. **Header**
- `FullScreenHeader` component kullanılmalı
- Header rengi ve yüksekliği değiştirilmemeli
- Header'ın altındaki yeşil zemin devam etmeli

### 📦 Gerekli Import'lar

```typescript
import { Brand, BorderRadius, Shadows } from '@/constants/theme';
```

### 🎨 Görsel Özellikler

1. **Background**: Solid `Brand.primary` (yeşil)
   - ❌ LinearGradient kullanma
   - ✅ Düz renk kullan

2. **İçerik Kartı**: Beyaz (#FFFFFF)
   - Üst köşeler yuvarlatılmış: `borderTopLeftRadius: 32, borderTopRightRadius: 32`
   - Gölge efekti: `...Shadows.lg`

3. **Renk Tutarlılığı**:
   - Header'ın yeşili ile container background'u aynı olmalı
   - Renk geçişi olmamalı

### 📝 Örnek Uygulama

```tsx
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { FullScreenHeader } from '@/components/header';
import { Brand, BorderRadius, Shadows } from '@/constants/theme';

export default function ExampleScreen() {
  return (
    <View style={styles.container}>
      <FullScreenHeader
        title="Sayfa Başlığı"
        subtitle="Alt başlık (opsiyonel)"
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Sayfa içeriği buraya */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.primary,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    ...Shadows.lg,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
});
```

### ⚠️ Yapılmaması Gerekenler

1. ❌ LinearGradient kullanmayın
2. ❌ Container'da farklı background rengi kullanmayın
3. ❌ Border radius'u değiştirmeyin (32px sabit)
4. ❌ Header component'ini custom header ile değiştirmeyin

### ✅ Uygulanan Ekranlar

- Dashboard (index.tsx)
- Yükler (loads.tsx)
- Mesajlar (messages.tsx)
- Profil (profile.tsx)
- Kişiler (contacts.tsx)
- Pozisyonlar (positions.tsx)
- Daha Fazla (more.tsx)

### 🎯 Sonuç

Bu standart sayesinde:
- Tutarlı görsel deneyim
- Modern ve profesyonel görünüm
- Auth sayfalarıyla uyumlu tasarım
- Daha iyi kullanıcı deneyimi

---

## Bottom Sheet Modal Standardı

Uygulama genelinde tutarlı modal deneyimi için bottom sheet kullanımı standardize edilmiştir.

### ⚠️ KRİTİK: Provider Kullanımı

**ÖNEMLI:** `GestureHandlerRootView` ve `BottomSheetModalProvider` zaten `app/_layout.tsx`'te TÜM UYGULAMA için tanımlıdır!

```tsx
// app/_layout.tsx - ZATEN TANIMLI
<GestureHandlerRootView style={{ flex: 1 }}>
  <BottomSheetModalProvider>
    {/* Tüm uygulama */}
  </BottomSheetModalProvider>
</GestureHandlerRootView>
```

**❌ YAPILMAMALIDIR:**
```tsx
// ❌ YANLIŞ - Duplicate provider eklemek
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

export default function MyScreen() {
  return (
    <GestureHandlerRootView>  {/* ❌ DUPLICATE */}
      <BottomSheetModalProvider>  {/* ❌ DUPLICATE */}
        <View>...</View>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
```

**✅ DOĞRU KULLANIM:**
```tsx
// ✅ DOĞRU - Provider'lar zaten _layout.tsx'te var
export default function MyScreen() {
  return (
    <View style={styles.container}>
      {/* İçerik */}

      {/* Modal'lar direkt buraya */}
      <MyModal ref={modalRef} />
    </View>
  );
}
```

**Sorunlar:**
- Duplicate provider'lar modal gesture'larını bozar
- Scroll sırasında istenmeyen davranışlara neden olur
- Modal'ın beklenmedik şekilde kapanmasına sebep olur

### 🎨 Modal Tasarım Prensibleri

#### 1. **Base Component: CustomBottomSheet**

Tüm bottom sheet modalleri için `CustomBottomSheet` component'i kullanılmalıdır.

**Özellikler:**
- `@gorhom/bottom-sheet` kütüphanesi üzerine kurulu
- iOS-tarzı smooth spring animasyonları
- Yuvarlatılmış köşeler (BorderRadius.xl - 16px)
- Swipe indicator handle (40x4px, #D1D5DB)
- Swipe down to dismiss
- Backdrop ile tap-outside-to-close
- Dimmed backdrop (0.5 opacity)

**Temel Yapı:**
```tsx
import CustomBottomSheet from '@/components/modals/CustomBottomSheet';
import { BottomSheetModal } from '@gorhom/bottom-sheet';

const modalRef = useRef<BottomSheetModal>(null);

<CustomBottomSheet
  ref={modalRef}
  snapPoints={['32%']}
  onDismiss={handleDismiss}
>
  {/* Modal içeriği */}
</CustomBottomSheet>
```

#### 2. **Snap Points (Modal Yüksekliği) - KRİTİK**

Modal yükseklikleri içeriğe göre belirlenmelidir. **ÖNEMLI:** Snap point sayısı modal davranışını doğrudan etkiler!

##### **Tek Snap Point (Sabit Modal - ÖNERİLEN)**

✅ **Kullanım Senaryoları:**
- Form modal'ları (Adres, Yetkili, vb.)
- Searchable select modal'lar
- Scroll içeriği olan modal'lar

✅ **Avantajları:**
- Modal sabit yükseklikte kalır
- Yukarı/aşağı sürüklenemez
- Scroll yaparken kazara kapanmaz
- Daha kontrollü kullanıcı deneyimi

```tsx
// ✅ DOĞRU - Tek snap point (sabit yükseklik)
const snapPoints = useMemo(() => ['90%'], []);

<BottomSheetModal
  ref={bottomSheetRef}
  index={0}
  snapPoints={snapPoints}
  enablePanDownToClose={true}           // Handle'dan aşağı sürükle = Kapat
  enableContentPanningGesture={false}   // İçerik scroll eder, modal hareket etmez
  enableDynamicSizing={false}
  animateOnMount={true}
/>
```

##### **Çoklu Snap Point (Ayarlanabilir Modal)**

⚠️ **Kullanım Senaryoları:**
- Liste modal'ları (sadece liste görünümü için)
- Kullanıcının modal boyutunu değiştirmesini istediğiniz durumlar

⚠️ **Dikkat Edilmesi Gerekenler:**
- Scroll içeriği olan form'larda kullanılmamalı
- Scroll yaparken modal istemeden snap point'ler arasında hareket edebilir
- Kazara kapanma riski yüksek

```tsx
// ⚠️ SADECE LİSTE MODAL'LARI İÇİN
const snapPoints = useMemo(() => ['50%', '75%', '90%'], []);

<BottomSheetModal
  ref={bottomSheetRef}
  index={1}                           // Başlangıçta index 1 (%75)
  snapPoints={snapPoints}
  enablePanDownToClose={true}
  animateOnMount={true}
/>
```

##### **Snap Point Yükseklikleri**

- **Success State:** `['30%']` - Başarı mesajı için
- **Küçük Form (1-2 input):** `['40%']` - Tek snap point
- **Orta Form (3-5 input):** `['60%']` - Tek snap point
- **Büyük Form (6+ input, scroll):** `['85%']` - Tek snap point (ÖNERİLEN)
- **Full Screen Modal:** `['90%']` - Searchable select için
- **Liste Modal (adjustable):** `['50%', '75%', '90%']` + `index={1}`

**❌ YAPILMAMALIDIR:**
```tsx
// ❌ YANLIŞ - Form modal'ında çift snap point
const snapPoints = useMemo(() => ['75%', '90%'], []);  // İki yükseklik = Sürüklenebilir
// Bu, scroll yaparken modal'ın istemeden hareket etmesine neden olur!
```

**✅ DOĞRU KULLANIM:**
```tsx
// ✅ DOĞRU - Form modal'ında tek snap point
const snapPoints = useMemo(() => ['90%'], []); // Tek yükseklik = Sabit

// Success state için farklı snap point
const snapPoints = useMemo(() => (isSuccess ? ['30%'] : ['85%']), [isSuccess]);
```

##### **Gesture Props - KRİTİK AYARLAR**

Bottom sheet gesture davranışını kontrol eden props:

**1. `enablePanDownToClose`**
- **Varsayılan:** `false`
- **Önerilen:** `true`
- **İşlevi:** Handle'dan aşağı sürükleyerek modal'ı kapatma
- **Kullanım:** Tüm modal'larda `true` olmalı

```tsx
enablePanDownToClose={true}  // ✅ Handle'dan aşağı sürükle = Modal kapanır
```

**2. `enableContentPanningGesture`**
- **Varsayılan:** `true`
- **Önerilen:** `false` (scroll içeriği olan modal'lar için)
- **İşlevi:** İçerik scroll ederken modal'ın hareket edip etmemesi
- **Kullanım:** Form ve liste modal'larında `false` olmalı

```tsx
enableContentPanningGesture={false}  // ✅ Scroll yaparken modal hareket etmez
```

⚠️ **SORUN:** `enableContentPanningGesture={true}` olduğunda:
- Scroll yaparken modal istemeden hareket eder
- Kullanıcı scroll yaparken kazara modal'ı kapatabilir
- Çift snap point varsa snap point'ler arasında istenmeyen geçişler olur

**3. `enableHandlePanningGesture`**
- **Varsayılan:** `true`
- **Önerilen:** Tanımlanmasın (default değer kullanılsın)
- **İşlevi:** Handle'dan sürükleme gesture'ı
- **Kullanım:** Tek snap point'li modal'larda tanımlanmamalı

```tsx
// ✅ DOĞRU - enableHandlePanningGesture tanımlanmamış (default: true)
<BottomSheetModal
  enablePanDownToClose={true}
  enableContentPanningGesture={false}
  // enableHandlePanningGesture tanımlanmadı
/>
```

⚠️ **UYARI:** `enableHandlePanningGesture={false}` olursa:
- Handle'dan modal AŞAĞI sürüklenemez
- `enablePanDownToClose={true}` bile olsa kapatılamaz
- Sadece backdrop'a tıklayarak kapatılabilir

**4. `enableDynamicSizing`**
- **Varsayılan:** `false`
- **Önerilen:** `false` (sabit snap point'ler için)
- **İşlevi:** Modal'ın içeriğe göre boyutlanması
- **Kullanım:** Sabit snap point kullanıyorsak `false` olmalı

```tsx
enableDynamicSizing={false}  // ✅ Sabit snap point kullan
```

##### **Tam Yapılandırma Örnekleri**

**Form Modal (Sabit, Scroll İçerikli):**
```tsx
const snapPoints = useMemo(() => ['90%'], []);

<BottomSheetModal
  ref={bottomSheetRef}
  index={0}
  snapPoints={snapPoints}
  enablePanDownToClose={true}           // ✅ Handle'dan kapat
  enableContentPanningGesture={false}   // ✅ Scroll yaparken hareket etme
  enableDynamicSizing={false}           // ✅ Sabit yükseklik
  animateOnMount={true}
  animationConfigs={animationConfigs}
  backdropComponent={renderBackdrop}
  backgroundStyle={styles.background}
  handleIndicatorStyle={styles.handleIndicator}
  keyboardBehavior="interactive"
  keyboardBlurBehavior="restore"
  android_keyboardInputMode="adjustResize"
  onDismiss={handleDismiss}
>
  <BottomSheetScrollView>
    {/* Form içeriği */}
  </BottomSheetScrollView>
</BottomSheetModal>
```

**Searchable Select Modal (Full Screen):**
```tsx
const snapPoints = useMemo(() => ['90%'], []);

<BottomSheetModal
  ref={bottomSheetRef}
  index={0}
  snapPoints={snapPoints}
  enablePanDownToClose={true}           // ✅ Handle'dan kapat
  enableContentPanningGesture={false}   // ✅ Liste scroll ederken hareket etme
  enableDynamicSizing={false}           // ✅ Sabit %90
  animateOnMount={true}
  animationConfigs={animationConfigs}
  backdropComponent={renderBackdrop}
  keyboardBehavior="interactive"
  keyboardBlurBehavior="restore"
  android_keyboardInputMode="adjustResize"
>
  <BottomSheetFlatList
    data={options}
    renderItem={renderItem}
  />
</BottomSheetModal>
```

**Context7 Best Practices:**
- ✅ **Tek snap point kullanın** - Form ve scroll içeriği için
- ✅ **`enableContentPanningGesture={false}`** - Scroll sırasında istenmeyen hareket engellenir
- ✅ **`enablePanDownToClose={true}`** - Handle'dan kapatma her zaman aktif
- ❌ **`enableHandlePanningGesture={false}` kullanmayın** - Handle'dan kapatma çalışmaz
- ⚠️ **`index` prop'u kritik!** Modal açıldığında hangi snap point'e gideceğini belirler
- ✅ **`animateOnMount={true}`** - Smooth açılış animasyonu
- ✅ **`enableDynamicSizing={false}`** - Sabit snap point için zorunlu

#### 3. **Modal Ref Pattern**

Her modal component, parent'a `present` ve `dismiss` metotlarını expose etmelidir:

```tsx
export interface YourModalRef {
  present: () => void;
  dismiss: () => void;
}

const YourModal = forwardRef<YourModalRef>((props, ref) => {
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  useImperativeHandle(ref, () => ({
    present: () => bottomSheetRef.current?.present(),
    dismiss: () => bottomSheetRef.current?.dismiss(),
  }));

  return <CustomBottomSheet ref={bottomSheetRef}>...</CustomBottomSheet>;
});
```

### 📋 Form Modal Standardı (ForgotPasswordModal Örneği)

#### **Layout Kuralları**

```tsx
const styles = StyleSheet.create({
  formContainer: {
    paddingHorizontal: Spacing['2xl'],  // 32px
    paddingTop: 0,                       // Handle area yeterli
    paddingBottom: Spacing.lg,           // 16px
  },
  title: {
    ...Typography.headingMD,
    textAlign: 'center',
    marginBottom: Spacing.xs,            // 8px
  },
  subtitle: {
    ...Typography.bodySM,
    textAlign: 'center',
    marginBottom: Spacing.md,            // 12px
    color: colors.textSecondary,
  },
  inputContainer: {
    marginBottom: Spacing.md,            // 12px
  },
});
```

#### **Button Standardı**

```tsx
<TouchableOpacity
  style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
  onPress={handleSubmit}
  disabled={isLoading}
>
  <LinearGradient
    colors={[Brand.primary, Brand.primaryLight]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={styles.sendButtonGradient}
  >
    <Text style={styles.sendButtonText}>
      {isLoading ? 'Gönderiliyor...' : 'Buton Metni'}
    </Text>
  </LinearGradient>
</TouchableOpacity>

const styles = StyleSheet.create({
  sendButton: {
    width: '100%',
    height: 44,                          // Modal içi butonlar 44px
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

### ✅ Success State Standardı

Modal içinde işlem başarılı olduğunda gösterilecek success state:

```tsx
<View style={styles.successContainer}>
  <View style={[styles.successIcon, { backgroundColor: colors.successLight }]}>
    <CheckCircle size={28} color={colors.success} />
  </View>
  <Text style={[styles.successTitle, { color: colors.text }]}>
    İşlem Başarılı!
  </Text>
  <Text style={[styles.successText, { color: colors.textSecondary }]}>
    Açıklama metni burada yer alır.
  </Text>
</View>

const styles = StyleSheet.create({
  successContainer: {
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  successIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  successTitle: {
    ...Typography.headingMD,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  successText: {
    ...Typography.bodySM,
    textAlign: 'center',
    lineHeight: 18,
  },
});
```

### 🔄 State Management

Modal state yönetimi için önerilen pattern:

```tsx
const [email, setEmail] = useState('');
const [error, setError] = useState('');
const [isSent, setIsSent] = useState(false);

// Modal kapanınca state'i temizle
const handleDismiss = () => {
  setTimeout(() => {
    setEmail('');
    setError('');
    setIsSent(false);
  }, 200); // Modal dismiss animasyonu tamamlansın
};

// Success state'de otomatik kapat (opsiyonel)
useEffect(() => {
  if (isSent) {
    const timer = setTimeout(() => {
      bottomSheetRef.current?.dismiss();
    }, 3000);
    return () => clearTimeout(timer);
  }
}, [isSent]);
```

### 🎯 Gerekli Import'lar

```tsx
import React, { useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import CustomBottomSheet from '@/components/modals/CustomBottomSheet';
import { Input } from '@/components/ui';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
```

### 📱 Kullanım Örneği

Login sayfasında modal'ı kullanma:

```tsx
import ForgotPasswordModal, { ForgotPasswordModalRef } from '@/components/modals/ForgotPasswordModal';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

export default function LoginScreen() {
  const forgotPasswordModalRef = useRef<ForgotPasswordModalRef>(null);

  return (
    <GestureHandlerRootView style={styles.container}>
      <BottomSheetModalProvider>
        {/* Sayfa içeriği */}

        <TouchableOpacity onPress={() => forgotPasswordModalRef.current?.present()}>
          <Text>Şifremi unuttum?</Text>
        </TouchableOpacity>

        {/* Modal */}
        <ForgotPasswordModal ref={forgotPasswordModalRef} />
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
```

### 🔧 Sorun Giderme (Troubleshooting)

#### **Sorun 1: Modal scroll yaparken kapanıyor veya hareket ediyor**

**Neden:**
- `enableContentPanningGesture={true}` (default)
- Çift snap point kullanımı

**Çözüm:**
```tsx
// ✅ Bu değişiklikleri yap
const snapPoints = useMemo(() => ['90%'], []);  // Tek snap point

<BottomSheetModal
  snapPoints={snapPoints}
  enableContentPanningGesture={false}  // EKLE
/>
```

#### **Sorun 2: Handle'dan modal aşağı sürüklenemiyor**

**Neden:**
- `enableHandlePanningGesture={false}` yanlışlıkla eklenmiş

**Çözüm:**
```tsx
// ✅ Bu prop'u KALDIR
<BottomSheetModal
  enablePanDownToClose={true}
  // enableHandlePanningGesture={false}  ← BUNU SİL
/>
```

#### **Sorun 3: Modal açıldığında çok küçük açılıyor**

**Neden:**
- `index={0}` ve ilk snap point çok küçük
- Örnek: `snapPoints={['30%', '90%']}` + `index={0}` → %30'da açılır

**Çözüm:**
```tsx
// ✅ Seçenek 1: index değiştir
<BottomSheetModal
  index={1}  // İkinci snap point'e aç
  snapPoints={['30%', '90%']}
/>

// ✅ Seçenek 2: Tek snap point kullan (ÖNERİLEN)
const snapPoints = useMemo(() => ['90%'], []);
<BottomSheetModal
  index={0}
  snapPoints={snapPoints}
/>
```

#### **Sorun 4: Duplicate provider hatası veya modal garip davranıyor**

**Neden:**
- `GestureHandlerRootView` ve `BottomSheetModalProvider` sayfa içinde tekrar kullanılmış
- Bu provider'lar zaten `app/_layout.tsx`'te tanımlı

**Çözüm:**
```tsx
// ❌ BUNLARI SİL
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

export default function MyScreen() {
  return (
    // ❌ BUNLARI SİL
    // <GestureHandlerRootView>
    //   <BottomSheetModalProvider>
          <View style={styles.container}>
            {/* İçerik */}
            <MyModal ref={modalRef} />
          </View>
    //   </BottomSheetModalProvider>
    // </GestureHandlerRootView>
  );
}
```

#### **Sorun 5: Modal çok yukarı/aşağı hareket ediyor (snap point'ler arası)**

**Neden:**
- Birden fazla snap point kullanımı
- Örnek: `['75%', '90%']` → Kullanıcı modal'ı yukarı/aşağı çekebiliyor

**Çözüm:**
```tsx
// ✅ Tek snap point kullan
const snapPoints = useMemo(() => ['90%'], []);  // Sadece bir yükseklik
```

### ⚠️ Önemli Notlar

1. **Root Provider:** `GestureHandlerRootView` ve `BottomSheetModalProvider` **ZATEN `app/_layout.tsx`'TE VAR** - Sayfalara EKLEME!
2. **Snap Points:** Form modal'ları için **TEK snap point** kullan - Çift snap point scroll sorunlarına neden olur
3. **Keyboard Handling:** Input içeren modallerde keyboard otomatik handle edilir
4. **State Cleanup:** Modal kapanırken state'i temizlemeyi unutma
5. **Loading State:** Butonlarda loading state göster ve disabled yap
6. **Validation:** Form validation error'ları Input component'inin `error` prop'u ile göster
7. **Animation:** CustomBottomSheet spring animation kullanır, özel animation gerekmez
8. **Gesture Props:** `enableContentPanningGesture={false}` ZORUNLU - Scroll sorunlarını önler
9. **Handle Panning:** `enableHandlePanningGesture` prop'unu KULLANMA - Default değer yeterli

### 📦 Full Screen Searchable Select Modal Standardı (SearchableSelect)

Müşteri seçimi gibi arama + seçim işlemleri için full screen modal kullanılmalıdır:

```tsx
import {
  BottomSheetModal,
  BottomSheetFlatList,
  BottomSheetBackdrop,
  BottomSheetTextInput,
  useBottomSheetSpringConfigs,
} from '@gorhom/bottom-sheet';

const SearchableSelect = () => {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  
  // Tek snap point - direkt %90'da açılır
  const snapPoints = useMemo(() => ['90%'], []);

  // iOS-like spring animation
  const animationConfigs = useBottomSheetSpringConfigs({
    damping: 80,
    overshootClamping: true,
    restDisplacementThreshold: 0.1,
    restSpeedThreshold: 0.1,
    stiffness: 500,
  });

  // Backdrop - arka plana tıklayınca kapatır
  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose={true}        // Tepedeki çizgiden sürükleyerek kapat
      enableContentPanningGesture={false} // Liste scroll ederken kapanmaz
      enableDynamicSizing={false}         // Sabit %90 yüksekliği
      animateOnMount={true}
      animationConfigs={animationConfigs}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handleIndicator}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Müşteri Seç</Text>
        <Text style={styles.subtitle}>{options.length} sonuç</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Search size={20} color={colors.icon} />
        <BottomSheetTextInput
          style={styles.searchInput}
          placeholder="Ara..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* List */}
      <BottomSheetFlatList
        data={options}
        renderItem={renderOptionItem}
        keyExtractor={(item) => String(item.value)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  handleIndicator: {
    backgroundColor: '#9CA3AF',  // Daha belirgin
    width: 48,                   // Daha geniş
    height: 5,                   // Daha kalın
    borderRadius: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.lg,      // Daha fazla üst boşluk
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
  },
  searchInput: {
    flex: 1,
    ...Typography.bodyMD,
    paddingVertical: Spacing.xs,
    color: Colors.light.text,
  },
  listContent: {
    paddingBottom: Spacing['2xl'],
  },
});
```

**Önemli Noktalar:**
- ✅ `snapPoints={['90%']}` - Direkt ekranın %90'ında açılır
- ✅ `enableDynamicSizing={false}` - İçeriğe göre boyutlanmayı engeller
- ✅ `enablePanDownToClose={true}` - Tepedeki çizgiden sürükleyerek kapatma
- ✅ `enableContentPanningGesture={false}` - Liste scroll ederken kapanmayı engeller
- ✅ `pressBehavior="close"` - Arka plana tıklayınca kapatır
- ✅ `BottomSheetTextInput` - Klavye ile uyumlu input
- ✅ Belirgin handle indicator (48x5px, koyu gri)

### 📦 List Modal Standardı (LoadPickerModal Örneği)

Scrollable liste içeren modaller için `BottomSheetFlatList` kullanılmalıdır:

```tsx
import {
  BottomSheetModal,
  BottomSheetFlatList,
  BottomSheetBackdrop,
  useBottomSheetSpringConfigs,
} from '@gorhom/bottom-sheet';

const LoadPickerModal = forwardRef<LoadPickerModalRef, LoadPickerModalProps>(
  ({ loads, onSelectLoad, loadingLoadId }, ref) => {
    const bottomSheetRef = useRef<BottomSheetModal>(null);

    // Snap points: 50%-75%-90%, başlangıçta index 1 (%75) ile açılır
    const snapPoints = useMemo(() => ['50%', '75%', '90%'], []);

    // iOS-like spring animation
    const animationConfigs = useBottomSheetSpringConfigs({
      damping: 80,
      overshootClamping: true,
      restDisplacementThreshold: 0.1,
      restSpeedThreshold: 0.1,
      stiffness: 500,
    });

    // Custom backdrop
    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
          pressBehavior="close"
        />
      ),
      []
    );

    return (
      <BottomSheetModal
        ref={bottomSheetRef}
        index={1}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        animateOnMount={true}
        animationConfigs={animationConfigs}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.background}
        handleIndicatorStyle={styles.handleIndicator}
        onDismiss={handleDismiss}
      >
        <BottomSheetFlatList
          data={loads}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </BottomSheetModal>
    );
  }
);
```

**Önemli Noktalar:**
- ✅ `BottomSheetFlatList` doğrudan `BottomSheetModal`'ın child'ı olmalı
- ✅ `BottomSheetView` ile sarmalanmamalı
- ✅ Büyük listeler için snap points: `['75%', '90%']`
- ✅ Multiple selection için modal kapanmamalı (sadece X veya swipe down ile)
- ✅ Her seçimde toast göster ama modal açık kalsın

### 🔄 Multiple Selection Pattern

Birden fazla item seçimi için modal açık kalmalı:

```tsx
const handleSelectItem = async (item: Item) => {
  try {
    await onSelectItem(item);
    // Success toast göster
    success('Başarılı', 'Item eklendi.');
    // ❌ Modal'ı KAPAMA - kullanıcı daha fazla seçim yapabilir
    // setShowModal(false); // YANLIŞ
    fetchData(); // Data'yı güncelle
  } catch (err) {
    showError('Hata', err.message);
    throw err; // Modal error handling için
  }
};
```

Modal sadece kullanıcı X'e tıkladığında veya swipe down yaptığında kapanır.

### 📦 Referans Component'ler

#### Form Modal Örneği
`@/components/modals/ForgotPasswordModal.tsx`

Bu modal:
- ✅ Form ve success state yönetimi
- ✅ Email validation
- ✅ Loading states
- ✅ Auto-dismiss after success
- ✅ State cleanup on dismiss
- ✅ Proper ref exposure

#### Scroll Form Modal Örnekleri (GÜNCEL)
`@/components/contact/AddressFormSheet.tsx`
`@/components/contact/AuthorityFormSheet.tsx`

Bu modal'lar:
- ✅ **Tek snap point** (`['85%']`) - Sabit yükseklik
- ✅ **`enableContentPanningGesture={false}`** - Scroll sorunlarını önler
- ✅ **`enablePanDownToClose={true}`** - Handle'dan kapatma
- ✅ `BottomSheetScrollView` ile scroll içerik
- ✅ Success state için farklı snap point (`['30%']`)
- ✅ Form validation ve error handling
- ✅ State cleanup on dismiss

**Kritik Özellikler:**
```tsx
// Tek snap point - modal sabit kalır
const snapPoints = useMemo(() => (isSuccess ? ['30%'] : ['85%']), [isSuccess]);

<BottomSheetModal
  index={0}
  snapPoints={snapPoints}
  enablePanDownToClose={true}
  enableContentPanningGesture={false}  // ← KRİTİK
  enableDynamicSizing={false}
  // enableHandlePanningGesture TANIMLANMAMIŞ (default: true)
/>
```

#### Searchable Select Modal Örneği (GÜNCEL)
`@/components/modals/SearchableSelectModal.tsx`

Bu modal:
- ✅ **Tek snap point** (`['90%']`) - Full screen
- ✅ **`enableContentPanningGesture={false}`** - Liste scroll ederken modal hareket etmez
- ✅ `BottomSheetFlatList` ile scrollable options
- ✅ Arama fonksiyonu
- ✅ Empty state handling
- ✅ `BottomSheetTextInput` kullanımı

#### List Modal Örneği
`@/components/modals/LoadPickerModal.tsx`

Bu modal:
- ✅ BottomSheetFlatList ile scrollable list
- ✅ Multiple selection support
- ✅ Loading state per item
- ✅ Selected state visual feedback
- ✅ Empty state handling
- ✅ Modal açık kalma pattern

#### Kullanım Örneği (Fatura Sayfası)
`@/app/finance/invoices/new.tsx`

Bu sayfa:
- ✅ **PROVIDER YOK** (zaten `_layout.tsx`'te var)
- ✅ SearchableSelectModal kullanımı
- ✅ Birden fazla modal yönetimi
- ✅ Modal ref pattern

```tsx
export default function NewInvoiceScreen() {
  const currencyModalRef = useRef<SearchableSelectModalRef>(null);
  const contactModalRef = useRef<SearchableSelectModalRef>(null);

  return (
    <View style={styles.container}>  {/* ✅ Provider YOK */}
      <FullScreenHeader ... />
      <ScrollView>
        {/* Form içeriği */}
      </ScrollView>

      {/* Modal'lar ScrollView DIŞINDA */}
      <SearchableSelectModal
        ref={currencyModalRef}
        title="Para Birimi Seçin"
        options={currencyOptions}
        onSelect={handleCurrencySelect}
      />

      <SearchableSelectModal
        ref={contactModalRef}
        title="Cari Seçin"
        options={contactOptions}
        onSelect={handleContactSelect}
      />
    </View>
  );
}
```

#### Kullanım Örneği (Cari Detay)
`@/app/contact/[id].tsx`

Bu sayfa:
- ✅ **PROVIDER YOK** (duplicate provider hatası çözüldü)
- ✅ AddressFormSheet ve AuthorityFormSheet kullanımı
- ✅ Modal'lar ana View içinde, ScrollView dışında

```tsx
export default function ContactDetailScreen() {
  const addressSheetRef = useRef<AddressFormSheetRef>(null);
  const authoritySheetRef = useRef<AuthorityFormSheetRef>(null);

  return (
    <View style={styles.container}>  {/* ✅ Provider YOK */}
      <FullScreenHeader ... />
      <ScrollView>
        {/* Sayfa içeriği */}
      </ScrollView>

      {/* Modal'lar ScrollView DIŞINDA */}
      {contact && (
        <AddressFormSheet
          ref={addressSheetRef}
          contactId={contact.id}
          address={editingAddress}
          onSuccess={handleAddressSuccess}
        />
      )}

      {contact && (
        <AuthorityFormSheet
          ref={authoritySheetRef}
          contactId={contact.id}
          authority={editingAuthority}
          onSuccess={handleAuthoritySuccess}
        />
      )}
    </View>
  );
}
```

tüm best practice'leri içerir.

---

## Liste Sayfaları Standardı (CRUD Operations)

Tüm liste sayfalarında (Çekler, Senetler, Kasalar, vb.) tutarlı bir davranış ve kullanıcı deneyimi sağlanmalıdır.

### 🎯 Zorunlu Kurallar

#### 1. **Header Yapısı**

Header'da sağ üstte yeni kayıt ekleme butonu bulunmalıdır:

```tsx
import { router, useFocusEffect } from 'expo-router';
import { Plus } from 'lucide-react-native';

<FullScreenHeader
  title="Sayfa Başlığı"
  subtitle={pagination ? `${pagination.total} kayıt` : undefined}
  tabs={headerTabs} // Status filtreleri (opsiyonel)
  rightIcons={
    <TouchableOpacity
      onPress={() => router.push('/module/new')}
      activeOpacity={0.7}
    >
      <Plus size={22} color="#FFFFFF" />
    </TouchableOpacity>
  }
/>
```

**Önemli:**
- ✅ `rightIcons` prop'u kullanılmalı (rightActions DEĞİL)
- ✅ TouchableOpacity ile sarmalanmalı
- ✅ Plus icon beyaz renkte (#FFFFFF)
- ✅ Icon boyutu 22px

#### 2. **Silme İşlemi Standardı**

Silme işlemi anında tamamlanmalı, kullanıcı toast mesajını beklemeden listeye dönmelidir:

```tsx
const handleConfirmDelete = async () => {
  if (!id) return;
  setIsDeleting(true);
  try {
    await deleteItem(parseInt(id, 10));

    // ✅ Success toast göster
    success('Başarılı', 'Kayıt silindi.');

    // ✅ ANINDA geri dön - setTimeout KULLANMA
    router.back();

  } catch (err) {
    showError('Hata', err instanceof Error ? err.message : 'Kayıt silinemedi.');
    // ❌ Hata durumunda state'leri temizle
    setIsDeleting(false);
    setShowDeleteConfirm(false);
  }
  // ❌ finally bloğunda state temizleme - başarı durumunda modal zaten kapanmış olacak
};
```

**Önemli:**
- ✅ Toast mesajı göster
- ✅ `router.back()` HEMEN çağrılmalı
- ❌ `setTimeout(() => router.back(), 1500)` KULLANMA
- ❌ Toast'in kapanmasını BEKLEME

#### 3. **Kaydetme İşlemi Standardı**

Oluşturma ve güncelleme işlemlerinde de aynı prensip geçerlidir:

```tsx
const handleSubmit = async () => {
  if (!validateForm()) return;

  setIsSubmitting(true);
  try {
    await createItem(formData);
    // veya
    await updateItem(parseInt(id, 10), formData);

    // ✅ Success toast göster
    success('Başarılı', 'Kayıt kaydedildi.');

    // ✅ ANINDA geri dön
    router.back();

  } catch (error: any) {
    const validationErrors = getValidationErrors(error);
    if (validationErrors) {
      // Validation hatalarını göster
      setErrors(flattenErrors(validationErrors));
    } else {
      showError('Hata', getErrorMessage(error));
    }
  } finally {
    setIsSubmitting(false);
  }
};
```

#### 4. **Liste Otomatik Güncelleme (useFocusEffect)**

Liste sayfası, detail/edit sayfalarından dönüldüğünde otomatik olarak güncellenmelidir:

```tsx
import { router, useFocusEffect } from 'expo-router';

export default function ListScreen() {
  const [items, setItems] = useState([]);
  const hasInitialFetchRef = useRef(false);

  // ... diğer state ve fetch logic

  // ✅ Screen focus olduğunda liste yenile
  useFocusEffect(
    useCallback(() => {
      if (hasInitialFetchRef.current) {
        executeFetch(searchQuery, activeFilter, 1, false);
      }
    }, [searchQuery, activeFilter, executeFetch])
  );

  // ... rest of component
}
```

**Önemli:**
- ✅ `useFocusEffect` hook'u kullanılmalı
- ✅ `hasInitialFetchRef.current` kontrolü ile ilk mount'ta çift fetch engellensin
- ✅ Mevcut search ve filter parametreleri korunmalı
- ✅ Dependencies array'e executeFetch dahil edilmeli

#### 5. **Liste Item Bileşeni (StandardListItem)**

Tüm liste sayfalarında tutarlı görünüm için `StandardListItem` component'i kullanılmalıdır:

```tsx
import { StandardListItem } from '@/components/ui';
import { FileText } from 'lucide-react-native';

const renderItem = (item: Item) => {
  return (
    <StandardListItem
      icon={FileText}
      iconColor={Brand.primary}
      title={item.number}
      subtitle={item.contact?.name || '-'}
      additionalInfo={
        <View style={styles.additionalInfo}>
          <Text style={styles.detailText}>
            {item.bank_name} • {formatDate(item.due_date, 'dd.MM.yyyy')}
          </Text>
        </View>
      }
      status={{
        label: getStatusLabel(item.status),
        variant: getStatusColor(item.status),
      }}
      footer={{
        left: (
          <Badge
            label={getTypeLabel(item.type)}
            variant={item.type === 'received' ? 'success' : 'info'}
            size="sm"
          />
        ),
        right: (
          <Text style={styles.amount}>
            {formatAmount(item.amount, item.currency_type)}
          </Text>
        ),
      }}
      onPress={() => router.push(`/module/${item.id}`)}
    />
  );
};
```

**Önemli:**
- ✅ `StandardListItem` component'i kullanılmalı
- ✅ Icon ve iconColor belirtilmeli
- ✅ Footer'da sol tarafta type badge, sağ tarafta amount gösterilmeli
- ✅ Status badge sağ üstte gösterilmeli
- ❌ Custom TouchableOpacity + Card yerine StandardListItem kullanılmalı

#### 6. **Badge Kullanımı**

Badge etiketleri kısa ve öz olmalıdır:

```tsx
// ✅ DOĞRU
export function getTypeLabel(type: Type): string {
  const labels: Record<Type, string> = {
    received: 'Alınan',
    issued: 'Verilen',
  };
  return labels[type] || type;
}

// ❌ YANLIŞ - Çok uzun
export function getTypeLabel(type: Type): string {
  const labels: Record<Type, string> = {
    received: 'Alınan Çek',
    issued: 'Verilen Çek',
  };
  return labels[type] || type;
}
```

**Badge Props:**
```tsx
<Badge
  label={label}
  variant="success"
  size="sm"
  numberOfLines={1}  // Otomatik eklenir
/>
```

### 📋 Header Action Buttons Örnekleri

#### Detail Screen (Edit + Delete)

```tsx
<FullScreenHeader
  title={item.number}
  showBackButton
  rightIcons={
    <View style={{ flexDirection: 'row', gap: Spacing.md }}>
      <TouchableOpacity
        onPress={() => router.push(`/module/${item.id}/edit`)}
        activeOpacity={0.7}
      >
        <Edit size={20} color="#FFFFFF" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={handleDelete}
        activeOpacity={0.7}
        disabled={isDeleting}
      >
        {isDeleting ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Trash2 size={20} color="#FFFFFF" />
        )}
      </TouchableOpacity>
    </View>
  }
/>
```

#### Edit/New Screen (Save)

```tsx
<FullScreenHeader
  title="Yeni Kayıt"
  subtitle="Form bilgilerini girin"
  rightIcons={
    <TouchableOpacity
      onPress={handleSubmit}
      activeOpacity={0.7}
      disabled={isSubmitting}
    >
      {isSubmitting ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <Save size={22} color="#FFFFFF" />
      )}
    </TouchableOpacity>
  }
/>
```

### ✅ Referans Component'ler

Bu standartları uygulayan örnek sayfalar:

#### Liste Sayfaları
- `@/app/check/index.tsx` - Çekler listesi
- `@/app/promissory-note/index.tsx` - Senetler listesi
- `@/app/cash-register/index.tsx` - Kasalar listesi

#### Detail Sayfaları
- `@/app/check/[id].tsx` - Çek detayı
- `@/app/promissory-note/[id].tsx` - Senet detayı

#### Form Sayfaları
- `@/app/check/new.tsx` - Yeni çek
- `@/app/check/[id]/edit.tsx` - Çek düzenle
- `@/app/promissory-note/new.tsx` - Yeni senet
- `@/app/promissory-note/[id]/edit.tsx` - Senet düzenle

### ⚠️ Yapılmaması Gerekenler

1. ❌ **setTimeout ile geri dönüş:** Toast'in kapanmasını beklemeyin
   ```tsx
   // YANLIŞ
   success('Başarılı', 'Kayıt silindi.');
   setTimeout(() => router.back(), 1500); // ❌

   // DOĞRU
   success('Başarılı', 'Kayıt silindi.');
   router.back(); // ✅
   ```

2. ❌ **rightActions kullanımı:** Bu prop mevcut değil
   ```tsx
   // YANLIŞ
   rightActions={[{ icon: <Plus />, onPress: () => {} }]} // ❌

   // DOĞRU
   rightIcons={<TouchableOpacity>...</TouchableOpacity>} // ✅
   ```

3. ❌ **useFocusEffect olmadan liste:** Geri dönüşte liste güncellenmiyor
   ```tsx
   // YANLIŞ - sadece useEffect kullanmak
   useEffect(() => {
     fetchData();
   }, []); // ❌ Geri dönüşte çalışmaz

   // DOĞRU
   useFocusEffect(
     useCallback(() => {
       if (hasInitialFetchRef.current) {
         fetchData();
       }
     }, [fetchData])
   ); // ✅
   ```

4. ❌ **Custom card rendering:** StandardListItem kullanılmalı
   ```tsx
   // YANLIŞ
   <TouchableOpacity style={styles.card}>
     <View>...</View>
   </TouchableOpacity> // ❌

   // DOĞRU
   <StandardListItem
     icon={FileText}
     title={item.title}
     ...
   /> // ✅
   ```

### 🎯 Kullanıcı Deneyimi Hedefi

Bu standartlar ile:
- ✅ Anında geri bildirim (toast + navigation)
- ✅ Liste her zaman güncel
- ✅ Tutarlı görünüm (StandardListItem)
- ✅ Beklemeden işlem tamamlanıyor
- ✅ Modern ve akıcı kullanım deneyimi

---

## Özet Kart (Summary Card) Standardı

Liste sayfalarında (Faturalar, Kasalar, vb.) üstte gösterilen özet kart için standart tasarım.

### 🎨 Tasarım Kuralları

#### 1. **Kart Konumlandırma**

`StandardListContainer` içinde kullanılan `ListHeaderComponent` olarak eklenmelidir:

```tsx
<StandardListContainer
  ...
  ListHeaderComponent={renderHeader()}
/>
```

**Önemli:** `StandardListContainer` zaten `padding: Spacing.lg` uyguladığı için, özet kartta **margin kullanılmamalıdır**:

```typescript
// ❌ YANLIŞ - Çift padding oluşur
summaryCard: {
  marginHorizontal: Spacing.lg, // BUNU KULLANMA
  ...
}

// ✅ DOĞRU - Container padding'i yeterli
summaryCard: {
  marginHorizontal: 0, // Sıfır margin
  marginBottom: Spacing.md,
  ...
}
```

#### 2. **Kart Yapısı**

```tsx
const renderHeader = () => {
  if (data.length === 0) return null;

  return (
    <View style={styles.summaryCard}>
      {/* Header */}
      <View style={styles.summaryHeader}>
        <View style={styles.summaryHeaderLeft}>
          <View style={styles.summaryIcon}>
            <TrendingUp size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.summaryTitle}>Özet Başlık</Text>
        </View>
        <View style={styles.summaryBadge}>
          <Text style={styles.summaryBadgeText}>{data.length} Kayıt</Text>
        </View>
      </View>

      {/* Toplam Tutar */}
      <View style={styles.summaryTotal}>
        <Text style={styles.summaryTotalLabel}>Toplam Tutar</Text>
        <Text style={styles.summaryTotalValue}>
          {formatBalance(total, currency)}
        </Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.summaryGrid}>
        <View style={[styles.summaryStat, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
          <View style={styles.summaryStatHeader}>
            <Wallet size={16} color="#10B981" />
            <Text style={[styles.summaryStatValue, { color: '#10B981' }]}>
              {formatBalance(paid, currency)}
            </Text>
          </View>
          <Text style={styles.summaryStatLabel}>Ödendi</Text>
        </View>

        <View style={[styles.summaryStat, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
          <View style={styles.summaryStatHeader}>
            <Clock size={16} color="#F59E0B" />
            <Text style={[styles.summaryStatValue, { color: '#F59E0B' }]}>
              {formatBalance(pending, currency)}
            </Text>
          </View>
          <Text style={styles.summaryStatLabel}>Bekliyor</Text>
        </View>
      </View>
    </View>
  );
};
```

#### 3. **Style Tanımları**

```typescript
const styles = StyleSheet.create({
  summaryCard: {
    marginHorizontal: 0,      // Sıfır - container padding'i yeterli
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: Brand.primary,
    ...Shadows.md,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  summaryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: {
    ...Typography.headingSM,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  summaryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  summaryBadgeText: {
    ...Typography.bodyXS,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  summaryTotal: {
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  summaryTotalLabel: {
    ...Typography.bodySM,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: Spacing.xs,
  },
  summaryTotalValue: {
    ...Typography.headingLG,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  summaryStat: {
    flex: 1,
    minWidth: '45%',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  summaryStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  summaryStatValue: {
    ...Typography.bodyMD,
    fontWeight: '700',
  },
  summaryStatLabel: {
    ...Typography.bodyXS,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
```

#### 4. **Para Formatı**

Para değerleri için `formatBalance` fonksiyonu kullanılmalıdır:

```tsx
import { formatBalance } from '@/services/endpoints/cash-registers';

// Kullanım
<Text>{formatBalance(amount, currency)}</Text>
// Çıktı: "12.500,50 ₺" veya "$12,500.50"
```

### 🎨 Renk Kodları

Stats kartları için transparan arka plan renkleri:

| Durum | Renk | Arka Plan |
|-------|------|-----------|
| Başarılı | `#10B981` | `rgba(16, 185, 129, 0.15)` |
| Beklemede | `#F59E0B` | `rgba(245, 158, 11, 0.15)` |
| Hata/Vade Geçti | `#EF4444` | `rgba(239, 68, 68, 0.15)` |
| Bilgi | `#3B82F6` | `rgba(59, 130, 246, 0.15)` |

### ✅ Referans Uygulamalar

Tekli Özet Kartı:
- `@/app/finance/invoices/index.tsx` - Fatura Özeti
- `@/app/check/index.tsx` - Çek Özeti
- `@/app/promissory-note/index.tsx` - Senet Özeti

---

## Çoklu Para Birimi Carousel Standardı

Birden fazla para birimi (TRY, USD, EUR, vb.) olan sayfalarda (Kasalar, Bankalar, vb.) kullanılan yatay kaydırılabilir özet kart yapısı.

### 🎯 Kullanım Senaryoları

- Birden fazla döviz cinsi olan listeler (Kasalar, Bankalar)
- Her para birimi için ayrı özet gösterimi
- Kullanıcıların kaydırarak farklı para birimlerini görüntülemesi

### 🎨 Tasarım Kuralları

#### 1. **Yapı**

```tsx
const [activeIndex, setActiveIndex] = useState(0);
const carouselRef = useRef<FlatList>(null);
const screenWidth = Dimensions.get('window').width;
const cardWidth = screenWidth - Spacing.lg * 2; // Container padding

const renderCarouselCard = ({ item }: { item: [string, number] }) => {
  const [currency, total] = item;
  
  return (
    <View style={[styles.carouselCard, { width: cardWidth }]}>
      {/* Header */}
      <View style={styles.carouselHeader}>
        <View style={styles.carouselHeaderLeft}>
          <View style={styles.carouselIcon}>
            <TrendingUp size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.carouselTitle}>{currency} Kasaları</Text>
        </View>
        <View style={styles.carouselBadge}>
          <Text style={styles.carouselBadgeText}>3 Kasa</Text>
        </View>
      </View>

      {/* Total Amount */}
      <View style={styles.carouselTotal}>
        <Text style={styles.carouselTotalLabel}>Toplam Bakiye</Text>
        <Text style={styles.carouselTotalValue}>
          {formatBalance(total, currency)}
        </Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.carouselGrid}>
        <View style={[styles.carouselStat, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
          <View style={styles.carouselStatHeader}>
            <Text style={[styles.carouselStatValue, { color: '#10B981' }]}>
              2
            </Text>
          </View>
          <Text style={styles.carouselStatLabel}>Pozitif</Text>
        </View>

        <View style={[styles.carouselStat, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
          <View style={styles.carouselStatHeader}>
            <Text style={[styles.carouselStatValue, { color: '#EF4444' }]}>
              1
            </Text>
          </View>
          <Text style={styles.carouselStatLabel}>Negatif</Text>
        </View>
      </View>
    </View>
  );
};

const renderPaginationDots = () => {
  const entries = Object.entries(totals);
  if (entries.length <= 1) return null;
  
  return (
    <View style={styles.paginationContainer}>
      {entries.map((_, index) => (
        <View
          key={index}
          style={[
            styles.paginationDot,
            index === activeIndex && styles.paginationDotActive,
          ]}
        />
      ))}
    </View>
  );
};

// Usage in renderHeader
<FlatList
  ref={carouselRef}
  data={Object.entries(totals)}
  renderItem={renderCarouselCard}
  keyExtractor={([currency]) => currency}
  horizontal
  pagingEnabled
  showsHorizontalScrollIndicator={false}
  snapToInterval={cardWidth + Spacing.md}
  decelerationRate="fast"
  onMomentumScrollEnd={(event) => {
    const index = Math.round(
      event.nativeEvent.contentOffset.x / (cardWidth + Spacing.md)
    );
    setActiveIndex(index);
  }}
/>
{renderPaginationDots()}
```

#### 2. **Style Tanımları**

```typescript
const styles = StyleSheet.create({
  carouselContent: {
    paddingHorizontal: 0,
    gap: Spacing.md,
  },
  carouselCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: Brand.primary,
    ...Shadows.md,
  },
  carouselHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  carouselHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  carouselIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselTitle: {
    ...Typography.headingSM,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  carouselBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  carouselBadgeText: {
    ...Typography.bodyXS,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  carouselTotal: {
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  carouselTotalLabel: {
    ...Typography.bodySM,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: Spacing.xs,
  },
  carouselTotalValue: {
    ...Typography.headingLG,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  carouselGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  carouselStat: {
    flex: 1,
    minWidth: '45%',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  carouselStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  carouselStatValue: {
    ...Typography.bodyLG,
    fontWeight: '700',
  },
  carouselStatLabel: {
    ...Typography.bodyXS,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  paginationDotActive: {
    backgroundColor: '#FFFFFF',
    width: 24,
    borderRadius: 4,
  },
});
```

#### 3. **Navigasyon - Kullanıcı Deneyimi**

Kullanıcıya carousel'in kaydırılabilir olduğunu açıkça göstermek için:

**A. Peek (Glimpse) Gösterimi**
Bir sonraki kartın bir kısmını göstererek kaydırılabilir olduğunu ima et:

```typescript
const cardWidth = screenWidth - Spacing.lg * 2 - 40; // 40px peek alanı
```

**B. Ok Butonları**
Sol/sağ ok butonları ile manuel navigasyon:

```tsx
<TouchableOpacity
  onPress={() => scrollToIndex(activeIndex - 1)}
  disabled={activeIndex === 0}
  style={styles.paginationArrow}
>
  <ChevronLeft size={20} color="#FFFFFF" />
</TouchableOpacity>
```

**C. Para Birimi Tab'leri**
Döviz cinslerinin isimleriyle tab navigasyonu:

```tsx
<View style={styles.currencyTabs}>
  {currencies.map(([currency], index) => (
    <TouchableOpacity
      key={currency}
      onPress={() => scrollToIndex(index)}
      style={[
        styles.currencyTab,
        index === activeIndex && styles.currencyTabActive,
      ]}
    >
      <Text style={index === activeIndex ? activeText : inactiveText}>
        {currency}
      </Text>
    </TouchableOpacity>
  ))}
</View>
```

**D. Tab (Badge) Stilleri**

Deaktif tab'lerin görünürlüğünü artırmak için:

```typescript
currencyTabs: {
  flexDirection: 'row',
  gap: Spacing.sm,
  borderRadius: BorderRadius.full,
  padding: Spacing.xs,
},
// Deaktif Tab - Belirgin border ve koyu arka plan
currencyTab: {
  paddingHorizontal: Spacing.md,
  paddingVertical: Spacing.xs,
  borderRadius: BorderRadius.full,
  borderWidth: 2,                              // Kalın border
  borderColor: 'rgba(255, 255, 255, 0.6)',    // Daha opak border
  backgroundColor: 'rgba(0, 0, 0, 0.15)',     // Hafif koyu arka plan
},
// Aktif Tab - Beyaz vurgu
currencyTabActive: {
  backgroundColor: '#FFFFFF',
  borderColor: '#FFFFFF',
  ...Shadows.sm,
},
// Deaktif Yazı - Kalın ve gölge ile
currencyTabText: {
  ...Typography.bodySM,
  color: '#FFFFFF',
  fontWeight: '700',                          // Daha kalın
  textShadowColor: 'rgba(0, 0, 0, 0.3)',     // Okunurluk için gölge
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 2,
},
// Aktif Yazı
currencyTabTextActive: {
  color: Brand.primary,
  textShadowColor: 'transparent',            // Aktifken gölge yok
},
```

**Görünürlük İpuçları:**
- ✅ Border kalınlığı: `2px` (ince borderlar kaybolur)
- ✅ Deaktif arka plan: `rgba(0,0,0,0.15)` (beyazdan daha belirgin)
- ✅ Border opaklığı: En az `0.6` (çok transparan olmamalı)
- ✅ Yazı gölgesi: Kontrastı artırır
- ✅ Font kalınlığı: `700` (bold)

**E. Ok (Navigation) Stilleri**
```typescript
paginationArrow: {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: 'rgba(255, 255, 255, 0.25)',
  borderWidth: 1.5,
  borderColor: 'rgba(255, 255, 255, 0.5)',
  alignItems: 'center',
  justifyContent: 'center',
},
paginationArrowDisabled: {
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  borderColor: 'rgba(255, 255, 255, 0.2)',
  opacity: 0.4,
},
```

#### 4. **Önemli Kurallar**

- ✅ Tek para birimi varsa carousel gösterilmez
- ✅ `pagingEnabled` ile kart kart kaydırma
- ✅ `snapToInterval` ile düzgün hizalama
- ✅ **Peek**: Bir sonraki kartın 40px'i görünür
- ✅ **Ok butonları**: Sol/sağ gezinme
- ✅ **Tab'ler**: Para birimlerine tıklayarak atlama
- ✅ Aktif tab: Beyaz arka plan, yeşil yazı

### ✅ Referans Uygulamalar

- `@/app/cash-register/index.tsx` - Kasa Carousel (TRY, USD, EUR, GBP)
- `@/app/bank/index.tsx` - Banka Hesapları Carousel

---

**Son Güncelleme:** 2026-01-27

### 🔄 Changelog

#### 2026-01-27 - Bottom Sheet Modal Standardı - KRİTİK GÜNCELLEME
- **KRİTİK:** Provider kullanımı net açıklandı - `app/_layout.tsx`'te zaten tanımlı
- **KRİTİK:** Duplicate provider sorunları ve çözümleri eklendi
- **KRİTİK:** Snap points detaylı açıklandı - Tek vs çoklu snap point kullanımı
- **KRİTİK:** `enableContentPanningGesture={false}` zorunlu hale getirildi
- **KRİTİK:** `enableHandlePanningGesture` kullanımı netleştirildi - Default değer yeterli
- Yeni: Sorun giderme (Troubleshooting) bölümü eklendi
- Yeni: 5 yaygın modal sorunu ve çözümleri
- Güncelleme: AddressFormSheet ve AuthorityFormSheet referans olarak eklendi
- Güncelleme: SearchableSelectModal güncel props ile güncellendi
- Güncelleme: Fatura ve Cari detay sayfaları örnek olarak eklendi
- Düzeltme: Tüm modal örnekleri tek snap point kullanımı ile güncellendi

#### 2026-01-27 - Sayfa Güncellemeleri
- Güncelleme: `bank/index.tsx` - Carousel yapısına geçirildi
- Güncelleme: `check/index.tsx` - Özet kart eklendi
- Güncelleme: `promissory-note/index.tsx` - Özet kart eklendi
- Düzeltme: `contact/[id].tsx` - Modal sorunları çözüldü (duplicate provider, snap points)

#### 2026-01-27 - Çoklu Para Birimi Carousel Standardı
- Yeni: Birden fazla döviz cinsi için yatay kaydırılabilir carousel yapısı
- Yeni: Ok butonları ve para birimi tab'leri ile navigasyon
- Yeni: `pagingEnabled` ve `snapToInterval` ile düzgün kart hizalama

#### 2026-01-27 - Özet Kart (Summary Card) Standardı
- Yeni: Liste sayfaları için yeşil özet kart tasarım standardı eklendi
- Yeni: `marginHorizontal: 0` kullanımı - container padding'i ile uyumlu genişlik
- Yeni: Para formatı için `formatBalance` fonksiyonu kullanımı
- Yeni: Transparan stats kartları renk kodları standardize edildi

#### 2026-01-27 - Full Screen Searchable Select Modal Standardı
- Yeni: Full screen searchable select modal pattern eklendi (`['90%']` snap point)
- Güncelleme: `enableDynamicSizing={false}` sabit snap point kullanımı için zorunlu
- Güncelleme: `enableContentPanningGesture={false}` liste scroll sırasında kapanmayı engeller
- Güncelleme: `pressBehavior="close"` arka plana tıklayınca kapatır
