import { Status, Category, Guide, Media } from './common';
export type { Category, Guide, Media };

export type ProductStatus = 'published' | 'draft' | 'archived';

export interface ProductComponent {
  id: string;
  name: string;
  type?: string;
  manufacturer?: string;
  modelNumber?: string;
  specifications?: string;
  description?: string;
  quantity?: number;
}

export type Component = ProductComponent; // Alias for backward compatibility

export interface Product {
  id: string;
  name: string;
  description?: string;
  isPublished?: boolean;
  price?: number;
  modelNumber: string;
  manufacturer: string;
  category: Category | string;
  company: any; // Company ID or object
  status: ProductStatus | Status;
  isPublic: boolean;
  qrCodeUrl?: string;
  guides?: Guide[];
  components?: ProductComponent[];
  content?: string;
  supportVideos?: Media[];
  supportPDFs?: Media[];
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
