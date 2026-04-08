import { Status } from './common';

export interface Category {
  id: string;
  name: string;
  count?: number;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price?: number;
  manufacturer: string;
  category: Category | string;
  company: string; // Company ID
  status: Status;
  isPublic: boolean;
  qrCodeUrl?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ProductRecommendation {
  id: string;
  name: string;
  relevance: number;
  type: 'similar' | 'related';
}
