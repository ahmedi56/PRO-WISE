import axios from 'axios';
import { API_URL } from '../config';

export const productService = {
    getProducts: async (params?: any) => {
        const { data } = await axios.get(`${API_URL}/products`, { params });
        return data;
    },
    search: async (q: string) => {
        const { data } = await axios.get(`${API_URL}/search`, { params: { q } });
        return data;
    },
    getProductById: async (id: string) => {
        const { data } = await axios.get(`${API_URL}/products/${id}`);
        return data;
    },
    createProduct: async (productData: any) => {
        const { data } = await axios.post(`${API_URL}/products`, productData);
        return data;
    },
    updateProduct: async (id: string, productData: any) => {
        const { data } = await axios.put(`${API_URL}/products/${id}`, productData);
        return data;
    },
    deleteProduct: async (id: string) => {
        const { data } = await axios.delete(`${API_URL}/products/${id}`);
        return data;
    },
    getRecommendations: async (id: string) => {
        const { data } = await axios.get(`${API_URL}/products/${id}/recommendations`);
        return data;
    },
    semanticSearch: async (query: string) => {
        const { data } = await axios.get(`${API_URL}/products/search/semantic`, { params: { q: query } });
        return data;
    },
    publish: async (id: string) => {
        const { data } = await axios.put(`${API_URL}/products/${id}/publish`);
        return data;
    },
    unpublish: async (id: string) => {
        const { data } = await axios.put(`${API_URL}/products/${id}/unpublish`);
        return data;
    },
    archive: async (id: string) => {
        const { data } = await axios.put(`${API_URL}/products/${id}/archive`);
        return data;
    }
};
