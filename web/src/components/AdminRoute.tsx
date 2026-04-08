import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

interface AdminRouteProps {
    children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
    const { user, token } = useSelector((state: RootState) => state.auth);

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    const role = user?.role || (user as any)?.Role;
    const roleName = (typeof role === 'object' ? role?.name : role || '').toLowerCase();
    const isAdmin = ['company_admin', 'super_admin', 'administrator'].includes(roleName);

    if (!isAdmin) {
        return <Navigate to="/products" replace />;
    }

    return <>{children}</>;
};

export default AdminRoute;
