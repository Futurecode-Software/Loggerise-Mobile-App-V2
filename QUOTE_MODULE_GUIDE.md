# Quote Module - Mobil Uygulama Kılavuzu

## ✅ Tamamlanan Özellikler

### 1. **Müşteri Arama (SearchableSelect Component)**
- ✅ Web'deki AsyncSelect gibi çalışır
- ✅ Yazarken otomatik arama (300ms debounce)
- ✅ Modal ile tam ekran arama deneyimi
- ✅ Müşteri kodu ve ismi gösterimi
- ✅ Seçili müşteri temizleme özelliği
- ✅ Boş/yükleniyor/hata durumları

### 2. **Yeni Teklif Oluşturma**
- ✅ Müşteri seçimi (arama ile)
- ✅ Teklif ve geçerlilik tarihleri
- ✅ Para birimi seçimi (TRY, USD, EUR, GBP)
- ✅ Otomatik kur güncellemesi
- ✅ KDV ayarları (dahil/hariç, oran)
- ✅ İndirim ayarları (yüzde/tutar)
- ✅ Dinamik yük kalemleri (ekle/sil)
- ✅ Notlar (şartlar, dahili, müşteri)
- ✅ Backend validation ile tam uyumluluk

### 3. **Teklif Detay Ekranı**
- ✅ Teklif özet bilgileri
- ✅ Durum badge'i (taslak, gönderildi, vb.)
- ✅ Fiyatlandırma detayları
- ✅ Yük kalemleri listesi
- ✅ Tarih bilgileri
- ✅ Notlar görüntüleme
- ✅ Aksiyonlar (gönder, kopyala, PDF, sil)

### 4. **Teklif Listesi**
- ✅ Sayfalama desteği
- ✅ Arama (teklif no, müşteri)
- ✅ Durum filtreleme
- ✅ Pull-to-refresh
- ✅ Sonsuz scroll

## 🎯 Kullanım

### Yeni Teklif Oluşturma

1. **Teklifler** listesinde sağ alt köşedeki **+** butonuna basın
2. **Müşteri** alanına tıklayın
3. Modal açılır, müşteri adını yazarak arayın
4. Müşteri seçin
5. Teklif tarihlerini girin
6. Para birimi ve kur bilgilerini kontrol edin
7. Yük kalemlerini ekleyin (+ butonu ile yeni kalem)
8. İsteğe bağlı: İndirim ve notları ekleyin
9. **Teklif Oluştur** butonuna basın

### Müşteri Arama

```typescript
// SearchableSelect kullanımı
<SearchableSelect
  label="Müşteri"
  placeholder="Müşteri seçiniz..."
  value={customerId}
  onValueChange={setCustomerId}
  loadOptions={loadCustomerOptions}
  required
/>

// loadOptions fonksiyonu
const loadCustomerOptions = async (searchQuery: string) => {
  const { contacts } = await getContacts({
    search: searchQuery,
    is_active: true,
    per_page: 20,
  });

  return contacts.map((contact) => ({
    label: contact.name,
    value: contact.id,
    subtitle: contact.code ? `Kod: ${contact.code}` : undefined,
  }));
};
```

## 🔄 Backend API Uyumluluğu

### Endpoint'ler
```
GET    /api/v1/mobile/quotes              - Liste
POST   /api/v1/mobile/quotes              - Yeni oluştur
GET    /api/v1/mobile/quotes/{id}         - Detay
PUT    /api/v1/mobile/quotes/{id}         - Güncelle
DELETE /api/v1/mobile/quotes/{id}         - Sil
PATCH  /api/v1/mobile/quotes/{id}/status  - Durum güncelle
POST   /api/v1/mobile/quotes/{id}/send    - Gönder
POST   /api/v1/mobile/quotes/{id}/duplicate - Kopyala
GET    /api/v1/mobile/quotes/{id}/pdf     - PDF indir
```

### Veri Yapısı (QuoteFormData)
```typescript
interface QuoteFormData {
  customer_id: number;              // ZORUNLU
  quote_date: string;               // ZORUNLU (YYYY-MM-DD)
  valid_until: string;              // ZORUNLU (YYYY-MM-DD)
  currency: CurrencyType;           // ZORUNLU
  exchange_rate: number;            // ZORUNLU
  include_vat?: boolean;            // Opsiyonel
  vat_rate?: number;                // Opsiyonel
  discount_percentage?: number;     // Opsiyonel
  discount_amount?: number;         // Opsiyonel
  terms_conditions?: string;        // Opsiyonel
  internal_notes?: string;          // Opsiyonel
  customer_notes?: string;          // Opsiyonel
  load_items: LoadItem[];           // ZORUNLU (min 1)
}

interface LoadItem {
  cargo_name: string;               // ZORUNLU
  cargo_name_foreign?: string;
  vehicle_type?: string;
  loading_type?: string;
  load_type?: 'full' | 'partial';
  transport_speed?: string;
  cargo_class?: string;
  freight_price: number;            // ZORUNLU
  items?: CargoItem[];
  addresses?: LoadAddress[];
}
```

## 📱 Component'ler

### SearchableSelect
Web'deki AsyncSelect component'inin mobil versiyonu.

**Özellikler:**
- Async veri yükleme
- Debounced arama (300ms)
- Modal tabanlı UI
- Seçili değer gösterimi
- Alt başlık desteği
- Clear button
- Loading/Empty states
- Keyboard handling

**Props:**
```typescript
interface SearchableSelectProps {
  label?: string;
  placeholder?: string;
  value?: string | number;
  onValueChange: (value: string | number) => void;
  loadOptions: (searchQuery: string) => Promise<SearchableSelectOption[]>;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  renderOption?: (option: SearchableSelectOption) => React.ReactNode;
}
```

## 🚀 Gelecek Geliştirmeler

- [ ] Yük kalemlerine adres ekleme
- [ ] Yük kalemlerine cargo item ekleme
- [ ] Teklif düzenleme ekranı
- [ ] Teklif durumu değiştirme
- [ ] PDF görüntüleme
- [ ] Teklifi yüklere dönüştürme
- [ ] Toplu teklif işlemleri
- [ ] Offline desteği

## 🔧 Teknik Detaylar

### Dosya Yapısı
```
loggerise_mobile_v2/
├── app/
│   ├── quotes.tsx              # Teklif listesi
│   └── quote/
│       ├── _layout.tsx         # Stack layout
│       ├── new.tsx             # Yeni teklif formu
│       └── [id].tsx            # Teklif detay
├── components/
│   └── ui/
│       └── searchable-select.tsx  # Arama component'i
└── services/
    └── endpoints/
        ├── quotes.ts           # Quote API
        └── contacts.ts         # Contact API
```

### Debounce Mekanizması
SearchableSelect component'i her tuş vuruşunda API çağrısı yapmaz:
```typescript
useEffect(() => {
  if (!isOpen) return;

  if (searchTimeoutRef.current) {
    clearTimeout(searchTimeoutRef.current);
  }

  searchTimeoutRef.current = setTimeout(() => {
    fetchOptions(searchQuery);
  }, 300); // 300ms bekle

  return () => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  };
}, [searchQuery, isOpen]);
```

## 🐛 Bilinen Sorunlar

Şu an bilinen bir sorun yok.

## 📞 Destek

Sorun yaşarsanız:
1. Backend API'nin çalıştığından emin olun
2. Network loglarını kontrol edin
3. Browser logs tool'unu kullanın (backend)
4. Console loglarını kontrol edin (mobile)
