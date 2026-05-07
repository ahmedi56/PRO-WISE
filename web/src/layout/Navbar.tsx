import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { RootState, AppDispatch } from '../store';
import SemanticSearch from '../components/SemanticSearch';
import { IonIcon } from '../components/ui';
import { NotificationDropdown } from '../components/NotificationDropdown';
import '../styles/navbar.css';

export const Navbar: React.FC = () => {
    const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('prowise-theme') || 'dark';
    });

    const [isHidden, setIsHidden] = useState(false);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [stormEnabled, setStormEnabled] = useState(() => {
        return localStorage.getItem('prowise-storm') !== 'false';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('prowise-theme', theme);
    }, [theme]);

    useEffect(() => {
        if (stormEnabled) {
            document.body.classList.remove('animations-disabled');
        } else {
            document.body.classList.add('animations-disabled');
        }
        localStorage.setItem('prowise-storm', stormEnabled.toString());
    }, [stormEnabled]);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            
            // Only hide when scrolling down past 60px, show when scrolling up
            if (currentScrollY > lastScrollY && currentScrollY > 60) {
                setIsHidden(true);
            } else if (currentScrollY < lastScrollY) {
                setIsHidden(false);
            }
            
            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

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
        <nav className="navbar" style={{ transform: isHidden ? 'translateY(-100%)' : 'translateY(0)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
                <Link to="/" className="navbar-brand" style={{ display: 'flex', alignItems: 'center' }}>
                    <img src="/pro-wise.svg" alt="PRO-WISE Logo" style={{ height: '48px', width: 'auto', objectFit: 'contain' }} />
                </Link>

                <div className="desktop-links" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Link to="/categories" className={`nav-link ${isActive('/categories') ? 'active' : ''}`}>
                        Directory
                    </Link>
                    <Link to="/technicians" className={`nav-link ${isActive('/technicians') ? 'active' : ''}`}>
                        Find Experts
                    </Link>

                    {isAdmin && (
                        <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`}>
                            Operations
                        </Link>
                    )}
                </div>
            </div>

            <div style={{ flex: 1, maxWidth: '500px', margin: '0 2rem' }}>
                <SemanticSearch />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button onClick={toggleTheme} className="nav-icon-btn">
                    <IonIcon name={theme === 'dark' ? "sunny-outline" : "moon-outline"} style={{ fontSize: '1.25rem' }} />
                </button>

                <div style={{ paddingLeft: '1.25rem', borderLeft: '1px solid var(--color-border)', position: 'relative', zIndex: 1000000 }}>
                    <NotificationDropdown />
                </div>

                {isAuthenticated ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', paddingLeft: '1.25rem', borderLeft: '1px solid var(--color-border)', position: 'relative', zIndex: 1000000 }}>
                        <div className="nav-user-pill" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                            <div className="nav-avatar">
                                {initial}
                            </div>
                            <IonIcon name={userMenuOpen ? "chevron-up-outline" : "chevron-down-outline"} style={{ fontSize: '14px', color: 'var(--color-text-muted)' }} />
                        </div>

                        {userMenuOpen && (
                            <div className="user-dropdown pw-card pw-absolute pw-top-full pw-right-0 pw-mt-2 pw-fade-in" style={{ width: '220px', padding: '0.5rem', boxShadow: 'var(--shadow-lg)', zIndex: 100001 }}>
                                <Link to="/profile" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                                    <IonIcon name="person-outline" /> Profile
                                </Link>

                                {user?.technicianStatus === 'none' && !isAdmin && (
                                    <Link to="/technician/apply" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                                        <IonIcon name="construct-outline" /> Become a Technician
                                    </Link>
                                )}

                                {user?.technicianStatus === 'approved' && (
                                    <Link to="/technician-portal" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                                        <IonIcon name="hammer-outline" /> Technician Portal
                                    </Link>
                                )}

                                <button className="dropdown-item" onClick={() => setStormEnabled(!stormEnabled)}>
                                    <IonIcon name={stormEnabled ? "flash-outline" : "flash-off-outline"} /> 
                                    {stormEnabled ? 'Disable Storm' : 'Enable Storm'}
                                </button>
                                <div style={{ height: '1px', background: 'var(--color-border)', margin: '0.5rem 0' }} />
                                <button className="dropdown-item logout" onClick={handleLogout}>
                                    <IonIcon name="log-out-outline" /> Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', paddingLeft: '1.25rem', borderLeft: '1px solid var(--color-border)' }}>
                        <Link to="/login" style={{ textDecoration: 'none', color: 'var(--color-text-strong)', fontWeight: 700, fontSize: '0.9rem' }}>Sign In</Link>
                        <Link to="/register" className="btn-get-started" style={{ 
                            textDecoration: 'none', color: '#fff', background: 'var(--color-primary)', 
                            padding: '0.625rem 1.25rem', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: '0.9rem' 
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
