/**
 * Documents Section (CRUD)
 *
 * Allows uploading, viewing, and deleting documents for a position.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  FileText,
  Plus,
  Trash2,
  ChevronLeft,
  Upload,
  File,
  Image as ImageIcon,
  FileSpreadsheet,
  Download,
  Eye,
  Share2,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import { Card, Input, SelectInput } from '@/components/ui';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import {
  Position,
  DocumentResponse,
  uploadDocument,
  deleteDocument,
  getDocumentDownloadUrl,
  DOCUMENT_CATEGORIES,
  getDocumentCategoryLabel,
} from '@/services/endpoints/positions';
import { showToast } from '@/utils/toast';
import api from '@/services/api';

interface DocumentsSectionProps {
  position: Position;
  onUpdate: () => void;
}

export function DocumentsSection({ position, onUpdate }: DocumentsSectionProps) {
  const colors = Colors.light;
  const insets = useSafeAreaInsets();
  const documents = position.documents || [];

  // Modal states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingDocumentId, setDeletingDocumentId] = useState<number | null>(null);

  // Upload form state
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name: string;
    type: string;
    size?: number;
  } | null>(null);
  const [category, setCategory] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const resetUploadForm = () => {
    setSelectedFile(null);
    setCategory('');
    setDescription('');
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedFile({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'application/octet-stream',
          size: asset.size,
        });
      }
    } catch (error) {
      if (__DEV__) console.error('Document picker error:', error);
      showToast({ type: 'error', message: 'Dosya seçilemedi' });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showToast({ type: 'error', message: 'Lütfen bir dosya seçin' });
      return;
    }

    setIsUploading(true);
    try {
      await uploadDocument(
        position.id,
        {
          uri: selectedFile.uri,
          name: selectedFile.name,
          type: selectedFile.type,
        },
        {
          category: category || undefined,
          description: description || undefined,
        }
      );
      showToast({ type: 'success', message: 'Evrak başarıyla yüklendi' });
      setIsUploadModalOpen(false);
      resetUploadForm();
      onUpdate();
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Evrak yüklenemedi',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenDelete = (documentId: number) => {
    setDeletingDocumentId(documentId);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingDocumentId) return;

    setIsDeleting(true);
    try {
      await deleteDocument(position.id, deletingDocumentId);
      showToast({ type: 'success', message: 'Evrak silindi' });
      setIsDeleteDialogOpen(false);
      setDeletingDocumentId(null);
      onUpdate();
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Silme işlemi başarısız',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const [downloadingDocId, setDownloadingDocId] = useState<number | null>(null);
  const [actionType, setActionType] = useState<'view' | 'share' | null>(null);

  // Helper: Download file and return local URI
  const downloadFile = async (doc: DocumentResponse): Promise<{ uri: string; mimeType: string } | null> => {
    // Get temporary download URL from API
    const downloadPath = getDocumentDownloadUrl(position.id, doc.id);
    const response = await api.get(downloadPath);

    if (!response.data.success || !response.data.data?.download_url) {
      throw new Error(response.data.message || 'İndirme linki alınamadı');
    }

    const { download_url, file_name, mime_type } = response.data.data;

    // Download file directly from S3
    const fileName = file_name || doc.original_file_name || doc.file_name || `document_${doc.id}`;
    const localUri = `${FileSystem.documentDirectory}${fileName}`;

    const downloadResult = await FileSystem.downloadAsync(download_url, localUri);

    if (downloadResult.status !== 200) {
      throw new Error(`İndirme başarısız. Durum kodu: ${downloadResult.status}`);
    }

    return {
      uri: downloadResult.uri,
      mimeType: mime_type || doc.mime_type || 'application/octet-stream',
    };
  };

  // View file with default app
  const handleView = async (doc: DocumentResponse) => {
    try {
      setDownloadingDocId(doc.id);
      setActionType('view');

      const result = await downloadFile(doc);
      if (!result) return;

      if (Platform.OS === 'android') {
        // Android: Use IntentLauncher to open with default app
        const contentUri = await FileSystem.getContentUriAsync(result.uri);
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
          type: result.mimeType,
        });
      } else {
        // iOS: Use Sharing which shows a preview
        await Sharing.shareAsync(result.uri, {
          mimeType: result.mimeType,
          dialogTitle: 'Dosyayı Görüntüle',
        });
      }
    } catch (error) {
      if (__DEV__) console.error('View error:', error);
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Dosya açılamadı',
      });
    } finally {
      setDownloadingDocId(null);
      setActionType(null);
    }
  };

  // Share file
  const handleShare = async (doc: DocumentResponse) => {
    try {
      setDownloadingDocId(doc.id);
      setActionType('share');

      const result = await downloadFile(doc);
      if (!result) return;

      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(result.uri, {
          mimeType: result.mimeType,
          dialogTitle: 'Dosyayı Paylaş',
        });
      } else {
        showToast({ type: 'error', message: 'Paylaşım bu cihazda desteklenmiyor' });
      }
    } catch (error) {
      if (__DEV__) console.error('Share error:', error);
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Dosya paylaşılamadı',
      });
    } finally {
      setDownloadingDocId(null);
      setActionType(null);
    }
  };

  const getFileIcon = (fileType?: string) => {
    switch (fileType?.toLowerCase()) {
      case 'pdf':
        return <FileText size={24} color={colors.danger} />;
      case 'doc':
      case 'docx':
        return <FileText size={24} color="#2b579a" />;
      case 'xls':
      case 'xlsx':
        return <FileSpreadsheet size={24} color="#217346" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <ImageIcon size={24} color={colors.info} />;
      default:
        return <File size={24} color={colors.icon} />;
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '-';
    if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(2)} GB`;
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(2)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${bytes} B`;
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('tr-TR');
    } catch {
      return dateString;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with Add Button */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Evraklar</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: Brand.primary }]}
          onPress={() => setIsUploadModalOpen(true)}
        >
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Yükle</Text>
        </TouchableOpacity>
      </View>

      {/* Documents List */}
      {documents.length === 0 ? (
        <Card style={styles.emptyCard}>
          <View style={styles.empty}>
            <FileText size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Henüz evrak bulunmuyor
            </Text>
          </View>
        </Card>
      ) : (
        documents.map((doc) => (
          <Card key={doc.id} style={styles.documentCard}>
            <View style={styles.documentRow}>
              {/* File Icon */}
              <View style={[styles.fileIconContainer, { backgroundColor: colors.surface }]}>
                {getFileIcon(doc.file_type)}
              </View>

              {/* File Info */}
              <View style={styles.documentInfo}>
                <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>
                  {doc.original_file_name || doc.file_name}
                </Text>
                <View style={styles.documentMeta}>
                  {doc.category && (
                    <Text style={[styles.categoryBadge, { backgroundColor: colors.surface, color: colors.textSecondary }]}>
                      {getDocumentCategoryLabel(doc.category)}
                    </Text>
                  )}
                  <Text style={[styles.fileSize, { color: colors.textMuted }]}>
                    {formatFileSize(doc.file_size)}
                  </Text>
                </View>
                {doc.description && (
                  <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
                    {doc.description}
                  </Text>
                )}
              </View>

              {/* Actions */}
              <View style={styles.documentActions}>
                {/* View Button */}
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.surface }]}
                  onPress={() => handleView(doc)}
                  disabled={downloadingDocId === doc.id}
                >
                  {downloadingDocId === doc.id && actionType === 'view' ? (
                    <ActivityIndicator size={16} color={Brand.primary} />
                  ) : (
                    <Eye size={16} color={Brand.primary} />
                  )}
                </TouchableOpacity>
                {/* Share Button */}
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.surface }]}
                  onPress={() => handleShare(doc)}
                  disabled={downloadingDocId === doc.id}
                >
                  {downloadingDocId === doc.id && actionType === 'share' ? (
                    <ActivityIndicator size={16} color={colors.info} />
                  ) : (
                    <Share2 size={16} color={colors.info} />
                  )}
                </TouchableOpacity>
                {/* Delete Button */}
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.surface }]}
                  onPress={() => handleOpenDelete(doc.id)}
                >
                  <Trash2 size={16} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        ))
      )}

      {/* Upload Modal */}
      <Modal
        visible={isUploadModalOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent={true}
        onRequestClose={() => {
          setIsUploadModalOpen(false);
          resetUploadForm();
        }}
      >
        <View style={[styles.modalContainer, { backgroundColor: Brand.primary, paddingTop: insets.top }]}>
          {/* Green Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setIsUploadModalOpen(false);
                resetUploadForm();
              }}
              style={styles.backButton}
            >
              <ChevronLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Evrak Yükle</Text>
            <View style={styles.headerPlaceholder} />
          </View>

          {/* Form Content */}
          <KeyboardAvoidingView
            style={[styles.modalContent, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              contentContainerStyle={styles.formContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* File Picker */}
              <View style={styles.filePickerContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Dosya *</Text>
                <TouchableOpacity
                  style={[
                    styles.filePicker,
                    { borderColor: colors.border, backgroundColor: colors.surface },
                  ]}
                  onPress={handlePickDocument}
                >
                  {selectedFile ? (
                    <View style={styles.selectedFileInfo}>
                      {getFileIcon(selectedFile.name.split('.').pop())}
                      <View style={styles.selectedFileText}>
                        <Text style={[styles.selectedFileName, { color: colors.text }]} numberOfLines={1}>
                          {selectedFile.name}
                        </Text>
                        <Text style={[styles.selectedFileSize, { color: colors.textMuted }]}>
                          {formatFileSize(selectedFile.size)}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.filePickerPlaceholder}>
                      <Upload size={32} color={colors.textMuted} />
                      <Text style={[styles.filePickerText, { color: colors.textMuted }]}>
                        Dosya seçmek için dokunun
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <Select
                label="Kategori"
                data={DOCUMENT_CATEGORIES.map((c) => ({ label: c.label, value: c.value }))}
                value={category}
                onValueChange={(v) => setCategory((v as string) || '')}
                placeholder="Kategori seçin (opsiyonel)"
              />

              <Input
                label="Açıklama"
                value={description}
                onChangeText={setDescription}
                placeholder="Opsiyonel açıklama"
                multiline
                numberOfLines={3}
              />

              {/* Upload Button */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: Brand.primary },
                  (isUploading || !selectedFile) && styles.submitButtonDisabled,
                ]}
                onPress={handleUpload}
                disabled={isUploading || !selectedFile}
              >
                {isUploading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Upload size={20} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>Yükle</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={isDeleteDialogOpen}
        title="Evrakı Sil"
        message="Bu evrakı silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
        confirmText="Sil"
        cancelText="İptal"
        onConfirm={handleDelete}
        onCancel={() => {
          setIsDeleteDialogOpen(false);
          setDeletingDocumentId(null);
        }}
        isLoading={isDeleting}
        isDangerous
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerTitle: {
    ...Typography.headingSM,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  addButtonText: {
    color: '#FFFFFF',
    ...Typography.bodySM,
    fontWeight: '600',
  },
  emptyCard: {
    padding: Spacing.xl,
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  emptyText: {
    ...Typography.bodyMD,
    textAlign: 'center',
  },
  documentCard: {
    padding: Spacing.md,
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  fileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  fileName: {
    ...Typography.bodyMD,
    fontWeight: '500',
  },
  documentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  categoryBadge: {
    ...Typography.bodySM,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    fontSize: 11,
  },
  fileSize: {
    ...Typography.bodySM,
    fontSize: 11,
  },
  description: {
    ...Typography.bodySM,
    fontStyle: 'italic',
  },
  documentActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  actionButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  modalTitle: {
    ...Typography.headingMD,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerPlaceholder: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  formContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing['2xl'],
  },
  filePickerContainer: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.bodyMD,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  filePicker: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  filePickerPlaceholder: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  filePickerText: {
    ...Typography.bodyMD,
  },
  selectedFileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    width: '100%',
  },
  selectedFileText: {
    flex: 1,
  },
  selectedFileName: {
    ...Typography.bodyMD,
    fontWeight: '500',
  },
  selectedFileSize: {
    ...Typography.bodySM,
  },
  submitButton: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    ...Typography.bodyMD,
    fontWeight: '600',
  },
});
