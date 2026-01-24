import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import { X } from 'lucide-react-native';
import { Input, Button } from '@/components/ui';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import {
  QuoteNote,
  createQuoteNote,
  updateQuoteNote,
} from '@/services/endpoints/quote-notes';

interface NoteFormModalProps {
  visible: boolean;
  quoteId: number;
  note?: QuoteNote | null;
  onClose: () => void;
  onSave: () => void;
}

export default function NoteFormModal({
  visible,
  quoteId,
  note,
  onClose,
  onSave,
}: NoteFormModalProps) {
  const colors = Colors.light;

  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Update form when note changes
  useEffect(() => {
    if (note) {
      setContent(note.content);
      setIsPinned(note.is_pinned);
    } else {
      setContent('');
      setIsPinned(false);
    }
    setError('');
  }, [note, visible]);

  const validateForm = (): boolean => {
    if (!content.trim()) {
      setError('Not içeriği zorunludur');
      return false;
    }

    if (content.length > 5000) {
      setError('Not içeriği en fazla 5000 karakter olabilir');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (note) {
        // Update existing note
        await updateQuoteNote(quoteId, note.id, { content });
      } else {
        // Create new note
        await createQuoteNote(quoteId, { content, is_pinned: isPinned });
      }
      onSave();
      onClose();
    } catch (err) {
      Alert.alert('Hata', err instanceof Error ? err.message : 'İşlem başarısız');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {note ? 'Notu Düzenle' : 'Yeni Not'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.modalBody}>
            <Input
              label="Not İçeriği"
              placeholder="Not yazınız..."
              value={content}
              onChangeText={(value) => {
                setContent(value);
                setError('');
              }}
              multiline
              numberOfLines={8}
              style={styles.textArea}
              error={error}
              required
            />

            {!note && (
              <View style={styles.formGroup}>
                <TouchableOpacity
                  style={[
                    styles.checkboxRow,
                    {
                      backgroundColor: isPinned ? Brand.primary + '10' : colors.surface,
                      borderColor: isPinned ? Brand.primary : colors.border,
                    },
                  ]}
                  onPress={() => setIsPinned(!isPinned)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: isPinned ? Brand.primary : 'transparent',
                        borderColor: isPinned ? Brand.primary : colors.border,
                      },
                    ]}
                  >
                    {isPinned && <View style={styles.checkmark} />}
                  </View>
                  <Text style={[styles.checkboxLabel, { color: colors.text }]}>
                    Notu sabitle
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={[styles.helperText, { color: colors.textMuted }]}>
              * Sabitlenmiş notlar listenin en üstünde görünür
            </Text>
          </View>

          {/* Footer */}
          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <Button
              label="İptal"
              onPress={onClose}
              variant="secondary"
              style={styles.footerButton}
            />
            <Button
              label={isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
              onPress={handleSave}
              disabled={isSubmitting}
              variant="primary"
              style={styles.footerButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  modalTitle: {
    ...Typography.headingLG,
    flex: 1,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  modalBody: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  textArea: {
    minHeight: 150,
    textAlignVertical: 'top',
  },
  formGroup: {
    marginBottom: Spacing.md,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    width: 12,
    height: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  checkboxLabel: {
    ...Typography.bodyMD,
    fontWeight: '500',
  },
  helperText: {
    ...Typography.bodyXS,
    fontStyle: 'italic',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
  },
});
