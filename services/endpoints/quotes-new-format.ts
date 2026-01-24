/**
 * Quotes API - NEW FORMAT (Web Compatible)
 *
 * YENİ teklif oluşturma formatı - Web ile %100 uyumlu
 * Backend: MobileStoreQuoteRequest (güncellenmiş)
 */

/**
 * Pickup/Delivery Type enums
 */
export type PickupType = 'pre_transport' | 'direct_from_address' | 'customer_to_warehouse';
export type DeliveryType = 'deliver_to_address' | 'final_transport' | 'pickup_from_warehouse';

/**
 * Direction enum
 */
export type Direction = 'import' | 'export';

/**
 * Cargo item (düz liste - artık nested değil)
 */
export interface NewCargoItem {
  cargo_name: string; // ZORUNLU
  cargo_name_foreign?: string;
  package_type?: string;
  package_count?: number;
  piece_count?: number;
  gross_weight?: number;
  net_weight?: number;
  volumetric_weight?: number;
  lademetre_weight?: number;
  total_chargeable_weight?: number;
  width?: number;
  height?: number;
  length?: number;
  volume?: number;
  lademetre?: number;
  is_stackable?: boolean;
  stackable_rows?: number;
  is_hazardous?: boolean;
  hazmat_un_no?: string;
  hazmat_class?: string;
  hazmat_page_no?: string;
  hazmat_packing_group?: string;
  hazmat_flash_point?: number;
  hazmat_description?: string;
}

/**
 * Pricing item (fiyatlandırma kalemi)
 */
export interface PricingItem {
  description?: string;
  unit_price: number; // ZORUNLU
  quantity?: number;
  currency?: string;
  exchange_rate?: number;
}

/**
 * Yeni adres verisi (new_pickup_address / new_delivery_address)
 */
export interface NewAddressData {
  title: string; // ZORUNLU
  address: string; // ZORUNLU
  country_id: number; // ZORUNLU
  state_id?: number;
  city_id?: number;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  place_id?: string;
  formatted_address?: string;
}

/**
 * YENİ Quote Form Data (Web ile aynı)
 */
export interface NewQuoteFormData {
  // Temel Bilgiler - Step 1
  customer_id: number; // ZORUNLU
  customer?: {
    id: number;
    name: string;
    short_name?: string;
  }; // Müşteri bilgisi (preview için)
  quote_date: string; // ZORUNLU (YYYY-MM-DD)
  valid_until: string; // ZORUNLU (YYYY-MM-DD)

  // Transport Bilgileri - TEKLİF SEVİYESİNDE (Step 1)
  direction?: Direction;
  vehicle_type?: string;
  loading_type?: string; // normal, karisik
  load_type?: 'full' | 'partial'; // Komple/Parsiyel
  transport_speed?: string; // expres, normal
  cargo_class?: string;

  // Beyanname Bilgileri (opsiyonel - advanced)
  declaration_no?: string;
  declaration_submission_date?: string;
  declaration_ready_date?: string;
  declaration_inspection_date?: string;
  declaration_clearance_date?: string;

  // Fatura Bilgileri (opsiyonel - advanced)
  cargo_invoice_no?: string;
  cargo_invoice_date?: string;
  estimated_cargo_value?: number;
  estimated_value_currency?: string;
  delivery_terms?: string;

  // Gümrük Bilgileri (opsiyonel - advanced)
  gtip_hs_code?: string;
  atr_no?: string;
  regime_no?: string;

  // Cargo Items - Step 2 (düz liste)
  cargo_items: NewCargoItem[]; // ZORUNLU (min 1)

  // Adresler - Step 3
  pickup_type?: PickupType;
  delivery_type?: DeliveryType;

  // Mevcut adres ID veya yeni adres
  pickup_contact_address_id?: number;
  new_pickup_address?: NewAddressData;

  delivery_contact_address_id?: number;
  new_delivery_address?: NewAddressData;

  // Fiyatlandırma & Notlar - Step 4
  currency: string; // ZORUNLU
  exchange_rate: number; // ZORUNLU
  pricing_items?: PricingItem[];
  include_vat?: boolean;
  vat_rate?: number;
  discount_percentage?: number;
  discount_amount?: number;
  has_insurance?: boolean;
  terms_conditions?: string;
  internal_notes?: string;
  customer_notes?: string;

  // Action parameter (draft veya send)
  action?: 'draft' | 'send';
}

/**
 * Step bazlı validation helper
 */
export function validateStep(step: number, data: Partial<NewQuoteFormData>): string[] {
  const errors: string[] = [];

  switch (step) {
    case 1: // Temel Bilgiler
      if (!data.customer_id) errors.push('Müşteri seçimi zorunludur');
      if (!data.quote_date) errors.push('Teklif tarihi zorunludur');
      if (!data.valid_until) errors.push('Geçerlilik tarihi zorunludur');
      if (data.quote_date && data.valid_until && data.valid_until <= data.quote_date) {
        errors.push('Geçerlilik tarihi teklif tarihinden sonra olmalıdır');
      }
      break;

    case 2: // Cargo Items
      if (!data.cargo_items || data.cargo_items.length === 0) {
        errors.push('En az bir kargo kalemi eklenmelidir');
      } else {
        data.cargo_items.forEach((item, index) => {
          if (!item.cargo_name || item.cargo_name.trim() === '') {
            errors.push(`Kalem ${index + 1}: Mal adı zorunludur`);
          }
        });
      }
      break;

    case 3: // Adresler
      // Yükleme adresi: ya mevcut adres ID ya da yeni adres olmalı
      if (!data.pickup_contact_address_id && !data.new_pickup_address) {
        errors.push('Yükleme adresi seçilmeli veya yeni adres eklenmelidir');
      }
      if (data.new_pickup_address) {
        if (!data.new_pickup_address.title) errors.push('Yükleme adresi başlığı zorunludur');
        if (!data.new_pickup_address.address) errors.push('Yükleme açık adresi zorunludur');
        if (!data.new_pickup_address.country_id) errors.push('Yükleme ülkesi zorunludur');
      }

      // Teslimat adresi: ya mevcut adres ID ya da yeni adres olmalı
      if (!data.delivery_contact_address_id && !data.new_delivery_address) {
        errors.push('Teslimat adresi seçilmeli veya yeni adres eklenmelidir');
      }
      if (data.new_delivery_address) {
        if (!data.new_delivery_address.title) errors.push('Teslimat adresi başlığı zorunludur');
        if (!data.new_delivery_address.address) errors.push('Teslimat açık adresi zorunludur');
        if (!data.new_delivery_address.country_id) errors.push('Teslimat ülkesi zorunludur');
      }
      break;

    case 4: // Fiyatlandırma & Notlar
      if (!data.currency) errors.push('Para birimi zorunludur');
      if (!data.exchange_rate || data.exchange_rate <= 0) {
        errors.push('Döviz kuru zorunludur ve 0\'dan büyük olmalıdır');
      }
      break;

    case 5: // Önizleme (tüm validasyonlar)
      // Step 1-4 validasyonlarını birleştir
      errors.push(...validateStep(1, data));
      errors.push(...validateStep(2, data));
      errors.push(...validateStep(3, data));
      errors.push(...validateStep(4, data));
      break;
  }

  // Duplicate errors'ları kaldır
  return [...new Set(errors)];
}
