export interface User {
  id: number;
  name: string;
  email: string;
  roles: Role[];
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: number;
  name: string;
  guard_name: string;
  created_at: string;
}

export interface Invitation {
  id: number;
  email: string;
  roles: string[];
  invited_by: string;
  invited_by_id: number;
  status: 'pending' | 'accepted' | 'expired';
  is_expired: boolean;
  expires_at: string;
  created_at: string;
}

export interface UserFilters {
  search?: string;
  role?: string;
  sort_by?: 'created_at' | 'name' | 'email';
  sort_order?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

export interface UserPayload {
  name: string;
  email: string;
  password?: string;
  password_confirmation?: string;
  roles: string[];
}

export interface InvitePayload {
  emails: string;
  roles: string[];
}
