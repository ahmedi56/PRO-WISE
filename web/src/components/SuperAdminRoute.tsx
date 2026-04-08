import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

interface SuperAdminRouteProps {
    children: React.ReactNode;
}

const SuperAdminRoute: React.FC<SuperAdminRouteProps> = ({ children }) => {
    const { user, token } = useSelector((state: RootState) => state.auth);

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    if (user.status !== 'active') {
        return <Navigate to="/pending-approval" replace />;
    }

    const role = user?.role || (user as any)?.Role;
    const roleName = (typeof role === 'object' ? role?.name : role || '').toLowerCase();
    const isSuperAdmin = roleName === 'super_admin';

    if (!isSuperAdmin) {
        return <Navigate to="/products" replace />;
    }

    return <>{children}</>;
};

export default SuperAdminRoute;
