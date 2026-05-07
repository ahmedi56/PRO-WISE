import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from '../../constants/config';
import { apiFetch } from '../../utils/api';
import { User, UserRole } from '../../types/user';

interface AuthState {
    user: User | null;
    token: string | null;
    loading: boolean;
    error: string | null;
    success: boolean;
    updateSuccess: boolean;
}

const normalizeRoleName = (role: any): string => {
    if (!role) return 'user';
    const name = (typeof role === 'string' ? role : (role.name || '')).toLowerCase().trim();
    if (['superadmin', 'super-admin', 'super_admin'].includes(name)) return 'super_admin';
    if (['administrator', 'company_admin'].includes(name)) return 'company_admin';
    if (['client', 'user'].includes(name)) return 'user';
    return name || 'user';
};

// Thunks
export const loginUser = createAsyncThunk(
    'auth/loginUser',
    async ({ email, password }: any, { rejectWithValue }) => {
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
                return rejectWithValue(data.message || 'Login failed');
            }

            // Role Check: Mobile is for Customers only
            const roleName = normalizeRoleName(data.user?.role);
            if (roleName !== 'user') {
                return rejectWithValue('Access denied: This app is for customers only. Admins should use the web portal.');
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
            return rejectWithValue('Network request failed');
        }
    }
);

export const registerUser = createAsyncThunk(
    'auth/registerUser',
    async ({ name, username, email, password, roleName }: any, { rejectWithValue }) => {
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

export const googleLogin = createAsyncThunk(
    'auth/googleLogin',
    async (accessToken: string, { rejectWithValue }) => {
        try {
            const response = await fetch(`${API_URL}/auth/google`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ idToken: accessToken }),
            });

            const data = await response.json();
            if (!response.ok) {
                return rejectWithValue(data.message || 'Google login failed');
            }

            // Role Check: Mobile is for Customers only
            const roleName = normalizeRoleName(data.user?.role);
            if (roleName !== 'user') {
                return rejectWithValue('Access denied: This app is for customers only. Admins should use the web portal.');
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
            return rejectWithValue('Network request failed');
        }
    }
);

export const updateUser = createAsyncThunk(
    'auth/updateUser',
    async (userData: any, { rejectWithValue, dispatch }) => {
        try {
            const response = await apiFetch(`${API_URL}/users/profile`, {
                method: 'PUT',
                body: JSON.stringify(userData),
            }, () => dispatch(logout())); 

            const data = await response.json();
            if (!response.ok) {
                return rejectWithValue(data.message || 'Update failed');
            }
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
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState: AuthState = {
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
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.token = action.payload.token;
                state.user = action.payload.user;
                if (state.user && state.user.role) {
                    state.user.role = { name: normalizeRoleName(state.user.role) };
                }
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
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
                state.error = action.payload as string;
            })
            .addCase(googleLogin.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(googleLogin.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.token = action.payload.token;
                state.user = action.payload.user;
                if (state.user && state.user.role) {
                    state.user.role = { name: normalizeRoleName(state.user.role) };
                }
            })
            .addCase(googleLogin.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(loadUser.pending, (state) => {
                state.loading = true;
            })
            .addCase(loadUser.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.token = action.payload.token;
                state.user = action.payload.user;
                if (state.user && state.user.role) {
                    state.user.role = { name: normalizeRoleName(state.user.role) };
                }
            })
            .addCase(loadUser.rejected, (state) => {
                state.loading = false;
                state.token = null;
                state.user = null;
            })
            .addCase(updateUser.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.updateSuccess = false;
            })
            .addCase(updateUser.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                const user = { ...state.user, ...action.payload.user };
                if (user && user.role) {
                    user.role = { name: normalizeRoleName(user.role) };
                }
                state.user = user;
                state.updateSuccess = true;
            })
            .addCase(updateUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { logout, clearError, resetSuccess } = authSlice.actions;
export default authSlice.reducer;
