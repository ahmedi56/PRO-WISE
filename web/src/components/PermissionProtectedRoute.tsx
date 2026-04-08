import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

interface PermissionProtectedRouteProps {
    children: React.ReactNode;
    permission: string;
}

const PermissionProtectedRoute: React.FC<PermissionProtectedRouteProps> = ({ children, permission }) => {
    const { user, token } = useSelector((state: RootState) => state.auth);
    const location = useLocation();

    if (!token || !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (user.status !== 'active') {
        return <Navigate to="/pending-approval" replace />;
    }

    const role = user?.role || (user as any)?.Role;
    const permissions = (typeof role === 'object' ? role?.permissions : []) || [];

    if (!permissions.includes(permission)) {
        return <Navigate to="/products" replace />;
    }

    return <>{children}</>;
};

export default PermissionProtectedRoute;
