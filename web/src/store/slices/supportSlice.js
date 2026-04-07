import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../config';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// ─── Thunks ──────────────────────────────────────────────

export const fetchSupportContent = createAsyncThunk(
    'support/fetchSupportContent',
    async (productId, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_URL}/support/products/${productId}`, {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch support content');
        }
    }
);

export const createGuide = createAsyncThunk(
    'support/createGuide',
    async (guideData, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_URL}/support/guides`, guideData, {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create guide');
        }
    }
);

export const deleteGuide = createAsyncThunk(
    'support/deleteGuide',
    async (id, { rejectWithValue }) => {
        try {
            await axios.delete(`${API_URL}/support/guides/${id}`, {
                headers: getAuthHeaders()
            });
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete guide');
        }
    }
);

export const createStep = createAsyncThunk(
    'support/createStep',
    async (stepData, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_URL}/support/steps`, stepData, {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to add step');
        }
    }
);

export const deleteStep = createAsyncThunk(
    'support/deleteStep',
    async (id, { rejectWithValue }) => {
        try {
            await axios.delete(`${API_URL}/support/steps/${id}`, {
                headers: getAuthHeaders()
            });
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete step');
        }
    }
);

export const createVideo = createAsyncThunk(
    'support/createVideo',
    async (videoData, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_URL}/support/videos`, videoData, {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to add video');
        }
    }
);

export const deleteVideo = createAsyncThunk(
    'support/deleteVideo',
    async (id, { rejectWithValue }) => {
        try {
            await axios.delete(`${API_URL}/support/videos/${id}`, {
                headers: getAuthHeaders()
            });
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete video');
        }
    }
);

export const createPDF = createAsyncThunk(
    'support/createPDF',
    async (pdfData, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_URL}/support/pdfs`, pdfData, {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to add PDF');
        }
    }
);

export const uploadPDF = createAsyncThunk(
    'support/uploadPDF',
    async (formData, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_URL}/support/pdfs/upload`, formData, {
                headers: {
                    ...getAuthHeaders()
                }
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to upload PDF');
        }
    }
);

export const deletePDF = createAsyncThunk(
    'support/deletePDF',
    async (id, { rejectWithValue }) => {
        try {
            await axios.delete(`${API_URL}/support/pdfs/${id}`, {
                headers: getAuthHeaders()
            });
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete PDF');
        }
    }
);

// ─── Slice ───────────────────────────────────────────────

const initialState = {
    content: {
        guide: null,
        videos: [],
        pdfs: [],
        steps: []
    },
    loading: false,
    error: null,
    success: null
};

const supportSlice = createSlice({
    name: 'support',
    initialState,
    reducers: {
        clearSupportState: (state) => {
            state.content = initialState.content;
            state.error = null;
            state.success = null;
        },
        clearMessages: (state) => {
            state.error = null;
            state.success = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch All support content
            .addCase(fetchSupportContent.fulfilled, (state, action) => {
                state.loading = false;
                state.content = action.payload;
            })

            // Guide
            .addCase(createGuide.fulfilled, (state, action) => {
                state.loading = false;
                state.content.guide = action.payload;
                state.success = 'Repair Guide created successfully';
            })
            .addCase(deleteGuide.fulfilled, (state) => {
                state.loading = false;
                state.content.guide = null;
                state.content.steps = [];
                state.success = 'Repair Guide removed';
            })

            // Steps
            .addCase(createStep.fulfilled, (state, action) => {
                state.loading = false;
                state.content.steps.push(action.payload);
                state.content.steps.sort((a, b) => a.step_number - b.step_number);
                state.success = 'Step added successfully';
            })
            .addCase(deleteStep.fulfilled, (state, action) => {
                state.loading = false;
                state.content.steps = state.content.steps.filter(s => s.id !== action.payload);
                state.success = 'Step removed';
            })

            // Videos
            .addCase(createVideo.fulfilled, (state, action) => {
                state.loading = false;
                state.content.videos.push(action.payload);
                state.success = 'Video added successfully';
            })
            .addCase(deleteVideo.fulfilled, (state, action) => {
                state.loading = false;
                state.content.videos = state.content.videos.filter(v => v.id !== action.payload);
                state.success = 'Video removed';
            })

            // PDFs
            .addCase(createPDF.fulfilled, (state, action) => {
                state.loading = false;
                state.content.pdfs.push(action.payload);
                state.success = 'PDF added successfully';
            })
            .addCase(uploadPDF.fulfilled, (state) => {
                state.loading = false; // Upload is just a middle step
            })
            .addCase(deletePDF.fulfilled, (state, action) => {
                state.loading = false;
                state.content.pdfs = state.content.pdfs.filter(p => p.id !== action.payload);
                state.success = 'PDF removed';
            })

            // Generic Pending/Rejected Handler Generator (MUST COME LAST)
            .addMatcher(
                (action) => action.type.startsWith('support/') && action.type.endsWith('/pending'),
                (state) => {
                    state.loading = true;
                    state.error = null;
                }
            )
            .addMatcher(
                (action) => action.type.startsWith('support/') && action.type.endsWith('/rejected'),
                (state, action) => {
                    state.loading = false;
                    state.error = action.payload || 'An unexpected error occurred';
                }
            );
    }
});

export const { clearSupportState, clearMessages } = supportSlice.actions;
export default supportSlice.reducer;
