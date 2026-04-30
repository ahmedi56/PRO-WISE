import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../config';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    read: boolean;
    createdAt: string;
    link?: string;
}

interface NotificationState {
    items: Notification[];
    unreadCount: number;
    loading: boolean;
    error: string | null;
}

const initialState: NotificationState = {
    items: [],
    unreadCount: 0,
    loading: false,
    error: null,
};

// Thunks
export const fetchNotifications = createAsyncThunk(
    'notifications/fetchNotifications',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_URL}/notifications`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications');
        }
    }
);

export const markAsRead = createAsyncThunk(
    'notifications/markAsRead',
    async (id: string, { rejectWithValue }) => {
        try {
            const response = await axios.patch(`${API_URL}/notifications/${id}`, { read: true });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update notification');
        }
    }
);

export const markAllRead = createAsyncThunk(
    'notifications/markAllRead',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.put(`${API_URL}/notifications/mark-all-read`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to mark all as read');
        }
    }
);

const notificationSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        addLocalNotification: (state, action: PayloadAction<Notification>) => {
            state.items.unshift(action.payload);
            state.unreadCount += 1;
        },
        clearNotifications: (state) => {
            state.items = [];
            state.unreadCount = 0;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotifications.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchNotifications.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.items = action.payload.notifications;
                state.unreadCount = action.payload.pagination.unreadCount;
            })
            .addCase(fetchNotifications.rejected, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(markAsRead.fulfilled, (state, action: PayloadAction<Notification>) => {
                const index = state.items.findIndex(n => n.id === action.payload.id);
                if (index !== -1 && !state.items[index].read) {
                    state.items[index].read = true;
                    state.unreadCount = Math.max(0, state.unreadCount - 1);
                }
            })
            .addCase(markAllRead.fulfilled, (state) => {
                state.items.forEach(n => n.read = true);
                state.unreadCount = 0;
            });
    },
});

export const { addLocalNotification, clearNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;
