# Orkestra Şefi - Paralel Modül Modernizasyonu

Büyük refactoring görevlerini paralel agent'larla yönetir. Her agent fresh context ile çalışır.

## Kullanım

```
/orkestra <modül-adı> <referans-modül>
```

**Örnek:**
```
/orkestra fleet/logistics accounting/cash-register
```

## Ne Yapar?

1. **Analiz**: Modüldeki dosyaları tarar (index, new, [id], [id]/edit)
2. **Planlama**: Her dosya tipi için task oluşturur
3. **Paralel Çalışma**: Her modül için ayrı agent başlatır (fresh 200k context)
4. **Düzeltme**: SelectInput → SearchableSelectModal, ConfirmDialog düzeltmeleri
5. **Raporlama**: Detaylı özet raporu

## Agent Prompt Template

Her agent şu bilgilerle çalışır:
- ✅ CLAUDE.md kuralları
- ✅ Backend sadakat (mobile-api.php kontrol)
- ✅ Referans dosyalar (cash-register, invoices, bank)
- ✅ Spesifik görev (index/new/[id] modernizasyonu)
- ✅ Lint kontrol

## Özellikler

- **Fresh Context**: Her agent 200k token ile başlar
- **Paralel İşlem**: 3-4 agent aynı anda çalışır
- **Zero Overflow**: Context dolması olmaz
- **Auto-Fix**: Select ve Dialog otomatik düzeltilir

## Task Tracking

TaskCreate/TaskUpdate ile ilerleme takibi:
- Task #1: Module A modernizasyonu
- Task #2: Module B modernizasyonu
- Task #3: Düzeltmeler

## Referans Dosyalar

**Liste Sayfası:**
- app/accounting/cash-register/index.tsx
- PageHeader + AnimatedPressable + Skeleton

**Form Sayfası:**
- app/accounting/cash-register/new.tsx
- app/accounting/invoices/new.tsx
- LinearGradient + Animasyonlu orbs + SearchableSelectModal

**Detay Sayfası:**
- app/accounting/cash-register/[id].tsx
- app/accounting/bank/[id]/index.tsx
- SectionHeader + InfoRow + ConfirmDialog (BottomSheetModal)

## Kritik Kurallar

1. **Para Formatı**: formatCurrency() (YASAK: toLocaleString)
2. **Bildirimler**: Toast.show() (YASAK: Alert.alert)
3. **Animasyonlar**: Shadow'lu elementte giriş animasyonu YASAK
4. **Modal**: BottomSheetModal (YASAK: react-native Modal)
5. **Klavye**: KeyboardAwareScrollView (YASAK: KeyboardAvoidingView)
6. **Select**: SearchableSelectModal (YASAK: SelectInput)
7. **Dialog**: @/components/modals/ConfirmDialog (YASAK: @/components/ui/confirm-dialog)

## Backend Sadakat

**ASLA tahmin etme!** Önce kontrol et:
```
C:\Users\ufukm\Documents\GitHub\FlsV2
├── routes\mobile-api.php              # Endpoint URL, HTTP metot
├── app\Http\Controllers\Api\Mobile\   # Request/Response, Validation
├── database\migrations\               # Alan isimleri, tipler
└── resources\views\                   # Web form alanları
```

## Örnek Çıktı

```
🎼 ORKESTRA ŞEFİ BAŞLIYOR

📊 Analiz: fleet/tractor-trailer/
- index.tsx (Liste) - ESKİ TASARIM
- new.tsx (Form) - ESKİ TASARIM
- [id].tsx (Detay) - ESKİ TASARIM

🚀 Agent'lar Başlatılıyor (Paralel):
- Agent #1: Tractor-Trailer modernizasyonu
- Agent #2: Driver-Tractor modernizasyonu
- Agent #3: Tire-Warehouse modernizasyonu

✅ Tamamlandı: 9 dosya güncellendi
📋 Düzeltmeler: 6 dosya (Select + Dialog)
🎉 Toplam: 15 dosya, SIFIR context overflow
```

## Workflow

1. Kullanıcı `/orkestra fleet accounting/cash-register` çağırır
2. Claude Glob ile fleet modülünü tarar
3. Eski tasarımı tespit eder (FullScreenHeader, lucide-react-native)
4. Her modül için Task agent başlatır (paralel)
5. Agent'lar referans dosyalara bakarak günceller
6. Düzeltme agent'ı Select/Dialog kontrol eder
7. Final rapor sunulur

## Avantajlar

✅ **Hız**: Paralel işlem ile 3-4x hızlı
✅ **Kalite**: Her agent fresh context, daha az hata
✅ **Kontrol**: Task tracking ile şeffaf ilerleme
✅ **Tutarlılık**: Tüm agent'lar aynı kuralları takip eder
✅ **Ölçeklenebilir**: 100+ dosya bile sorunsuz

## Kısıtlamalar

- Terminal erişimi gerekli (git, npm)
- Backend repo erişimi önemli (FlsV2)
- Referans modül güncel olmalı

## Tips

- İlk önce küçük bir modülle test et
- Backend'i mutlaka kontrol ettir
- Lint sonuçlarını gözden geçir
- Gerekirse düzeltme agent'ı tekrar çalıştır
