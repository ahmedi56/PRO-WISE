import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PermissionProtectedRoute = ({ children, permission }) => {
    const { user, token } = useSelector((state) => state.auth);
    const location = useLocation();

    if (!token || !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Block non-active users
    if (user.status !== 'active') {
        return <Navigate to="/pending-approval" replace />;
    }

    const userRole = user?.role || user?.Role;
    const permissions = userRole?.permissions || [];

    // Check if user has the specific permission
    if (!permissions.includes(permission)) {
        // If they are missing this specific permission, redirecting to products is more context-aware than profile
        return <Navigate to="/products" replace />;
    }

    return children;
};

export default PermissionProtectedRoute;
