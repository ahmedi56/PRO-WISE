import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import '@/styles/admin-layout.css';

interface NavItem {
    label: string;
    path: string;
    icon: string;
    permission: string;
    section: 'Governance' | 'Operations';
    badgeKey?: string;
}

const NAV_ITEMS: NavItem[] = [
    // Governance
    { label: 'Users', path: '/admin/users', icon: '👥', permission: 'users.manage', section: 'Governance' },
    { label: 'Categories', path: '/admin/categories', icon: '🏷️', permission: 'categories.manage', section: 'Governance' },
    { label: 'Audit Logs', path: '/admin/audit-logs', icon: '📜', permission: 'audit.view', section: 'Governance' },
    { label: 'Analytics', path: '/admin/analytics', icon: '📊', permission: 'analytics.view', section: 'Governance' },
    
    // Operations
    { label: 'Products', path: '/admin/products', icon: '📦', permission: 'products.manage', section: 'Operations' },
    { label: 'Support Content', path: '/admin/support', icon: '🛠️', permission: 'products.manage', section: 'Operations' },
    { label: 'QR Codes', path: '/admin/qr-generate', icon: '📱', permission: 'qr.generate', section: 'Operations' }
];

const AdminLayout: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [badges] = useState<Record<string, number>>({});

    // Filter items based on user permissions
    const role = user?.role || (user as any)?.Role;
    const roleName = (typeof role === 'object' ? role?.name : role || '').toLowerCase();
    const permissions = (typeof role === 'object' ? role?.permissions : []) || [];
    const isSuperAdmin = roleName === 'super_admin';

    const visibleItems = NAV_ITEMS.filter(item => {
        if (isSuperAdmin) {
            return item.section === 'Governance';
        }
        return permissions.includes(item.permission);
    });

    const sections = (['Governance', 'Operations'] as const).filter(section => 
        visibleItems.some(item => item.section === section)
    );

    const currentTitle = NAV_ITEMS.find(item => location.pathname.startsWith(item.path))?.label || (isSuperAdmin ? 'Super Admin Workspace' : 'Operations Workspace');

    return (
        <div className="admin-shell">
            {/* Sidebar */}
            <aside className={`admin-sidebar ${mobileOpen ? 'open' : ''}`}>
                <div className="admin-sidebar-header">
                    <img src="/pro-wise.png" alt="PRO-WISE Logo" className="brand-logo" />
                    <div className="sidebar-title">
                        {isSuperAdmin ? 'Platform Management' : 'Organization Hub'}
                    </div>
                </div>

                <nav className="admin-nav">
                    {sections.map((section) => (
                        <div key={section} className="admin-nav-section">
                            <div className="admin-nav-section-title">{isSuperAdmin ? section : 'Organization Operations'}</div>
                            {visibleItems.filter(item => item.section === section).map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
                                    onClick={() => setMobileOpen(false)}
                                >
                                    <span className="nav-icon">{item.icon}</span>
                                    <span className="nav-label">{item.label}</span>
                                    {item.badgeKey && badges[item.badgeKey] > 0 && (
                                        <span className="nav-badge">{badges[item.badgeKey]}</span>
                                    )}
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>

                <div className="admin-user-profile">
                    <div className="user-avatar">{user?.name?.charAt(0) || 'A'}</div>
                    <div className="user-info">
                        <span className="user-name">{user?.name || (isSuperAdmin ? 'Super Admin' : 'Operations Admin')}</span>
                        <span className="user-role">
                            {String(roleName || 'Operator').replace(/_/g, ' ').toUpperCase()}
                        </span>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="admin-content">
                <header className="admin-mobile-header">
                    <button className="menu-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
                        ☰
                    </button>
                    <span className="mobile-title">{currentTitle}</span>
                </header>

                <div className="admin-page-container">
                    <Outlet />
                </div>
            </main>

            {mobileOpen && <div className="admin-sidebar-overlay" onClick={() => setMobileOpen(false)} />}
        </div>
    );
};

export default AdminLayout;
