// Generic API response structure
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface Category {
  id: string;
  name: string;
  count?: number;
  icon?: string;
  summary?: string;
  description?: string;
  slug?: string;
  image?: { url: string };
  parent?: any;
  children?: Category[];
}

export interface Step {
  id: string;
  title: string;
  description?: string;
  order: number;
  stepNumber?: number;
  media?: Media[];
}

export interface Media {
  id: string;
  url: string;
  title?: string;
  thumbnail?: string;
  type?: string;
  videoUrl?: string;
  videoId?: string;
  author?: string;
  fileUrl?: string;
}

export interface ClassifiedMedia extends Media {}

export interface Guide {
  id: string;
  title: string;
  description?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | string;
  estimatedTime?: string;
  estimated_time?: string;
  isPublished?: boolean;
  slug?: string;
  steps: Step[];
  media?: Media[];
}

export type Status = 'active' | 'deactivated' | 'pending' | 'retired';

export interface AuditLog {
  id: string;
  action: string;
  user: string;
  details: string;
  createdAt: string;
}
