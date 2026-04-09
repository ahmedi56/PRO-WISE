import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from '../constants/config';
import { apiFetch } from '../utils/api';

export const authService = {
    login: async (email: string, password: string): Promise<any> => {
        const res = await apiFetch(`${API_URL}/auth/login`, {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Login failed');
        }
        
        const data = await res.json();
        if (data.token) {
            await AsyncStorage.setItem('userToken', data.token);
        }
        if (data.refreshToken) {
            await AsyncStorage.setItem('refreshToken', data.refreshToken);
        }
        
        return data;
    },

    logout: async (): Promise<void> => {
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('refreshToken');
    },

    getProfile: async (): Promise<any> => {
        const res = await apiFetch(`${API_URL}/auth/me`);
        if (!res.ok) throw new Error('Failed to fetch profile');
        return res.json();
    },

    register: async (userData: any): Promise<any> => {
        const res = await apiFetch(`${API_URL}/auth/register`, {
            method: 'POST',
            body: JSON.stringify(userData),
        });
        
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Registration failed');
        }
        
        return res.json();
    }
};
