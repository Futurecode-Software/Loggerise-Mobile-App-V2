# Google OAuth Kurulum Rehberi

Google ile giriş yapma özelliği için Google Cloud Console'da OAuth yapılandırması gereklidir.

## 📋 Adım 1: Google Cloud Console

1. **Google Cloud Console'a Git**
   - https://console.cloud.google.com
   - Google hesabınızla giriş yapın

2. **Proje Oluştur**
   - Sol üst köşeden "Select a project" → "New Project"
   - Proje adı: `Loggerise Mobile`
   - Create butonuna tıklayın

## 🔑 Adım 2: OAuth Consent Screen

1. **APIs & Services → OAuth consent screen**
   - User Type: **External** seçin
   - CREATE butonuna tıklayın

2. **App Information**
   - App name: `Loggerise - Lojistik ERP`
   - User support email: E-posta adresinizi girin
   - App logo: (opsiyonel)

3. **App Domain (opsiyonel)**
   - Homepage: `https://erp.loggerise.com`

4. **Developer contact information**
   - Email addresses: E-posta adresinizi girin
   - SAVE AND CONTINUE

5. **Scopes**
   - ADD OR REMOVE SCOPES butonuna tıklayın
   - Şu scope'ları seçin:
     - `userinfo.email`
     - `userinfo.profile`
   - UPDATE → SAVE AND CONTINUE

6. **Test users** (Development aşamasında)
   - ADD USERS → Test kullanıcı email'lerini ekleyin
   - SAVE AND CONTINUE

7. **Summary**
   - BACK TO DASHBOARD

## 🔐 Adım 3: OAuth Client ID'ler Oluştur

### 3.1 Web Client ID (Ana ID - Tüm platformlar için)

1. **APIs & Services → Credentials**
2. **CREATE CREDENTIALS → OAuth client ID**
3. Application type: **Web application**
4. Name: `Loggerise Web Client`
5. **Authorized redirect URIs** ekleyin:
   ```
   https://auth.expo.io/@your-expo-username/loggerise-lojistik-erp
   ```

   > **ÖNEMLİ:** `your-expo-username` yerine kendi Expo kullanıcı adınızı yazın.
   > Expo kullanıcı adınızı öğrenmek için: `npx expo whoami`

6. CREATE
7. **Client ID'yi kopyalayın** (bu Web Client ID)

### 3.2 Android Client ID

1. **CREATE CREDENTIALS → OAuth client ID**
2. Application type: **Android**
3. Name: `Loggerise Android`
4. **Package name:** `com.loggerise.erp`
5. **SHA-1 certificate fingerprint almak için:**

   **Debug keystore için:**
   ```bash
   # Windows
   keytool -list -v -keystore %USERPROFILE%\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android

   # macOS/Linux
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```

   **Production keystore için (EAS Build):**
   ```bash
   # EAS Build otomatik keystore kullanıyorsa
   eas credentials
   # Select Android → Keystore → Download
   # Sonra indirilen keystore için:
   keytool -list -v -keystore ./production.keystore
   ```

6. SHA-1'i yapıştırın
7. CREATE
8. **Client ID'yi kopyalayın** (bu Android Client ID)

### 3.3 iOS Client ID

1. **CREATE CREDENTIALS → OAuth client ID**
2. Application type: **iOS**
3. Name: `Loggerise iOS`
4. **Bundle ID:** `com.loggerise.erp`
5. CREATE
6. **Client ID'yi kopyalayın** (bu iOS Client ID)

## 📱 Adım 4: Expo Client ID (Expo Go için)

Expo Go'da test etmek için ayrı bir Web Client ID daha oluşturun:

1. **CREATE CREDENTIALS → OAuth client ID**
2. Application type: **Web application**
3. Name: `Loggerise Expo Client`
4. **Authorized redirect URIs:**
   ```
   https://auth.expo.io/@your-expo-username/loggerise-lojistik-erp
   ```
5. CREATE
6. **Client ID'yi kopyalayın** (bu Expo Client ID)

## 🔧 Adım 5: app.config.ts Güncelleme

`app.config.ts` dosyasındaki Google Client ID'leri güncelleyin:

```typescript
extra: {
  // Google OAuth Client IDs
  googleWebClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  googleIosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
  googleAndroidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  googleExpoClientId: 'YOUR_EXPO_CLIENT_ID.apps.googleusercontent.com',
  // ...
}
```

> **GERÇEK DEĞERLERİ KULLANIN!** Şu anda placeholder'lar var, yukarıda oluşturduğunuz Client ID'leri yapıştırın.

## ✅ Adım 6: Test

### Expo Go ile Test
```bash
npx expo start
```
- QR kodu okutun
- Login ekranında "Google ile Devam Et" butonuna tıklayın

### Development Build ile Test
```bash
# Android
npx expo run:android

# iOS
npx expo run:ios
```

### Production Build (EAS)
```bash
# Preview build
eas build --profile preview --platform android

# Production build
eas build --profile production --platform all
```

## 🚀 Production'a Almak İçin

1. **OAuth Consent Screen'i Yayınla**
   - OAuth consent screen → PUBLISH APP
   - Google verification süreci başlar (1-2 hafta sürebilir)

2. **Scopes'ları Minimize Et**
   - Sadece `userinfo.email` ve `userinfo.profile` yeterli

3. **Privacy Policy & Terms of Service**
   - Uygulama store'da yayınlanacaksa gereklidir
   - OAuth consent screen'de URL'leri güncelleyin

## 🔍 Sorun Giderme

### "Invalid client" hatası
- Client ID'lerin doğru kopyalandığından emin olun
- app.config.ts'deki değerleri kontrol edin
- `npx expo start -c` ile cache temizleyin

### "Redirect URI mismatch" hatası
- Expo username'i doğru mu kontrol edin (`npx expo whoami`)
- Redirect URI'da slug isminin doğru olduğundan emin olun
- Google Cloud Console'da redirect URI'ı tekrar ekleyin

### Android'de çalışmıyor
- SHA-1 fingerprint doğru mu kontrol edin
- Package name `com.loggerise.erp` olmalı
- Android Client ID doğru kopyalanmış mı kontrol edin

### iOS'ta çalışmıyor
- Bundle ID `com.loggerise.erp` olmalı
- iOS Client ID doğru kopyalanmış mı kontrol edin

## 📚 Ek Kaynaklar

- [Expo Google Sign-In Docs](https://docs.expo.dev/guides/google-authentication/)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [EAS Build Credentials](https://docs.expo.dev/app-signing/managed-credentials/)

---

**Kurulum tamamlandıktan sonra bu dosyayı silebilirsiniz.**
