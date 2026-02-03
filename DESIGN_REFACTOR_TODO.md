# Tasarım Standartlarına Uyum İçin Yeniden Düzenleme (Refactor) Listesi

> **Referans Tasarım:** `app/accounting/cash-register/` modülü
> 
> **Kriter:** CLAUDE.md - Dashboard Theme Standartları

---

## 🎯 Kritik Kurallar Özeti

| Kural | ❌ Yasak | ✅ Zorunlu |
|-------|----------|-----------|
| Klavye | `KeyboardAvoidingView` | `KeyboardAwareScrollView` |
| Header | `FullScreenHeader` | `PageHeader` (liste) / Gradient Header (form) |
| Tema | `@/constants/theme` | `@/constants/dashboard-theme` |
| İkonlar | `lucide-react-native` | `@expo/vector-icons` (Ionicons) |
| Bildirimler | `useToast` / `showToast` / `Alert.alert` | `Toast.show()` / `ConfirmDialog` |
| Liste | `StandardListContainer/Item` | `FlatList` + Custom Card |
| Form | `Card` component | Section yapısı |

---

## 📊 İlerleme Özeti

| Modül | Toplam Dosya | Tamamlanan | Kalan | Durum |
|-------|-------------|------------|-------|-------|
| fleet/driver-tractor | 5 | 0 | 5 | 🔴 Başlanmadı |
| fleet/tire-warehouse | 5 | 0 | 5 | 🔴 Başlanmadı |
| fleet/tractor-trailer | 5 | 0 | 5 | 🔴 Başlanmadı |
| fleet/fault-reports | 1 | 0 | 1 | 🔴 Başlanmadı |
| hr/job-applications | 5 | 0 | 5 | 🔴 Başlanmadı |
| hr/job-postings | 5 | 0 | 5 | 🔴 Başlanmadı |
| inventory/stock/models | 3 | 0 | 3 | 🔴 Başlanmadı |
| logistics/domestic | 4 | 0 | 4 | 🔴 Başlanmadı |
| message/group | 2 | 0 | 2 | 🔴 Başlanmadı |
| message | 1 | 0 | 1 | 🔴 Başlanmadı |
| crm/quotes | 1 | 0 | 1 | 🔴 Başlanmadı |
| crm/customers/interactions | 2 | 0 | 2 | 🔴 Başlanmadı |
| (tabs)/positions | 1 | 0 | 1 | 🔴 Başlanmadı |
| notifications | 1 | 0 | 1 | 🔴 Başlanmadı |
| accounting/contacts | 2 | 0 | 2 | 🔴 Başlanmadı |
| **TOPLAM** | **43** | **0** | **43** | 🔴 |

---

## 🚗 FLEET Modülü

### 1. fleet/driver-tractor

#### [ ] `index.tsx` - Liste Sayfası
- [ ] `FullScreenHeader` → `PageHeader` (from `@/components/navigation`)
- [ ] `Colors, Spacing, Brand, Shadows` → `DashboardColors, DashboardSpacing, DashboardShadows`
- [ ] `StandardListContainer/Item` → `FlatList` + Custom Card (cash-register index.tsx referans)
- [ ] `lucide-react-native` → `Ionicons` (UserCircle2, Plus, CheckCircle2, XCircle, Edit, Trash2)
- [ ] `showToast` → `Toast.show()`

#### [ ] `new.tsx` - Form Sayfası
- [ ] `KeyboardAvoidingView` → `KeyboardAwareScrollView` (**KRİTİK**)
- [ ] `FullScreenHeader` → Gradient Header (LinearGradient + Animasyonlu Glow Orbs)
- [ ] `Colors, Typography, Spacing, Brand` → `DashboardColors, DashboardFontSizes, DashboardSpacing`
- [ ] `Card` component → Section yapısı (cash-register new.tsx referans)
- [ ] `lucide-react-native` → `Ionicons` (Save)
- [ ] `useToast` → `Toast.show()`
- [ ] Buton boyutu: 40x40 (form standardı)

#### [ ] `[id].tsx` - Detay/Edit Sayfası
- [ ] `KeyboardAvoidingView` → `KeyboardAwareScrollView` (**KRİTİK**)
- [ ] `FullScreenHeader` → Gradient Header (LinearGradient + **Statik** Glow Orbs)
- [ ] `Colors, Typography, Spacing, Brand` → Dashboard theme
- [ ] `Card` component → Section yapısı
- [ ] `lucide-react-native` → `Ionicons` (Save, Trash2)
- [ ] `useToast` → `Toast.show()`
- [ ] Buton boyutu: 44x44 (detay standardı)
- [ ] `ConfirmDialog` kullanımını kontrol et (BottomSheetModal olmalı)

---

### 2. fleet/tire-warehouse

#### [ ] `index.tsx` - Liste Sayfası
- [ ] `FullScreenHeader` → `PageHeader`
- [ ] `Colors, Spacing, Brand, Shadows` → Dashboard theme
- [ ] `StandardListContainer/Item` → `FlatList` + Custom Card
- [ ] `lucide-react-native` → `Ionicons` (CircleDot, Plus, Filter)
- [ ] `showToast` → `Toast.show()`

#### [ ] `new.tsx` - Form Sayfası
- [ ] `KeyboardAvoidingView` → `KeyboardAwareScrollView` (**KRİTİK**)
- [ ] `FullScreenHeader` → Gradient Header (LinearGradient + Animasyonlu Glow Orbs)
- [ ] `Colors, Typography, Spacing, Brand` → Dashboard theme
- [ ] `Card` component → Section yapısı
- [ ] `lucide-react-native` → `Ionicons` (Save)
- [ ] `useToast` → `Toast.show()`
- [ ] Buton boyutu: 40x40

#### [ ] `[id].tsx` - Detay/Edit Sayfası
- [ ] `KeyboardAvoidingView` → `KeyboardAwareScrollView` (**KRİTİK**)
- [ ] `FullScreenHeader` → Gradient Header (LinearGradient + **Statik** Glow Orbs)
- [ ] `Colors, Typography, Spacing, Brand` → Dashboard theme
- [ ] `Card` component → Section yapısı
- [ ] `lucide-react-native` → `Ionicons` (Save, Trash2, Car, Wrench)
- [ ] `useToast` → `Toast.show()`
- [ ] Buton boyutu: 44x44
- [ ] `ConfirmDialog` kullanımını kontrol et

---

### 3. fleet/tractor-trailer

#### [ ] `index.tsx` - Liste Sayfası
- [ ] `FullScreenHeader` → `PageHeader`
- [ ] `Colors, Spacing, Brand, Shadows` → Dashboard theme
- [ ] `StandardListContainer/Item` → `FlatList` + Custom Card
- [ ] `lucide-react-native` → `Ionicons` (Link2, Plus, CheckCircle2, XCircle, Edit, Trash2)
- [ ] `showToast` → `Toast.show()`

#### [ ] `new.tsx` - Form Sayfası
- [ ] `KeyboardAvoidingView` → `KeyboardAwareScrollView` (**KRİTİK**)
- [ ] `FullScreenHeader` → Gradient Header (LinearGradient + Animasyonlu Glow Orbs)
- [ ] `Colors, Typography, Spacing, Brand` → Dashboard theme
- [ ] `Card` component → Section yapısı
- [ ] `lucide-react-native` → `Ionicons` (Save)
- [ ] `useToast` → `Toast.show()`
- [ ] Buton boyutu: 40x40

#### [ ] `[id].tsx` - Detay/Edit Sayfası
- [ ] `KeyboardAvoidingView` → `KeyboardAwareScrollView` (**KRİTİK**)
- [ ] `FullScreenHeader` → Gradient Header (LinearGradient + **Statik** Glow Orbs)
- [ ] `Colors, Typography, Spacing, Brand` → Dashboard theme
- [ ] `Card` component → Section yapısı
- [ ] `lucide-react-native` → `Ionicons` (Save, Trash2)
- [ ] `useToast` → `Toast.show()`
- [ ] Buton boyutu: 44x44
- [ ] `ConfirmDialog` kullanımını kontrol et

---

### 4. fleet/fault-reports

#### [ ] `index.tsx` - Liste Sayfası
- [ ] `FullScreenHeader` → `PageHeader`
- [ ] `Colors, Spacing` → Dashboard theme
- [ ] `StandardListContainer/Item` → `FlatList` + Custom Card
- [ ] `lucide-react-native` → `Ionicons` (AlertTriangle, Filter)

---

## 👥 HR Modülü

### 5. hr/job-applications

#### [ ] `index.tsx` - Liste Sayfası
- [ ] `FullScreenHeader` → `PageHeader`
- [ ] `Colors, Spacing, Typography, Shadows, Brand` → Dashboard theme
- [ ] `StandardListContainer/Item` → `FlatList` + Custom Card
- [ ] `lucide-react-native` → `Ionicons`
- [ ] `showToast` → `Toast.show()`

#### [ ] `new.tsx` - Form Sayfası
- [ ] `KeyboardAvoidingView` → `KeyboardAwareScrollView` (**KRİTİK**)
- [ ] `FullScreenHeader` → Gradient Header (LinearGradient + Animasyonlu Glow Orbs)
- [ ] `Colors, Typography, Spacing, Brand, Shadows, BorderRadius` → Dashboard theme
- [ ] `Card` component → Section yapısı
- [ ] `lucide-react-native` → `Ionicons` (Save, Upload, FileText, X)
- [ ] `useToast` → `Toast.show()`
- [ ] Buton boyutu: 40x40

#### [ ] `[id].tsx` - Detay Sayfası
- [ ] `FullScreenHeader` → Gradient Header (LinearGradient + **Statik** Glow Orbs)
- [ ] `Colors, Typography, Spacing, Brand, Shadows` → Dashboard theme
- [ ] `Card` component → Section yapısı (SectionHeader + InfoRow pattern)
- [ ] `lucide-react-native` → `Ionicons` (Edit, Trash2, Download, CheckCircle, Calendar, MessageCircle)
- [ ] `useToast` → `Toast.show()`
- [ ] `Alert.alert` → `ConfirmDialog` (BottomSheetModal) (**KRİTİK**)
- [ ] Buton boyutu: 44x44

#### [ ] `[id]/edit.tsx` - Edit Sayfası
- [ ] `KeyboardAvoidingView` → `KeyboardAwareScrollView` (**KRİTİK**)
- [ ] `FullScreenHeader` → Gradient Header (LinearGradient + Animasyonlu Glow Orbs)
- [ ] `Colors, Typography, Spacing, Brand, Shadows, BorderRadius` → Dashboard theme
- [ ] `Card` component → Section yapısı
- [ ] `lucide-react-native` → `Ionicons` (Save, Upload, FileText, X)
- [ ] `useToast` → `Toast.show()`
- [ ] Buton boyutu: 40x40

---

### 6. hr/job-postings

#### [ ] `index.tsx` - Liste Sayfası
- [ ] `FullScreenHeader` → `PageHeader`
- [ ] `Colors, Spacing, Typography, Shadows, Brand` → Dashboard theme
- [ ] `StandardListContainer/Item` → `FlatList` + Custom Card
- [ ] `lucide-react-native` → `Ionicons` (Plus, Layers, CheckCircle, XCircle, Globe, Lock, Briefcase)
- [ ] `showToast` → `Toast.show()`

#### [ ] `new.tsx` - Form Sayfası
- [ ] `KeyboardAvoidingView` → `KeyboardAwareScrollView` (**KRİTİK**)
- [ ] `FullScreenHeader` → Gradient Header (LinearGradient + Animasyonlu Glow Orbs)
- [ ] `Colors, Typography, Spacing, Brand, Shadows` → Dashboard theme
- [ ] `Card` component → Section yapısı
- [ ] `lucide-react-native` → `Ionicons` (Save)
- [ ] `useToast` → `Toast.show()`
- [ ] Buton boyutu: 40x40

#### [ ] `[id].tsx` - Detay Sayfası
- [ ] `FullScreenHeader` → Gradient Header (LinearGradient + **Statik** Glow Orbs)
- [ ] `Colors, Typography, Spacing, Brand, Shadows` → Dashboard theme
- [ ] `Card` component → Section yapısı
- [ ] `lucide-react-native` → `Ionicons` (Edit, Trash2, Globe, Eye, Users, Calendar, Briefcase)
- [ ] `useToast` → `Toast.show()`
- [ ] `Alert.alert` → `ConfirmDialog` (BottomSheetModal) (**KRİTİK**)
- [ ] Buton boyutu: 44x44

#### [ ] `[id]/edit.tsx` - Edit Sayfası
- [ ] `KeyboardAvoidingView` → `KeyboardAwareScrollView` (**KRİTİK**)
- [ ] `FullScreenHeader` → Gradient Header (LinearGradient + Animasyonlu Glow Orbs)
- [ ] `Colors, Typography, Spacing, Brand, Shadows` → Dashboard theme
- [ ] `Card` component → Section yapısı
- [ ] `lucide-react-native` → `Ionicons` (Save)
- [ ] `useToast` → `Toast.show()`
- [ ] Buton boyutu: 40x40

---

## 📦 INVENTORY Modülü

### 7. inventory/stock/models

#### [ ] `index.tsx` - Liste Sayfası
- [ ] `FullScreenHeader` → `PageHeader`
- [ ] `Colors, Spacing, Brand, Shadows` → Dashboard theme
- [ ] `StandardListContainer/Item` → `FlatList` + Custom Card
- [ ] `lucide-react-native` → `Ionicons` (Plus, Layers)
- [ ] `showToast` → `Toast.show()`

#### [ ] `new.tsx` - Form Sayfası
- [ ] `KeyboardAvoidingView` → `KeyboardAwareScrollView` (**KRİTİK**)
- [ ] `FullScreenHeader` → Gradient Header (LinearGradient + Animasyonlu Glow Orbs)
- [ ] `Colors, Typography, Spacing, Brand, BorderRadius` → Dashboard theme
- [ ] `Card` component → Section yapısı
- [ ] `lucide-react-native` → `Ionicons` (Save)
- [ ] `useToast` → `Toast.show()`
- [ ] Buton boyutu: 40x40

#### [ ] `[id].tsx` - Detay/Edit Sayfası
- [ ] `KeyboardAvoidingView` → `KeyboardAwareScrollView` (**KRİTİK**)
- [ ] `FullScreenHeader` → Gradient Header (LinearGradient + **Statik** Glow Orbs)
- [ ] `Colors, Typography, Spacing, Brand, BorderRadius` → Dashboard theme
- [ ] `Card` component → Section yapısı
- [ ] `lucide-react-native` → `Ionicons` (Save, Trash2, Layers)
- [ ] `useToast` → `Toast.show()`
- [ ] `ConfirmDialog` kullanımını kontrol et
- [ ] Buton boyutu: 44x44

---

## 🚚 LOGISTICS Modülü

### 8. logistics/domestic

#### [ ] `index.tsx` - Liste Sayfası
- [ ] `FullScreenHeader` → `PageHeader`
- [ ] `Colors, Typography, Spacing, Brand, BorderRadius, Shadows` → Dashboard theme
- [ ] `Card, Badge, Input` → Dashboard theme uyumlu
- [ ] `lucide-react-native` → `Ionicons`

#### [ ] `new.tsx` - Form Sayfası
- [ ] `KeyboardAvoidingView` → `KeyboardAwareScrollView` (**KRİTİK**)
- [ ] `FullScreenHeader` → Gradient Header (LinearGradient + Animasyonlu Glow Orbs)
- [ ] `Colors, Typography, Spacing, Brand, BorderRadius, Shadows` → Dashboard theme
- [ ] `Card, Input, DateInput` → Dashboard theme uyumlu
- [ ] `lucide-react-native` → `Ionicons` (Save, Package, User, MapPin, Calendar, FileText)
- [ ] `useToast` → `Toast.show()`
- [ ] Buton boyutu: 40x40

#### [ ] `[id].tsx` - Detay Sayfası
- [ ] `FullScreenHeader` → Gradient Header (LinearGradient + **Statik** Glow Orbs)
- [ ] `Colors, Typography, Spacing, Brand, BorderRadius, Shadows` → Dashboard theme
- [ ] `Card, Badge` → Dashboard theme uyumlu
- [ ] `lucide-react-native` → `Ionicons`
- [ ] `useToast` → `Toast.show()`
- [ ] Buton boyutu: 44x44

---

## 💬 MESSAGE Modülü

### 9. message/group

#### [ ] `[id].tsx`
- [ ] `FullScreenHeader` → Gradient Header (LinearGradient + **Statik** Glow Orbs)
- [ ] `Colors, Typography, Spacing, Brand, BorderRadius, Shadows, Status` → Dashboard theme
- [ ] `lucide-react-native` → `Ionicons`
- [ ] `useToast` → `Toast.show()`

#### [ ] `new.tsx`
- [ ] `FullScreenHeader` → Gradient Header (LinearGradient + Animasyonlu Glow Orbs)
- [ ] `Colors, Typography, Spacing, Brand, BorderRadius` → Dashboard theme
- [ ] `lucide-react-native` → `Ionicons` (Users)
- [ ] Buton boyutu: 40x40

### 10. message

#### [ ] `new.tsx`
- [ ] `FullScreenHeader` → Gradient Header (LinearGradient + Animasyonlu Glow Orbs)
- [ ] `Colors, Brand, Typography, Spacing` → Dashboard theme
- [ ] `lucide-react-native` → `Ionicons` (Users)

---

## 👤 CRM Modülü

### 11. crm/quotes

#### [ ] `[id].tsx`
- [ ] `FullScreenHeader` → Gradient Header (LinearGradient + **Statik** Glow Orbs)
- [ ] `Colors, Spacing, Brand, Shadows` → Dashboard theme
- [ ] `lucide-react-native` → `Ionicons` (Edit, Trash2)

### 12. crm/customers/interactions

#### [ ] `[interactionId].tsx`
- [ ] `FullScreenHeader` → Gradient Header (LinearGradient + **Statik** Glow Orbs)
- [ ] `Colors, Typography, Spacing, Brand, BorderRadius, Shadows` → Dashboard theme
- [ ] `Card, Badge, Input, Button, ConfirmDialog` → Dashboard theme uyumlu
- [ ] `lucide-react-native` → `Ionicons`
- [ ] `useToast` → `Toast.show()`
- [ ] Buton boyutu: 44x44

#### [ ] `new.tsx`
- [ ] `FullScreenHeader` → Gradient Header (LinearGradient + Animasyonlu Glow Orbs)
- [ ] `Colors, Typography, Spacing, Brand, BorderRadius, Shadows` → Dashboard theme
- [ ] `Card, Input, Button` → Dashboard theme uyumlu
- [ ] `lucide-react-native` → `Ionicons` (Save, Users, Phone, Mail, Clock)
- [ ] `useToast` → `Toast.show()`
- [ ] Buton boyutu: 40x40

---

## 📱 DİĞER Sayfalar

### 13. (tabs)/positions

#### [ ] `index.tsx`
- [ ] `FullScreenHeader` → `PageHeader`
- [ ] `Colors, Typography, Spacing, Brand, BorderRadius, Shadows` → Dashboard theme
- [ ] `Card, Badge, Input` → Dashboard theme uyumlu
- [ ] `lucide-react-native` → `Ionicons`

### 14. notifications

#### [ ] `index.tsx`
- [ ] `FullScreenHeader` → `PageHeader`
- [ ] `Colors, Typography, Spacing, Brand, BorderRadius` → Dashboard theme
- [ ] `Card, Badge` → Dashboard theme uyumlu
- [ ] `lucide-react-native` → `Ionicons`

---

## 💰 ACCOUNTING Modülü

### 15. accounting/contacts

#### [ ] `new.tsx`
- [ ] `Card` component → Section yapısı
- [ ] Theme kontrolü (muhtemelen zaten Dashboard theme)

#### [ ] `[id]/edit.tsx`
- [ ] `Card` component → Section yapısı
- [ ] Theme kontrolü

---

## 📝 BACKUP Dosyaları (Silinecek)

- [ ] `app/accounting/bank/index.tsx.backup` - Sil veya arşivle
- [ ] `app/accounting/bank/[id].tsx.backup` - Sil veya arşivle

---

## ✅ Kalite Kontrol Checklist (Her dosya için)

### Liste Sayfaları İçin:
- [ ] `PageHeader` kullanılıyor mu?
- [ ] `DashboardColors` import edilmiş mi?
- [ ] `FlatList` kullanılıyor mu?
- [ ] Custom card component var mı?
- [ ] `Ionicons` kullanılıyor mu?
- [ ] `Toast.show()` kullanılıyor mu?
- [ ] `useCallback` ile `fetchData` sarmalanmış mı?
- [ ] `useFocusEffect` ile yenileme var mı?
- [ ] `RefreshControl` var mı?
- [ ] Skeleton component var mı?

### Form Sayfaları İçin:
- [ ] `KeyboardAwareScrollView` kullanılıyor mu?
- [ ] Gradient header (LinearGradient) var mı?
- [ ] Animasyonlu glow orbs var mı?
- [ ] `DashboardColors` import edilmiş mi?
- [ ] Section yapısı (Card yerine) kullanılıyor mu?
- [ ] `Ionicons` kullanılıyor mu?
- [ ] `Toast.show()` kullanılıyor mu?
- [ ] Header buton boyutu 40x40 mı?
- [ ] `overflow: 'hidden'` header container'da var mı?

### Detay Sayfaları İçin:
- [ ] Gradient header (LinearGradient) var mı?
- [ ] **Statik** glow orbs var mı? (Animasyonlu değil)
- [ ] `DashboardColors` import edilmiş mi?
- [ ] SectionHeader + InfoRow pattern var mı?
- [ ] `Ionicons` kullanılıyor mu?
- [ ] `Toast.show()` kullanılıyor mu?
- [ ] `ConfirmDialog` (BottomSheetModal) kullanılıyor mu?
- [ ] Header buton boyutu 44x44 mü?
- [ ] `useFocusEffect` ile edit'ten dönüşte yenileme var mı?
- [ ] `isMountedRef` ile memory leak önlemi var mı?

---

## 🔄 İlerleme Güncelleme Rehberi

Bir dosyayı tamamladığınızda:
1. İlgili checkbox'ları işaretleyin
2. İlerleme tablosunu güncelleyin
3. `npm run lint` çalıştırın
4. Hata yoksa commit yapın

Örnek commit mesajı:
```
refactor(fleet): tractor-trailer tasarımı cash-register standardına uygun hale getirildi

- KeyboardAvoidingView -> KeyboardAwareScrollView
- FullScreenHeader -> Gradient Header
- Eski tema -> DashboardColors
- Lucide -> Ionicons
```

---

**Son Güncelleme:** $(date)

**Sorumlu:** @developer
