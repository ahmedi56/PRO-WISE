import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { token, user, loading } = useSelector((state: RootState) => state.auth);

    if (loading || (token && !user)) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh', 
                backgroundColor: 'var(--color-bg)', 
                color: 'var(--color-text-strong)',
                fontFamily: 'inherit'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner mb-4" style={{ margin: '0 auto' }}></div>
                    <p style={{ fontWeight: 600, letterSpacing: '0.05em' }}>VERIFYING SESSION</p>
                </div>
            </div>
        );
    }

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
