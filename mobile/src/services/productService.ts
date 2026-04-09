import API_URL from '../constants/config';
import { apiFetch } from '../utils/api';
import { Product } from '../types/product';

export const productService = {
    getAll: async (params: { categoryId?: string; search?: string } = {}): Promise<Product[]> => {
        const query = new URLSearchParams();
        if (params.categoryId) query.append('category', params.categoryId);
        if (params.search) query.append('search', params.search);
        
        const res = await apiFetch(`${API_URL}/products?${query.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch products');
        return res.json();
    },

    getOne: async (id: string): Promise<Product> => {
        const res = await apiFetch(`${API_URL}/products/${id}`);
        if (!res.ok) throw new Error('Failed to fetch product details');
        return res.json();
    },

    getRecommendations: async (productId: string): Promise<Product[]> => {
        const res = await apiFetch(`${API_URL}/products/${productId}/recommendations`);
        if (!res.ok) throw new Error('Failed to fetch recommendations');
        const json = await res.json();
        return Array.isArray(json.data) ? json.data : json;
    },

    getRecommendationsByComponents: async (
        productId: string, 
        categoryId: string | undefined, 
        components: any[]
    ): Promise<any> => {
        const res = await apiFetch(`${API_URL}/products/recommend/by-components`, {
            method: 'POST',
            body: JSON.stringify({
                components,
                currentProductId: productId,
                categoryId,
                limit: 6,
            }),
        });
        if (!res.ok) throw new Error('Failed to fetch component matches');
        return res.json();
    }
};
