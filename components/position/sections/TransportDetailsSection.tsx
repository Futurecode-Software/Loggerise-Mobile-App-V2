/**
 * Transport Details Section (Editable)
 *
 * Allows editing RoRo and Train transport details.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ship, Train } from 'lucide-react-native';
import { Card, Button, Input, DateInput, Select } from '@/components/ui';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { Position, updatePosition, DeckType } from '@/services/endpoints/positions';
import { showToast } from '@/utils/toast';

interface TransportDetailsSectionProps {
  position: Position;
  onUpdate: () => void;
}

const DECK_TYPES: { label: string; value: DeckType }[] = [
  { label: 'Alt Güverte', value: 'alt_guverte' },
  { label: 'Üst Güverte', value: 'ust_guverte' },
];

export function TransportDetailsSection({ position, onUpdate }: TransportDetailsSectionProps) {
  const colors = Colors.light;
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // RoRo form data
  const [roroData, setRoroData] = useState({
    roro_booking_reference: position.roro_booking_reference || '',
    roro_voyage_number: position.roro_voyage_number || '',
    roro_cutoff_date: position.roro_cutoff_date
      ? new Date(position.roro_cutoff_date).toISOString().split('T')[0]
      : '',
    roro_departure_date: position.roro_departure_date
      ? new Date(position.roro_departure_date).toISOString().split('T')[0]
      : '',
    roro_arrival_date: position.roro_arrival_date
      ? new Date(position.roro_arrival_date).toISOString().split('T')[0]
      : '',
    roro_deck_type: position.roro_deck_type || '',
    roro_notes: position.roro_notes || '',
  });

  // Train form data
  const [trainData, setTrainData] = useState({
    train_voyage_number: position.train_voyage_number || '',
    train_wagon_number: position.train_wagon_number || '',
    train_seal_number: position.train_seal_number || '',
    train_departure_terminal: position.train_departure_terminal || '',
    train_departure_date: position.train_departure_date
      ? new Date(position.train_departure_date).toISOString().split('T')[0]
      : '',
    train_arrival_terminal: position.train_arrival_terminal || '',
    train_arrival_date: position.train_arrival_date
      ? new Date(position.train_arrival_date).toISOString().split('T')[0]
      : '',
  });

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updateData: Partial<Position> = {};

      if (position.is_roro) {
        Object.assign(updateData, roroData);
      }

      if (position.is_train) {
        Object.assign(updateData, trainData);
      }

      await updatePosition(position.id, updateData);
      showToast({ type: 'success', message: 'Taşıma bilgileri güncellendi' });
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Güncelleme başarısız',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!position.is_roro && !position.is_train) {
    return (
      <Card style={styles.card}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Bu pozisyon RoRo veya Tren taşımacılığı değil
        </Text>
      </Card>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* RoRo Section */}
      {position.is_roro && (
        <Card style={styles.card}>
          <View style={styles.header}>
            <Ship size={20} color={colors.primary} />
            <Text style={[styles.title, { color: colors.text }]}>RoRo Bilgileri</Text>
          </View>

          {isEditing ? (
            <View style={styles.form}>
              <Input
                label="Rezervasyon Referansı"
                value={roroData.roro_booking_reference}
                onChangeText={(text) =>
                  setRoroData({ ...roroData, roro_booking_reference: text })
                }
                placeholder="Rezervasyon numarası"
              />

              <Input
                label="Sefer Numarası"
                value={roroData.roro_voyage_number}
                onChangeText={(text) =>
                  setRoroData({ ...roroData, roro_voyage_number: text })
                }
                placeholder="Sefer no"
              />

              <Select
                label="Güverte Tipi"
                value={roroData.roro_deck_type}
                data={DECK_TYPES.map((d) => ({ label: d.label, value: d.value }))}
                onValueChange={(value) =>
                  setRoroData({ ...roroData, roro_deck_type: value as DeckType })
                }
                placeholder="Güverte seçiniz"
              />

              <DateInput
                label="Cut-off Tarihi"
                value={roroData.roro_cutoff_date}
                onChange={(value) =>
                  setRoroData({ ...roroData, roro_cutoff_date: value })
                }
              />

              <DateInput
                label="Kalkış Tarihi"
                value={roroData.roro_departure_date}
                onChange={(value) =>
                  setRoroData({ ...roroData, roro_departure_date: value })
                }
              />

              <DateInput
                label="Varış Tarihi"
                value={roroData.roro_arrival_date}
                onChange={(value) =>
                  setRoroData({ ...roroData, roro_arrival_date: value })
                }
              />

              <Input
                label="Notlar"
                value={roroData.roro_notes}
                onChangeText={(text) => setRoroData({ ...roroData, roro_notes: text })}
                multiline
                numberOfLines={3}
                placeholder="RoRo notları"
              />
            </View>
          ) : (
            <View style={styles.readOnly}>
              {position.roro_booking_reference && (
                <View style={styles.infoRow}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>
                    Rezervasyon:
                  </Text>
                  <Text style={[styles.value, { color: colors.text }]}>
                    {position.roro_booking_reference}
                  </Text>
                </View>
              )}
              {position.roro_voyage_number && (
                <View style={styles.infoRow}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>
                    Sefer No:
                  </Text>
                  <Text style={[styles.value, { color: colors.text }]}>
                    {position.roro_voyage_number}
                  </Text>
                </View>
              )}
            </View>
          )}
        </Card>
      )}

      {/* Train Section */}
      {position.is_train && (
        <Card style={styles.card}>
          <View style={styles.header}>
            <Train size={20} color={colors.warning} />
            <Text style={[styles.title, { color: colors.text }]}>Tren Bilgileri</Text>
          </View>

          {isEditing ? (
            <View style={styles.form}>
              <Input
                label="Sefer Numarası"
                value={trainData.train_voyage_number}
                onChangeText={(text) =>
                  setTrainData({ ...trainData, train_voyage_number: text })
                }
                placeholder="Sefer no"
              />

              <Input
                label="Vagon Numarası"
                value={trainData.train_wagon_number}
                onChangeText={(text) =>
                  setTrainData({ ...trainData, train_wagon_number: text })
                }
                placeholder="Vagon no"
              />

              <Input
                label="Mühür Numarası"
                value={trainData.train_seal_number}
                onChangeText={(text) =>
                  setTrainData({ ...trainData, train_seal_number: text })
                }
                placeholder="Mühür no"
              />

              <Input
                label="Kalkış Terminali"
                value={trainData.train_departure_terminal}
                onChangeText={(text) =>
                  setTrainData({ ...trainData, train_departure_terminal: text })
                }
                placeholder="Kalkış terminali"
              />

              <DateInput
                label="Kalkış Tarihi"
                value={trainData.train_departure_date}
                onChange={(value) =>
                  setTrainData({ ...trainData, train_departure_date: value })
                }
              />

              <Input
                label="Varış Terminali"
                value={trainData.train_arrival_terminal}
                onChangeText={(text) =>
                  setTrainData({ ...trainData, train_arrival_terminal: text })
                }
                placeholder="Varış terminali"
              />

              <DateInput
                label="Varış Tarihi"
                value={trainData.train_arrival_date}
                onChange={(value) =>
                  setTrainData({ ...trainData, train_arrival_date: value })
                }
              />
            </View>
          ) : (
            <View style={styles.readOnly}>
              {position.train_voyage_number && (
                <View style={styles.infoRow}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>
                    Sefer No:
                  </Text>
                  <Text style={[styles.value, { color: colors.text }]}>
                    {position.train_voyage_number}
                  </Text>
                </View>
              )}
              {position.train_wagon_number && (
                <View style={styles.infoRow}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>
                    Vagon No:
                  </Text>
                  <Text style={[styles.value, { color: colors.text }]}>
                    {position.train_wagon_number}
                  </Text>
                </View>
              )}
            </View>
          )}
        </Card>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        {isEditing ? (
          <>
            <Button
              label="İptal"
              variant="outline"
              onPress={() => setIsEditing(false)}
              style={styles.button}
            />
            <Button
              label="Kaydet"
              onPress={handleSave}
              loading={isSaving}
              style={styles.button}
            />
          </>
        ) : (
          <Button label="Düzenle" onPress={() => setIsEditing(true)} />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    gap: Spacing.md,
  },
  card: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    ...Typography.headingMD,
  },
  form: {
    gap: Spacing.md,
  },
  readOnly: {
    gap: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  label: {
    ...Typography.bodySM,
    minWidth: 100,
  },
  value: {
    ...Typography.bodySM,
    fontWeight: '500',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  button: {
    flex: 1,
  },
  emptyText: {
    ...Typography.bodyMD,
    textAlign: 'center',
    padding: Spacing.xl,
  },
});
