import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { IonIcon } from '../components/ui';

export const MainLayout: React.FC = () => {
    const location = useLocation();
    
    const navItems = [
        { icon: 'home-outline', label: 'Home', path: '/home' },
        { icon: 'grid-outline', label: 'Categories', path: '/categories' },
        { icon: 'search-outline', label: 'Search', path: '/search' },
        { icon: 'person-outline', label: 'Profile', path: '/profile' },
    ];

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />
            
            <main style={{ flex: 1, padding: '2rem', paddingTop: '80px', position: 'relative', zIndex: 1 }}>
                <div className="pw-page">
                    <Outlet />
                </div>
            </main>

            {/* Bottom Nav for Mobile */}
            <nav className="mobile-bottom-nav" style={{ 
                position: 'fixed', bottom: 0, left: 0, right: 0, 
                height: '72px', backgroundColor: 'var(--color-surface)', 
                borderTop: '1px solid var(--color-border)',
                display: 'none', justifyContent: 'space-around', alignItems: 'center',
                zIndex: 1000
            }}>
                {navItems.map(item => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                        <Link 
                            key={item.path} 
                            to={item.path} 
                            style={{ 
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textDecoration: 'none', 
                                color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                gap: '4px'
                            }}
                        >
                            <IonIcon name={item.icon} style={{ fontSize: '24px' }} />
                            <span style={{ fontSize: '10px', fontWeight: isActive ? 700 : 500 }}>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <style>{`
                @media (max-width: 768px) {
                    .mobile-bottom-nav { display: flex !important; }
                    main { padding-bottom: 90px !important; }
                }
                .pw-page {
                    max-width: 1280px;
                    margin: 0 auto;
                    width: 100%;
                }
            `}</style>
        </div>
    );
};
