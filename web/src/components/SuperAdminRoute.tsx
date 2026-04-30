import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isSuperAdmin, loading } = useAuth();

    if (loading) return null;

    if (!isSuperAdmin) {
        return <Navigate to="/home" replace />;
    }

    return <>{children}</>;
};
