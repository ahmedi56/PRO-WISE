import React from 'react';

interface BadgeProps {
    children: React.ReactNode;
    tone?: 'neutral' | 'success' | 'danger' | 'warning' | 'info' | 'primary';
    className?: string;
}

const Badge: React.FC<BadgeProps> = ({ children, tone = 'neutral', className = '' }) => (
    <span className={`badge badge-${tone} ${className}`.trim()}>{children}</span>
);

export default Badge;
