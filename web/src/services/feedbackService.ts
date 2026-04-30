import axios from 'axios';
import { API_URL } from '../config';

export const feedbackService = {
    getAllFeedback: async () => {
        const { data } = await axios.get(`${API_URL}/feedback`);
        return data;
    },
    getProductFeedback: async (productId: string) => {
        const { data } = await axios.get(`${API_URL}/products/${productId}/feedback`);
        return data;
    },
    createFeedback: async (feedbackData: any) => {
        const { data } = await axios.post(`${API_URL}/feedback`, feedbackData);
        return data;
    },
    respond: async (id: string, responseData: any) => {
        const { data } = await axios.put(`${API_URL}/feedback/${id}/respond`, responseData);
        return data;
    },
    reply: async (id: string, replyData: any) => {
        const { data } = await axios.post(`${API_URL}/feedback/${id}/reply`, replyData);
        return data;
    },
    toggleVisibility: async (id: string) => {
        const { data } = await axios.put(`${API_URL}/feedback/${id}/toggle-visibility`);
        return data;
    },
    deleteFeedback: async (id: string) => {
        const { data } = await axios.delete(`${API_URL}/feedback/${id}`);
        return data;
    },
    getStats: async (companyId: string) => {
        const { data } = await axios.get(`${API_URL}/feedback/stats/${companyId}`);
        return data;
    }
};
