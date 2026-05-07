import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loadUser } from '../store/slices/authSlice';
import { AppDispatch, RootState } from '../store';

// Layouts & Guards
import { MainLayout, AdminLayout, AuthLayout } from '../layout';
import { 
    ProtectedRoute, AdminRoute, SuperAdminRoute, 
    PermissionProtectedRoute, CompanyAdminRoute, 
    ErrorBoundary 
} from '../components/index';

// Public Pages
import { 
    HomePage, CategoryPage, CategoryProductsPage, 
    ProductDetailPage, SearchPage, VideoPlayerPage,
    TechniciansPage, ExpertProfilePage
} from '../pages/public';

// Auth Pages
import { LoginPage, RegisterPage, PendingApprovalPage } from '../pages/auth';

// User Pages
import { ProfilePage, TechnicianProfilePage, ServiceRequestPage, TechnicianApplicationPage, TechnicianPortalPage } from '../pages/user';

// Admin Pages
import { 
    DashboardPage, ProductsPage, ProductFormPage, 
    SupportPage, FeedbackPage, AnalyticsPage, 
    ContentListPage, ContentFormPage, PendingContentPage, QRGeneratorPage 
} from '../pages/admin';

// Super Admin Pages
import { 
    SuperDashboardPage, CategoriesPage, CategoryFormPage, CompaniesPage, 
    UsersPage, AuditLogPage, TechnicianApplicationsPage 
} from '../pages/super-admin';

const AdminIndexRedirect: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        if (!user) return;
        const role = user?.role || (user as any)?.Role;
        const roleName = (typeof role === 'object' && role !== null ? (role as any).name : String(role || '')).toLowerCase();
        
        if (roleName === 'super_admin') {
            navigate('/admin/super-dashboard', { replace: true });
        } else {
            navigate('/admin/dashboard', { replace: true });
        }
    }, [user, navigate]);

    return null;
};

const App: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();

    useEffect(() => {
        dispatch(loadUser());
    }, [dispatch]);

    return (
        <ErrorBoundary>
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <Routes>
                    <Route path="/" element={<Navigate to="/home" replace />} />

                    {/* Auth Routes */}
                    <Route element={<AuthLayout />}>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/pending-approval" element={<PendingApprovalPage />} />
                    </Route>

                    {/* Main Layout (Public & User Protected) */}
                    <Route element={<MainLayout />}>
                        <Route path="/home" element={<HomePage />} />
                        <Route path="/categories" element={<CategoryPage />} />
                        <Route path="/home/category/:categoryName" element={<CategoryProductsPage />} />
                        <Route path="/products/:id" element={<ProductDetailPage />} />
                        <Route path="/search" element={<SearchPage />} />
                        <Route path="/video/:videoId" element={<VideoPlayerPage />} />
                        <Route path="/technicians" element={<TechniciansPage />} />
                        <Route path="/experts/:id" element={<ExpertProfilePage />} />

                        <Route path="/profile" element={
                            <ProtectedRoute>
                                <ProfilePage />
                            </ProtectedRoute>
                        } />
                        <Route path="/technician/apply" element={
                            <ProtectedRoute>
                                <TechnicianApplicationPage />
                            </ProtectedRoute>
                        } />
                        <Route path="/technician/profile" element={
                            <ProtectedRoute>
                                <TechnicianProfilePage />
                            </ProtectedRoute>
                        } />
                        <Route path="/technician-portal" element={
                            <ProtectedRoute>
                                <TechnicianPortalPage />
                            </ProtectedRoute>
                        } />
                        <Route path="/service-request" element={
                            <ProtectedRoute>
                                <ServiceRequestPage />
                            </ProtectedRoute>
                        } />
                    </Route>

                    {/* Admin & Super Admin Layout */}
                    <Route path="/admin" element={
                        <CompanyAdminRoute>
                            <AdminLayout />
                        </CompanyAdminRoute>
                    }>
                        <Route index element={<AdminIndexRedirect />} />
                        
                        {/* Super Admin Restricted */}
                        <Route path="super-dashboard" element={<SuperAdminRoute><SuperDashboardPage /></SuperAdminRoute>} />
                        <Route path="users" element={<SuperAdminRoute><UsersPage /></SuperAdminRoute>} />
                        <Route path="technician-applications" element={<SuperAdminRoute><TechnicianApplicationsPage /></SuperAdminRoute>} />
                        <Route path="categories" element={<SuperAdminRoute><CategoriesPage /></SuperAdminRoute>} />
                        <Route path="categories/new" element={<SuperAdminRoute><CategoryFormPage /></SuperAdminRoute>} />
                        <Route path="categories/:id/edit" element={<SuperAdminRoute><CategoryFormPage /></SuperAdminRoute>} />
                        <Route path="audit-logs" element={<SuperAdminRoute><AuditLogPage /></SuperAdminRoute>} />

                        {/* Mixed / Permission Based */}
                        <Route path="companies" element={<SuperAdminRoute><CompaniesPage /></SuperAdminRoute>} />
                        <Route path="dashboard" element={<AdminRoute><DashboardPage /></AdminRoute>} />
                        
                        <Route path="products" element={<PermissionProtectedRoute permission="products.manage"><ProductsPage /></PermissionProtectedRoute>} />
                        <Route path="products/new" element={<PermissionProtectedRoute permission="products.manage"><ProductFormPage /></PermissionProtectedRoute>} />
                        <Route path="products/:id/edit" element={<PermissionProtectedRoute permission="products.update"><ProductFormPage /></PermissionProtectedRoute>} />
                        
                        <Route path="support" element={<PermissionProtectedRoute permission="products.manage"><ContentListPage /></PermissionProtectedRoute>} />
                        <Route path="support/new" element={<PermissionProtectedRoute permission="products.manage"><ContentFormPage /></PermissionProtectedRoute>} />
                        <Route path="support/pending" element={<PermissionProtectedRoute permission="products.manage"><PendingContentPage /></PermissionProtectedRoute>} />
                        <Route path="support/:id/edit" element={<PermissionProtectedRoute permission="products.update"><ContentFormPage /></PermissionProtectedRoute>} />
                        
                        <Route path="feedback" element={<CompanyAdminRoute><FeedbackPage /></CompanyAdminRoute>} />
                        <Route path="analytics" element={<CompanyAdminRoute><AnalyticsPage /></CompanyAdminRoute>} />
                        <Route path="qr-generate/:id?" element={<PermissionProtectedRoute permission="qr.generate"><QRGeneratorPage /></PermissionProtectedRoute>} />
                    </Route>

                    <Route path="*" element={<Navigate to="/home" replace />} />
                </Routes>
            </BrowserRouter>
        </ErrorBoundary>
    );
};

export default App;
