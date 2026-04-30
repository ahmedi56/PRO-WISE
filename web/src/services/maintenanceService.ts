import axios from 'axios';
import { API_URL } from '../config';

export const maintenanceService = {
    createRequest: async (requestData: any) => {
        const { data } = await axios.post(`${API_URL}/maintenance/requests`, requestData);
        return data;
    },
    getUserRequests: async () => {
        const { data } = await axios.get(`${API_URL}/maintenance/requests/user`);
        return data;
    },
    getTechnicianRequests: async () => {
        const { data } = await axios.get(`${API_URL}/maintenance/requests/technician`);
        return data;
    },
    updateRequestStatus: async (id: string, status: string) => {
        const { data } = await axios.patch(`${API_URL}/maintenance/requests/${id}/status`, { status });
        return data;
    }
};
