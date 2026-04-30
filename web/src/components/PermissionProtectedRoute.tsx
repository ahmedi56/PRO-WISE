import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

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
    const roleName = (typeof role === 'object' && role !== null ? (role as any).name : String(role || '')).toLowerCase();
    const permissions: string[] = (typeof role === 'object' ? (role as any)?.permissions : []) || [];

    const isSuperAdmin = roleName === 'super_admin';
    const isCompanyAdmin = ['company_admin', 'administrator'].includes(roleName);

    const hasPermission = permissions.includes(permission);
    const hasImplicitAccess = isSuperAdmin || (isCompanyAdmin && [
        'products.manage', 'products.update', 'guides.manage', 'guides.update',
        'technicians.manage', 'qr.generate'
    ].includes(permission));

    if (!hasPermission && !hasImplicitAccess) {
        return <Navigate to="/home" replace />;
    }

    return <>{children}</>;
};

export default PermissionProtectedRoute;
