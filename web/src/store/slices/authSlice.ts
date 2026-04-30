import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../config';
import { User } from '../../types/user';

interface AuthState {
    user: User | null;
    token: string | null;
    loading: boolean;
    error: string | null;
    logoutMessage: string | null;
    success: boolean;
    registrationMessage: string | null;
    updateSuccess: boolean;
    isAuthenticated: boolean;
}

const normalizeRoleName = (role: any): string => {
    if (!role) return 'customer';
    const name = (typeof role === 'string' ? role : (role.name || '')).toLowerCase().trim();
    if (['superadmin', 'super-admin'].includes(name)) return 'super_admin';
    if (name === 'administrator') return 'company_admin';
    if (name === 'client' || name === 'user' || name === 'customer_role') return 'customer';
    return name || 'customer';
};

const normalizeUserRole = (user: any): User => {
    if (!user) return user;
    const role = user.role || user.Role;
    if (role && typeof role === 'object') {
        return { ...user, role: { ...role, name: normalizeRoleName(role) } };
    } else if (role) {
        return { ...user, role: { name: normalizeRoleName(role) } };
    }
    return user;
};

// Thunks
export const loginUser = createAsyncThunk(
    'auth/loginUser',
    async ({ email, password }: any, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_URL}/auth/login`, { email, password });
            console.log('Login Response:', response.data);
            const token = response.data.token;
            localStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            if (response.data.refreshToken) {
                localStorage.setItem('refreshToken', response.data.refreshToken);
            }
            return response.data;
        } catch (error: any) {
            console.error('Login Error:', error.response?.data || error.message);
            return rejectWithValue(error.response?.data?.message || 'Login failed');
        }
    }
);

export const registerUser = createAsyncThunk(
    'auth/registerUser',
    async (formData: any, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_URL}/auth/register`, formData);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Registration failed');
        }
    }
);

export const loadUser = createAsyncThunk(
    'auth/loadUser',
    async (_, { rejectWithValue }) => {
        const token = localStorage.getItem('token');
        if (!token) return rejectWithValue('__no_token__');

        try {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            const response = await axios.get(`${API_URL}/auth/me`);
            console.log('Load User Response:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Load User Error:', error.response?.data || error.message);
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            delete axios.defaults.headers.common['Authorization'];
            return rejectWithValue(error.response?.data?.message || 'Session expired');
        }
    }
);

export const updateUser = createAsyncThunk(
    'auth/updateUser',
    async (userData: any, { rejectWithValue }) => {
        try {
            const response = await axios.put(`${API_URL}/users/profile`, userData);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Update failed');
        }
    }
);

export const updateCompany = createAsyncThunk(
    'auth/updateCompany',
    async ({ id, companyData }: { id: string; companyData: any }, { rejectWithValue }) => {
        try {
            const response = await axios.put(`${API_URL}/companies/${id}`, companyData);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Company update failed');
        }
    }
);

export const googleLogin = createAsyncThunk(
    'auth/googleLogin',
    async (idToken: string, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_URL}/auth/google`, { idToken });
            const token = response.data.token;
            localStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            if (response.data.refreshToken) {
                localStorage.setItem('refreshToken', response.data.refreshToken);
            }
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Google login failed');
        }
    }
);

const initialState: AuthState = {
    user: null,
    token: localStorage.getItem('token'),
    loading: false,
    error: null,
    logoutMessage: null,
    success: false,
    registrationMessage: null,
    updateSuccess: false,
    isAuthenticated: !!localStorage.getItem('token'),
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            delete axios.defaults.headers.common['Authorization'];
            state.user = null;
            state.token = null;
            state.error = null;
            state.isAuthenticated = false;
            state.logoutMessage = 'You have been logged out successfully.';
        },
        clearError: (state) => {
            state.error = null;
            state.logoutMessage = null;
        },
        resetSuccess: (state) => {
            state.success = false;
            state.registrationMessage = null;
            state.updateSuccess = false;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.logoutMessage = null;
            })
            .addCase(loginUser.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.token = action.payload.token;
                state.user = normalizeUserRole(action.payload.user);
                state.isAuthenticated = true;
            })
            .addCase(loginUser.rejected, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(registerUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.success = true;
                state.registrationMessage = action.payload.successMessage || 'Registration successful';
                state.error = null;
            })
            .addCase(registerUser.rejected, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(loadUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loadUser.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.user = normalizeUserRole(action.payload);
                state.isAuthenticated = true;
            })
            .addCase(loadUser.rejected, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.user = null;
                state.token = null;
                state.isAuthenticated = false;
                // Don't set error for "no token" case — it's not a user-facing error
                if (action.payload && action.payload !== '__no_token__') {
                    state.error = action.payload;
                }
            })
            .addCase(updateUser.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.updateSuccess = false;
            })
            .addCase(updateUser.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                if (state.user && action.payload.user) {
                    state.user = normalizeUserRole({ ...state.user, ...action.payload.user });
                }
                state.updateSuccess = true;
            })
            .addCase(updateUser.rejected, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(updateCompany.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.updateSuccess = false;
            })
            .addCase(updateCompany.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                const companyData = action.payload;
                if (state.user && state.user.company) {
                    const companyId = typeof state.user.company === 'string' ? state.user.company : (state.user.company as any).id;
                    if (companyId === companyData.id) {
                        state.user = {
                            ...state.user,
                            company: { ...(typeof state.user.company === 'object' ? state.user.company : {}), ...companyData }
                        };
                    }
                }
                state.updateSuccess = true;
            })
            .addCase(updateCompany.rejected, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(googleLogin.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(googleLogin.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.token = action.payload.token;
                state.user = normalizeUserRole(action.payload.user);
                state.isAuthenticated = true;
            })
            .addCase(googleLogin.rejected, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { logout, clearError, resetSuccess } = authSlice.actions;

export default authSlice.reducer;
