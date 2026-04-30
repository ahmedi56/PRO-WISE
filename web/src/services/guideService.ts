import axios from 'axios';
import { API_URL } from '../config';

export const guideService = {
    createGuide: async (guideData: any) => {
        const { data } = await axios.post(`${API_URL}/guides`, guideData);
        return data;
    },
    updateGuide: async (id: string, guideData: any) => {
        const { data } = await axios.put(`${API_URL}/guides/${id}`, guideData);
        return data;
    },
    deleteGuide: async (id: string) => {
        const { data } = await axios.delete(`${API_URL}/guides/${id}`);
        return data;
    },
    createStep: async (stepData: any) => {
        const { data } = await axios.post(`${API_URL}/steps`, stepData);
        return data;
    },
    createMedia: async (mediaData: any) => {
        const { data } = await axios.post(`${API_URL}/media`, mediaData);
        return data;
    },
    getGuideTypes: async () => {
        const { data } = await axios.get(`${API_URL}/guidetypes`);
        return data;
    },
    createGuideType: async (typeData: any) => {
        const { data } = await axios.post(`${API_URL}/guidetypes`, typeData);
        return data;
    }
};
