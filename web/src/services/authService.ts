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
    requestTechnicianUpgrade: async (applicationData: any) => {
        const { data } = await axios.post(`${API_URL}/users/technician/request`, applicationData);
        return data;
    },
    getTechnicianMe: async () => {
        const { data } = await axios.get(`${API_URL}/users/technician/me`);
        return data;
    },
    updateTechnicianProfile: async (profileData: any) => {
        const { data } = await axios.put(`${API_URL}/users/technician/profile`, profileData);
        return data;
    },
    getTechnicianApplications: async () => {
        const { data } = await axios.get(`${API_URL}/users/technician/applications`);
        return data;
    },
    approveTechnician: async (userId: string) => {
        const { data } = await axios.put(`${API_URL}/users/${userId}/technician/approve`);
        return data;
    },
    rejectTechnician: async (userId: string, rejectionReason: string) => {
        const { data } = await axios.put(`${API_URL}/users/${userId}/technician/reject`, { rejectionReason });
        return data;
    },
    getPublicTechnicians: async () => {
        const { data } = await axios.get(`${API_URL}/homepage`);
        return data.technicians || [];
    }
};
