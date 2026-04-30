import axios from 'axios';
import { API_URL } from '../config';

export const categoryService = {
    getCategories: async (params?: any) => {
        const { data } = await axios.get(`${API_URL}/categories`, { params });
        return data;
    },
    getPopular: async () => {
        const { data } = await axios.get(`${API_URL}/categories/popular`);
        return data;
    },
    getCategoryById: async (id: string) => {
        const { data } = await axios.get(`${API_URL}/categories/${id}`);
        return data;
    },
    createCategory: async (categoryData: any) => {
        const { data } = await axios.post(`${API_URL}/categories`, categoryData);
        return data;
    },
    updateCategory: async (id: string, categoryData: any) => {
        const { data } = await axios.put(`${API_URL}/categories/${id}`, categoryData);
        return data;
    },
    deleteCategory: async (id: string) => {
        const { data } = await axios.delete(`${API_URL}/categories/${id}`);
        return data;
    }
};
