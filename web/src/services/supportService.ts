import axios from 'axios';
import { API_URL } from '../config';

export const supportService = {
    getProductSupport: async (productId: string) => {
        const { data } = await axios.get(`${API_URL}/support/products/${productId}`);
        return data;
    },
    createGuide: async (guideData: any) => {
        const { data } = await axios.post(`${API_URL}/support/guides`, guideData);
        return data;
    },
    deleteGuide: async (id: string) => {
        const { data } = await axios.delete(`${API_URL}/support/guides/${id}`);
        return data;
    },
    createStep: async (stepData: any) => {
        const { data } = await axios.post(`${API_URL}/support/steps`, stepData);
        return data;
    },
    deleteStep: async (id: string) => {
        const { data } = await axios.delete(`${API_URL}/support/steps/${id}`);
        return data;
    },
    createVideo: async (videoData: any) => {
        const { data } = await axios.post(`${API_URL}/support/videos`, videoData);
        return data;
    },
    deleteVideo: async (id: string) => {
        const { data } = await axios.delete(`${API_URL}/support/videos/${id}`);
        return data;
    },
    uploadPDF: async (formData: FormData) => {
        const { data } = await axios.post(`${API_URL}/support/pdfs/upload`, formData);
        return data;
    },
    createPDF: async (pdfData: any) => {
        const { data } = await axios.post(`${API_URL}/support/pdfs`, pdfData);
        return data;
    },
    deletePDF: async (id: string) => {
        const { data } = await axios.delete(`${API_URL}/support/pdfs/${id}`);
        return data;
    },
    getPendingContent: async () => {
        const { data } = await axios.get(`${API_URL}/content/pending`);
        return data;
    },
    approveContent: async (type: string, id: string) => {
        // We now use a unified endpoint /api/content/:id/approve
        const { data } = await axios.put(`${API_URL}/content/${id}/approve`);
        return data;
    },
    rejectContent: async (type: string, id: string, reason: string) => {
        // We now use a unified endpoint /api/content/:id/reject
        const { data } = await axios.put(`${API_URL}/content/${id}/reject`, { reason });
        return data;
    }
};
