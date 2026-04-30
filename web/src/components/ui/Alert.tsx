import React from 'react';

interface AlertProps {
    tone?: 'error' | 'success' | 'warning' | 'info';
    children: React.ReactNode;
    className?: string;
}

export const Alert: React.FC<AlertProps> = ({ tone = 'error', children, className = '' }) => (
    <div className={`alert alert-${tone} ${className}`.trim()} role="alert">
        {children}
    </div>
);

export default Alert;
