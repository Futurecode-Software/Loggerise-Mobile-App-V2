# Bildirim ve Dialog Kuralları

> **KESİN KURAL:** React Native'in `Alert` bileşeni hiçbir yerde kullanılmayacaktır. Bu kural istisnasızdır.

## Toast Kullanımı (Bildirimler)

Başarı, hata, uyarı ve bilgi mesajları için `react-native-toast-message` kullanılır.

### Temel Kullanım

```typescript
import Toast from 'react-native-toast-message'

// Başarı mesajı
Toast.show({
  type: 'success',
  text1: 'İşlem başarıyla tamamlandı',
  position: 'top',
  visibilityTime: 1500
})

// Hata mesajı
Toast.show({
  type: 'error',
  text1: 'Bir hata oluştu',
  position: 'top',
  visibilityTime: 1500
})

// Bilgi/Uyarı mesajı
Toast.show({
  type: 'info',
  text1: 'Lütfen tüm alanları doldurun',
  position: 'top',
  visibilityTime: 1500
})

// İki satırlı mesaj
Toast.show({
  type: 'success',
  text1: 'Başarılı',
  text2: 'İşlem tamamlandı',
  position: 'top',
  visibilityTime: 1500
})
```

### Standart Ayarlar

- `position: 'top'` - Her zaman üstte göster
- `visibilityTime: 1500` - 1.5 saniye görünür

### Ne Zaman Kullanılır

- Form validasyon hataları
- API başarı/hata mesajları
- Kullanıcı bilgilendirmeleri
- Kısa süreli uyarılar

## ConfirmDialog Kullanımı (Onay Dialogları)

Silme, iptal ve diğer onay gerektiren işlemler için `ConfirmDialog` bileşeni kullanılır.

### Temel Kullanım

```typescript
import { useRef } from 'react'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import ConfirmDialog from '@/components/modals/ConfirmDialog'

// Ref tanımla
const deleteDialogRef = useRef<BottomSheetModal>(null)

// Dialogu aç
const handleDelete = () => {
  deleteDialogRef.current?.present()
}

// Onay işlemi
const confirmDelete = async () => {
  // Silme işlemi...
  deleteDialogRef.current?.dismiss()
  Toast.show({
    type: 'success',
    text1: 'Silindi',
    position: 'top',
    visibilityTime: 1500
  })
}

// JSX'te kullan
<ConfirmDialog
  ref={deleteDialogRef}
  title="Silme Onayı"
  message="Bu öğeyi silmek istediğinizden emin misiniz?"
  type="danger" // danger | warning | info | success
  confirmText="Sil"
  cancelText="İptal"
  onConfirm={confirmDelete}
  isLoading={isDeleting}
/>
```

### Ne Zaman Kullanılır

- Silme işlemleri
- Geri alınamaz işlemler
- Önemli kararlar gerektiren durumlar
- Kullanıcı onayı gereken işlemler

## Özet Tablo

| Durum | Kullanılacak | Kullanılmayacak |
|-------|--------------|-----------------|
| Başarı mesajı | `Toast.show({ type: 'success' })` | `Alert.alert()` |
| Hata mesajı | `Toast.show({ type: 'error' })` | `Alert.alert()` |
| Form uyarısı | `Toast.show({ type: 'info' })` | `Alert.alert()` |
| Silme onayı | `ConfirmDialog` | `Alert.alert()` |
| Kritik onay | `ConfirmDialog` | `Alert.alert()` |
