import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import Button from './ui/Button';

const Navbar = () => {
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = React.useState(false);

    if (!user) {
        return null;
    }

    const role = user.role || user.Role;
    const roleName = role?.name?.toLowerCase() || '';
    const isAdmin = ['company_admin', 'super_admin'].includes(roleName);
    const initial = (user.name || user.username)?.[0]?.toUpperCase() || 'U';
    const isActive = (path) =>
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
                            Admin
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
                                <Link
                                    to="/admin/qr-generate"
                                    className={`nav-link ${isActive('/admin/qr-generate') ? 'active' : ''}`}
                                    onClick={closeMenu}
                                >
                                    QR Codes
                                </Link>
                            </>
                        )}
                    </>
                ) : null}
                <Button onClick={handleLogout} variant="ghost" size="sm">
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
