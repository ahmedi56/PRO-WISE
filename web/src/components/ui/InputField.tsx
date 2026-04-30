import React, { InputHTMLAttributes } from 'react';
import IonIcon from './IonIcon';

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
    id: string;
    label?: string;
    helperText?: string;
    error?: string | null;
    textArea?: boolean;
    icon?: string;
}

export const InputField: React.FC<InputFieldProps> = ({
    id,
    label,
    helperText,
    error,
    textArea = false,
    icon,
    className = '',
    ...inputProps
}) => {
    const describedBy = [
        helperText ? `${id}-helper` : '',
        error ? `${id}-error` : '',
    ].filter(Boolean).join(' ');

    const InputElement = textArea ? 'textarea' : 'input';

    return (
        <div className="input-group">
            {label && (
                <label htmlFor={id} className="label">
                    {label}
                </label>
            )}
            <div style={{ position: 'relative' }}>
                {icon && (
                    <IonIcon
                        name={icon}
                        style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            fontSize: '1.1rem',
                            color: 'var(--color-text-muted)',
                            pointerEvents: 'none',
                            zIndex: 1
                        }}
                    />
                )}
                <InputElement
                    id={id}
                    className={`input ${error ? 'input-error' : ''} ${icon ? 'input-with-icon' : ''} ${className}`.trim()}
                    aria-invalid={Boolean(error)}
                    aria-describedby={describedBy || undefined}
                    style={{ 
                        paddingLeft: icon ? '38px' : '12px',
                        minHeight: textArea ? '100px' : 'auto',
                        paddingTop: textArea ? '12px' : '0.75rem',
                        paddingBottom: textArea ? '12px' : '0.75rem'
                    }}
                    {...(inputProps as any)}
                />
            </div>
            {helperText && <div id={`${id}-helper`} className="helper-text">{helperText}</div>}
            {error && <div id={`${id}-error`} className="error-text">{error}</div>}
        </div>
    );
};

export default InputField;
