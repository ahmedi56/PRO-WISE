import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../config';

const normalizeRoleName = (role) => {
    if (!role) return 'user';
    const name = (typeof role === 'string' ? role : (role.name || '')).toLowerCase().trim();
    if (['superadmin', 'super-admin'].includes(name)) return 'super_admin';
    if (name === 'administrator') return 'company_admin';
    if (name === 'client') return 'user';
    return name || 'user';
};

// Thunks
export const loginUser = createAsyncThunk(
    'auth/loginUser',
    async ({ email, password }, { rejectWithValue }) => {
        try {
            console.log(`Web login attempt for ${email} at ${API_URL}/auth/login`);
            const response = await axios.post(`${API_URL}/auth/login`, { email, password });
            console.log('Web login success:', response.data);
            localStorage.setItem('token', response.data.token);
            if (response.data.refreshToken) {
                localStorage.setItem('refreshToken', response.data.refreshToken);
            }
            return response.data;
        } catch (error) {
            console.error('Web Login Error:', error.response?.data || error.message);
            return rejectWithValue(error.response?.data?.message || 'Login failed');
        }
    }
);

export const registerUser = createAsyncThunk(
    'auth/registerUser',
    async ({ name, username, email, password, roleName, companyId, newCompanyName, newCompanyDescription }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_URL}/auth/register`, {
                name,
                username,
                email,
                password,
                roleName,
                companyId,
                newCompanyName,
                newCompanyDescription
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Registration failed');
        }
    }
);

export const loadUser = createAsyncThunk(
    'auth/loadUser',
    async (_, { rejectWithValue }) => {
        const token = localStorage.getItem('token');
        if (!token) {
            return rejectWithValue('No token found');
        }

        try {
            const response = await axios.get(`${API_URL}/auth/me`);
            return response.data;
        } catch (error) {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            return rejectWithValue(error.response?.data?.message || 'Session expired');
        }
    }
);

export const updateUser = createAsyncThunk(
    'auth/updateUser',
    async (userData, { rejectWithValue }) => {
        const token = localStorage.getItem('token');
        try {
            const response = await axios.put(`${API_URL}/users/profile`, userData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Update failed');
        }
    }
);

export const updateCompany = createAsyncThunk(
    'auth/updateCompany',
    async ({ id, companyData }, { rejectWithValue }) => {
        const token = localStorage.getItem('token');
        try {
            const response = await axios.put(`${API_URL}/companies/${id}`, companyData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Company update failed');
        }
    }
);

const initialState = {
    user: null,
    token: localStorage.getItem('token'),
    loading: false,
    error: null,
    logoutMessage: null,
    success: false,
    registrationMessage: null,
    updateSuccess: false,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            state.user = null;
            state.token = null;
            state.error = null;
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
            // Login
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.logoutMessage = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.token = action.payload.token;
                const user = action.payload.user;
                if (user && user.role) {
                    user.role.name = normalizeRoleName(user.role);
                }
                state.user = user;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Register
            .addCase(registerUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.registrationMessage = action.payload.successMessage || 'Registration successful';
                state.error = null;
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Load User
            .addCase(loadUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loadUser.fulfilled, (state, action) => {
                state.loading = false;
                const user = action.payload;
                if (user && user.role) {
                    user.role.name = normalizeRoleName(user.role);
                }
                state.user = user;
            })
            .addCase(loadUser.rejected, (state) => {
                state.loading = false;
                state.user = null;
                state.token = null;
            })
            // Update User
            .addCase(updateUser.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.updateSuccess = false;
            })
            .addCase(updateUser.fulfilled, (state, action) => {
                state.loading = false;
                const user = { ...state.user, ...action.payload.user };
                if (user && user.role) {
                    user.role.name = normalizeRoleName(user.role);
                }
                state.user = user;
                state.updateSuccess = true;
            })
            .addCase(updateUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Update Company
            .addCase(updateCompany.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.updateSuccess = false;
            })
            .addCase(updateCompany.fulfilled, (state, action) => {
                state.loading = false;
                if (state.user && state.user.company && (state.user.company.id === action.payload.id || state.user.company === action.payload.id)) {
                    state.user.company = { ...state.user.company, ...action.payload };
                }
                state.updateSuccess = true;
            })
            .addCase(updateCompany.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { logout, clearError, resetSuccess } = authSlice.actions;

export default authSlice.reducer;
