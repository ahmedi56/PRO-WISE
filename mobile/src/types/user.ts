export type UserRole = 'super_admin' | 'company_admin' | 'customer';
export type Role = UserRole; // Alias for consistency

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  company?: any; // Company ID or object
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
