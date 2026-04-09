import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from '../constants/config';

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
    refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
    refreshSubscribers.map((cb) => cb(token));
    refreshSubscribers = [];
};

export const apiFetch = async (
    url: string, 
    options: RequestInit = {}, 
    onUnauthorized: (() => void) | null = null
): Promise<Response> => {
    const token = await AsyncStorage.getItem('userToken');
    
    let headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };

    if (token && !headers.Authorization) {
        headers.Authorization = `Bearer ${token}`;
    }

    const config: RequestInit = {
        ...options,
        headers,
    };

    let response = await fetch(url, config);

    // Skip refresh logic for auth routes
    if (url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/register')) {
        return response;
    }

    if (response.status === 401) {
        if (!isRefreshing) {
            isRefreshing = true;
            const refreshToken = await AsyncStorage.getItem('refreshToken');

            if (!refreshToken) {
                if (onUnauthorized) onUnauthorized();
                isRefreshing = false;
                return response;
            }

            try {
                const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken })
                });

                if (!refreshResponse.ok) throw new Error('Refresh failed');

                const data = await refreshResponse.json();
                
                await AsyncStorage.setItem('userToken', data.token);
                if (data.refreshToken) {
                    await AsyncStorage.setItem('refreshToken', data.refreshToken);
                }

                isRefreshing = false;
                onRefreshed(data.token);

                // Retry original request
                headers.Authorization = `Bearer ${data.token}`;
                return fetch(url, { ...config, headers });

            } catch (error) {
                isRefreshing = false;
                if (onUnauthorized) onUnauthorized();
                return response;
            }
        } else {
            // Queue the request until refresh finishes
            return new Promise((resolve) => {
                subscribeTokenRefresh((newToken) => {
                    headers.Authorization = `Bearer ${newToken}`;
                    resolve(fetch(url, { ...config, headers }));
                });
            });
        }
    }

    return response;
};
