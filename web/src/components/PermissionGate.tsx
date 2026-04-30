import React from 'react';
import { useAuth } from '../hooks/useAuth';

interface PermissionGateProps {
    children: React.ReactNode;
    roles?: string[];
    permissions?: string[]; // For future granular permissions
    fallback?: React.ReactNode;
}

/**
 * A component that renders its children only if the user has the required roles.
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({ 
    children, 
    roles = [], 
    fallback = null 
}) => {
    const { roleName, isAuthenticated } = useAuth();

    if (!isAuthenticated) return <>{fallback}</>;

    const hasRole = roles.length === 0 || roles.includes(roleName);

    if (!hasRole) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};
