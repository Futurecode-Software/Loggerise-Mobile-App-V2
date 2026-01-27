/**
 * Reports - Ana Rapor Listesi
 * Tüm raporlara erişim sağlayan ana sayfa
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { FullScreenHeader } from '@/components/header';
import { Brand, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import {
  TrendingUp,
  FileText,
  Users,
  Truck,
  ChevronRight,
} from 'lucide-react-native';

interface ReportItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  route: string;
}

const REPORTS: ReportItem[] = [
  {
    id: 'profit-loss',
    title: 'Kar/Zarar Analizi',
    description: 'Gelir, gider ve karlılık raporları',
    icon: <TrendingUp size={24} color={Brand.primary} />,
    iconColor: Brand.primary,
    iconBg: `${Brand.primary}15`,
    route: '/reports/profit-loss',
  },
  {
    id: 'kdv',
    title: 'KDV Raporu',
    description: 'KDV beyanı ve hesaplamaları',
    icon: <FileText size={24} color="#3B82F6" />,
    iconColor: '#3B82F6',
    iconBg: '#3B82F615',
    route: '/reports/kdv',
  },
  {
    id: 'contact',
    title: 'Cari Raporları',
    description: 'Alacak, borç ve yaşlandırma raporları',
    icon: <Users size={24} color="#8B5CF6" />,
    iconColor: '#8B5CF6',
    iconBg: '#8B5CF615',
    route: '/reports/contact',
  },
  {
    id: 'domestic',
    title: 'Yurtiçi Raporlar',
    description: 'Yurtiçi taşıma istatistikleri',
    icon: <Truck size={24} color="#F59E0B" />,
    iconColor: '#F59E0B',
    iconBg: '#F59E0B15',
    route: '/reports/domestic',
  },
];

export default function ReportsIndexScreen() {
  return (
    <View style={styles.container}>
      <FullScreenHeader title="Raporlar" subtitle="İş analitiği ve raporlama" />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {REPORTS.map((report) => (
            <TouchableOpacity
              key={report.id}
              style={styles.reportCard}
              onPress={() => router.push(report.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: report.iconBg }]}>
                {report.icon}
              </View>

              <View style={styles.reportContent}>
                <Text style={styles.reportTitle}>{report.title}</Text>
                <Text style={styles.reportDescription}>{report.description}</Text>
              </View>

              <ChevronRight size={20} color={Colors.light.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>📊 Rapor Bilgilendirmesi</Text>
          <Text style={styles.infoText}>
            Tüm raporlar gerçek zamanlı veriler üzerinden hesaplanmaktadır. İhtiyacınız olan raporu seçerek
            detaylı analizlere ulaşabilirsiniz.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.primary,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    ...Shadows.lg,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  grid: {
    gap: Spacing.md,
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: Spacing.lg,
    ...Shadows.sm,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportContent: {
    flex: 1,
  },
  reportTitle: {
    ...Typography.headingSM,
    color: Colors.light.text,
    marginBottom: 4,
  },
  reportDescription: {
    ...Typography.bodyXS,
    color: Colors.light.textSecondary,
  },
  infoCard: {
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    backgroundColor: `${Brand.primary}10`,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Brand.primary,
  },
  infoTitle: {
    ...Typography.headingSM,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  infoText: {
    ...Typography.bodySM,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
});
