import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { API_URL } from '../config';
import '../styles/admin-layout.css';

const NAV_ITEMS = [
    // Governance
    { label: 'Users', path: '/admin/users', icon: '👥', permission: 'users.manage', section: 'Governance' },
    { label: 'Categories', path: '/admin/categories', icon: '🏷️', permission: 'categories.manage', section: 'Governance' },
    { label: 'Audit Logs', path: '/admin/audit-logs', icon: '📜', permission: 'audit.view', section: 'Governance' },
    
    // Operations
    { label: 'Products', path: '/admin/products', icon: '📦', permission: 'products.manage', section: 'Operations' },
    { label: 'QR Codes', path: '/admin/qr-generate', icon: '📱', permission: 'qr.generate', section: 'Operations' },
    { label: 'Analytics', path: '/admin/analytics', icon: '📊', permission: 'analytics.view', section: 'Operations' }
];

const AdminLayout = () => {
    const { user, token } = useSelector((state) => state.auth);
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [badges, setBadges] = useState({});

    // Filter items based on user permissions
    const userRole = (user?.role?.name || user?.Role?.name || '').toLowerCase();
    const permissions = user?.role?.permissions || user?.Role?.permissions || [];

    const visibleItems = NAV_ITEMS.filter(item => {
        return permissions.includes(item.permission);
    });

    const sections = ['Governance', 'Operations'].filter(section => 
        visibleItems.some(item => item.section === section)
    );

    // Determine title based on current path for mobile header
    const currentTitle = NAV_ITEMS.find(item => location.pathname.startsWith(item.path))?.label || 'Admin Workspace';

    return (
        <div className="admin-shell">
            {/* Sidebar */}
            <aside className={`admin-sidebar ${mobileOpen ? 'open' : ''}`}>
                <div className="admin-sidebar-header">
                    <img src="/pro-wise.png" alt="PRO-WISE Logo" className="brand-logo" />
                    <span className="brand-text">Admin Console</span>
                </div>

                <nav className="admin-nav">
                    {sections.map((section) => (
                        <div key={section} className="admin-nav-section">
                            <div className="admin-nav-section-title">{section}</div>
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
                        <span className="user-name">{user?.name || 'Admin'}</span>
                        <span className="user-role">
                            {(user?.role?.name || 'Administrator').replace(/_/g, ' ').toUpperCase()}
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

            {/* Overlay for mobile sidebar */}
            {mobileOpen && <div className="admin-sidebar-overlay" onClick={() => setMobileOpen(false)} />}
        </div>
    );
};

export default AdminLayout;
