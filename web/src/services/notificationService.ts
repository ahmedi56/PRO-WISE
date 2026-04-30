import axios from 'axios';
import { API_URL } from '../config';

export const notificationService = {
    getNotifications: async () => {
        const { data } = await axios.get(`${API_URL}/notifications`);
        return data;
    },
    markAsRead: async (id: string) => {
        const { data } = await axios.patch(`${API_URL}/notifications/${id}`, { read: true });
        return data;
    },
    markAllAsRead: async () => {
        const { data } = await axios.put(`${API_URL}/notifications/mark-all-read`);
        return data;
    }
};
