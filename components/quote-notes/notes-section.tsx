import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Plus, Pin, Edit2, Trash2, MessageSquare } from 'lucide-react-native';
import { Card, ConfirmDialog } from '@/components/ui';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import {
  QuoteNote,
  deleteQuoteNote,
  toggleNotePin,
  formatRelativeTime,
} from '@/services/endpoints/quote-notes';
import NoteFormModal from './note-form-modal';
import { useToast } from '@/hooks/use-toast';

interface NotesSectionProps {
  quoteId: number;
  notes: QuoteNote[];
  onNotesChange: () => void;
}

export default function NotesSection({ quoteId, notes, onNotesChange }: NotesSectionProps) {
  const colors = Colors.light;
  const toast = useToast();

  const [showNoteForm, setShowNoteForm] = useState(false);
  const [editingNote, setEditingNote] = useState<QuoteNote | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingNote, setDeletingNote] = useState<QuoteNote | null>(null);

  // Sort notes: pinned first, then by date
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const handleAddNote = () => {
    setEditingNote(null);
    setShowNoteForm(true);
  };

  const handleEditNote = (note: QuoteNote) => {
    setEditingNote(note);
    setShowNoteForm(true);
  };

  const handleDeleteNote = (note: QuoteNote) => {
    setDeletingNote(note);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingNote) return;

    try {
      await deleteQuoteNote(quoteId, deletingNote.id);
      toast.success('Not silindi');
      onNotesChange();
    } catch (err) {
      toast.showError(err instanceof Error ? err.message : 'Not silinemedi');
    } finally {
      setDeleteDialogOpen(false);
      setDeletingNote(null);
    }
  };

  const handleTogglePin = async (note: QuoteNote) => {
    try {
      await toggleNotePin(quoteId, note.id);
      onNotesChange();
    } catch (err) {
      toast.showError(err instanceof Error ? err.message : 'İşlem başarısız');
    }
  };

  const handleSave = () => {
    setShowNoteForm(false);
    setEditingNote(null);
    onNotesChange();
  };

  const renderNoteItem = ({ item }: { item: QuoteNote }) => (
    <Card
      style={[
        styles.noteCard,
        ...(item.is_pinned ? [{ backgroundColor: Brand.primary + '05', borderColor: Brand.primary }] : []),
      ]}
    >
      <View style={styles.noteHeader}>
        {item.is_pinned && (
          <View style={styles.pinnedBadge}>
            <Pin size={12} color={Brand.primary} />
          </View>
        )}
        <View style={styles.noteAuthor}>
          <Text style={[styles.authorName, { color: colors.text }]}>
            {item.user?.name || 'Bilinmeyen'}
          </Text>
          <Text style={[styles.noteTime, { color: colors.textMuted }]}>
            {formatRelativeTime(item.created_at)}
          </Text>
        </View>
        <View style={styles.noteActions}>
          <TouchableOpacity
            style={styles.actionIcon}
            onPress={() => handleTogglePin(item)}
          >
            <Pin
              size={16}
              color={item.is_pinned ? Brand.primary : colors.textMuted}
              fill={item.is_pinned ? Brand.primary : 'none'}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon} onPress={() => handleEditNote(item)}>
            <Edit2 size={16} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon} onPress={() => handleDeleteNote(item)}>
            <Trash2 size={16} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={[styles.noteContent, { color: colors.text }]}>{item.content}</Text>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MessageSquare size={32} color={colors.textMuted} />
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        Henüz not eklenmemiş
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Notlar ({sortedNotes.length})
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: Brand.primary }]}
          onPress={handleAddNote}
        >
          <Plus size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {sortedNotes.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={sortedNotes}
          renderItem={renderNoteItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.notesList}
          scrollEnabled={false}
        />
      )}

      <NoteFormModal
        visible={showNoteForm}
        quoteId={quoteId}
        note={editingNote}
        onClose={() => {
          setShowNoteForm(false);
          setEditingNote(null);
        }}
        onSave={handleSave}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={deleteDialogOpen}
        title="Notu Sil"
        message="Bu notu silmek istediğinizden emin misiniz?"
        confirmText="Sil"
        cancelText="İptal"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
        variant="destructive"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.headingMD,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notesList: {
    gap: Spacing.md,
  },
  noteCard: {
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  pinnedBadge: {
    padding: 4,
  },
  noteAuthor: {
    flex: 1,
  },
  authorName: {
    ...Typography.bodySM,
    fontWeight: '600',
  },
  noteTime: {
    ...Typography.bodyXS,
    marginTop: 2,
  },
  noteActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionIcon: {
    padding: 4,
  },
  noteContent: {
    ...Typography.bodyMD,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyText: {
    ...Typography.bodySM,
  },
});
