import React from 'react';

interface PageHeaderProps {
    title: string;
    subtitle?: React.ReactNode;
    actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions }) => {
    return (
        <header className="page-header" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div className="page-header-content">
                <h1 className="page-title" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-strong)', letterSpacing: '-0.02em', margin: 0 }}>{title}</h1>
                {subtitle && <div className="page-subtitle" style={{ fontSize: '1rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', fontWeight: 500 }}>{subtitle}</div>}
            </div>
            {actions && <div className="page-header-actions" style={{ display: 'flex', gap: '0.75rem' }}>{actions}</div>}
        </header>
    );
};

export default PageHeader;
