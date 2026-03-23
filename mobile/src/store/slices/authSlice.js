import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from '../../constants/config';
import { apiFetch } from '../../utils/api';

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
            console.log(`Attempting login for ${email} at ${API_URL}/auth/login`);
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            console.log('Login response status:', response.status);

            if (!response.ok) {
                console.log('Login failed response data:', data);
                return rejectWithValue(data.message || 'Login failed');
            }

            console.log('Login success data:', data);

            // Role Check: Mobile is for End Users and Company Admins
            const roleName = normalizeRoleName(data.user?.role);
            if (roleName !== 'user' && roleName !== 'company_admin') {
                console.warn('Access denied: Role is', roleName);
                return rejectWithValue('Access denied: Mobile app is for standard users and business administrators only');
            }

            await AsyncStorage.setItem('userToken', data.token);
            if (data.refreshToken) {
                await AsyncStorage.setItem('refreshToken', data.refreshToken);
            }
            if (data.user) {
                await AsyncStorage.setItem('userData', JSON.stringify(data.user));
            }
            return data;
        } catch (error) {
            console.error('Login Fetch Error:', error);
            return rejectWithValue('Network request failed');
        }
    }
);

export const registerUser = createAsyncThunk(
    'auth/registerUser',
    async ({ name, username, email, password, roleName }, { rejectWithValue }) => {
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, username, email, password, roleName }),
            });
            const data = await response.json();

            if (!response.ok) {
                return rejectWithValue(data.message || 'Registration failed');
            }

            return data;
        } catch (error) {
            return rejectWithValue('Network request failed');
        }
    }
);

export const updateUser = createAsyncThunk(
    'auth/updateUser',
    async (userData, { rejectWithValue, dispatch }) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await apiFetch(`${API_URL}/users/profile`, {
                method: 'PUT',
                body: JSON.stringify(userData),
            }, () => dispatch(logout())); 

            
            const data = await response.json();
            if (!response.ok) {
                return rejectWithValue(data.message || 'Update failed');
            }
            // Fix Profile Bug: The backend returns { message, user }, we should return { user: data.user }
            return { user: data.user || data };
        } catch (error) {
            return rejectWithValue('Network request failed');
        }
    }
);

export const loadUser = createAsyncThunk(
    'auth/loadUser',
    async (_, { rejectWithValue, dispatch }) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) return rejectWithValue('No token found');

            const response = await apiFetch(`${API_URL}/auth/me`, {}, () => dispatch(logout()));

            if (response.ok) {
                const data = await response.json();
                return { token, user: data };
            } else {
                await AsyncStorage.removeItem('userToken');
                return rejectWithValue('Session expired');
            }
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    user: null,
    token: null,
    loading: false,
    error: null,
    success: false,
    updateSuccess: false,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            AsyncStorage.removeItem('userToken');
            AsyncStorage.removeItem('refreshToken');
            AsyncStorage.removeItem('userData');
            state.user = null;
            state.token = null;
            state.error = null;
            state.success = false;
            state.updateSuccess = false;
        },
        clearError: (state) => {
            state.error = null;
        },
        resetSuccess: (state) => {
            state.success = false;
            state.updateSuccess = false;
        }
    },
    extraReducers: (builder) => {
        builder
            // Login
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
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
            .addCase(registerUser.fulfilled, (state) => {
                state.loading = false;
                state.success = true;
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Load User
            .addCase(loadUser.pending, (state) => {
                state.loading = true;
            })
            .addCase(loadUser.fulfilled, (state, action) => {
                state.loading = false;
                state.token = action.payload.token;
                const user = action.payload.user;
                if (user && user.role) {
                    user.role.name = normalizeRoleName(user.role);
                }
                state.user = user;
            })
            .addCase(loadUser.rejected, (state) => {
                state.loading = false;
                state.token = null;
                state.user = null;
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
            });
    },
});

export const { logout, clearError, resetSuccess } = authSlice.actions;

export default authSlice.reducer;
