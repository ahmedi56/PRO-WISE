import { Status } from './common';

export interface Company {
  id: string;
  name: string;
  description?: string;
  category?: any;
  status: Status;
  products?: string[]; // Array of Product IDs
  admin?: string; // User ID
  createdAt: string;
  updatedAt: string;
}

export interface CompanyWithStats extends Company {
  productCount: number;
  activeGuideCount: number;
}
