/**
 * Loggy AI Constants and Types
 */

import {
  Building2,
  Package,
  Receipt,
  Banknote,
  Truck,
  Warehouse,
  Car,
  BarChart3,
  Users,
  FileText,
  Bell,
} from 'lucide-react-native';

export interface SuggestionCategory {
  id: string;
  label: string;
  icon: any;
  color: string;
  suggestions: {
    title: string;
    prompt: string;
    description: string;
  }[];
}

export const suggestionCategories: SuggestionCategory[] = [
  {
    id: 'contact',
    label: 'Cari',
    icon: Building2,
    color: '#3b82f6',
    suggestions: [
      {
        title: 'Cari Ara',
        prompt: 'ABC firmasını ara',
        description: 'Müşteri veya tedarikçi arama',
      },
      {
        title: 'Yeni Cari Ekle',
        prompt: 'XYZ Ltd. Şti. adında yeni bir müşteri ekle',
        description: 'Yeni müşteri/tedarikçi oluştur',
      },
      {
        title: 'Cari Bakiye',
        prompt: 'ABC firmasının bakiyesi ne kadar?',
        description: 'Alacak/borç durumu sorgula',
      },
    ],
  },
  {
    id: 'product',
    label: 'Ürün',
    icon: Package,
    color: '#10b981',
    suggestions: [
      {
        title: 'Ürün Ara',
        prompt: 'Monitör ürününü ara',
        description: 'Stok kalemlerinde arama',
      },
      {
        title: 'Stokta Ara',
        prompt: 'Stokta olan ürünleri listele',
        description: 'Sadece stokta olanlar',
      },
    ],
  },
  {
    id: 'invoice',
    label: 'Fatura',
    icon: Receipt,
    color: '#8b5cf6',
    suggestions: [
      {
        title: 'Fatura Ara',
        prompt: 'Son 10 satış faturasını göster',
        description: 'Fatura listesi ve filtreleme',
      },
      {
        title: 'Fatura Bakiye',
        prompt: 'FTR-2025-001 faturasının bakiyesi ne kadar?',
        description: 'Ödenen/kalan tutar sorgula',
      },
      {
        title: 'Satış Faturası Kes',
        prompt: 'ABC firmasına 100 adet kalem için satış faturası kes',
        description: 'Yeni satış faturası oluştur',
      },
      {
        title: 'Alış Faturası',
        prompt: 'XYZ firmasından 50 adet monitör aldım, alış faturası oluştur',
        description: 'Yeni alış faturası oluştur',
      },
    ],
  },
  {
    id: 'payment',
    label: 'Ödeme',
    icon: Banknote,
    color: '#f59e0b',
    suggestions: [
      {
        title: 'Tahsilat Kaydet',
        prompt: 'FTR-2025-001 faturasına 5000 TL tahsilat kaydet',
        description: 'Satış faturası ödemesi al',
      },
      {
        title: 'Ödeme Yap',
        prompt: 'FTR-2025-002 faturasının tamamını öde',
        description: 'Alış faturası ödemesi yap',
      },
    ],
  },
  {
    id: 'logistics',
    label: 'Lojistik',
    icon: Truck,
    color: '#ef4444',
    suggestions: [
      {
        title: 'Yük Ara',
        prompt: 'YK-2025-001 numaralı yükü ara',
        description: 'Yük numarası veya detay ile arama',
      },
      {
        title: 'Yük Oluştur',
        prompt: "ABC firması için Almanya'ya ihracat yükü oluştur",
        description: 'Yeni sevkiyat kaydı',
      },
      {
        title: 'İthalat Yükü',
        prompt: 'XYZ firmasından ithalat yükü oluştur',
        description: 'İthalat sevkiyat kaydı',
      },
      {
        title: 'Planlanmamış Yükler',
        prompt: 'Araca atanmamış yükleri listele',
        description: 'Henüz planlanmamış sevkiyatlar',
      },
      {
        title: 'Yüke Kalem Ekle',
        prompt: 'YK-2025-001 yüküne 50 adet monitör ekle',
        description: 'Mevcut yüke ürün ekle',
      },
    ],
  },
  {
    id: 'stock',
    label: 'Stok',
    icon: Warehouse,
    color: '#14b8a6',
    suggestions: [
      {
        title: 'Stok Durumu',
        prompt: 'Laptop ürününün stok durumu nedir?',
        description: 'Anlık stok miktarı sorgula',
      },
      {
        title: 'Stok Hareketleri',
        prompt: 'Son 7 günde stok hareketlerini göster',
        description: 'Stok giriş/çıkış listesi',
      },
      {
        title: 'Stok Transferi',
        prompt: 'Ana depodan şube deposuna 50 adet monitör transfer et',
        description: 'Depolar arası transfer',
      },
    ],
  },
  {
    id: 'vehicle',
    label: 'Araç',
    icon: Car,
    color: '#f97316',
    suggestions: [
      {
        title: 'Araç Ara',
        prompt: '34 ABC plakalı aracı ara',
        description: 'Plaka veya marka ile arama',
      },
      {
        title: 'Araç Ekle',
        prompt: '34 XYZ 789 plakalı Mercedes Actros 2023 model çekici ekle',
        description: 'Yeni araç kaydı oluştur',
      },
      {
        title: 'Araç Durumu',
        prompt: '34 ABC 123 plakalı aracın durumu nedir?',
        description: 'Sigorta, muayene, bakım bilgileri',
      },
      {
        title: 'Bakım Kaydı',
        prompt: '34 ABC 123 plakalı araç için 150.000 km bakım kaydı oluştur',
        description: 'Yeni bakım kaydı ekle',
      },
    ],
  },
  {
    id: 'finance',
    label: 'Finans',
    icon: BarChart3,
    color: '#6366f1',
    suggestions: [
      {
        title: 'Gelir-Gider Raporu',
        prompt: 'Bu ayın gelir-gider raporunu göster',
        description: 'Aylık finansal özet',
      },
      {
        title: 'Kar-Zarar Raporu',
        prompt: '2025 yılının kar-zarar raporunu oluştur',
        description: 'Detaylı kar/zarar analizi',
      },
      {
        title: 'Vadesi Geçen Alacaklar',
        prompt: 'Vadesi geçmiş alacaklarımız ne kadar?',
        description: 'Yaşlandırma raporu',
      },
      {
        title: 'Nakit Akışı',
        prompt: 'Bu ayın nakit akış raporunu göster',
        description: 'Banka/kasa hareketleri',
      },
    ],
  },
  {
    id: 'hr',
    label: 'İK',
    icon: Users,
    color: '#ec4899',
    suggestions: [
      {
        title: 'Personel Ara',
        prompt: 'Ahmet Yılmaz adlı personeli ara',
        description: 'Ad veya pozisyona göre arama',
      },
      {
        title: 'Personel Ekle',
        prompt: 'Ali Veli adında yeni bir sürücü ekle. TC: 12345678901, Tel: 05551234567, E-posta: ali@firma.com',
        description: 'Yeni personel kaydı oluştur',
      },
      {
        title: 'Sürücü Belgeleri',
        prompt: "Ahmet Yılmaz'ın belge durumunu kontrol et",
        description: 'Ehliyet, SRC, ADR, vize durumu',
      },
      {
        title: 'Aktif Sürücüler',
        prompt: 'Aktif sürücüleri listele',
        description: 'Sürücü pozisyonundaki personeller',
      },
    ],
  },
  {
    id: 'uninvoiced',
    label: 'Faturasız Yük',
    icon: FileText,
    color: '#dc2626',
    suggestions: [
      {
        title: 'Faturasız Yükler',
        prompt: 'Faturası kesilmemiş yüklerimiz var mı?',
        description: 'Tamamlanmış ama faturalanmamış yükler',
      },
      {
        title: 'Kritik Yükler',
        prompt: '30 gündür faturalanmamış yükleri göster',
        description: 'Uzun süredir bekleyen yükler',
      },
      {
        title: 'Toplu Faturala',
        prompt: "ABC Lojistik'in tüm faturalanmamış yüklerini faturala",
        description: 'Müşterinin yüklerini toplu faturala',
      },
      {
        title: 'Gelir Raporu',
        prompt: 'Faturalanmamış toplam gelir ne kadar?',
        description: 'Faturalanmayı bekleyen gelir analizi',
      },
    ],
  },
  {
    id: 'reminder',
    label: 'Hatırlatıcı',
    icon: Bell,
    color: '#06b6d4',
    suggestions: [
      {
        title: 'Hatırlatıcı Oluştur',
        prompt: 'Yarın saat 14:00\'de ABC firmasını aramayı hatırlat',
        description: 'Belirli bir zaman için hatırlatıcı kur',
      },
      {
        title: 'Aktif Hatırlatıcılar',
        prompt: 'Aktif hatırlatıcılarımı göster',
        description: 'Bekleyen hatırlatıcıları listele',
      },
      {
        title: 'Hatırlatıcı İptal',
        prompt: '3 numaralı hatırlatıcıyı iptal et',
        description: 'Bir hatırlatıcıyı kaldır',
      },
      {
        title: 'Bugünkü Hatırlatıcılar',
        prompt: 'Bugün için hatırlatıcılarım var mı?',
        description: 'Günlük hatırlatıcı özeti',
      },
      {
        title: 'Fatura Hatırlatıcı',
        prompt: '1 hafta sonra FTR-2025-001 faturasının ödemesini hatırlat',
        description: 'Fatura takibi için hatırlatıcı',
      },
    ],
  },
];

export type ViewMode = 'list' | 'chat';
