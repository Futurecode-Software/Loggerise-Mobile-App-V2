/**
 * LEGACY PDF Export Implementation
 *
 * This is a fallback implementation using the legacy expo-file-system API
 * If the new File/Directory API doesn't work, you can use this instead.
 *
 * To use: import from 'expo-file-system/legacy' instead of 'expo-file-system'
 */

import { downloadAsync, documentDirectory } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { API_BASE_URL } from '../config';
import { secureStorage } from '../storage';
import { getErrorMessage } from '../api';

/**
 * Export quote as PDF using legacy API
 */
export async function exportQuotePdfLegacy(id: number): Promise<{ uri: string; fileName: string }> {
  try {
    // Get auth token
    const token = await secureStorage.getToken();
    if (!token) {
      throw new Error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
    }

    const fileName = `teklif_${id}_${new Date().getTime()}.pdf`;
    const fileUri = `${documentDirectory}${fileName}`;

    console.log('[PDF Export] Starting download...', {
      url: `${API_BASE_URL}/quotes/${id}/pdf`,
      destination: fileUri,
    });

    // Download PDF using legacy FileSystem API
    const downloadResult = await downloadAsync(
      `${API_BASE_URL}/quotes/${id}/pdf`,
      fileUri,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/pdf',
        },
      }
    );

    console.log('[PDF Export] Download result:', downloadResult);

    if (downloadResult.status !== 200) {
      throw new Error(`PDF indirilemedi (HTTP ${downloadResult.status})`);
    }

    // Share/Open the downloaded PDF
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(downloadResult.uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Teklif PDF',
        UTI: 'com.adobe.pdf',
      });
    } else {
      console.warn('[PDF Export] Sharing not available on this device');
    }

    return { uri: downloadResult.uri, fileName };
  } catch (error) {
    console.error('[PDF Export] Error:', error);
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}
