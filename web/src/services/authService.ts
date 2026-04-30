import axios from 'axios';
import { API_URL } from '../config';

export const authService = {
    login: async (credentials: any) => {
        const { data } = await axios.post(`${API_URL}/auth/login`, credentials);
        return data;
    },
    register: async (userData: any) => {
        const { data } = await axios.post(`${API_URL}/auth/register`, userData);
        return data;
    },
    getMe: async () => {
        const { data } = await axios.get(`${API_URL}/auth/me`);
        return data;
    },
    updateProfile: async (profileData: any) => {
        const { data } = await axios.put(`${API_URL}/users/profile`, profileData);
        return data;
    },
    requestTechnicianUpgrade: async () => {
        const { data } = await axios.post(`${API_URL}/tech-upgrade`);
        return data;
    }
};
