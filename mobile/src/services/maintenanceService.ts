import API_URL from '../constants/config';
import { apiFetch } from '../utils/api';

export const maintenanceService = {
    createRequest: async (requestData: any): Promise<any> => {
        const res = await apiFetch(`${API_URL}/maintenance/requests`, {
            method: 'POST',
            body: JSON.stringify(requestData),
        });
        if (!res.ok) throw new Error('Failed to create maintenance request');
        return res.json();
    },

    getUserRequests: async (): Promise<any[]> => {
        const res = await apiFetch(`${API_URL}/maintenance/requests/user`);
        if (!res.ok) throw new Error('Failed to fetch user requests');
        return res.json();
    },

    getTechnicianRequests: async (): Promise<any[]> => {
        const res = await apiFetch(`${API_URL}/maintenance/requests/technician`);
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Failed to fetch technician requests');
        }
        return res.json();
    },

    updateRequestStatus: async (id: string, status: string): Promise<any> => {
        const res = await apiFetch(`${API_URL}/maintenance/requests/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error('Failed to update request status');
        return res.json();
    }
};
