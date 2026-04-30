import React from 'react';

interface SectionProps {
    title?: string;
    subtitle?: string;
    action?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

export const Section: React.FC<SectionProps> = ({ title, subtitle, action, children, className = '' }) => {
    return (
        <section className={`pw-section ${className}`}>
            {(title || action) && (
                <div className="pw-flex pw-justify-between pw-items-end pw-mb-4">
                    <div>
                        {title && <h2 className="pw-section-title" style={{ marginBottom: subtitle ? 'var(--sp-1)' : 0 }}>{title}</h2>}
                        {subtitle && <p className="pw-text-muted pw-text-sm">{subtitle}</p>}
                    </div>
                    {action && <div>{action}</div>}
                </div>
            )}
            <div>
                {children}
            </div>
        </section>
    );
};
