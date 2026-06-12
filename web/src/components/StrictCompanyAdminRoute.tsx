import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

interface StrictCompanyAdminRouteProps {
    children: React.ReactNode;
}

const StrictCompanyAdminRoute: React.FC<StrictCompanyAdminRouteProps> = ({ children }) => {
    const { user, token } = useSelector((state: RootState) => state.auth);

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    if (user.status !== 'active') {
        return <Navigate to="/pending-approval" replace />;
    }

    const role = user?.role || (user as any)?.Role;
    const roleName = (typeof role === 'object' && role !== null ? (role as any).name : String(role || '')).toLowerCase();
    const isStrictCompanyAdmin = roleName === 'company_admin';

    if (!isStrictCompanyAdmin) {
        return <Navigate to="/home" replace />;
    }

    return <>{children}</>;
};

export default StrictCompanyAdminRoute;
