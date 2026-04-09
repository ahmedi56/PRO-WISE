import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../config';

interface Guide {
    id: string;
    title: string;
    description?: string;
    product: string;
    difficulty?: string;
    estimated_time?: string;
    isPublished?: boolean;
}

interface Step {
    id: string;
    step_number: number;
    title: string;
    instruction: string;
    guide: string;
}

interface Video {
    id: string;
    title: string;
    url: string;
    product: string;
}

interface PDF {
    id: string;
    title: string;
    file_path: string;
    product: string;
}

interface SupportState {
    content: {
        guide: Guide | null;
        videos: Video[];
        pdfs: PDF[];
        steps: Step[];
    };
    loading: boolean;
    error: string | null;
    success: string | null;
}

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// ─── Thunks ──────────────────────────────────────────────

export const fetchSupportContent = createAsyncThunk(
    'support/fetchSupportContent',
    async (productId: string, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_URL}/support/products/${productId}`, {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch support content');
        }
    }
);

export const createGuide = createAsyncThunk(
    'support/createGuide',
    async (guideData: any, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_URL}/support/guides`, guideData, {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create guide');
        }
    }
);

export const deleteGuide = createAsyncThunk(
    'support/deleteGuide',
    async (id: string, { rejectWithValue }) => {
        try {
            await axios.delete(`${API_URL}/support/guides/${id}`, {
                headers: getAuthHeaders()
            });
            return id;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete guide');
        }
    }
);

export const createStep = createAsyncThunk(
    'support/createStep',
    async (stepData: any, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_URL}/support/steps`, stepData, {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to add step');
        }
    }
);

export const deleteStep = createAsyncThunk(
    'support/deleteStep',
    async (id: string, { rejectWithValue }) => {
        try {
            await axios.delete(`${API_URL}/support/steps/${id}`, {
                headers: getAuthHeaders()
            });
            return id;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete step');
        }
    }
);

export const createVideo = createAsyncThunk(
    'support/createVideo',
    async (videoData: any, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_URL}/support/videos`, videoData, {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to add video');
        }
    }
);

export const deleteVideo = createAsyncThunk(
    'support/deleteVideo',
    async (id: string, { rejectWithValue }) => {
        try {
            await axios.delete(`${API_URL}/support/videos/${id}`, {
                headers: getAuthHeaders()
            });
            return id;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete video');
        }
    }
);

export const createPDF = createAsyncThunk(
    'support/createPDF',
    async (pdfData: any, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_URL}/support/pdfs`, pdfData, {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to add PDF');
        }
    }
);

export const uploadPDF = createAsyncThunk(
    'support/uploadPDF',
    async (formData: FormData, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_URL}/support/pdfs/upload`, formData, {
                headers: {
                    ...getAuthHeaders()
                }
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to upload PDF');
        }
    }
);

export const deletePDF = createAsyncThunk(
    'support/deletePDF',
    async (id: string, { rejectWithValue }) => {
        try {
            await axios.delete(`${API_URL}/support/pdfs/${id}`, {
                headers: getAuthHeaders()
            });
            return id;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete PDF');
        }
    }
);

const initialState: SupportState = {
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
            .addCase(fetchSupportContent.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.content = action.payload;
            })
            .addCase(createGuide.fulfilled, (state, action: PayloadAction<Guide>) => {
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
            .addCase(createStep.fulfilled, (state, action: PayloadAction<Step>) => {
                state.loading = false;
                state.content.steps.push(action.payload);
                state.content.steps.sort((a, b) => a.step_number - b.step_number);
                state.success = 'Step added successfully';
            })
            .addCase(deleteStep.fulfilled, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.content.steps = state.content.steps.filter(s => s.id !== action.payload);
                state.success = 'Step removed';
            })
            .addCase(createVideo.fulfilled, (state, action: PayloadAction<Video>) => {
                state.loading = false;
                state.content.videos.push(action.payload);
                state.success = 'Video added successfully';
            })
            .addCase(deleteVideo.fulfilled, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.content.videos = state.content.videos.filter(v => v.id !== action.payload);
                state.success = 'Video removed';
            })
            .addCase(createPDF.fulfilled, (state, action: PayloadAction<PDF>) => {
                state.loading = false;
                state.content.pdfs.push(action.payload);
                state.success = 'PDF added successfully';
            })
            .addCase(uploadPDF.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(deletePDF.fulfilled, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.content.pdfs = state.content.pdfs.filter(p => p.id !== action.payload);
                state.success = 'PDF removed';
            })
            .addMatcher(
                (action) => action.type.startsWith('support/') && action.type.endsWith('/pending'),
                (state) => {
                    state.loading = true;
                    state.error = null;
                }
            )
            .addMatcher(
                (action) => action.type.startsWith('support/') && action.type.endsWith('/rejected'),
                (state, action: PayloadAction<any>) => {
                    state.loading = false;
                    state.error = action.payload || 'An unexpected error occurred';
                }
            );
    }
});

export const { clearSupportState, clearMessages } = supportSlice.actions;
export default supportSlice.reducer;
