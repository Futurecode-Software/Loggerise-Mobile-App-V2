import api from '@/services/api';
import { User, Role, Invitation, UserFilters, UserPayload, InvitePayload } from '../../types/user';

export const userManagementService = {
  /**
   * Get paginated list of users
   */
  async getUsers(filters?: UserFilters): Promise<{
    data: User[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  }> {
    const response = await api.get('/settings/users', { params: filters });
    return response.data;
  },

  /**
   * Get single user by ID
   */
  async getUser(id: number): Promise<User> {
    const response = await api.get(`/settings/users/${id}`);
    return response.data.data;
  },

  /**
   * Create new user
   */
  async createUser(payload: UserPayload): Promise<User> {
    const response = await api.post('/settings/users', payload);
    return response.data.data;
  },

  /**
   * Update existing user
   */
  async updateUser(id: number, payload: Partial<UserPayload>): Promise<User> {
    const response = await api.put(`/settings/users/${id}`, payload);
    return response.data.data;
  },

  /**
   * Delete user
   */
  async deleteUser(id: number): Promise<void> {
    await api.delete(`/settings/users/${id}`);
  },

  /**
   * Get available roles
   */
  async getRoles(): Promise<Role[]> {
    const response = await api.get('/settings/users/meta/roles');
    return response.data.data;
  },

  /**
   * Get user limits info
   */
  async getUserLimits(): Promise<{
    max_users: number | null;
    current_users: number;
    can_add_more: boolean;
  }> {
    const response = await api.get('/settings/users/meta/limits');
    return response.data;
  },

  /**
   * Get pending invitations
   */
  async getInvitations(): Promise<Invitation[]> {
    const response = await api.get('/settings/users/invitations/pending');
    return response.data.data;
  },

  /**
   * Send invitation
   */
  async sendInvitation(payload: InvitePayload): Promise<{
    message: string;
    success_count: number;
    errors: string[];
  }> {
    const response = await api.post('/settings/users/invitations/send', payload);
    return response.data;
  },

  /**
   * Resend invitation
   */
  async resendInvitation(id: number): Promise<void> {
    await api.post(`/settings/users/invitations/${id}/resend`);
  },

  /**
   * Cancel invitation
   */
  async cancelInvitation(id: number): Promise<void> {
    await api.delete(`/settings/users/invitations/${id}`);
  },
};
