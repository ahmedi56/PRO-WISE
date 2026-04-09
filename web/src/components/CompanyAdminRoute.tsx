import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

interface CompanyAdminRouteProps {
    children: React.ReactNode;
}

const CompanyAdminRoute: React.FC<CompanyAdminRouteProps> = ({ children }) => {
    const { user, token } = useSelector((state: RootState) => state.auth);

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    // Must be active to do anything admin-related
    if (user.status !== 'active') {
        return <Navigate to="/pending-approval" replace />;
    }

    const role = user.role;
    const roleName = (typeof role === 'object' && role !== null ? (role as any).name : String(role || '')).toLowerCase();
    const isAdmin = ['company_admin', 'super_admin', 'administrator'].includes(roleName);

    if (!isAdmin) {
        return <Navigate to="/products" replace />;
    }

    return <>{children}</>;
};

export default CompanyAdminRoute;
