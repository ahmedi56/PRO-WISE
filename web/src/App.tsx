import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { loadUser } from '@/store/slices/authSlice';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ProfilePage from '@/pages/ProfilePage';
import AdminPage from '@/pages/AdminPage';
import ProductListPage from '@/pages/ProductListPage';
import AdminCategoryPage from '@/pages/AdminCategoryPage';
import AdminCompanyPage from '@/pages/AdminCompanyPage';
import ProductFormPage from '@/pages/ProductFormPage';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import AdminLayout from '@/components/AdminLayout';
import SuperAdminRoute from '@/components/SuperAdminRoute';
import CompanyAdminRoute from '@/components/CompanyAdminRoute';
import PermissionProtectedRoute from '@/components/PermissionProtectedRoute';
import AdminUsersPage from '@/pages/AdminUsersPage';
import AdminGuideTypePage from '@/pages/AdminGuideTypePage';
import PendingApprovalPage from '@/pages/PendingApprovalPage';
import AuditLogPage from '@/pages/AuditLogPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import QRGeneratorPage from '@/pages/QRGeneratorPage';
import CategoryPage from '@/pages/CategoryPage';
import SearchPage from '@/pages/SearchPage';
import AdminSupportPage from '@/pages/AdminSupportPage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import VideoPlayerPage from '@/pages/VideoPlayerPage';
import { RootState, AppDispatch } from '@/store';

const HomeRedirect: React.FC = () => {
    const { user, token, loading } = useSelector((state: RootState) => state.auth);
    if (loading || (token && !user)) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-strong)' }}>Loading session...</div>;
    if (!user) return <Navigate to="/login" replace />;

    // Everyone goes to categories first as the main entry point
    return <Navigate to="/categories" replace />;
};

const AdminIndexRedirect: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const role = user?.role || (user as any)?.Role;
    const roleName = (typeof role === 'object' ? role?.name : role || '').toLowerCase();
    const permissions = (typeof role === 'object' ? role?.permissions : []) || [];

    const isSuperAdmin = roleName === 'super_admin';
    const isOrganizationAdmin = ['company_admin', 'administrator'].includes(roleName);

    // Super Admin: Focus on governance (User Management)
    if (isSuperAdmin || permissions.includes('users.manage')) {
        return <Navigate to="/admin/users" replace />;
    }

    // Company Admin / Others: Focus on Operations (Products)
    if (isOrganizationAdmin || permissions.includes('analytics.view') || permissions.includes('products.manage')) {
        return <Navigate to="/admin/products" replace />;
    }

    return <Navigate to="/products" replace />; 
};

function App() {
    const dispatch = useDispatch<AppDispatch>();

    React.useEffect(() => {
        dispatch(loadUser());
    }, [dispatch]);

    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Navbar />
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/pending-approval" element={<PendingApprovalPage />} />

                <Route
                    path="/categories"
                    element={
                        <ProtectedRoute>
                            <CategoryPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/products"
                    element={
                        <ProtectedRoute>
                            <ProductListPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/products/:id"
                    element={
                        <ProtectedRoute>
                            <ProductDetailPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/products/:id/videos/:videoId"
                    element={
                        <ProtectedRoute>
                            <VideoPlayerPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <ProfilePage />
                        </ProtectedRoute>
                    }
                />

                {/* Admin Routes */}
                <Route path="/admin" element={<CompanyAdminRoute><AdminLayout /></CompanyAdminRoute>}>
                    <Route index element={<AdminIndexRedirect />} />

                    {/* Products Management */}
                    <Route
                        path="products"
                        element={<PermissionProtectedRoute permission="products.manage"><AdminPage /></PermissionProtectedRoute>}
                    />
                    <Route
                        path="products/new"
                        element={<PermissionProtectedRoute permission="products.manage"><ProductFormPage /></PermissionProtectedRoute>}
                    />
                    <Route
                        path="products/:id/edit"
                        element={<PermissionProtectedRoute permission="products.update"><ProductFormPage /></PermissionProtectedRoute>}
                    />

                    {/* Super Admin Restricted Features */}
                    <Route
                        path="users"
                        element={<SuperAdminRoute><AdminUsersPage /></SuperAdminRoute>}
                    />
                    <Route
                        path="categories"
                        element={<SuperAdminRoute><AdminCategoryPage /></SuperAdminRoute>}
                    />
                    <Route
                        path="companies"
                        element={<CompanyAdminRoute><AdminCompanyPage /></CompanyAdminRoute>}
                    />
                    <Route
                        path="guide-types"
                        element={<SuperAdminRoute><AdminGuideTypePage /></SuperAdminRoute>}
                    />

                    <Route path="qr-generate" element={<PermissionProtectedRoute permission="qr.generate"><QRGeneratorPage /></PermissionProtectedRoute>} />
                    <Route path="qr-generate/:id" element={<PermissionProtectedRoute permission="qr.generate"><QRGeneratorPage /></PermissionProtectedRoute>} />
                    <Route path="support" element={<PermissionProtectedRoute permission="products.manage"><AdminSupportPage /></PermissionProtectedRoute>} />
                    <Route path="analytics" element={<SuperAdminRoute><AnalyticsPage /></SuperAdminRoute>} />
                    <Route path="audit-logs" element={<SuperAdminRoute><AuditLogPage /></SuperAdminRoute>} />
                </Route>

                <Route
                    path="/search"
                    element={
                        <ProtectedRoute>
                            <SearchPage />
                        </ProtectedRoute>
                    }
                />

                <Route path="/" element={<HomeRedirect />} />
            </Routes>
        </Router>
    );
}

export default App;
