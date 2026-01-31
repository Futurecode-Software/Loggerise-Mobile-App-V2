# Animasyon Kuralları

> **PAZARLIKSIZ EMİR:** Shadow içeren HİÇBİR elemana giriş animasyonu (FadeIn, FadeInDown, FadeInUp, vb.) uygulanmayacaktır. Bu kural kesindir ve istisnası yoktur.

## Yasak Durumlar

Shadow stiline sahip tüm elemanlar (kartlar, form elemanları, arama kutuları, container'lar vb.) **direkt olarak** render edilmelidir.

### YANLIŞ Kullanım

```typescript
// Shadow'lu kart animasyonlu giriş - YASAK
<Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
  <View style={[styles.card, DashboardShadows.md]}>
    ...
  </View>
</Animated.View>

// Animasyonlu form elemanı - YASAK
<Animated.View entering={FadeIn.delay(100).duration(300)} style={styles.searchContainer}>
  <TextInput ... />
</Animated.View>
```

### DOĞRU Kullanım

```typescript
// Shadow'lu kart direkt render - DOĞRU
<View style={[styles.card, DashboardShadows.md]}>
  ...
</View>

// Direkt render - DOĞRU
<View style={styles.searchContainer}>
  <TextInput ... />
</View>
```

## Neden Bu Kural?

Animasyonlu yükleme, shadow'lu elemanların görsel olarak kötü görünmesine ve kullanıcı deneyimini olumsuz etkilemesine neden olur. Shadow render edilirken titreme ve görsel artifactlar oluşur.

## İzin Verilen Animasyonlar

1. **Basma/Dokunma Animasyonları**
   - Scale değişimleri
   - Opacity değişimleri
   - Press feedback

2. **Sayfa Geçiş Animasyonları**
   - Stack navigator geçişleri
   - Tab navigator geçişleri

3. **Kullanıcı Etkileşimine Bağlı Animasyonlar**
   - Swipe gestureları
   - Pull-to-refresh
   - Scroll-based animasyonlar

## Örnek: Kart Basma Animasyonu (İzinli)

```typescript
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring
} from 'react-native-reanimated'

function Card({ children, onPress }) {
  const scale = useSharedValue(1)

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }))

  const handlePressIn = () => {
    scale.value = withSpring(0.98)
  }

  const handlePressOut = () => {
    scale.value = withSpring(1)
  }

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.card, DashboardShadows.md]}
      >
        {children}
      </Pressable>
    </Animated.View>
  )
}
```

## Kontrol Listesi

- [ ] Kart oluşturulurken `entering` prop yok
- [ ] Liste elemanlarında `FadeInDown` yok
- [ ] Form elemanlarında `FadeIn` yok
- [ ] Shadow'lu container'larda giriş animasyonu yok
- [ ] Sadece etkileşim animasyonları var
