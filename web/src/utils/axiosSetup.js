import axios from 'axios';
import { API_URL } from '../config';
import store from '../store';
import { logout } from '../store/slices/authSlice';

// Add a request interceptor to automatically attach the token
axios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Add a response interceptor to automatically refresh tokens on 401
axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Skip interceptor for auth routes to prevent loops
        if (originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/refresh')) {
            return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
                store.dispatch(logout());
                return Promise.reject(error);
            }

            try {
                // Request a new token
                const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
                if (data.token) {
                    localStorage.setItem('token', data.token);
                    if (data.refreshToken) {
                        localStorage.setItem('refreshToken', data.refreshToken);
                    }
                    
                    // Update the failed request with the new token and retry
                    originalRequest.headers.Authorization = `Bearer ${data.token}`;
                    return axios(originalRequest);
                }
            } catch (refreshError) {
                // If refresh fails, log the user out
                store.dispatch(logout());
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);
