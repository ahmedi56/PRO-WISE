import React from 'react';
import IonIcon from './IonIcon';

export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg', color?: string }> = ({ size = 'md', color }) => {
    const sizeMap = { sm: 16, md: 24, lg: 32 };
    const dim = sizeMap[size];
    
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <IonIcon 
                name="sync-outline"
                style={{ 
                    fontSize: `${dim}px`, 
                    color: color || 'var(--color-primary)',
                    animation: 'spin 1s linear infinite'
                }}
            />
            <style>{`
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default Spinner;
