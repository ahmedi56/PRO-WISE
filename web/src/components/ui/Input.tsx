import React, { forwardRef } from 'react';
import IonIcon from './IonIcon';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
    label?: string;
    error?: string;
    multiline?: boolean;
    rows?: number;
    icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(({
    label,
    error,
    multiline = false,
    className = '',
    icon,
    ...props
}, ref) => {
    const inputClasses = `pw-input ${error ? 'pw-border-error' : ''} ${className}`;
    
    return (
        <div className="pw-flex-col pw-mb-4">
            {label && <label className="pw-label">{label}</label>}
            <div style={{ position: 'relative' }}>
                {icon && (
                    <span style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--pw-text-muted)', display: 'flex' }}>
                        {typeof icon === 'string' ? <IonIcon name={icon} style={{ fontSize: '1.25rem' }} /> : icon}
                    </span>
                )}
                {multiline ? (
                    <textarea 
                        ref={ref as React.Ref<HTMLTextAreaElement>}
                        className={inputClasses} 
                        style={icon ? { paddingLeft: '40px' } : {}}
                        {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
                    />
                ) : (
                    <input 
                        ref={ref as React.Ref<HTMLInputElement>}
                        className={inputClasses}
                        style={icon ? { paddingLeft: '40px' } : {}}
                        {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
                    />
                )}
            </div>
            {error && <span className="pw-text-xs pw-mt-1" style={{ color: 'var(--pw-error)' }}>{error}</span>}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
