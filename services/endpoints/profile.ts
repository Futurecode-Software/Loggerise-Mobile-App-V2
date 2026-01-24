/**
 * Profile API Endpoints
 *
 * Handles profile update, password change, and avatar management.
 * Uses Laravel Sanctum for token-based authentication.
 */

import api, { ApiResponse, getErrorMessage } from '../api';

/**
 * Profile update data
 */
export interface ProfileUpdateData {
  name: string;
  email: string;
  phone?: string;
}

/**
 * Password change data
 */
export interface PasswordChangeData {
  current_password: string;
  password: string;
  password_confirmation: string;
}

/**
 * Profile update response
 */
interface ProfileUpdateResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: number;
      name: string;
      email: string;
      phone?: string;
      avatar?: string;
      tenant_id?: number;
      tenant_name?: string;
    };
  };
}

/**
 * Update user profile
 */
export async function updateProfile(data: ProfileUpdateData): Promise<ProfileUpdateResponse['data']['user']> {
  try {
    const response = await api.put<ProfileUpdateResponse>('/profile', data);
    return response.data.data.user;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Change password
 */
export async function changePassword(data: PasswordChangeData): Promise<string> {
  try {
    const response = await api.put<ApiResponse<{ message: string }>>('/password', data);
    return response.data.message || 'Sifreniz basariyla guncellendi.';
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Upload avatar
 */
export async function uploadAvatar(formData: FormData): Promise<string> {
  try {
    const response = await api.post<ApiResponse<{ avatar_url: string; message: string }>>(
      '/profile/avatar',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data?.avatar_url || '';
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Delete avatar
 */
export async function deleteAvatar(): Promise<void> {
  try {
    await api.delete('/profile/avatar');
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}
