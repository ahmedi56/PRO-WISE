import { useSelector } from 'react-redux';
import { RootState } from '../store';

export const useAuth = () => {
    const { user, token, loading } = useSelector((state: RootState) => state.auth);
    
    const roleName = user?.role 
        ? (typeof user.role === 'string' ? user.role : user.role.name)?.toLowerCase()
        : 'customer';

    return {
        user,
        token,
        loading,
        isAuthenticated: !!user && !!token,
        roleName,
        isSuperAdmin: roleName === 'super_admin',
        isCompanyAdmin: roleName === 'company_admin',
        isCustomer: roleName === 'customer',
        isTechnician: roleName === 'technician'
    };
};
