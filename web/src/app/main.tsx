import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import store from '../store';
import '../utils/axiosSetup';
import '../index.css';

const container = document.getElementById('root');
if (!container) {
    throw new Error('Fatal: Target container #root not found in DOM.');
}

const root = createRoot(container);
root.render(
    <React.StrictMode>
        <Provider store={store}>
            <GoogleOAuthProvider clientId="1007717796636-6j5ll09sbmpubbirplsl3428e43mobb4.apps.googleusercontent.com">
                <App />
            </GoogleOAuthProvider>
        </Provider>
    </React.StrictMode>
);

