import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:1337/api';

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  q?: string;
  action?: string;
  targetType?: string;
  severity?: string;
  dateFrom?: string;
  dateTo?: string;
  user?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  actorRole: string;
  target: string;
  targetType: string;
  targetLabel: string;
  ipAddress: string;
  userAgent: string;
  severity: 'info' | 'warning' | 'critical';
  details: any;
  createdAt: number;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  company?: {
    id: string;
    name: string;
  };
}

export interface AuditLogResponse {
  data: AuditLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const auditLogService = {
  getLogs: async (filters: AuditLogFilters = {}): Promise<AuditLogResponse> => {
    const response = await axios.get(`${API_URL}/audit-logs`, {
      params: filters,
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  }
};

export default auditLogService;
