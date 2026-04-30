import React from 'react';

interface BadgeProps {
    children: React.ReactNode;
    tone?: 'neutral' | 'success' | 'danger' | 'warning' | 'info' | 'primary' | 'accent' | 'error';
    size?: string;
    className?: string;
    style?: React.CSSProperties;
}

const Badge: React.FC<BadgeProps> = ({ children, tone = 'neutral', size, className = '', style }) => {
    // Map 'danger' to 'error' if needed by the CSS
    const resolvedTone = tone === 'danger' ? 'error' : tone;
    
    return (
        <span
            className={`badge badge-${resolvedTone} ${size ? `badge-${size}` : ''} ${className}`.trim()}
            style={style}
        >
            {children}
        </span>
    );
};

export default Badge;
