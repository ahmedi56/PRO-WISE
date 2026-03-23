import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const SuperAdminRoute = ({ children }) => {
    const { user, token } = useSelector((state) => state.auth);

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    // Block non-active users
    if (user.status !== 'active') {
        return <Navigate to="/pending-approval" replace />;
    }

    const userRole = user?.role || user?.Role;
    const isSuperAdmin = userRole?.name && userRole.name.toLowerCase() === 'super_admin';

    if (!isSuperAdmin) {
        return <Navigate to="/products" replace />;
    }

    return children;
};

export default SuperAdminRoute;
