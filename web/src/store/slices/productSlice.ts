import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../config';
import { Product, Category } from '../../types/product';
import { Company } from '../../types/company';
import { User } from '../../types/user';

interface ProductState {
    products: Product[];
    productsMeta: any | null;
    currentProduct: Product | null;
    companies: Company[];
    categories: Category[];
    users: User[];
    loading: boolean;
    error: string | null;
    success: string | null;
}

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// ─── Product Thunks ──────────────────────────────────────

export const fetchProducts = createAsyncThunk(
    'products/fetchProducts',
    async (params: any = {}, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_URL}/products`, {
                headers: getAuthHeaders(),
                params
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch products');
        }
    }
);

export const fetchProductById = createAsyncThunk(
    'products/fetchProductById',
    async (id: string, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_URL}/products/${id}`, {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch product');
        }
    }
);

export const createProduct = createAsyncThunk(
    'products/createProduct',
    async (productData: any, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_URL}/products`, productData, {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create product');
        }
    }
);

export const updateProduct = createAsyncThunk(
    'products/updateProduct',
    async ({ id, ...productData }: any, { rejectWithValue }) => {
        try {
            const response = await axios.put(`${API_URL}/products/${id}`, productData, {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update product');
        }
    }
);

export const deleteProduct = createAsyncThunk(
    'products/deleteProduct',
    async (id: string, { rejectWithValue }) => {
        try {
            await axios.delete(`${API_URL}/products/${id}`, {
                headers: getAuthHeaders()
            });
            return id;
        } catch (error: any) {
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
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch companies');
        }
    }
);

export const createCompany = createAsyncThunk(
    'products/createCompany',
    async (data: any, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_URL}/companies`, data, {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create company');
        }
    }
);

export const updateCompany = createAsyncThunk(
    'products/updateCompany',
    async ({ id, ...data }: any, { rejectWithValue }) => {
        try {
            const response = await axios.put(`${API_URL}/companies/${id}`, data, {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update company');
        }
    }
);

export const deleteCompany = createAsyncThunk(
    'products/deleteCompany',
    async (id: string, { rejectWithValue }) => {
        try {
            await axios.delete(`${API_URL}/companies/${id}`, {
                headers: getAuthHeaders()
            });
            return id;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete company');
        }
    }
);

// ─── Category Thunks ─────────────────────────────────────

export const fetchCategories = createAsyncThunk(
    'products/fetchCategories',
    async (params: any = {}, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_URL}/categories`, {
                headers: getAuthHeaders(),
                params
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories');
        }
    }
);

export const createCategory = createAsyncThunk(
    'products/createCategory',
    async (data: any, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_URL}/categories`, data, {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create category');
        }
    }
);

export const updateCategory = createAsyncThunk(
    'products/updateCategory',
    async ({ id, ...data }: any, { rejectWithValue }) => {
        try {
            const response = await axios.put(`${API_URL}/categories/${id}`, data, {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update category');
        }
    }
);

export const deleteCategory = createAsyncThunk(
    'products/deleteCategory',
    async (id: string, { rejectWithValue }) => {
        try {
            await axios.delete(`${API_URL}/categories/${id}`, {
                headers: getAuthHeaders()
            });
            return id;
        } catch (error: any) {
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
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch users');
        }
    }
);

export const deleteUser = createAsyncThunk(
    'products/deleteUser',
    async (id: string, { rejectWithValue }) => {
        try {
            await axios.delete(`${API_URL}/users/${id}`, {
                headers: getAuthHeaders()
            });
            return id;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete user');
        }
    }
);

export const updateUserRole = createAsyncThunk(
    'products/updateUserRole',
    async ({ id, roleName }: any, { rejectWithValue }) => {
        try {
            const response = await axios.put(`${API_URL}/users/${id}/role`, { roleName }, {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update user role');
        }
    }
);

// ─── Slice ───────────────────────────────────────────────

const initialState: ProductState = {
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
            .addCase(fetchProducts.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.products = action.payload.data || action.payload;
                state.productsMeta = action.payload.meta || null;
            })
            .addCase(fetchProducts.rejected, (state, action: PayloadAction<any>) => { state.loading = false; state.error = action.payload; })

            .addCase(fetchProductById.fulfilled, (state, action: PayloadAction<any>) => { state.currentProduct = action.payload; })

            .addCase(createProduct.fulfilled, (state, action: PayloadAction<any>) => {
                state.products.unshift(action.payload);
                state.success = 'Product created successfully';
            })
            .addCase(createProduct.rejected, (state, action: PayloadAction<any>) => { state.error = action.payload; })

            .addCase(updateProduct.fulfilled, (state, action: PayloadAction<any>) => {
                const idx = state.products.findIndex(p => p.id === action.payload.id);
                if (idx !== -1) state.products[idx] = action.payload;
                state.success = 'Product updated successfully';
            })
            .addCase(updateProduct.rejected, (state, action: PayloadAction<any>) => { state.error = action.payload; })

            .addCase(deleteProduct.fulfilled, (state, action: PayloadAction<any>) => {
                state.products = state.products.filter(p => p.id !== action.payload);
                state.success = 'Product deleted successfully';
            })
            .addCase(deleteProduct.rejected, (state, action: PayloadAction<any>) => { state.error = action.payload; })

            // Companies
            .addCase(fetchCompanies.fulfilled, (state, action: PayloadAction<any>) => { state.companies = action.payload; })
            .addCase(createCompany.fulfilled, (state, action: PayloadAction<any>) => {
                state.companies.push(action.payload);
                state.success = 'Company created successfully';
            })
            .addCase(createCompany.rejected, (state, action: PayloadAction<any>) => { state.error = action.payload; })
            .addCase(updateCompany.fulfilled, (state, action: PayloadAction<any>) => {
                const idx = state.companies.findIndex(c => c.id === action.payload.id);
                if (idx !== -1) state.companies[idx] = action.payload;
                state.success = 'Company updated successfully';
            })
            .addCase(deleteCompany.fulfilled, (state, action: PayloadAction<any>) => {
                state.companies = state.companies.filter(c => c.id !== action.payload);
                state.success = 'Company deleted successfully';
            })
            .addCase(deleteCompany.rejected, (state, action: PayloadAction<any>) => { state.error = action.payload; })

            // Categories
            .addCase(fetchCategories.fulfilled, (state, action: PayloadAction<any>) => { state.categories = action.payload; })
            .addCase(createCategory.fulfilled, (state, action: PayloadAction<any>) => {
                state.categories.push(action.payload);
                state.success = 'Category created successfully';
            })
            .addCase(createCategory.rejected, (state, action: PayloadAction<any>) => { state.error = action.payload; })
            .addCase(updateCategory.fulfilled, (state, action: PayloadAction<any>) => {
                const idx = state.categories.findIndex(c => c.id === action.payload.id);
                if (idx !== -1) state.categories[idx] = action.payload;
                state.success = 'Category updated successfully';
            })
            .addCase(deleteCategory.fulfilled, (state, action: PayloadAction<any>) => {
                state.categories = state.categories.filter(c => c.id !== action.payload);
                state.success = 'Category deleted successfully';
            })
            .addCase(deleteCategory.rejected, (state, action: PayloadAction<any>) => { state.error = action.payload; })

            // Users
            .addCase(fetchUsers.fulfilled, (state, action: PayloadAction<any>) => { state.users = action.payload; })
            .addCase(deleteUser.fulfilled, (state, action: PayloadAction<any>) => {
                state.users = state.users.filter(u => u.id !== action.payload);
                state.success = 'User deleted successfully';
            })
            .addCase(deleteUser.rejected, (state, action: PayloadAction<any>) => { state.error = action.payload; })
            .addCase(updateUserRole.fulfilled, (state, action: PayloadAction<any>) => {
                const idx = state.users.findIndex(u => u.id === action.payload.user.id);
                if (idx !== -1) state.users[idx] = action.payload.user;
                state.success = 'User role updated successfully';
            })
            .addCase(updateUserRole.rejected, (state, action: PayloadAction<any>) => { state.error = action.payload; });
    },
});

export const { clearError, clearSuccess } = productSlice.actions;
export default productSlice.reducer;
