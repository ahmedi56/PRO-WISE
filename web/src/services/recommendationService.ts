import axios from 'axios';
import { API_URL } from '../config';

export const recommendationService = {
    getPopularProducts: async () => {
        const { data } = await axios.get(`${API_URL}/recommendations/popular`);
        return data;
    },
    getSimilarProducts: async (productId: string) => {
        const { data } = await axios.get(`${API_URL}/recommendations/similar/${productId}`);
        return data;
    },
    getRecentlyVisited: async () => {
        const { data } = await axios.get(`${API_URL}/recommendations/recent`);
        return data;
    }
};
