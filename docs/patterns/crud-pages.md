# CRUD Sayfa Pattern'leri

> **REFERANS:** Bu pattern'ler `app/load/` ve `app/cash-register/` dizinlerinden referans alınmıştır.

## Klasör Yapısı

```
app/
  module-name/
    _layout.tsx           # Stack navigator, headerShown: false
    index.tsx             # Liste sayfası
    [id]/
      _layout.tsx         # İç stack navigator
      index.tsx           # Detay sayfası (READ)
      edit.tsx            # Düzenleme sayfası (UPDATE)
    new.tsx               # Yeni kayıt sayfası (CREATE)
```

## Container Standardı

Tüm sayfalar aşağıdaki container yapısını kullanmalıdır:

```typescript
// Ana container - Header ile aynı renk (gradient geçişi için)
container: {
  flex: 1,
  backgroundColor: DashboardColors.primary
}

// İçerik alanı - Arka plan rengi
content: {
  flex: 1,
  backgroundColor: DashboardColors.background
}
```

**Neden?**
- `PageHeader` gradient kullanır (#022920 → #044134 → #065f4a)
- Container'ın `DashboardColors.primary` olması kesintisiz geçiş sağlar

## Layout Konfigürasyonu

### Ana Layout (`app/module/_layout.tsx`)

```typescript
import { Stack } from 'expo-router'
import { DashboardColors } from '@/constants/dashboard-theme'

export default function ModuleLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: DashboardColors.background },
        animation: 'default'
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="new" />
    </Stack>
  )
}
```

### İç Layout (`app/module/[id]/_layout.tsx`)

```typescript
export default function DetailLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: DashboardColors.background },
        animation: 'default'
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="edit" />
    </Stack>
  )
}
```

## Liste Sayfası (index.tsx)

```typescript
import { PageHeader } from '@/components/navigation'

export default function ListScreen() {
  const router = useRouter()

  return (
    <View style={styles.container}>
      <PageHeader
        title="Modül Adı"
        icon="list-outline"
        subtitle="Açıklama metni"
        showBackButton
        onBackPress={() => router.back()}
        rightAction={{
          icon: 'add',
          onPress: handleNew
        }}
      />

      <View style={styles.content}>
        {/* Filtreler, liste içeriği */}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DashboardColors.primary
  },
  content: {
    flex: 1,
    backgroundColor: DashboardColors.background
  }
})
```

### Checklist

- [ ] Container: `backgroundColor: DashboardColors.primary`
- [ ] Content: `backgroundColor: DashboardColors.background`
- [ ] `PageHeader` component kullan
- [ ] `useFocusEffect` ile veri yenileme
- [ ] RefreshControl ile pull-to-refresh
- [ ] Pagination desteği
- [ ] Empty state
- [ ] Error state + retry button

## Detay Sayfası ([id]/index.tsx)

```typescript
export default function DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const deleteDialogRef = useRef<BottomSheetModal>(null)

  return (
    <View style={styles.container}>
      {/* Header - Her zaman görünür */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={['#022920', '#044134', '#065f4a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.glowOrb1} />
        {renderHeaderContent()}
        <View style={styles.bottomCurve} />
      </View>

      {/* İçerik */}
      <ScrollView refreshControl={<RefreshControl ... />}>
        {isLoading && <DetailSkeleton />}
        {error && <ErrorState />}
        {data && <ActualContent />}
      </ScrollView>

      <ConfirmDialog ref={deleteDialogRef} ... />
    </View>
  )
}
```

### Header Stilleri

```typescript
// Glow Orb
glowOrb1: {
  position: 'absolute',
  top: -40,
  right: -20,
  width: 140,
  height: 140,
  borderRadius: 70,
  backgroundColor: 'rgba(16, 185, 129, 0.12)'
}

// Bottom Curve
bottomCurve: {
  position: 'absolute',
  bottom: -1,
  left: 0,
  right: 0,
  height: 24,
  backgroundColor: DashboardColors.background,
  borderTopLeftRadius: DashboardBorderRadius['2xl'],
  borderTopRightRadius: DashboardBorderRadius['2xl']
}
```

### Checklist

- [ ] useLocalSearchParams ile ID alma
- [ ] Header her zaman render ediliyor
- [ ] LinearGradient header
- [ ] Glow orbs + bottomCurve efekti
- [ ] Skeleton loading state
- [ ] Error state + retry button
- [ ] `useFocusEffect` ile veri yenileme
- [ ] ConfirmDialog ile silme
- [ ] isMountedRef ile memory leak önleme

## useFocusEffect Pattern

Form sayfalarından geri dönüldüğünde veri yenilemesi için:

```typescript
import { useCallback } from 'react'
import { useFocusEffect } from 'expo-router'

// İlk yükleme
useEffect(() => {
  fetchData()
}, [id])

// Sayfa focus aldığında yenile
useFocusEffect(
  useCallback(() => {
    fetchData(false) // showLoading = false (sessiz yenileme)
  }, [id])
)
```

## Memory Leak Prevention

```typescript
const isMountedRef = useRef(true)

useEffect(() => {
  isMountedRef.current = true

  const fetchData = async () => {
    try {
      const data = await fetchAPI()
      if (isMountedRef.current) {
        setData(data)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message)
      }
    }
  }

  fetchData()

  return () => {
    isMountedRef.current = false
  }
}, [])
```
