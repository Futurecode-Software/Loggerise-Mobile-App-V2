import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { PageHeader } from '@/components/navigation'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius,
  DashboardShadows
} from '@/constants/dashboard-theme'

export default function HelpScreen() {
  const faqItems = [
    {
      question: 'Nasıl yeni yük oluşturabilirim?',
      answer: 'Yükler sekmesinden + butonuna tıklayarak yeni yük oluşturabilirsiniz.'
    },
    {
      question: 'Pozisyon nasıl atanır?',
      answer: 'Dispozisyon ekranından yüklerinizi sürücülere ve araçlara atayabilirsiniz.'
    },
    {
      question: 'Raporlara nasıl erişebilirim?',
      answer: 'Daha fazla sekmesinden Raporlar menüsüne girerek çeşitli raporları görüntüleyebilirsiniz.'
    },
    {
      question: 'Bildirimler nasıl çalışır?',
      answer: 'Önemli güncellemeler için push bildirimleri alırsınız. Ayarlardan bildirim tercihlerinizi değiştirebilirsiniz.'
    },
    {
      question: 'Şifremi nasıl değiştirebilirim?',
      answer: 'Profil > Şifre Değiştir menüsünden şifrenizi güncelleyebilirsiniz.'
    }
  ]

  return (
    <View style={styles.container}>
      <PageHeader
        title="Yardım ve Destek"
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
        <View style={[styles.contactCard, DashboardShadows.md]}>
          <View style={styles.contactIconContainer}>
            <Ionicons name="headset" size={32} color={DashboardColors.primary} />
          </View>
          <Text style={styles.contactTitle}>Destek Ekibi</Text>
          <Text style={styles.contactSubtitle}>
            Sorularınız için bizimle iletişime geçin
          </Text>
          <TouchableOpacity style={styles.contactButton} activeOpacity={0.7}>
            <Ionicons name="mail" size={18} color="#FFFFFF" />
            <Text style={styles.contactButtonText}>Destek Talebi Oluştur</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Sık Sorulan Sorular</Text>

        {faqItems.map((item, index) => (
          <View key={index} style={[styles.faqCard, DashboardShadows.sm]}>
            <View style={styles.faqQuestion}>
              <Ionicons name="help-circle" size={20} color={DashboardColors.primary} />
              <Text style={styles.faqQuestionText}>{item.question}</Text>
            </View>
            <Text style={styles.faqAnswer}>{item.answer}</Text>
          </View>
        ))}

        <View style={[styles.infoCard, DashboardShadows.md]}>
          <Text style={styles.infoTitle}>Daha fazla yardıma mı ihtiyacınız var?</Text>
          <Text style={styles.infoText}>
            Detaylı kullanım kılavuzu için web sitemizi ziyaret edebilir veya
            destek ekibimizle iletişime geçebilirsiniz.
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
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: 0,
    paddingBottom: DashboardSpacing['3xl']
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing['2xl'],
    marginBottom: DashboardSpacing.lg,
    alignItems: 'center'
  },
  contactIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${DashboardColors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.md
  },
  contactTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '700',
    color: DashboardColors.text,
    marginBottom: DashboardSpacing.xs
  },
  contactSubtitle: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    marginBottom: DashboardSpacing.lg,
    textAlign: 'center'
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    backgroundColor: DashboardColors.primary,
    paddingVertical: DashboardSpacing.md,
    paddingHorizontal: DashboardSpacing.xl,
    borderRadius: DashboardBorderRadius.full
  },
  contactButtonText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: '#FFFFFF'
  },
  sectionTitle: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '600',
    color: DashboardColors.text,
    marginBottom: DashboardSpacing.md
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: DashboardBorderRadius.lg,
    padding: DashboardSpacing.lg,
    marginBottom: DashboardSpacing.md
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: DashboardSpacing.sm,
    marginBottom: DashboardSpacing.sm
  },
  faqQuestionText: {
    flex: 1,
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.text
  },
  faqAnswer: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    lineHeight: 20,
    marginLeft: 28
  },
  infoCard: {
    backgroundColor: `${DashboardColors.primary}15`,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.lg,
    marginTop: DashboardSpacing.lg
  },
  infoTitle: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.text,
    marginBottom: DashboardSpacing.sm
  },
  infoText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    lineHeight: 20
  }
})
