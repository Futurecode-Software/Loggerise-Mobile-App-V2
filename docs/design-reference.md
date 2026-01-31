# UI/UX Tasarım Referansı Kullanım Kılavuzu

## ⭐ Proje Önceliği

**EN ÖNEMLİ GÖREV:** Bu uygulamanın kritik önceliği, referans uygulama (`C:\LoggeriseMobileV3`) ile **sayfa sayfa tasarımsal güncellemeler** yapmaktır.

## Temel İlkeler

### 1. Birebir Kopyalama Zorunluluğu

❌ **YAPMA:**
- Kendi yorumunu katma
- "Daha iyi olur" diye değişiklik yapma
- Yaratıcı olmaya çalışma
- Modernize etmeye çalışma

✅ **YAP:**
- Referans uygulamadaki tasarımı **pixel-perfect** kopyala
- Tüm style değerlerini birebir al
- Komponent yapısını aynı şekilde kur
- Belirsizlik varsa kullanıcıya sor

### 2. Kontrol Edilmesi Gereken Her Şey

Her sayfa güncellemesinde aşağıdaki liste **tamamen** kontrol edilmelidir:

#### Layout & Yapı
- [ ] Container yapısı (flex, backgroundColor)
- [ ] Content wrapper (borderRadius, padding)
- [ ] ScrollView/FlatList yapısı
- [ ] Komponent hiyerarşisi
- [ ] Grid/column yapısı (varsa)

#### Renkler
- [ ] Background colors (tüm seviyeler)
- [ ] Text colors (başlık, alt başlık, body)
- [ ] Border colors
- [ ] Icon colors
- [ ] Badge/chip colors
- [ ] Gradient değerleri

#### Spacing (Boşluklar)
- [ ] Padding değerleri (top, bottom, left, right)
- [ ] Margin değerleri
- [ ] Gap değerleri (flex gap)
- [ ] Komponentler arası boşluklar
- [ ] İçerik kenar boşlukları

#### Typography
- [ ] Font sizes (tüm text elementleri)
- [ ] Font weights
- [ ] Line heights
- [ ] Letter spacing
- [ ] Text alignment
- [ ] Text transform (uppercase, capitalize)

#### Görsel Detaylar
- [ ] Border radius (köşe yuvarlaklıkları)
- [ ] Shadow/elevation değerleri
- [ ] Border width ve style
- [ ] Opacity değerleri
- [ ] Icon boyutları
- [ ] Image/avatar boyutları

#### Interaktif Elementler
- [ ] Button stilleri
- [ ] Input field stilleri
- [ ] Touchable feedback
- [ ] Disabled states
- [ ] Loading states
- [ ] Error states

## Workflow: Sayfa Güncellemesi

### Adım 1: Referans Analizi

```bash
# 1. Referans dosyayı bul ve oku
# Örnek: Liste sayfası güncellenecekse
# C:\LoggeriseMobileV3\app\products\index.tsx

# 2. Claude Code ile dosyayı oku
Read tool ile referans dosyayı oku

# 3. Şunları not et:
# - Komponent yapısı
# - Style tanımları
# - Kullanılan componentler
# - Renk paleti
# - Spacing değerleri
```

### Adım 2: Görsel Karşılaştırma

```bash
# 1. Referans uygulamayı çalıştır
cd C:\LoggeriseMobileV3
npx expo start

# 2. İlgili sayfanın screenshot'ını al

# 3. Mevcut uygulamayı çalıştır
cd C:\LoggeriseMobile
npx expo start

# 4. Karşılaştırma yap ve farkları listele
```

### Adım 3: Komponent Mapping

Referans uygulamadaki komponent yapısını çıkar:

```typescript
// REFERANS UYGULAMADAN
<View style={styles.container}>
  <PageHeader
    title="Ürünler"
    rightAction={{
      icon: 'add',
      onPress: handleNew
    }}
  />
  <View style={styles.content}>
    <FlatList
      data={products}
      renderItem={({ item }) => <ProductCard product={item} />}
      contentContainerStyle={styles.listContent}
    />
  </View>
</View>

// STYLE DEĞERLERİ
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DashboardColors.primary
  },
  content: {
    flex: 1,
    backgroundColor: DashboardColors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16
  },
  listContent: {
    padding: 16,
    gap: 12
  }
})
```

### Adım 4: Style Migration

Tüm style değerlerini referanstan birebir kopyala:

```typescript
// ❌ YANLIŞ - Tahmin etme
card: {
  padding: 20,  // Tahmin
  margin: 15    // Tahmin
}

// ✅ DOĞRU - Referanstan al
card: {
  padding: 16,        // Referanstaki değer
  marginHorizontal: 16, // Referanstaki değer
  marginBottom: 12,   // Referanstaki değer
  borderRadius: 12,   // Referanstaki değer
  backgroundColor: '#FFFFFF',
  ...DashboardShadows.md  // Referanstaki shadow
}
```

### Adım 5: Doğrulama

Güncelleme tamamlandıktan sonra:

```bash
# 1. Lint kontrolü
npm run lint

# 2. Görsel karşılaştırma
# Referans ve mevcut uygulamayı yan yana aç
# Pixel-perfect eşleşmeyi doğrula

# 3. Checklist kontrolü
# Yukarıdaki "Kontrol Edilmesi Gereken Her Şey" listesini kontrol et

# 4. Test
# Sayfadaki tüm interaksiyon noktalarını test et
```

## Claude Code İçin Talimat Şablonları

### Liste Sayfası Güncellemesi

```
app/products/index.tsx sayfasını, referans uygulamadaki
(C:\LoggeriseMobileV3\app\products\index.tsx) ile birebir aynı tasarıma getir.

Adımlar:
1. Referans dosyayı oku
2. Komponent yapısını ve style değerlerini not et
3. Mevcut dosyayı referansa göre güncelle
4. Tüm style değerlerini (renk, spacing, typography) birebir kopyala
5. Lint kontrolü yap
```

### Detay Sayfası Güncellemesi

```
app/products/[id]/index.tsx detay sayfasını, referans uygulamadaki
(C:\LoggeriseMobileV3\app\products\[id]\index.tsx) ile birebir aynı tasarıma getir.

Dikkat edilmesi gerekenler:
- Header gradient değerleri
- Info section layout
- Badge stilleri
- Skeleton loading stilleri
- Tüm spacing ve typography değerleri
```

### Form Sayfası Güncellemesi

```
app/products/new.tsx form sayfasını, referans uygulamadaki
(C:\LoggeriseMobileV3\app\products\new.tsx) ile birebir aynı tasarıma getir.

Dikkat edilmesi gerekenler:
- Input field stilleri (height, padding, borderRadius)
- Label stilleri
- Button stilleri
- Form layout ve spacing
- Klavye davranışı (KeyboardAwareScrollView)
```

## Component Güncellemesi

### Card Component

```typescript
// REFERANSTAN AL - Örnek ProductCard
<TouchableOpacity
  style={[styles.card, DashboardShadows.md]}
  onPress={onPress}
>
  {/* Header */}
  <View style={styles.header}>
    <View style={styles.iconContainer}>
      <Ionicons name="cube-outline" size={24} color={DashboardColors.primary} />
    </View>
    <View style={styles.headerContent}>
      <Text style={styles.name}>{product.name}</Text>
      <Text style={styles.code}>#{product.code}</Text>
    </View>
  </View>

  {/* Info Container */}
  <View style={styles.infoContainer}>
    <View style={styles.infoRow}>
      <Ionicons name="pricetag-outline" size={16} color={DashboardColors.textSecondary} />
      <Text style={styles.infoText}>{product.category}</Text>
    </View>
  </View>

  {/* Footer */}
  <View style={styles.footer}>
    <View style={styles.amountContainer}>
      <Text style={styles.amountLabel}>FİYAT</Text>
      <Text style={styles.amount}>{formatCurrency(product.price, 'TRY')}</Text>
    </View>
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{product.stock} adet</Text>
    </View>
  </View>
</TouchableOpacity>

// STYLE DEĞERLERİ - Referanstan birebir kopyala
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${DashboardColors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  headerContent: {
    flex: 1
  },
  name: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: DashboardColors.text,
    marginBottom: 2
  },
  code: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary
  },
  infoContainer: {
    gap: 8,
    marginBottom: 12
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  infoText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: DashboardColors.border
  },
  amountContainer: {
    gap: 2
  },
  amountLabel: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600',
    color: DashboardColors.textSecondary,
    textTransform: 'uppercase'
  },
  amount: {
    fontSize: DashboardFontSizes['2xl'],
    fontWeight: '800',
    color: DashboardColors.primary
  },
  badge: {
    backgroundColor: DashboardColors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100
  },
  badgeText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600',
    color: '#FFFFFF'
  }
})
```

## Sık Yapılan Hatalar

### ❌ Hata 1: Tahmin Etme

```typescript
// YANLIŞ
card: {
  padding: 20,  // "Yaklaşık 20 olmalı" diye tahmin ettim
  margin: 10    // "10-15 arası bir şey" diye tahmin ettim
}

// DOĞRU
card: {
  padding: 16,  // Referansta tam olarak 16
  marginHorizontal: 16,  // Referansta marginHorizontal: 16
  marginBottom: 12       // Referansta marginBottom: 12
}
```

### ❌ Hata 2: Kendi Yorumunu Katma

```typescript
// YANLIŞ - "Daha modern olur" diye değiştirme
card: {
  borderRadius: 16,  // Referansta 12 ama ben 16 yaptım
  padding: 20        // Referansta 16 ama ben 20 yaptım
}

// DOĞRU - Referansı birebir kopyala
card: {
  borderRadius: 12,  // Referanstaki gibi
  padding: 16        // Referanstaki gibi
}
```

### ❌ Hata 3: Eksik Detaylar

```typescript
// YANLIŞ - Bazı değerleri atladım
footer: {
  flexDirection: 'row',
  justifyContent: 'space-between'
  // paddingTop, borderTopWidth, borderTopColor eksik!
}

// DOĞRU - Tüm detayları kopyala
footer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingTop: 12,
  borderTopWidth: 1,
  borderTopColor: DashboardColors.border
}
```

### ❌ Hata 4: Renk Farklılıkları

```typescript
// YANLIŞ - Yakın renk kullandım
badge: {
  backgroundColor: '#2ecc71'  // Referansta DashboardColors.success var
}

// DOĞRU - Tam renk değerini kullan
badge: {
  backgroundColor: DashboardColors.success  // Referanstaki gibi
}
```

## Checklist: Her Sayfa İçin

Bir sayfa güncellemesi tamamlandığında aşağıdaki kontrolü yap:

- [ ] **Referans dosya okundu**
- [ ] **Komponent yapısı birebir aynı**
- [ ] **Container/wrapper yapısı aynı**
- [ ] **Tüm renk değerleri referansla eşleşiyor**
- [ ] **Tüm spacing değerleri (padding, margin, gap) aynı**
- [ ] **Typography (fontSize, fontWeight) birebir kopyalandı**
- [ ] **Border radius değerleri aynı**
- [ ] **Shadow/elevation değerleri aynı**
- [ ] **Icon boyutları ve konumları aynı**
- [ ] **Button stilleri referansla eşleşiyor**
- [ ] **Badge/chip stilleri aynı**
- [ ] **Görsel karşılaştırma yapıldı (yan yana ekran)**
- [ ] **Lint kontrolü geçti**
- [ ] **Tüm interaktif elementler test edildi**

## Özel Durumlar

### Referansta Olmayan Yeni Özellik

Eğer eklenmesi istenen bir özellik referans uygulamada yoksa:

1. **Kullanıcıya sor:** "Bu özellik referans uygulamada yok. Nasıl tasarlanmasını istersiniz?"
2. **Benzer komponent ara:** Referansta benzer bir komponent varsa ondan esin al
3. **Mevcut pattern'lere sadık kal:** Referanstaki genel tasarım dilini koru

### Referansta Farklı Versiyonlar

Eğer referans uygulamada aynı komponentin farklı versiyonları varsa:

1. **Kullanıcıya göster:** "Referansta 2 farklı versiyon var. Hangisini kullanmalıyım?"
2. **En güncel olanı seç:** Git commit tarihlerine bak
3. **Dokümantasyona bak:** Varsa proje dokümantasyonunda belirtilen versiyonu kullan

## Sonuç

**Hatırla:** Bu projede tasarım güncellemesi **en kritik görev**. Her sayfa pixel-perfect olmalı, tüm detaylar referans uygulamayla birebir eşleşmeli. Belirsizlik varsa kullanıcıya sor, tahmin etme!
