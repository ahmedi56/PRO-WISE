import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { RootState, AppDispatch } from '../store';
import SemanticSearch from '../components/SemanticSearch';
import { IonIcon } from '../components/ui';
import { NotificationDropdown } from '../components/NotificationDropdown';

export const Navbar: React.FC = () => {
    const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('prowise-theme') || 'dark';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('prowise-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    if (location.pathname === '/login' || location.pathname === '/register') {
        return null;
    }

    const role = user?.role || (user as any)?.Role;
    const roleName = (typeof role === 'object' ? role?.name : role || '').toLowerCase();
    const isAdmin = isAuthenticated && ['company_admin', 'super_admin', 'administrator'].includes(roleName);
    const initial = isAuthenticated ? ((user?.name || user?.username)?.[0]?.toUpperCase() || 'U') : '';
    
    const isActive = (path: string) =>
        location.pathname === path || location.pathname.startsWith(`${path}/`);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    return (
        <nav className="navbar" style={{ 
            padding: '0 2rem', 
            height: '72px', 
            background: 'var(--color-surface)', 
            borderBottom: '1px solid var(--color-border)', 
            position: 'sticky', 
            top: 0, 
            zIndex: 1000, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between' 
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
                <Link to="/" className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="pw-logo-box" style={{ 
                        backgroundColor: 'var(--color-primary)', 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                    }}>
                        <IonIcon name="flash" style={{ fontSize: '20px' }} />
                    </div>
                    <span style={{ fontWeight: 800, color: 'var(--color-text-strong)', letterSpacing: '-0.02em' }}>PRO-WISE</span>
                </Link>

                <div className="desktop-links" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Link
                        to="/categories"
                        className={`nav-link ${isActive('/categories') ? 'active' : ''}`}
                        style={{ 
                            padding: '0.5rem 1rem', 
                            fontSize: '0.9375rem', 
                            fontWeight: 600, 
                            color: isActive('/categories') ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            textDecoration: 'none'
                        }}
                    >
                        Directory
                    </Link>

                    {isAdmin && (
                        <Link
                            to="/admin"
                            className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
                            style={{ 
                                padding: '0.5rem 1rem', 
                                fontSize: '0.9375rem', 
                                fontWeight: 600, 
                                color: isActive('/admin') ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                textDecoration: 'none'
                            }}
                        >
                            Operations
                        </Link>
                    )}
                </div>
            </div>

            <div style={{ flex: 1, maxWidth: '500px', margin: '0 2rem' }}>
                <SemanticSearch />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <button
                    onClick={toggleTheme}
                    className="theme-toggle-btn"
                    style={{ 
                        background: 'none', 
                        cursor: 'pointer', 
                        color: 'var(--color-text-muted)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: 'var(--radius-md)', 
                        border: '1px solid var(--color-border)' 
                    }}
                >
                    <IonIcon name={theme === 'dark' ? "sunny-outline" : "moon-outline"} style={{ fontSize: '1.25rem' }} />
                </button>

                <div style={{ paddingLeft: '1.25rem', borderLeft: '1px solid var(--color-border)' }}>
                    <NotificationDropdown />
                </div>

                {isAuthenticated ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '1.25rem', borderLeft: '1px solid var(--color-border)' }}>
                        <Link to="/profile" style={{ textDecoration: 'none' }}>
                            <div className="nav-avatar" style={{ 
                                width: '36px', 
                                height: '36px', 
                                borderRadius: 'var(--radius-md)', 
                                background: 'var(--color-primary)', 
                                color: '#fff', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                fontWeight: 800, 
                                fontSize: '0.875rem' 
                            }}>
                                {initial}
                            </div>
                        </Link>
                        <button 
                            onClick={handleLogout} 
                            style={{ 
                                background: 'none', 
                                border: 'none', 
                                cursor: 'pointer', 
                                color: 'var(--color-text-muted)',
                                fontWeight: 700, 
                                fontSize: '0.8125rem' 
                            }}
                        >
                            Sign Out
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '1.25rem', borderLeft: '1px solid var(--color-border)' }}>
                        <Link to="/login" style={{ textDecoration: 'none', color: 'var(--color-text-strong)', fontWeight: 600, fontSize: '0.9375rem' }}>Sign In</Link>
                        <Link to="/register" style={{ 
                            textDecoration: 'none', 
                            color: '#fff', 
                            background: 'var(--color-primary)', 
                            padding: '0.5rem 1rem', 
                            borderRadius: 'var(--radius-md)', 
                            fontWeight: 600, 
                            fontSize: '0.9375rem' 
                        }}>
                            Get Started
                        </Link>
                    </div>
                )}
            </div>
            
            <style>{`
                @media (max-width: 768px) {
                    .desktop-links, .semantic-search-container { display: none !important; }
                }
            `}</style>
        </nav>
    );
};
