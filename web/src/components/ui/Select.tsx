import React, { forwardRef, SelectHTMLAttributes } from 'react';
import IonIcon from './IonIcon';

interface Option {
    value: string | number;
    label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    id: string;
    label?: string;
    options?: Option[];
    error?: string | null;
    helperText?: string;
    placeholder?: string;
    icon?: string | React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
    id,
    label,
    options = [],
    error,
    helperText,
    placeholder = 'Select an option',
    className = '',
    icon,
    style,
    ...props
}, ref) => {
    const describedBy = [
        helperText ? `${id}-helper` : '',
        error ? `${id}-error` : '',
    ].filter(Boolean).join(' ');

    return (
        <div className={`pw-input-group pw-mb-4 ${className}`}>
            {label && (
                <label htmlFor={id} className="pw-label">
                    {label}
                </label>
            )}
            
            <div style={{ position: 'relative' }}>
                {icon && (
                    <span className="pw-input-icon">
                        {typeof icon === 'string' ? (
                            <IonIcon name={icon} />
                        ) : (
                            icon
                        )}
                    </span>
                )}
                
                <select
                    id={id}
                    ref={ref}
                    className={`pw-select ${error ? 'pw-border-error' : ''}`}
                    aria-invalid={Boolean(error)}
                    aria-describedby={describedBy || undefined}
                    style={{
                        ...style,
                        paddingLeft: icon ? '38px' : '12px'
                    }}
                    {...props}
                >
                    <option value="">{placeholder}</option>
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            {error && (
                <div id={`${id}-error`} className="pw-error-text">
                    {error}
                </div>
            )}
            
            {helperText && !error && (
                <div id={`${id}-helper`} className="pw-helper-text">
                    {helperText}
                </div>
            )}
        </div>
    );
});

Select.displayName = 'Select';

export default Select;
