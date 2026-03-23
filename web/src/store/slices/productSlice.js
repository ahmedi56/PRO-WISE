import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../config';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// ─── Product Thunks ──────────────────────────────────────

export const fetchProducts = createAsyncThunk(
    'products/fetchProducts',
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_URL}/products`, {
                headers: getAuthHeaders(),
                params
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch products');
        }
    }
);

export const fetchProductById = createAsyncThunk(
    'products/fetchProductById',
    async (id, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_URL}/products/${id}`, {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch product');
        }
    }
);

export const createProduct = createAsyncThunk(
    'products/createProduct',
    async (productData, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_URL}/products`, productData, {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create product');
        }
    }
);

export const updateProduct = createAsyncThunk(
    'products/updateProduct',
    async ({ id, ...productData }, { rejectWithValue }) => {
        try {
            const response = await axios.put(`${API_URL}/products/${id}`, productData, {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update product');
        }
    }
);

export const deleteProduct = createAsyncThunk(
    'products/deleteProduct',
    async (id, { rejectWithValue }) => {
        try {
            await axios.delete(`${API_URL}/products/${id}`, {
                headers: getAuthHeaders()
            });
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete product');
        }
    }
);

// ─── Company Thunks ──────────────────────────────────────

export const fetchCompanies = createAsyncThunk(
    'products/fetchCompanies',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_URL}/companies`, {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch companies');
        }
    }
);

export const createCompany = createAsyncThunk(
    'products/createCompany',
    async (data, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_URL}/companies`, data, {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create company');
        }
    }
);

export const updateCompany = createAsyncThunk(
    'products/updateCompany',
    async ({ id, ...data }, { rejectWithValue }) => {
        try {
            const response = await axios.put(`${API_URL}/companies/${id}`, data, {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update company');
        }
    }
);

export const deleteCompany = createAsyncThunk(
    'products/deleteCompany',
    async (id, { rejectWithValue }) => {
        try {
            await axios.delete(`${API_URL}/companies/${id}`, {
                headers: getAuthHeaders()
            });
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete company');
        }
    }
);

// ─── Category Thunks ─────────────────────────────────────

export const fetchCategories = createAsyncThunk(
    'products/fetchCategories',
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_URL}/categories`, {
                headers: getAuthHeaders(),
                params
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories');
        }
    }
);

export const createCategory = createAsyncThunk(
    'products/createCategory',
    async (data, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_URL}/categories`, data, {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create category');
        }
    }
);

export const updateCategory = createAsyncThunk(
    'products/updateCategory',
    async ({ id, ...data }, { rejectWithValue }) => {
        try {
            const response = await axios.put(`${API_URL}/categories/${id}`, data, {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update category');
        }
    }
);

export const deleteCategory = createAsyncThunk(
    'products/deleteCategory',
    async (id, { rejectWithValue }) => {
        try {
            await axios.delete(`${API_URL}/categories/${id}`, {
                headers: getAuthHeaders()
            });
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete category');
        }
    }
);

// ─── Users Thunks (admin) ────────────────────────────────

export const fetchUsers = createAsyncThunk(
    'products/fetchUsers',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_URL}/users`, {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch users');
        }
    }
);

export const deleteUser = createAsyncThunk(
    'products/deleteUser',
    async (id, { rejectWithValue }) => {
        try {
            await axios.delete(`${API_URL}/users/${id}`, {
                headers: getAuthHeaders()
            });
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete user');
        }
    }
);

export const updateUserRole = createAsyncThunk(
    'products/updateUserRole',
    async ({ id, roleName }, { rejectWithValue }) => {
        try {
            const response = await axios.put(`${API_URL}/users/${id}/role`, { roleName }, {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update user role');
        }
    }
);

// ─── Slice ───────────────────────────────────────────────

const initialState = {
    products: [],
    productsMeta: null,
    currentProduct: null,
    companies: [],
    categories: [],
    users: [],
    loading: false,
    error: null,
    success: null,
};

const productSlice = createSlice({
    name: 'products',
    initialState,
    reducers: {
        clearError: (state) => { state.error = null; },
        clearSuccess: (state) => { state.success = null; },
    },
    extraReducers: (builder) => {
        builder
            // Products
            .addCase(fetchProducts.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchProducts.fulfilled, (state, action) => {
                state.loading = false;
                state.products = action.payload.data || action.payload;
                state.productsMeta = action.payload.meta || null;
            })
            .addCase(fetchProducts.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

            .addCase(fetchProductById.fulfilled, (state, action) => { state.currentProduct = action.payload; })

            .addCase(createProduct.fulfilled, (state, action) => {
                state.products.unshift(action.payload);
                state.success = 'Product created successfully';
            })
            .addCase(createProduct.rejected, (state, action) => { state.error = action.payload; })

            .addCase(updateProduct.fulfilled, (state, action) => {
                const idx = state.products.findIndex(p => p.id === action.payload.id);
                if (idx !== -1) state.products[idx] = action.payload;
                state.success = 'Product updated successfully';
            })
            .addCase(updateProduct.rejected, (state, action) => { state.error = action.payload; })

            .addCase(deleteProduct.fulfilled, (state, action) => {
                state.products = state.products.filter(p => p.id !== action.payload);
                state.success = 'Product deleted successfully';
            })
            .addCase(deleteProduct.rejected, (state, action) => { state.error = action.payload; })

            // Companies
            .addCase(fetchCompanies.fulfilled, (state, action) => { state.companies = action.payload; })
            .addCase(createCompany.fulfilled, (state, action) => {
                state.companies.push(action.payload);
                state.success = 'Company created successfully';
            })
            .addCase(createCompany.rejected, (state, action) => { state.error = action.payload; })
            .addCase(updateCompany.fulfilled, (state, action) => {
                const idx = state.companies.findIndex(c => c.id === action.payload.id);
                if (idx !== -1) state.companies[idx] = action.payload;
                state.success = 'Company updated successfully';
            })
            .addCase(deleteCompany.fulfilled, (state, action) => {
                state.companies = state.companies.filter(c => c.id !== action.payload);
                state.success = 'Company deleted successfully';
            })
            .addCase(deleteCompany.rejected, (state, action) => { state.error = action.payload; })

            // Categories
            .addCase(fetchCategories.fulfilled, (state, action) => { state.categories = action.payload; })
            .addCase(createCategory.fulfilled, (state, action) => {
                state.categories.push(action.payload);
                state.success = 'Category created successfully';
            })
            .addCase(createCategory.rejected, (state, action) => { state.error = action.payload; })
            .addCase(updateCategory.fulfilled, (state, action) => {
                const idx = state.categories.findIndex(c => c.id === action.payload.id);
                if (idx !== -1) state.categories[idx] = action.payload;
                state.success = 'Category updated successfully';
            })
            .addCase(deleteCategory.fulfilled, (state, action) => {
                state.categories = state.categories.filter(c => c.id !== action.payload);
                state.success = 'Category deleted successfully';
            })
            .addCase(deleteCategory.rejected, (state, action) => { state.error = action.payload; })

            // Users
            .addCase(fetchUsers.fulfilled, (state, action) => { state.users = action.payload; })
            .addCase(deleteUser.fulfilled, (state, action) => {
                state.users = state.users.filter(u => u.id !== action.payload);
                state.success = 'User deleted successfully';
            })
            .addCase(deleteUser.rejected, (state, action) => { state.error = action.payload; })
            .addCase(updateUserRole.fulfilled, (state, action) => {
                const idx = state.users.findIndex(u => u.id === action.payload.user.id);
                if (idx !== -1) state.users[idx] = action.payload.user;
                state.success = 'User role updated successfully';
            })
            .addCase(updateUserRole.rejected, (state, action) => { state.error = action.payload; });
    },
});

export const { clearError, clearSuccess } = productSlice.actions;
export default productSlice.reducer;
