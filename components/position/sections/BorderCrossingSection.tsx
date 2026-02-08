/**
 * Border Crossing Section (Editable)
 *
 * Matches web version: resources/js/components/logistics-management/positions/BorderCrossing.tsx
 * Allows editing border exit, entry and seal information.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LogOut, LogIn, Lock } from 'lucide-react-native';
import { Card, Button, Input, DateInput } from '@/components/ui';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { Position, updatePosition } from '@/services/endpoints/positions';
import { showToast } from '@/utils/toast';

interface BorderCrossingSectionProps {
  position: Position;
  onUpdate: () => void;
}

interface FormData {
  border_exit_gate: string;
  border_exit_date: string;
  border_exit_manifest_no: string;
  border_exit_manifest_date: string;
  border_entry_gate: string;
  border_entry_date: string;
  border_entry_manifest_no: string;
  border_entry_manifest_date: string;
  seal_no: string;
  sealing_person: string;
}

export function BorderCrossingSection({ position, onUpdate }: BorderCrossingSectionProps) {
  const colors = Colors.light;

  // Helper function to format date for form
  const formatDateForForm = (date?: string | null): string => {
    if (!date) return '';
    try {
      return new Date(date).toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  // Form state
  const [formData, setFormData] = useState<FormData>({
    border_exit_gate: position.border_exit_gate || '',
    border_exit_date: formatDateForForm(position.border_exit_date),
    border_exit_manifest_no: position.border_exit_manifest_no || '',
    border_exit_manifest_date: formatDateForForm(position.border_exit_manifest_date),
    border_entry_gate: position.border_entry_gate || '',
    border_entry_date: formatDateForForm(position.border_entry_date),
    border_entry_manifest_no: position.border_entry_manifest_no || '',
    border_entry_manifest_date: formatDateForForm(position.border_entry_manifest_date),
    seal_no: position.seal_no || '',
    sealing_person: position.sealing_person || '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form when position changes
  useEffect(() => {
    setFormData({
      border_exit_gate: position.border_exit_gate || '',
      border_exit_date: formatDateForForm(position.border_exit_date),
      border_exit_manifest_no: position.border_exit_manifest_no || '',
      border_exit_manifest_date: formatDateForForm(position.border_exit_manifest_date),
      border_entry_gate: position.border_entry_gate || '',
      border_entry_date: formatDateForForm(position.border_entry_date),
      border_entry_manifest_no: position.border_entry_manifest_no || '',
      border_entry_manifest_date: formatDateForForm(position.border_entry_manifest_date),
      seal_no: position.seal_no || '',
      sealing_person: position.sealing_person || '',
    });
  }, [position]);

  // Reset form to original values
  const handleReset = () => {
    setFormData({
      border_exit_gate: position.border_exit_gate || '',
      border_exit_date: formatDateForForm(position.border_exit_date),
      border_exit_manifest_no: position.border_exit_manifest_no || '',
      border_exit_manifest_date: formatDateForForm(position.border_exit_manifest_date),
      border_entry_gate: position.border_entry_gate || '',
      border_entry_date: formatDateForForm(position.border_entry_date),
      border_entry_manifest_no: position.border_entry_manifest_no || '',
      border_entry_manifest_date: formatDateForForm(position.border_entry_manifest_date),
      seal_no: position.seal_no || '',
      sealing_person: position.sealing_person || '',
    });
    setErrors({});
  };

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    setErrors({});

    try {
      await updatePosition(position.id, {
        border_exit_gate: formData.border_exit_gate || undefined,
        border_exit_date: formData.border_exit_date || undefined,
        border_exit_manifest_no: formData.border_exit_manifest_no || undefined,
        border_exit_manifest_date: formData.border_exit_manifest_date || undefined,
        border_entry_gate: formData.border_entry_gate || undefined,
        border_entry_date: formData.border_entry_date || undefined,
        border_entry_manifest_no: formData.border_entry_manifest_no || undefined,
        border_entry_manifest_date: formData.border_entry_manifest_date || undefined,
        seal_no: formData.seal_no || undefined,
        sealing_person: formData.sealing_person || undefined,
      });

      showToast({
        type: 'success',
        message: 'Sınır geçiş bilgileri başarıyla güncellendi.',
      });

      onUpdate();
    } catch (error: any) {
      if (__DEV__) console.error('Update error:', error);

      // Handle validation errors
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }

      showToast({
        type: 'error',
        message: 'Bilgiler güncellenirken bir hata oluştu.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Border Exit Section */}
      <Card style={[styles.card, styles.exitCard]}>
        <View style={styles.sectionHeader}>
          <LogOut size={20} color="#DC2626" />
          <Text style={[styles.sectionTitle, { color: '#991B1B' }]}>Sınır Çıkış Bilgileri</Text>
        </View>

        {/* Exit Gate */}
        <Input
          label="Sınır Çıkış Kapısı"
          value={formData.border_exit_gate}
          onChangeText={(text) => setFormData((prev) => ({ ...prev, border_exit_gate: text }))}
          error={errors.border_exit_gate}
          placeholder="Kapı adı giriniz"
        />

        {/* Exit Date */}
        <DateInput
          label="Sınır Çıkış Tarihi"
          value={formData.border_exit_date}
          onChangeDate={(date) => setFormData((prev) => ({ ...prev, border_exit_date: date }))}
          error={errors.border_exit_date}
          placeholder="Tarih seçiniz"
        />

        {/* Exit Manifest No */}
        <Input
          label="Sınır Çıkış Manifesto No"
          value={formData.border_exit_manifest_no}
          onChangeText={(text) =>
            setFormData((prev) => ({ ...prev, border_exit_manifest_no: text }))
          }
          error={errors.border_exit_manifest_no}
          placeholder="Manifesto numarası"
        />

        {/* Exit Manifest Date */}
        <DateInput
          label="Sınır Çıkış Manifesto Tarihi"
          value={formData.border_exit_manifest_date}
          onChangeDate={(date) =>
            setFormData((prev) => ({ ...prev, border_exit_manifest_date: date }))
          }
          error={errors.border_exit_manifest_date}
          placeholder="Tarih seçiniz"
        />
      </Card>

      {/* Border Entry Section */}
      <Card style={[styles.card, styles.entryCard]}>
        <View style={styles.sectionHeader}>
          <LogIn size={20} color="#16A34A" />
          <Text style={[styles.sectionTitle, { color: '#166534' }]}>Sınır Giriş Bilgileri</Text>
        </View>

        {/* Entry Gate */}
        <Input
          label="Sınır Giriş Kapısı"
          value={formData.border_entry_gate}
          onChangeText={(text) => setFormData((prev) => ({ ...prev, border_entry_gate: text }))}
          error={errors.border_entry_gate}
          placeholder="Kapı adı giriniz"
        />

        {/* Entry Date */}
        <DateInput
          label="Sınır Giriş Tarihi"
          value={formData.border_entry_date}
          onChangeDate={(date) => setFormData((prev) => ({ ...prev, border_entry_date: date }))}
          error={errors.border_entry_date}
          placeholder="Tarih seçiniz"
        />

        {/* Entry Manifest No */}
        <Input
          label="Sınır Giriş Manifesto No"
          value={formData.border_entry_manifest_no}
          onChangeText={(text) =>
            setFormData((prev) => ({ ...prev, border_entry_manifest_no: text }))
          }
          error={errors.border_entry_manifest_no}
          placeholder="Manifesto numarası"
        />

        {/* Entry Manifest Date */}
        <DateInput
          label="Sınır Giriş Manifesto Tarihi"
          value={formData.border_entry_manifest_date}
          onChangeDate={(date) =>
            setFormData((prev) => ({ ...prev, border_entry_manifest_date: date }))
          }
          error={errors.border_entry_manifest_date}
          placeholder="Tarih seçiniz"
        />
      </Card>

      {/* Seal Section */}
      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <Lock size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Durum & Mühür</Text>
        </View>

        {/* Seal No */}
        <Input
          label="Mühür No"
          value={formData.seal_no}
          onChangeText={(text) => setFormData((prev) => ({ ...prev, seal_no: text }))}
          error={errors.seal_no}
          placeholder="Mühür numarası"
        />

        {/* Sealing Person */}
        <Input
          label="Mühürleyen Kişi"
          value={formData.sealing_person}
          onChangeText={(text) => setFormData((prev) => ({ ...prev, sealing_person: text }))}
          error={errors.sealing_person}
          placeholder="Mühürleyen kişi adı"
        />
      </Card>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          title="Değişiklikleri İptal Et"
          onPress={handleReset}
          variant="outline"
          disabled={isSaving}
          style={styles.cancelButton}
        />
        <Button
          title={isSaving ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
          onPress={handleSave}
          variant="primary"
          loading={isSaving}
          disabled={isSaving}
          style={styles.saveButton}
        />
      </View>

      {/* Bottom spacing */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  exitCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  entryCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.headingMD,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  bottomSpacer: {
    height: Spacing['2xl'],
  },
});
