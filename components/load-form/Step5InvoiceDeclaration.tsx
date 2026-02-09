/**
 * Step5InvoiceDeclaration - Fatura ve Beyanname Bilgileri
 *
 * Web versiyonu ile %100 uyumlu - Tüm tarih alanları ve kur bilgisi
 */

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Card, Input, DateInput } from '@/components/ui'
import { SelectInput } from '@/components/ui/select-input'
import { CURRENCY_OPTIONS } from '@/constants/currencies'
import { DashboardColors, DashboardSpacing, DashboardFontSizes } from '@/constants/dashboard-theme'
import type { LoadFormData } from '@/services/endpoints/loads'
import api from '@/services/api'

interface Step5InvoiceDeclarationProps {
  data: LoadFormData
  updateFormData: (field: keyof LoadFormData, value: any) => void
}

// Teslim şartları seçenekleri - Web ile aynı (17 seçenek)
const DELIVERY_TERMS_OPTIONS = [
  { label: 'CAD - Belgeye Karşı Ödeme', value: 'CAD' },
  { label: 'CAG - Mala Karşı Ödeme', value: 'CAG' },
  { label: 'CFA - Navlun Dahil', value: 'CFA' },
  { label: 'CFR - Navlun Dahil', value: 'CFR' },
  { label: 'CIF - Navlun ve Sigorta Dahil', value: 'CIF' },
  { label: 'CIP - Taşıma ve Sigorta Ödenmiş', value: 'CIP' },
  { label: 'CPT - Taşıma Ödenmiş', value: 'CPT' },
  { label: 'DAF - Sınırda Teslim', value: 'DAF' },
  { label: 'DAP - Yerde Teslim', value: 'DAP' },
  { label: 'DDP - Gümrük Vergisi Ödenmiş Teslim', value: 'DDP' },
  { label: 'DDU - Gümrük Vergisi Ödenmemiş Teslim', value: 'DDU' },
  { label: 'DEQ - Rıhtımda Teslim', value: 'DEQ' },
  { label: 'DES - Gemide Teslim', value: 'DES' },
  { label: 'EXW - Fabrikada Teslim', value: 'EXW' },
  { label: 'FAS - Gemi Doğrultusunda Masrafsız', value: 'FAS' },
  { label: 'FCA - Taşıyıcıya Masrafsız', value: 'FCA' },
  { label: 'FOB - Gemide Masrafsız', value: 'FOB' },
]

export default function Step5InvoiceDeclaration({
  data,
  updateFormData,
}: Step5InvoiceDeclarationProps) {
  // Döviz kuru çekme fonksiyonu - Web ile aynı
  const fetchExchangeRate = async (currencyCode: string) => {
    if (currencyCode === 'TRY') {
      updateFormData('estimated_value_exchange_rate', '1')
      return
    }

    try {
      const response = await api.get(`/exchange-rates/latest/${currencyCode}`)
      if (response.data.success) {
        const rate = response.data.data.forex_selling
        updateFormData('estimated_value_exchange_rate', rate?.toString() || '1')
      }
    } catch (error) {
      if (__DEV__) console.error('Kur çekilirken hata:', error)
    }
  }

  // Para birimi değiştiğinde kur çek
  const handleCurrencyChange = (value: string) => {
    updateFormData('estimated_value_currency', value)
    fetchExchangeRate(value)
  }

  return (
    <View style={styles.container}>
      {/* Beyanname Bilgileri */}
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="document-text-outline" size={18} color={DashboardColors.primary} />
          <View>
            <Text style={styles.cardTitle}>Beyanname Bilgileri</Text>
            <Text style={styles.cardDescription}>
              Gümrük beyannamesi bilgileri
            </Text>
          </View>
        </View>

        <Input
          label="Beyanname No"
          placeholder="Örn: 2024123456"
          value={data.declaration_no || ''}
          onChangeText={(value) => updateFormData('declaration_no', value)}
        />

        {/* 2'li grid - Web ile aynı */}
        <View style={styles.row}>
          <View style={styles.flex1}>
            <DateInput
              label="Beyanname Sunulma Tarihi"
              placeholder="Tarih seçiniz"
              value={data.declaration_submission_date || ''}
              onChangeDate={(date) => updateFormData('declaration_submission_date', date)}
            />
          </View>
          <View style={styles.flex1}>
            <DateInput
              label="Hazır Bildirim Tarihi"
              placeholder="Tarih seçiniz"
              value={data.declaration_ready_date || ''}
              onChangeDate={(date) => updateFormData('declaration_ready_date', date)}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.flex1}>
            <DateInput
              label="Fiziki Muayene Tarihi"
              placeholder="Tarih seçiniz"
              value={data.declaration_inspection_date || ''}
              onChangeDate={(date) => updateFormData('declaration_inspection_date', date)}
            />
          </View>
          <View style={styles.flex1}>
            <DateInput
              label="Araç Çıkabilir Tarihi"
              placeholder="Tarih seçiniz"
              value={data.declaration_clearance_date || ''}
              onChangeDate={(date) => updateFormData('declaration_clearance_date', date)}
            />
          </View>
        </View>
      </Card>

      {/* Fatura Bilgileri */}
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="receipt-outline" size={18} color={DashboardColors.info} />
          <View>
            <Text style={styles.cardTitle}>Fatura Bilgileri</Text>
            <Text style={styles.cardDescription}>
              Mal faturası ve bedel bilgileri
            </Text>
          </View>
        </View>

        {/* 2'li grid - Web ile aynı */}
        <View style={styles.row}>
          <View style={styles.flex1}>
            <Input
              label="Mal Fatura No"
              placeholder="Örn: INV-2024-001"
              value={data.cargo_invoice_no || ''}
              onChangeText={(value) => updateFormData('cargo_invoice_no', value)}
            />
          </View>
          <View style={styles.flex1}>
            <DateInput
              label="Fatura Tarihi"
              placeholder="Tarih seçiniz"
              value={data.cargo_invoice_date || ''}
              onChangeDate={(date) => updateFormData('cargo_invoice_date', date)}
            />
          </View>
        </View>

        {/* 3'lü grid - Mal Bedeli, Para Birimi, Döviz Kuru */}
        <View style={styles.row}>
          <View style={styles.flex2}>
            <Input
              label="Mal Bedeli"
              placeholder="0.00"
              value={data.estimated_cargo_value || ''}
              onChangeText={(value) => updateFormData('estimated_cargo_value', value)}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.flex1}>
            <SelectInput
              label="Para Birimi"
              placeholder="TRY"
              value={data.estimated_value_currency || 'TRY'}
              onValueChange={(value: string | number | null) => handleCurrencyChange(value as string)}
              options={CURRENCY_OPTIONS}
            />
          </View>
        </View>

        <Input
          label="Döviz Kuru"
          placeholder="1.0000"
          value={data.estimated_value_exchange_rate || ''}
          onChangeText={(value) => updateFormData('estimated_value_exchange_rate', value)}
          keyboardType="decimal-pad"
        />

        <SelectInput
          label="Teslim Şekli"
          placeholder="Seçiniz"
          value={data.delivery_terms || ''}
          onValueChange={(value) => updateFormData('delivery_terms', value)}
          options={DELIVERY_TERMS_OPTIONS}
        />
      </Card>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: DashboardSpacing.sm,
  },
  card: {
    padding: DashboardSpacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: DashboardSpacing.sm,
    marginBottom: DashboardSpacing.md,
  },
  cardTitle: {
    fontSize: DashboardFontSizes.md,
    fontWeight: '600',
    color: DashboardColors.text,
    marginBottom: 2,
  },
  cardDescription: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    gap: DashboardSpacing.sm,
  },
  flex1: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
})
