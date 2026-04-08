import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/store/slices/authSlice';
import Button from '@/components/ui/Button';
import SemanticSearch from '@/components/SemanticSearch';
import { RootState, AppDispatch } from '@/store';

const Navbar: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('prowise-theme') || 'dark';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('prowise-theme', theme);
    }, [theme]);

    if (!user) {
        return null;
    }

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const role = user.role || (user as any).Role;
    const roleName = (typeof role === 'object' ? role?.name : role || '').toLowerCase();
    const isAdmin = ['company_admin', 'super_admin', 'administrator'].includes(roleName);
    const initial = (user.name || user.username)?.[0]?.toUpperCase() || 'U';
    
    const isActive = (path: string) =>
        location.pathname === path || location.pathname.startsWith(`${path}/`);

    const closeMenu = () => setMobileOpen(false);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <Link to="/categories" className="navbar-brand" onClick={closeMenu}>
                <img src="/pro-wise.png" alt="PRO-WISE Logo" className="brand-logo" />
            </Link>

            <button
                onClick={toggleTheme}
                className="theme-toggle-btn"
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
                {theme === 'dark' ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="theme-icon">
                        <circle cx="12" cy="12" r="5" />
                        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                    </svg>
                ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="theme-icon">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                )}
            </button>

            <SemanticSearch />

            <button
                type="button"
                className="navbar-mobile-toggle"
                aria-label="Toggle navigation"
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen((previous) => !previous)}
            >
                {mobileOpen ? 'x' : '='}
            </button>

            <div className={`navbar-links ${mobileOpen ? 'mobile-open' : ''}`}>
                <Link
                    to="/categories"
                    className={`nav-link ${isActive('/categories') ? 'active' : ''}`}
                    onClick={closeMenu}
                >
                    Categories
                </Link>

                <Link
                    to="/profile"
                    className={`nav-link ${isActive('/profile') ? 'active' : ''}`}
                    onClick={closeMenu}
                >
                    Profile
                </Link>
                {isAdmin ? (
                    <>
                        <Link
                            to="/admin"
                            className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
                            onClick={closeMenu}
                        >
                            {roleName === 'super_admin' ? 'Super Admin' : 'Admin'}
                        </Link>
                        {roleName === 'super_admin' ? (
                            <>
                                <Link
                                    to="/admin/users"
                                    className={`nav-link ${isActive('/admin/users') ? 'active' : ''}`}
                                    onClick={closeMenu}
                                >
                                    Users
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/admin/products"
                                    className={`nav-link ${isActive('/admin/products') ? 'active' : ''}`}
                                    onClick={closeMenu}
                                >
                                    My Products
                                </Link>
                            </>
                        )}
                    </>
                ) : null}

                <Button onClick={handleLogout} variant="ghost" size="sm" style={{ padding: '0.5rem 1rem' }}>
                    Logout
                </Button>
                <div className="nav-avatar" title={user.name || user.username}>
                    {initial}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
