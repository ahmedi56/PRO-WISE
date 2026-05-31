import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { PermissionGate, IonIcon } from '../components/index';
import { getInitials } from '../utils/helpers';

export const AdminLayout: React.FC = () => {
    const { isSuperAdmin, user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const adminNavItems = isSuperAdmin ? [
        { to: "/admin/super-dashboard", icon: "stats-chart-outline", label: "Overview" },
        { to: "/admin/companies", icon: "business-outline", label: "Companies" },
        { to: "/admin/technician-applications", icon: "briefcase-outline", label: "Technicians" },
        { to: "/admin/support/pending", icon: "checkmark-circle-outline", label: "Content Approval" },
        { to: "/admin/categories", icon: "grid-outline", label: "Categories" },
        { to: "/admin/users", icon: "people-outline", label: "Users" },
        { to: "/admin/audit-logs", icon: "time-outline", label: "Audit Logs" },
    ] : [
        { to: "/admin/dashboard", icon: "speedometer-outline", label: "Dashboard" },
        { to: "/admin/products", icon: "cube-outline", label: "Products" },
        { to: "/admin/support", icon: "help-buoy-outline", label: "Support Content" },
        { to: "/admin/feedback", icon: "chatbubbles-outline", label: "Feedback" },
        { to: "/admin/qr-generate", icon: "qr-code-outline", label: "QR Codes" },
        { to: "/admin/analytics", icon: "analytics-outline", label: "Analytics" },
    ];

    return (
        <div className="pw-flex" style={{ height: '100vh', backgroundColor: 'var(--color-bg)', overflow: 'hidden' }}>
            {/* Sidebar Overlay (Mobile) */}
            {sidebarOpen && (
                <div 
                    onClick={() => setSidebarOpen(false)}
                    className="pw-fixed pw-inset-0 pw-z-50"
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                />
            )}

            {/* Sidebar */}
            <aside 
                className={`admin-sidebar pw-flex-col pw-z-100 ${sidebarOpen ? 'pw-translate-x-0' : 'pw-translate-x-neg-full'}`}
                style={{ 
                    width: '260px', 
                    transition: 'transform 0.3s ease, background-color 0.3s ease', 
                    position: 'absolute', 
                    height: '100%',
                    backgroundColor: 'var(--sidebar-bg)',
                    borderRight: '1px solid var(--sidebar-border)'
                }}
            >
                <div className="pw-flex pw-items-center pw-px-6 pw-border-b" style={{ height: '72px', borderColor: 'var(--sidebar-border)' }}>
                    <div style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <IonIcon name="shield-checkmark-outline" style={{ fontSize: '24px' }} />
                        <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em', color: 'var(--color-text-strong)' }}>
                            {isSuperAdmin ? 'SUPER ADMIN' : 'PRO-WISE'}
                        </span>
                    </div>
                </div>
                
                <nav className="pw-flex-1 pw-p-4 pw-overflow-y-auto" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {adminNavItems.map(item => (
                        <SidebarLink 
                            key={item.to}
                            to={item.to} 
                            icon={item.icon} 
                            label={item.label} 
                            onClick={() => setSidebarOpen(false)} 
                        />
                    ))}
                </nav>

                <div className="pw-p-4 pw-border-t" style={{ borderColor: 'var(--sidebar-border)' }}>
                    <button 
                        onClick={handleLogout}
                        className="pw-flex pw-items-center pw-gap-3 pw-w-full pw-p-3 hover-premium"
                        style={{ 
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer', 
                            fontWeight: 600,
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--color-error)'
                        }}
                    >
                        <IonIcon name="log-out-outline" style={{ fontSize: '20px' }} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="admin-main pw-flex-1 pw-flex-col pw-overflow-hidden">
                {/* Topbar */}
                <header className="pw-flex pw-items-center pw-justify-between pw-px-8 pw-bg-surface pw-border-b" style={{ height: '72px' }}>
                    <div className="pw-flex pw-items-center">
                        <button 
                            className="admin-menu-btn pw-mr-4"
                            onClick={() => setSidebarOpen(true)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'none', color: 'var(--color-text-strong)' }}
                        >
                            <IonIcon name="menu-outline" style={{ fontSize: '28px' }} />
                        </button>
                        <Link to="/home" className="pw-flex pw-items-center pw-gap-2 pw-text-muted hover:pw-text-primary" style={{ textDecoration: 'none', fontWeight: 500 }}>
                            <IonIcon name="arrow-back-outline" style={{ fontSize: '18px' }} />
                            <span className="pw-text-sm">Public Site</span>
                        </Link>
                    </div>
                    
                    <div className="pw-flex pw-items-center pw-gap-4">
                        <div style={{ textAlign: 'right' }}>
                            <div className="pw-text-sm pw-text-strong" style={{ fontWeight: 700 }}>{user?.name || user?.username}</div>
                            <div className="pw-text-xs pw-text-muted">{user?.company?.name || 'System Administrator'}</div>
                        </div>
                        <div className="pw-flex pw-items-center pw-justify-center pw-bg-primary pw-text-white" style={{ width: '40px', height: '40px', borderRadius: '12px', fontWeight: 800, fontSize: '0.9rem', boxShadow: '0 4px 12px var(--color-primary-glow)' }}>
                            {getInitials(user?.name || user?.username)}
                        </div>
                    </div>
                </header>
                
                {/* Page Content */}
                <main className="pw-flex-1 pw-overflow-y-auto pw-p-8" style={{ backgroundColor: 'var(--color-bg)' }}>
                    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                        <Outlet />
                    </div>
                </main>
            </div>

            <style>{`
                @media (min-width: 1024px) {
                    .admin-sidebar { position: static !important; transform: translateX(0) !important; }
                    .admin-menu-btn { display: none !important; }
                }
                @media (max-width: 1023px) {
                    .admin-menu-btn { display: block !important; }
                }
            `}</style>
        </div>
    );
};

const SidebarLink: React.FC<{ to: string; icon: string; label: string; onClick: () => void }> = ({ to, icon, label, onClick }) => {
    const location = useLocation();
    const isActive = location.pathname.startsWith(to);
    return (
        <Link 
            to={to} 
            onClick={onClick}
            style={{ 
                display: 'flex', alignItems: 'center', gap: '12px', 
                padding: '12px 16px', borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                backgroundColor: isActive ? 'var(--color-primary-light)' : 'transparent',
                color: isActive ? 'var(--color-primary)' : 'var(--sidebar-text)',
                fontWeight: isActive ? 700 : 500,
                transition: 'all 0.2s ease'
            }}
            className="sidebar-link-hover"
        >
            <IonIcon name={icon} style={{ fontSize: '20px', color: isActive ? 'var(--color-primary)' : 'inherit' }} />
            <span>{label}</span>
        </Link>
    );
};
