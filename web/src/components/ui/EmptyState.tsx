import React from 'react';
import IonIcon from './IonIcon';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    text?: string;
    description?: string; // Alias for text
    action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, text, description, action }) => (
    <div className="empty-state" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '4rem 2rem',
        textAlign: 'center'
    }}>
        <div className="empty-state-icon" style={{ 
            fontSize: '3rem', 
            marginBottom: '1.5rem',
            color: 'var(--color-text-muted)',
            opacity: 0.5
        }}>
            {typeof icon === 'string' ? <IonIcon name={icon} /> : icon || <IonIcon name="cube-outline" />}
        </div>
        <h3 className="empty-state-title" style={{ 
            fontSize: '1.25rem', 
            fontWeight: 700, 
            color: 'var(--color-text-strong)',
            marginBottom: '0.75rem'
        }}>{title}</h3>
        {(text || description) ? (
            <p className="empty-state-text" style={{ 
                fontSize: '0.9375rem', 
                color: 'var(--color-text-muted)',
                maxWidth: '400px',
                margin: '0 auto 1.5rem',
                lineHeight: '1.6'
            }}>{text || description}</p>
        ) : null}
        {action ? <div className="empty-state-action">{action}</div> : null}
    </div>
);

export default EmptyState;
