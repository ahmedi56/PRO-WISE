export type UserRole = 'super_admin' | 'company_admin' | 'technician' | 'user';
export interface RoleObject {
  id?: string;
  name: string;
}
export type Role = UserRole | RoleObject;

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role: Role;
  phone?: string;
  avatar?: string;
  company?: any; // Company ID or object
  status: 'active' | 'deactivated' | 'pending';
  isTechnician?: boolean;
  technicianStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  technicianProfile?: any;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}
