# Kullanıcı Yönetimi Modülü - Mobil Uygulama

## 📱 Genel Bakış

Mobil uygulama için eksiksiz kullanıcı yönetimi modülü. Web uygulamasındaki tüm özellikleri destekler.

## ✨ Özellikler

### 1. Kullanıcı Listeleme
- ✅ Pagination destekli liste
- ✅ Ad ve e-posta ile arama
- ✅ Role göre filtreleme
- ✅ Pull-to-refresh
- ✅ Infinite scroll
- ✅ Kullanıcı limiti göstergesi
- ✅ Boş durum gösterimi

### 2. Kullanıcı Oluşturma/Düzenleme
- ✅ Ad, e-posta, şifre alanları
- ✅ Rol atamaları (Süper Admin için)
- ✅ Form validasyonu
- ✅ İlk kullanıcı koruması (ID: 1)
- ✅ Şifre değiştirme (düzenlemede opsiyonel)
- ✅ Real-time error handling

### 3. Kullanıcı Silme
- ✅ Onay dialogu
- ✅ İlk kullanıcı koruması
- ✅ Kendini silme koruması

### 4. Kullanıcı Davet Sistemi
- ✅ Bekleyen davetleri listeleme
- ✅ Yeni davet gönderme (çoklu e-posta)
- ✅ Daveti yeniden gönderme
- ✅ Daveti iptal etme
- ✅ Süresi dolmuş davet göstergesi
- ✅ 7 günlük geçerlilik süresi

### 5. Roller ve İzinler
- ✅ Rolleri listeleme
- ✅ Multi-select rol seçimi
- ✅ Türkçe rol etiketleri
- ✅ Rol badge gösterimleri

### 6. Kullanıcı Limitleri
- ✅ Mevcut/maksimum kullanıcı sayısı
- ✅ Yeni kullanıcı eklenip eklenemeyeceği kontrolü
- ✅ Limit aşımı uyarıları

## 📁 Dosya Yapısı

```
src/
├── screens/
│   └── settings/
│       ├── UserManagementScreen.tsx   # Ana liste ekranı
│       ├── UserFormScreen.tsx         # Oluştur/düzenle formu
│       ├── UserInvitationsScreen.tsx  # Davetler ekranı
│       └── index.ts                   # Export dosyası
├── services/
│   └── api/
│       └── userManagementService.ts   # API servisi
└── types/
    └── user.ts                         # TypeScript tipleri
```

## 🔌 Backend API Endpoints

### Kullanıcı İşlemleri
```
GET    /api/v1/mobile/settings/users                      # Liste
GET    /api/v1/mobile/settings/users/{id}                 # Detay
POST   /api/v1/mobile/settings/users                      # Oluştur
PUT    /api/v1/mobile/settings/users/{id}                 # Güncelle
DELETE /api/v1/mobile/settings/users/{id}                 # Sil
```

### Yardımcı Endpointler
```
GET    /api/v1/mobile/settings/users/meta/roles           # Rolleri getir
GET    /api/v1/mobile/settings/users/meta/limits          # Limitleri getir
```

### Davet İşlemleri
```
GET    /api/v1/mobile/settings/users/invitations/pending  # Bekleyen davetler
POST   /api/v1/mobile/settings/users/invitations/send     # Davet gönder
POST   /api/v1/mobile/settings/users/invitations/{id}/resend  # Yeniden gönder
DELETE /api/v1/mobile/settings/users/invitations/{id}     # İptal et
```

## 🚀 Kullanım

### Navigation Setup

```typescript
// App.tsx veya navigation dosyanızda
import { UserManagementScreen, UserFormScreen, UserInvitationsScreen } from './screens/settings';

const SettingsStack = createStackNavigator();

function SettingsStackScreen() {
  return (
    <SettingsStack.Navigator>
      <SettingsStack.Screen
        name="UserManagement"
        component={UserManagementScreen}
        options={{ title: 'Kullanıcı Yönetimi' }}
      />
      <SettingsStack.Screen
        name="UserForm"
        component={UserFormScreen}
        options={{ title: 'Kullanıcı Formu' }}
      />
      <SettingsStack.Screen
        name="UserInvitations"
        component={UserInvitationsScreen}
        options={{ title: 'Kullanıcı Davetleri' }}
      />
    </SettingsStack.Navigator>
  );
}
```

### API Client Setup

API client'ınızın base URL'ini doğru yapılandırdığınızdan emin olun:

```typescript
// src/services/api/client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'https://your-api-domain.com/api/v1/mobile',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Sanctum token interceptor
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken(); // Token storage'dan al
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Örnek Kullanım

```typescript
// Settings menüsünden erişim
<TouchableOpacity onPress={() => navigation.navigate('UserManagement')}>
  <Text>Kullanıcı Yönetimi</Text>
</TouchableOpacity>
```

## 🎨 Tasarım

### Renk Paleti
Proje genelinde kullanılan `colors` constant'ını kullanır:
- **Primary**: Yeşil tema (#13452d)
- **Success**: Yeşil (#10b981)
- **Warning**: Turuncu (#f59e0b)
- **Danger**: Kırmızı (#ef4444)
- **Info**: Mavi (#3b82f6)
- **Gray**: Gri tonları

### Responsive Tasarım
- ✅ iOS ve Android uyumlu
- ✅ Farklı ekran boyutları desteklenir
- ✅ Landscape mode uyumlu

## 🔐 Güvenlik

### İzin Kontrolleri
Backend tarafında Laravel Policy ile kontrol edilir:
- `settings.users.view` - Liste görüntüleme
- `settings.users.invite` - Davet gönderme
- `settings.users.edit` - Düzenleme
- `settings.users.delete` - Silme

### Korumalı İşlemler
- İlk kullanıcı (ID: 1) silinemez ve rolü değiştirilemez
- Kullanıcı kendini silemez
- Kullanıcı limiti aşılamaz

## 📝 Validasyon Kuralları

### Kullanıcı Oluşturma
- **Ad Soyad**: Zorunlu, max 255 karakter
- **E-posta**: Zorunlu, geçerli format, unique
- **Şifre**: Zorunlu, min 8 karakter, confirmation eşleşmeli
- **Roller**: Opsiyonel (Süper Admin için)

### Kullanıcı Düzenleme
- **Ad Soyad**: Zorunlu, max 255 karakter
- **E-posta**: Zorunlu, geçerli format, unique (mevcut kullanıcı hariç)
- **Şifre**: Opsiyonel, min 8 karakter, confirmation eşleşmeli
- **Roller**: Opsiyonel (Süper Admin için, ID 1 hariç)

### Davet Gönderme
- **E-postalar**: Zorunlu, `;` ile ayrılmış, max 50 adet
- **Roller**: Zorunlu, en az 1 rol seçilmeli

## 🧪 Test Senaryoları

### Manuel Test Checklist
- [ ] Kullanıcı listesi yükleniyor
- [ ] Arama çalışıyor (debounced)
- [ ] Role göre filtreleme çalışıyor
- [ ] Pagination çalışıyor
- [ ] Yeni kullanıcı oluşturuluyor
- [ ] Kullanıcı düzenleniyor
- [ ] Kullanıcı siliniyor
- [ ] İlk kullanıcı koruması çalışıyor
- [ ] Davet gönderiliyor (tekli)
- [ ] Davet gönderiliyor (çoklu)
- [ ] Davet yeniden gönderiliyor
- [ ] Davet iptal ediliyor
- [ ] Kullanıcı limiti kontrolü çalışıyor
- [ ] Error handling doğru çalışıyor

## 🐛 Bilinen Sorunlar

Şu anda bilinen bir sorun yok.

## 📦 Bağımlılıklar

```json
{
  "@react-navigation/native": "^6.x",
  "@react-navigation/stack": "^6.x",
  "react-native-vector-icons": "^10.x",
  "axios": "^1.x"
}
```

## 🔄 Versiyon Geçmişi

### v1.0.0 (2026-01-28)
- ✅ İlk sürüm
- ✅ Tüm CRUD işlemleri
- ✅ Davet sistemi
- ✅ Rol yönetimi
- ✅ Kullanıcı limitleri

## 📞 Destek

Sorun bildirmek veya öneride bulunmak için lütfen backend geliştirici ile iletişime geçin.

## 📄 Lisans

Bu modül Loggerise projesi kapsamında geliştirilmiştir.
