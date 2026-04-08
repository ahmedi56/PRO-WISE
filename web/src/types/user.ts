export type Role = 'super_admin' | 'company_admin' | 'customer';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: Role;
  company?: string; // Company ID
  status: 'active' | 'deactivated';
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}
