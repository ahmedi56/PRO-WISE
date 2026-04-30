import React from 'react';

interface PageWrapperProps {
    children: React.ReactNode;
    className?: string;
    maxWidth?: string;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({ children, className = '', maxWidth }) => {
    return (
        <div 
            className={`pw-page pw-fade-in ${className}`}
            style={maxWidth ? { maxWidth } : {}}
        >
            {children}
        </div>
    );
};
