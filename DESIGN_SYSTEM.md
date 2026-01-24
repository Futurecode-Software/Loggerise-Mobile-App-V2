# Design System - Loggerise Mobile

Bu dokümantasyon Loggerise Mobile uygulamasının tasarım sistemi kurallarını, renk paletini, component standartlarını ve kullanım ilkelerini içerir.

**Platform**: React Native (Expo)
**Tasarım Dili**: iOS Human Interface Guidelines & Material Design principles'ların birleşimi
**Son Güncelleme**: 2026-01-23

---

## 📚 İçindekiler

- [🎨 Renk Paleti](#-renk-paleti)
- [✍️ Tipografi Sistemi](#-tipografi-sistemi)
- [📏 Spacing ve Layout](#-spacing-ve-layout)
- [🎯 Component Standartları](#-component-standartları)
- [🖼️ Logo ve Branding](#-logo-ve-branding)
- [🔔 Bildirim ve Toast](#-bildirim-ve-toast)
- [🎭 Animation ve Transitions](#-animation-ve-transitions)
- [📱 Platform-Specific Patterns](#-platform-specific-patterns)
- [♿ Accessibility](#-accessibility)
- [🎨 Tasarım Prensipleri](#-tasarım-prensipleri)

---

## 🎨 Renk Paleti

### Brand Colors (Marka Renkleri)

Loggerise'in temel marka renkleri yeşil tonlarından oluşur ve web versiyonu ile tam uyumludur:

| Renk              | Hex Code  | Kullanım Alanı                              | Örnek Kod                |
| ----------------- | --------- | ------------------------------------------- | ------------------------ |
| **Primary**       | `#13452d` | Ana marka rengi, CTA butonları, header      | `Brand.primary`          |
| **Primary Light** | `#227d53` | Hover durumları, başarı mesajları           | `Brand.primaryLight`     |
| **Secondary**     | `#5fbd92` | İkincil aksiyonlar, link'ler                | `Brand.secondary`        |
| **Accent**        | `#b4f25a` | Vurgular, dikkat çekici elementler, badge'ler | `Brand.accent`           |

**Kullanım Örneği:**

```tsx
import { Brand } from '@/constants/theme';

<Button style={{ backgroundColor: Brand.primary }}>
  <Text style={{ color: '#FFFFFF' }}>Kaydet</Text>
</Button>
```

### Status Colors (Durum Renkleri)

Uygulama içindeki durum mesajları, bildirimler ve feedback'ler için standart renkler:

| Durum       | Hex Code  | Kullanım                          | Örnek Kod            |
| ----------- | --------- | --------------------------------- | -------------------- |
| **Success** | `#227d53` | Başarılı işlemler, onay mesajları | `Status.success`     |
| **Warning** | `#f5a623` | Uyarı mesajları                   | `Status.warning`     |
| **Danger**  | `#d0021b` | Hata mesajları, silme işlemleri   | `Status.danger`      |
| **Info**    | `#3b82f6` | Bilgilendirme mesajları           | `Status.info`        |

**⚠️ CRITICAL**: Success rengi primary light ile aynıdır (`#227d53`), bu marka tutarlılığı için kasıtlıdır.

### Neutral Colors (Nötr Renkler)

Text, background ve UI elementleri için nötr renk skalası:

| Element          | Hex Code  | Kullanım                              | Örnek Kod              |
| ---------------- | --------- | ------------------------------------- | ---------------------- |
| **Background**   | `#FFFFFF` | Ana background                        | `Neutral.background`   |
| **Surface**      | `#F9FAFB` | Card, sheet background'ları           | `Neutral.surface`      |
| **Border**       | `#E5E7EB` | Input border, divider                 | `Neutral.border`       |
| **Text Primary** | `#1F2937` | Ana metin rengi                       | `Neutral.textPrimary`  |
| **Text Secondary** | `#6B7280` | İkincil metin, açıklamalar            | `Neutral.textSecondary` |
| **Text Muted**   | `#9CA3AF` | Placeholder, disabled text            | `Neutral.textMuted`    |

### Light & Dark Mode

Uygulama hem light hem dark mode'u destekler:

```tsx
import { Colors } from '@/constants/theme';

const colors = Colors.light; // veya Colors.dark

<View style={{ backgroundColor: colors.background }}>
  <Text style={{ color: colors.text }}>Merhaba</Text>
</View>
```

**Dark Mode Renk Değişiklikleri:**
- Background: `#0F172A` (koyu mavi-gri)
- Surface: `#1E293B`
- Text: `#F1F5F9`
- Border: `#334155`

---

## ✍️ Tipografi Sistemi

### Font Families

Platform-native fontlar kullanılır (optimal performans ve native his):

- **iOS**: San Francisco (System)
- **Android**: Roboto
- **Fallback**: System default

```tsx
import { Fonts } from '@/constants/theme';

// Font ailesi otomatik olarak platform'a göre seçilir
<Text style={{ fontFamily: Fonts.sans }}>Metin</Text>
```

### Font Scales

Responsive ve okunabilir tipografi için standart scale'ler:

#### Headings (Başlıklar)

```tsx
import { Typography } from '@/constants/theme';

<Text style={Typography.headingXL}>Ekstra Büyük Başlık</Text>
// fontSize: 28, fontWeight: '700', lineHeight: 36

<Text style={Typography.headingLG}>Büyük Başlık</Text>
// fontSize: 20, fontWeight: '700', lineHeight: 28

<Text style={Typography.headingMD}>Orta Başlık</Text>
// fontSize: 16, fontWeight: '600', lineHeight: 24

<Text style={Typography.headingSM}>Küçük Başlık</Text>
// fontSize: 14, fontWeight: '600', lineHeight: 20
```

#### Body (Gövde Metinleri)

```tsx
<Text style={Typography.bodyLG}>Büyük Metin</Text>
// fontSize: 16, fontWeight: '400', lineHeight: 24

<Text style={Typography.bodyMD}>Normal Metin</Text>
// fontSize: 14, fontWeight: '400', lineHeight: 20

<Text style={Typography.bodySM}>Küçük Metin</Text>
// fontSize: 12, fontWeight: '400', lineHeight: 16

<Text style={Typography.bodyXS}>Çok Küçük Metin</Text>
// fontSize: 10, fontWeight: '400', lineHeight: 14
```

#### Buttons (Buton Metinleri)

```tsx
<Text style={Typography.buttonLG}>Büyük Buton</Text>
// fontSize: 16, fontWeight: '500', lineHeight: 24

<Text style={Typography.buttonMD}>Normal Buton</Text>
// fontSize: 14, fontWeight: '500', lineHeight: 20

<Text style={Typography.buttonSM}>Küçük Buton</Text>
// fontSize: 12, fontWeight: '500', lineHeight: 16
```

### Typographic Hierarchy Kullanımı

```tsx
// ✅ DOĞRU: Net hiyerarşi
<View>
  <Text style={Typography.headingLG}>Araç Listesi</Text>
  <Text style={Typography.bodyMD}>Toplam 42 araç</Text>
  <Text style={Typography.bodySM}>Son güncelleme: 2 saat önce</Text>
</View>

// ❌ YANLIŞ: Belirsiz hiyerarşi
<View>
  <Text style={{ fontSize: 19 }}>Araç Listesi</Text>
  <Text style={{ fontSize: 13 }}>Toplam 42 araç</Text>
</View>
```

---

## 📏 Spacing ve Layout

### Spacing Scale

Tutarlı spacing için 8px tabanlı sistem:

| Size  | Piksel | Kullanım                          | Örnek Kod     |
| ----- | ------ | --------------------------------- | ------------- |
| `xs`  | 4px    | İkonlar arası, çok küçük boşluklar | `Spacing.xs`  |
| `sm`  | 8px    | Label-Input arası, küçük padding  | `Spacing.sm`  |
| `md`  | 12px   | Form elementleri arası, card içi | `Spacing.md`  |
| `lg`  | 16px   | Section padding, card padding     | `Spacing.lg`  |
| `xl`  | 20px   | Büyük section'lar arası           | `Spacing.xl`  |
| `2xl` | 24px   | Header, footer padding            | `Spacing['2xl']` |
| `3xl` | 32px   | Major section'lar                 | `Spacing['3xl']` |
| `4xl` | 40px   | Extra büyük boşluklar             | `Spacing['4xl']` |
| `5xl` | 48px   | Maximum boşluklar                 | `Spacing['5xl']` |

**Kullanım Örneği:**

```tsx
import { Spacing } from '@/constants/theme';

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,          // 16px
    gap: Spacing.md,               // 12px
    marginBottom: Spacing['2xl'],  // 24px
  },
  card: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
});
```

### Border Radius

Yumuşak ve modern görünüm için border radius standartları:

| Size  | Piksel | Kullanım                       | Örnek Kod            |
| ----- | ------ | ------------------------------ | -------------------- |
| `sm`  | 4px    | Badge, chip, küçük elementler  | `BorderRadius.sm`    |
| `md`  | 8px    | Input, button, card (default)  | `BorderRadius.md`    |
| `lg`  | 12px   | Modal, sheet, büyük card'lar   | `BorderRadius.lg`    |
| `xl`  | 16px   | Hero sections                  | `BorderRadius.xl`    |
| `2xl` | 20px   | Extra yuvarlak elementler      | `BorderRadius['2xl']` |
| `full` | 9999px | Tamamen yuvarlak (avatar, pill) | `BorderRadius.full` |

**Kullanım Örneği:**

```tsx
import { BorderRadius } from '@/constants/theme';

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.md,  // 8px
  },
  avatar: {
    borderRadius: BorderRadius.full, // Circle
  },
  card: {
    borderRadius: BorderRadius.lg,  // 12px
  },
});
```

### Shadow System

Depth ve elevation için shadow standartları:

```tsx
import { Shadows } from '@/constants/theme';

const styles = StyleSheet.create({
  cardSmall: {
    ...Shadows.sm,
    // shadowOpacity: 0.05, shadowRadius: 2, elevation: 1
  },
  cardMedium: {
    ...Shadows.md,
    // shadowOpacity: 0.1, shadowRadius: 4, elevation: 3
  },
  modal: {
    ...Shadows.lg,
    // shadowOpacity: 0.15, shadowRadius: 8, elevation: 6
  },
});
```

### Layout Patterns

#### Safe Area

Her ekranda SafeAreaView kullan:

```tsx
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Screen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Content */}
    </SafeAreaView>
  );
}
```

#### KeyboardAvoidingView

Form ekranlarında klavye yönetimi:

```tsx
import { KeyboardAvoidingView, Platform } from 'react-native';

<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  style={{ flex: 1 }}
>
  {/* Form content */}
</KeyboardAvoidingView>
```

---

## 🎯 Component Standartları

### Input Component

**Standard Input:**

```tsx
import { Input } from '@/components/ui';

<Input
  label="Plaka"
  placeholder="34 ABC 123"
  value={value}
  onChangeText={setValue}
  error={error}
  keyboardType="default"
/>
```

**Date Input** (Tarih Seçici):

```tsx
import { DateInput } from '@/components/ui';

<DateInput
  label="Tescil Tarihi"
  placeholder="Tarih seçiniz"
  value={dateValue}  // YYYY-MM-DD format
  onChangeText={setDateValue}
  error={error}
/>
```

**Özellikler:**
- ✅ Native date picker (iOS spinner, Android calendar)
- ✅ Türkçe format gösterimi (DD/MM/YYYY)
- ✅ Backend için YYYY-MM-DD format
- ✅ Min/Max tarih limitleri (1900-2100)
- ✅ Error handling
- ✅ Disabled state
- ✅ Takvim ikonu

### Button Component

```tsx
import { Button } from '@/components/ui';

// Primary button
<Button
  onPress={handleSubmit}
  variant="primary"
  size="md"
  disabled={isLoading}
>
  Kaydet
</Button>

// Secondary button
<Button variant="outline">İptal</Button>

// Destructive button
<Button variant="destructive">Sil</Button>
```

**Button Sizes:**
- `sm`: 32px yükseklik
- `md`: 40px yükseklik (default)
- `lg`: 48px yükseklik

**Minimum Touch Target:** 44x44px (iOS Human Interface Guidelines)

### Card Component

```tsx
import { Card } from '@/components/ui';

<Card style={styles.card}>
  <Text style={Typography.headingMD}>Başlık</Text>
  <Text style={Typography.bodyMD}>İçerik</Text>
</Card>
```

**Card Standartları:**
- Padding: `Spacing.lg` (16px)
- Border radius: `BorderRadius.lg` (12px)
- Background: `colors.card`
- Shadow: `Shadows.sm` veya `Shadows.md`

### Badge Component

```tsx
import { Badge } from '@/components/ui';

<Badge variant="success">Aktif</Badge>
<Badge variant="warning">Beklemede</Badge>
<Badge variant="danger">İptal</Badge>
<Badge variant="info">Bilgi</Badge>
```

### Checkbox Component

```tsx
import { Checkbox } from '@/components/ui';

<Checkbox
  value={isChecked}
  onValueChange={setIsChecked}
  disabled={false}
/>
```

### SelectInput Component

```tsx
import { SelectInput } from '@/components/ui/select-input';

<SelectInput
  label="Araç Tipi"
  options={[
    { label: 'Çekici', value: 'truck_tractor' },
    { label: 'Römork', value: 'trailer' },
  ]}
  selectedValue={selectedValue}
  onValueChange={setValue}
  error={error}
/>
```

---

## 🖼️ Logo ve Branding

### Logo Kullanımı

Uygulama logo'ları `assets/images/` klasöründe:

- **`logo-dark.png`**: Light mode için koyu logo
- **`logo-white.png`**: Dark mode için beyaz logo
- **`loggerise-icon.png`**: Uygulama ikonu

**Logo Placement:**

```tsx
import { Image } from 'expo-image';

// Header'da logo
<Image
  source={require('@/assets/images/logo-dark.png')}
  style={{ width: 120, height: 40 }}
  contentFit="contain"
/>

// Login ekranında logo
<Image
  source={require('@/assets/images/loggerise-icon.png')}
  style={{ width: 80, height: 80 }}
  contentFit="contain"
/>
```

**Logo Kuralları:**
- ✅ Minimum clear space: Logo yüksekliğinin 1/4'ü kadar boşluk
- ✅ Minimum boyut: 80px genişlik
- ❌ Logo'yu deforme etme
- ❌ Logo renklerini değiştirme
- ❌ Logo'nun üzerine metin yazma

### App Icon

- **iOS**: `icon.png` (1024x1024px)
- **Android**: Adaptive icon (foreground + background)
- **Background Color**: `#E6F4FE` (açık mavi)

---

## 🔔 Bildirim ve Toast

### Toast Notifications

```tsx
import { useToast } from '@/hooks/use-toast';

function MyComponent() {
  const { success, error, warning, info } = useToast();

  const handleSuccess = () => {
    success('Başarılı', 'İşlem başarıyla tamamlandı');
  };

  const handleError = () => {
    error('Hata', 'İşlem sırasında hata oluştu');
  };

  return (
    // ...
  );
}
```

**Toast Konumları:**
- Success/Info: Ekranın üstünde
- Error/Warning: Ekranın üstünde
- Duration: 3 saniye (default)

### Push Notifications

Expo Notifications kullanılarak implementasyon yapılır:

```tsx
import * as Notifications from 'expo-notifications';

// Notification configuration
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
```

---

## 🎭 Animation ve Transitions

### Transition Kuralları

**Smooth ve performant animasyonlar için:**

```tsx
// Reanimated ile animasyon
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

const opacity = useSharedValue(0);

const animatedStyle = useAnimatedStyle(() => ({
  opacity: withTiming(opacity.value, { duration: 300 }),
}));

<Animated.View style={animatedStyle}>
  {/* Content */}
</Animated.View>
```

**Duration Standartları:**
- Quick transitions: 150-200ms
- Standard transitions: 250-300ms
- Complex animations: 400-500ms

**Easing Functions:**
- `ease-out`: Çoğu transition için (default)
- `ease-in-out`: Modal open/close
- `spring`: Interactive elements

### Loading States

```tsx
import { ActivityIndicator } from 'react-native';
import { Brand } from '@/constants/theme';

<ActivityIndicator size="small" color={Brand.primary} />
<ActivityIndicator size="large" color={Brand.primary} />
```

### Haptic Feedback

```tsx
import * as Haptics from 'expo-haptics';

// Button press
<Button
  onPress={() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleAction();
  }}
>
  Kaydet
</Button>

// Success feedback
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

// Error feedback
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
```

---

## 📱 Platform-Specific Patterns

### iOS vs Android Farklılıkları

| Feature                | iOS                  | Android              |
| ---------------------- | -------------------- | -------------------- |
| **Date Picker**        | Spinner (kaydırmalı) | Calendar modal       |
| **Navigation Header**  | Large title          | Standard toolbar     |
| **Shadow**             | Native shadow        | Elevation            |
| **Haptic Feedback**    | UIImpactFeedback     | Vibration API        |
| **Status Bar**         | Dark/light content   | System bar color     |

**Platform-specific styling:**

```tsx
import { Platform } from 'react-native';

const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.select({
      ios: 44,
      android: 0,
      default: 0,
    }),
  },
});
```

### Safe Area Handling

iOS'ta notch, Android'te status bar için:

```tsx
import { SafeAreaView } from 'react-native-safe-area-context';

<SafeAreaView
  edges={['top', 'bottom']}
  style={{ flex: 1 }}
>
  {/* Content */}
</SafeAreaView>
```

### Navigation Patterns

**Tab Navigation:**
- Bottom tabs (iOS/Android standard)
- İkonlar: 24x24px (aktif ve pasif durumlar)
- Label: `Typography.bodySM`

**Stack Navigation:**
- Header height: 56px (Android), 44px (iOS)
- Back button: Platform-native
- Header title: Centered (iOS), Left-aligned (Android)

---

## ♿ Accessibility

### Touch Targets

**Minimum touch target boyutu: 44x44px (iOS) / 48x48dp (Android)**

```tsx
// ✅ DOĞRU
<TouchableOpacity
  style={{ width: 44, height: 44 }}
  accessible={true}
  accessibilityLabel="Menüyü aç"
>
  <Icon size={24} />
</TouchableOpacity>

// ❌ YANLIŞ
<TouchableOpacity style={{ width: 20, height: 20 }}>
  <Icon size={16} />
</TouchableOpacity>
```

### Color Contrast

WCAG 2.1 Level AA standartlarına uyum:

- **Normal text**: Minimum 4.5:1 contrast ratio
- **Large text** (18pt+): Minimum 3:1
- **UI components**: Minimum 3:1

**Contrast checker kullan:**
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Screen Reader Support

```tsx
<View
  accessible={true}
  accessibilityLabel="Araç listesi"
  accessibilityHint="Kayıtlı araçları görüntüle"
  accessibilityRole="list"
>
  {/* Content */}
</View>
```

**Accessibility Props:**
- `accessible`: Element'in erişilebilir olduğunu belirtir
- `accessibilityLabel`: Screen reader için açıklama
- `accessibilityHint`: Ek bilgi
- `accessibilityRole`: Element'in rolü (button, link, etc.)

### Focus Management

```tsx
import { useRef } from 'react';
import { TextInput } from 'react-native';

const inputRef = useRef<TextInput>(null);

// Auto-focus
useEffect(() => {
  inputRef.current?.focus();
}, []);

<Input ref={inputRef} />
```

---

## 🎨 Tasarım Prensipleri

### 1. Consistency (Tutarlılık)

✅ **ALWAYS kullan:**
- Theme constant'ları (`Brand`, `Colors`, `Typography`, `Spacing`)
- UI component library'den component'ler
- Standart pattern'ler (SafeAreaView, KeyboardAvoidingView)

❌ **NEVER kullanma:**
- Hard-coded renkler (`#000000` gibi)
- Rastgele spacing değerleri (`marginTop: 13`)
- Custom component'ler (UI library'de varsa)

### 2. Simplicity (Sadelik)

Mobile ekranlarda minimal ve odaklanmış tasarım:

- Her ekranda **tek bir primary action**
- **3-5 navigation item** (tab bar'da)
- Gereksiz decoration'lardan kaçın
- White space kullan (breathing room)

### 3. Performance (Performans)

Smooth 60 FPS için:

- Heavy computation'ları background thread'e taşı
- Image'leri optimize et (expo-image kullan)
- List'ler için FlatList kullan (map değil)
- Reanimated kullan (native-driven animations)

### 4. Native Feel (Native His)

Her platformda native hissettir:

- Platform-native component'ler kullan
- Platform-specific pattern'lere uy
- Native gesture'ları destekle (swipe, pinch, etc.)
- Haptic feedback ekle (iOS'ta)

### 5. Feedback (Geri Bildirim)

Kullanıcıya her zaman feedback ver:

- Loading states (spinner, skeleton)
- Success/error messages (toast)
- Haptic feedback (button press)
- Disabled states (açık göster)

---

## 📚 İlgili Dokümantasyon

### Internal Docs
- **[README.md](./README.md)** - Proje genel bakış
- **[BACKEND_API_DOCUMENTATION.md](./BACKEND_API_DOCUMENTATION.md)** - API entegrasyonu
- **[MOBILE_BACKEND_VERIFICATION.md](./MOBILE_BACKEND_VERIFICATION.md)** - Backend doğrulama

### Web Version
- **[.claude/guides/DESIGN-SYSTEM.md](../.claude/guides/DESIGN-SYSTEM.md)** - Web tasarım sistemi
- **[.claude/guides/RESPONSIVE-DESIGN-GUIDE.md](../.claude/guides/RESPONSIVE-DESIGN-GUIDE.md)** - Responsive patterns

### External Resources
- [Expo Documentation](https://docs.expo.dev)
- [React Native Documentation](https://reactnative.dev)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design](https://m3.material.io)
- [Lucide React Native Icons](https://lucide.dev)

---

## 🔄 Güncelleme Logları

| Tarih      | Versiyon | Değişiklik                                  |
| ---------- | -------- | ------------------------------------------- |
| 2026-01-23 | 1.0.0    | İlk versiyon - Kapsamlı design system dokümantasyonu |
| 2026-01-23 | 1.0.0    | DateInput component eklendi                 |

---

## ✅ Design Review Checklist

Yeni feature/component eklerken kontrol et:

- [ ] Theme constant'ları kullanıldı mı?
- [ ] Typography sistemi uygulandı mı?
- [ ] Spacing scale'e uygun mu?
- [ ] iOS ve Android'de test edildi mi?
- [ ] Dark mode destekleniyor mu?
- [ ] Accessibility prop'ları eklendi mi?
- [ ] Minimum touch target 44x44px mı?
- [ ] Loading/error states var mı?
- [ ] Haptic feedback eklendi mi? (uygunsa)
- [ ] Native his veriyor mu?

---

**Bakım**: Bu doküman her yeni component veya pattern eklendiğinde güncellenir.
**Sorumluluk**: Mobile Development Team
**Versiyon**: 1.0.0
