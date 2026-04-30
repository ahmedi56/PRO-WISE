export type Role = 'super_admin' | 'company_admin' | 'customer';
export type UserRole = Role; // Alias for consistency

export interface RoleObject {
  id?: string;
  name: string;
  permissions?: string[];
  description?: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role: RoleObject | string;
  phone?: string;
  avatar?: string;
  company?: any; // Company ID or object
  status: 'active' | 'deactivated' | 'pending';
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  updateSuccess?: boolean;
  error: string | null;
}
