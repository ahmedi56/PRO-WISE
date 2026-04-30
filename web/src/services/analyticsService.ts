import axios from 'axios';
import { API_URL } from '../config';

export const analyticsService = {
    getAnalytics: async () => {
        const token = localStorage.getItem('token');
        const { data } = await axios.get(`${API_URL}/analytics`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return data;
    }
};
