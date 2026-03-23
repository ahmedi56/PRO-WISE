import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const AdminRoute = ({ children }) => {
    const { user, token } = useSelector((state) => state.auth);

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    const userRole = user?.role || user?.Role;
    const isAdmin = userRole?.name && (
        userRole.name.toLowerCase() === 'company_admin' ||
        userRole.name.toLowerCase() === 'super_admin'
    );

    if (!isAdmin) {
        return <Navigate to="/products" replace />;
    }

    return children;
};

export default AdminRoute;
