# Google OAuth - Hızlı Kurulum (Mevcut Proje Kullanarak)

Mevcut Google Cloud projeniz var: **loggerise-login**
Web Client ID: `729255118841-mtgt26tjv5lb0ngbk27ckabr5os0p77n.apps.googleusercontent.com`

Sadece eksikleri tamamlayalım!

---

## ✅ Mevcut Durum

- ✅ Google Cloud Projesi: `loggerise-login`
- ✅ Web Client ID: `729255118841-mtgt26tjv5lb0ngbk27ckabr5os0p77n`
- ✅ OAuth Consent Screen: Yapılandırılmış

---

## 📱 Yapılması Gerekenler

### 1️⃣ Expo Username'i Öğren

```bash
npx expo whoami
```

Bu komutu çalıştır ve username'i not et. Örnek: `loggerise` veya `ufukm`

---

### 2️⃣ Web Client'a Redirect URI Ekle

1. **Google Cloud Console'a Git**
   - https://console.cloud.google.com
   - Proje: `loggerise-login` seçili olsun

2. **APIs & Services → Credentials**

3. **Web Client'ı Düzenle**
   - `729255118841-mtgt26tjv5lb0ngbk27ckabr5os0p77n` isimli credential'a tıkla

4. **Authorized redirect URIs'a EKLEYİN:**
   ```
   https://auth.expo.io/@YOUR_EXPO_USERNAME/loggerise-lojistik-erp
   ```

   > `YOUR_EXPO_USERNAME` yerine 1. adımda öğrendiğiniz username'i yazın!

5. **SAVE**

---

### 3️⃣ Android Client ID Oluştur

1. **Credentials → CREATE CREDENTIALS → OAuth client ID**

2. **Application type:** Android

3. **Name:** `Loggerise Android`

4. **Package name:** `com.loggerise.erp`

5. **SHA-1 certificate fingerprint:**

   **DEBUG için (geliştirme):**
   ```bash
   keytool -list -v -keystore %USERPROFILE%\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```

   Çıktıdan `SHA1` satırını kopyala, örnek:
   ```
   SHA1: A1:B2:C3:D4:E5:F6:...
   ```

6. **CREATE**

7. **Client ID'yi KOPYALA** (örnek: `729255118841-xxxxxx.apps.googleusercontent.com`)

---

### 4️⃣ iOS Client ID Oluştur

1. **CREATE CREDENTIALS → OAuth client ID**

2. **Application type:** iOS

3. **Name:** `Loggerise iOS`

4. **Bundle ID:** `com.loggerise.erp`

5. **CREATE**

6. **Client ID'yi KOPYALA**

---

## 🔧 app.config.ts Güncelleme

`C:\loggerisemobil\app.config.ts` dosyasını aç ve şu değerleri güncelle:

```typescript
extra: {
  // Google OAuth Client IDs
  googleWebClientId: '729255118841-mtgt26tjv5lb0ngbk27ckabr5os0p77n.apps.googleusercontent.com',
  googleIosClientId: 'BURAYA_IOS_CLIENT_ID_YAPISTIR.apps.googleusercontent.com',
  googleAndroidClientId: 'BURAYA_ANDROID_CLIENT_ID_YAPISTIR.apps.googleusercontent.com',
  googleExpoClientId: '729255118841-mtgt26tjv5lb0ngbk27ckabr5os0p77n.apps.googleusercontent.com', // Web ID ile aynı
  // ...
}
```

> **NOT:** `googleExpoClientId` ve `googleWebClientId` aynı değer olacak (Web Client ID)

---

## ✅ Test

```bash
# Cache temizle
npx expo start -c

# QR kodu okut ve Google login'i test et
```

---

## 🎯 Özet Checklist

- [ ] Expo username öğrendim: `___________`
- [ ] Web Client'a Expo redirect URI ekledim
- [ ] Android Client ID oluşturdum: `___________`
- [ ] iOS Client ID oluşturdum: `___________`
- [ ] app.config.ts güncelledim
- [ ] `npx expo start -c` ile test ettim

---

## 🔍 Sorun Giderme

### "Invalid client" hatası
```bash
# Cache temizle ve yeniden başlat
npx expo start -c
```

### "Redirect URI mismatch"
- Expo username'i doğru yazdığından emin ol
- Slug ismi: `loggerise-lojistik-erp` (app.config.ts'de)

### Android'de çalışmıyor
```bash
# SHA-1 fingerprint'i tekrar kontrol et
keytool -list -v -keystore %USERPROFILE%\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android
```

---

**Şu anda:** Web Client ID zaten çalışıyor ✅
**Yapman gereken:** Android ve iOS Client ID'leri oluşturup app.config.ts'ye eklemek! 🚀
