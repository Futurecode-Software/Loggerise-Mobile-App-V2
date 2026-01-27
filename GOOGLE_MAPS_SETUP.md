# Google Maps & Address Management Setup

Bu doküman, cari adres yönetimi için eklenen Google Maps Places API entegrasyonunu ve gerekli kurulum adımlarını içerir.

## ✅ Yapılan Değişiklikler

### 1. **Yeni Dosyalar Oluşturuldu**

- **`services/endpoints/locations.ts`** - Location API endpoints (ülke, il, ilçe search)
- **`components/ui/LocationSelects.tsx`** - Ülke/İl/İlçe select komponentleri
- **`components/ui/GooglePlacesAutocomplete.tsx`** - Google Places autocomplete
- **`components/contact/address-form-sheet.tsx`** - Güncellendi (web ile aynı özellikler)

### 2. **Güncellenen Dosyalar**

- **`app.config.ts`** - Google Maps API key eklendi
- **`services/endpoints/contacts.ts`** - AddressFormData interface güncellendi
- **`components/ui/index.ts`** - Yeni komponentler export edildi

---

## 📦 Gerekli Paket Kurulumu

Aşağıdaki komutu çalıştırarak gerekli paketi kurun:

```bash
npm install react-native-google-places-autocomplete
```

**Paket Detayları:**
- **Paket:** `react-native-google-places-autocomplete`
- **Versiyon:** En son stable versiyon kullanılacak
- **Amaç:** React Native için Google Places API autocomplete

---

## 🔑 Google Maps API Key Doğrulama

`.env` dosyasında API key zaten mevcut:

```bash
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyDFqBEuFwiQ6CgeHHOZQsgAA8NEXhlSaRQ
```

✅ **app.config.ts**'de de eklendi:

```typescript
extra: {
  googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  // ...
}
```

---

## 🎯 Yeni Özellikler

### 1. **Google Maps Places Autocomplete**
- Adres arama (Google'dan otomatik tamamlama)
- Koordinat otomatik doldurma (latitude, longitude)
- place_id ve formatted_address kaydetme
- Ülke kısıtlaması (varsayılan: Türkiye)

### 2. **Ülke/İl/İlçe Select Komponentleri**
- Cascade dropdown (ülke → il → ilçe)
- Backend API entegrasyonu:
  - `GET /api/countries/search`
  - `GET /api/states/search?country_id=X`
  - `GET /api/cities/search?state_id=X`
- Arama özelliği (debounced)
- Modal-based UI (React Native native görünüm)

### 3. **Backend Location Lookup**
- Google'dan gelen adres bilgilerini database ID'lerine çevirir
- Endpoint: `POST /api/location/lookup`
- Otomatik ülke/il/ilçe eşleştirmesi

### 4. **Güncellenmiş Address Form**
Web'deki tüm özellikler artık mobilde de mevcut:
- ✅ Google Maps autocomplete
- ✅ Ülke/İl/İlçe seçimi (zorunlu)
- ✅ Koordinat kaydetme
- ✅ place_id ve formatted_address
- ✅ Fax alanı
- ✅ Ana adres, fatura, sevkiyat flags
- ✅ Varsayılan adres seçeneği

---

## 🚀 Kullanım

### Adres Ekleme/Düzenleme

Cari detay ekranında "Adres Ekle" butonuna tıklandığında:

1. **Google Maps ile Arama:**
   - Kullanıcı adres yazmaya başlar
   - Google Places önerileri gösterilir
   - Seçilen adres:
     - Koordinatları otomatik doldurur
     - Ülke/İl/İlçe'yi otomatik seçer (backend lookup ile)
     - Posta kodunu doldurur

2. **Manuel Girdi:**
   - Kullanıcı manuel olarak ülke/il/ilçe seçebilir
   - Dropdown'lar cascade çalışır
   - Arama özelliği vardır

3. **Kaydetme:**
   - Backend'e tüm bilgiler gönderilir:
     - Adres metni
     - Ülke/İl/İlçe ID'leri
     - Koordinatlar (latitude, longitude)
     - Google place_id ve formatted_address

---

## 🔧 Backend Gereksinimleri

### 1. **Location Lookup Endpoint (Yeni)**

Backend'de bu endpoint'i oluşturmanız gerekiyor:

```php
// routes/api.php
Route::post('/location/lookup', [LocationController::class, 'lookup']);

// LocationController.php
public function lookup(Request $request): JsonResponse
{
    $country = Country::where('name', $request->country_name)
        ->orWhere('code', $request->country_code)
        ->first();

    $state = null;
    if ($country && $request->state_name) {
        $state = State::where('country_id', $country->id)
            ->where('name', 'like', "%{$request->state_name}%")
            ->first();
    }

    $city = null;
    if ($state && $request->city_name) {
        $city = City::where('state_id', $state->id)
            ->where('name', 'like', "%{$request->city_name}%")
            ->first();
    }

    return response()->json([
        'success' => true,
        'data' => [
            'country_id' => $country?->id,
            'state_id' => $state?->id,
            'city_id' => $city?->id,
        ],
    ]);
}
```

### 2. **Location Search Endpoints (Zaten Var)**

Bu endpoint'ler web'de zaten mevcut, mobil de kullanıyor:

- `GET /api/countries/search?search=Türkiye`
- `GET /api/states/search?search=İstanbul&country_id=1`
- `GET /api/cities/search?search=Kadıköy&state_id=34`

### 3. **Contact Address Endpoints (Zaten Var)**

Backend'deki `MobileStoreContactAddressRequest` validation'ı zaten bu alanları destekliyor:

```php
// Mevcut backend validation
'title' => ['required', 'string', 'max:255'],
'address' => ['required', 'string'],
'country_id' => ['required', new ExistsInMainDatabase('countries')],
'state_id' => ['nullable', new ExistsInMainDatabase('states')],
'city_id' => ['nullable', new ExistsInMainDatabase('cities')],
'postal_code' => ['nullable', 'string', 'max:20'],
'phone' => ['nullable', 'string', 'max:255'],
'fax' => ['nullable', 'string', 'max:255'],
'latitude' => ['nullable', 'numeric'],
'longitude' => ['nullable', 'numeric'],
'place_id' => ['nullable', 'string'],
'formatted_address' => ['nullable', 'string'],
// ...
```

---

## 🧪 Test Adımları

### 1. Paket Kurulumu
```bash
cd /path/to/loggerise_mobile_v2
npm install react-native-google-places-autocomplete
```

### 2. Backend Location Lookup Endpoint'ini Ekle
Yukarıdaki `LocationController::lookup` metodunu backend'e ekleyin.

### 3. Uygulamayı Yeniden Başlat
```bash
npx expo start -c
```

### 4. Test Senaryosu
1. Uygulamayı aç
2. Bir cari detayına git
3. "Adresler" tab'ına tıkla
4. "Adres Ekle" butonuna tıkla
5. **Google Maps Testi:**
   - "Adres Ara (Google Maps)" alanına "Ankara" yaz
   - Öneriler görünmeli
   - Bir adres seç
   - Koordinatların otomatik doldurulduğunu gör
6. **Manuel Girdi Testi:**
   - Ülke seçimi yap (modal açılmalı)
   - İl seçimi yap
   - İlçe seçimi yap
7. **Kaydet:**
   - Form submit edilmeli
   - Backend'e tüm bilgiler gitmeli
   - Başarılı mesajı görünmeli

---

## 📱 Platform Desteği

- ✅ **iOS** - Google Places SDK
- ✅ **Android** - Google Places SDK
- ⚠️ **Web** - CORS proxy gerekebilir (development için)

---

## 🐛 Olası Sorunlar ve Çözümler

### 1. "Google Maps API key bulunamadı" Hatası

**Çözüm:**
- `.env` dosyasını kontrol edin
- `npx expo start -c` ile cache'i temizleyin
- `app.config.ts`'de key'in export edildiğini doğrulayın

### 2. Google Places Önerileri Görünmüyor

**Çözüm:**
- API key'in Places API'yi etkinleştirdiğinden emin olun
- Google Cloud Console'da Places API'nin aktif olduğunu kontrol edin
- Billing hesabının aktif olduğundan emin olun

### 3. Location Lookup Çalışmıyor

**Çözüm:**
- Backend'de `/api/location/lookup` endpoint'inin eklendiğini doğrulayın
- Network tab'dan request'i kontrol edin
- Backend log'larını inceleyin

### 4. Ülke/İl/İlçe Dropdown'ları Açılmıyor

**Çözüm:**
- Backend API endpoint'lerinin çalıştığını doğrulayın:
  - `/api/countries/search`
  - `/api/states/search`
  - `/api/cities/search`
- Network tab'dan response'ları kontrol edin

---

## 📚 Referanslar

- **Google Places API:** https://developers.google.com/maps/documentation/places/web-service
- **react-native-google-places-autocomplete:** https://github.com/FaridSafi/react-native-google-places-autocomplete
- **Backend API Docs:** `BACKEND_API_DOCUMENTATION.md`

---

## ✨ Özet

Web uygulamasındaki tüm adres yönetimi özellikleri artık mobil uygulamada da mevcut:

| Özellik | Web | Mobil |
|---------|-----|-------|
| Google Maps Autocomplete | ✅ | ✅ |
| Ülke/İl/İlçe Select | ✅ | ✅ |
| Koordinat Kaydetme | ✅ | ✅ |
| place_id & formatted_address | ✅ | ✅ |
| Location Lookup | ✅ | ✅ |
| Fax Alanı | ✅ | ✅ |
| Ana/Fatura/Sevkiyat Flags | ✅ | ✅ |

**Tek yapmanız gereken:**
1. `npm install react-native-google-places-autocomplete`
2. Backend'e location lookup endpoint'i eklemek

Başarılar! 🚀
