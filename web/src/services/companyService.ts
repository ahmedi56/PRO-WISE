import axios from 'axios';
import { API_URL } from '../config';

export const companyService = {
    getCompanies: async () => {
        const { data } = await axios.get(`${API_URL}/companies`);
        return data;
    },
    getCompanyById: async (id: string) => {
        const { data } = await axios.get(`${API_URL}/companies/${id}`);
        return data;
    },
    updateCompany: async (id: string, companyData: any) => {
        const { data } = await axios.put(`${API_URL}/companies/${id}`, companyData);
        return data;
    },
    deleteCompany: async (id: string) => {
        const { data } = await axios.delete(`${API_URL}/companies/${id}`);
        return data;
    },
    activate: async (id: string) => {
        const { data } = await axios.put(`${API_URL}/companies/${id}/activate`);
        return data;
    },
    deactivate: async (id: string) => {
        const { data } = await axios.put(`${API_URL}/companies/${id}/deactivate`);
        return data;
    },
    approve: async (id: string) => {
        const { data } = await axios.put(`${API_URL}/companies/${id}/approve`);
        return data;
    }
};
