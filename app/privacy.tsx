import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { PageHeader } from '@/components/navigation'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius,
  DashboardShadows
} from '@/constants/dashboard-theme'

export default function PrivacyScreen() {
  const sections = [
    {
      title: 'Topladığımız Bilgiler',
      content: 'Loggerise Mobile uygulamasını kullanırken, işletmenizin lojistik operasyonlarını yönetmek için gerekli olan iş verilerini topluyoruz. Bu veriler arasında araç, sürücü, yük ve müşteri bilgileri bulunmaktadır.'
    },
    {
      title: 'Bilgilerin Kullanımı',
      content: 'Topladığımız bilgileri yalnızca size hizmet sunmak, uygulamayı geliştirmek ve güvenliğinizi sağlamak amacıyla kullanıyoruz. Verileriniz, izniniz olmadan üçüncü taraflarla paylaşılmaz.'
    },
    {
      title: 'Veri Güvenliği',
      content: 'Verilerinizin güvenliği bizim için önceliklidir. Endüstri standardı şifreleme ve güvenlik protokolleri kullanarak bilgilerinizi koruyoruz.'
    },
    {
      title: 'Çerezler',
      content: 'Uygulama deneyiminizi iyileştirmek için çerezler ve benzer teknolojiler kullanıyoruz. Bu teknolojiler, tercihlerinizi hatırlamamıza ve size özelleştirilmiş bir deneyim sunmamıza yardımcı olur.'
    },
    {
      title: 'Konum Bilgileri',
      content: 'Araç ve yük takibi özelliklerini kullanabilmek için konum bilgilerinize erişim izni gerekebilir. Bu bilgiler sadece operasyonel amaçlarla kullanılır ve güvenli bir şekilde saklanır.'
    },
    {
      title: 'Haklarınız',
      content: 'Verilerinize erişme, düzeltme veya silme hakkına sahipsiniz. Bu haklarınızı kullanmak için destek ekibimizle iletişime geçebilirsiniz.'
    },
    {
      title: 'Politika Değişiklikleri',
      content: 'Bu gizlilik politikasını zaman zaman güncelleyebiliriz. Önemli değişiklikler olduğunda size bildirimde bulunacağız.'
    }
  ]

  return (
    <View style={styles.container}>
      <PageHeader
        title="Gizlilik Politikası"
        variant="compact"
        leftAction={{
          icon: 'arrow-back',
          onPress: () => router.back()
        }}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.headerCard, DashboardShadows.md]}>
          <Text style={styles.headerTitle}>Gizliliğiniz Önemli</Text>
          <Text style={styles.headerSubtitle}>
            Son Güncelleme: 1 Ocak 2024
          </Text>
          <Text style={styles.headerText}>
            Bu gizlilik politikası, Loggerise Mobile uygulamasını kullanırken
            kişisel bilgilerinizin nasıl toplandığını, kullanıldığını ve
            korunduğunu açıklamaktadır.
          </Text>
        </View>

        {sections.map((section, index) => (
          <View key={index} style={[styles.sectionCard, DashboardShadows.sm]}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}

        <View style={[styles.footerCard, DashboardShadows.md]}>
          <Text style={styles.footerText}>
            Bu politika ile ilgili sorularınız için{' '}
            <Text style={styles.footerLink}>info@loggerise.com</Text> adresinden
            bizimle iletişime geçebilirsiniz.
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DashboardColors.background
  },
  content: {
    flex: 1
  },
  contentContainer: {
    padding: DashboardSpacing.lg,
    paddingBottom: DashboardSpacing['3xl']
  },
  headerCard: {
    backgroundColor: DashboardColors.primary,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.xl,
    marginBottom: DashboardSpacing.lg
  },
  headerTitle: {
    fontSize: DashboardFontSizes['2xl'],
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: DashboardSpacing.xs
  },
  headerSubtitle: {
    fontSize: DashboardFontSizes.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: DashboardSpacing.md
  },
  headerText: {
    fontSize: DashboardFontSizes.base,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 24
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: DashboardBorderRadius.lg,
    padding: DashboardSpacing.lg,
    marginBottom: DashboardSpacing.md
  },
  sectionTitle: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '600',
    color: DashboardColors.text,
    marginBottom: DashboardSpacing.sm
  },
  sectionContent: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    lineHeight: 24
  },
  footerCard: {
    backgroundColor: `${DashboardColors.primary}15`,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.lg,
    marginTop: DashboardSpacing.lg
  },
  footerText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    lineHeight: 20
  },
  footerLink: {
    color: DashboardColors.primary,
    fontWeight: '600'
  }
})
