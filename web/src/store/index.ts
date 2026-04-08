import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import productReducer from './slices/productSlice';
import supportReducer from './slices/supportSlice';

const store = configureStore({
    reducer: {
        auth: authReducer,
        products: productReducer,
        support: supportReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
