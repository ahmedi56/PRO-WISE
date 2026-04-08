// Generic API response structure
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export type Status = 'active' | 'deactivated' | 'pending' | 'retired';

export interface AuditLog {
  id: string;
  action: string;
  user: string;
  details: string;
  createdAt: string;
}
