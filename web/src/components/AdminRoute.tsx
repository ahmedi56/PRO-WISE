import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isCompanyAdmin, isSuperAdmin, loading } = useAuth();

    if (loading) return null;

    if (!isCompanyAdmin && !isSuperAdmin) {
        return <Navigate to="/home" replace />;
    }

    return <>{children}</>;
};
