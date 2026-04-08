import React, { InputHTMLAttributes } from 'react';

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
    id: string;
    label?: string;
    helperText?: string;
    error?: string | null;
}

const InputField: React.FC<InputFieldProps> = ({
    id,
    label,
    helperText,
    error,
    className = '',
    ...inputProps
}) => {
    const describedBy = [
        helperText ? `${id}-helper` : '',
        error ? `${id}-error` : '',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className="input-group">
            {label && (
                <label htmlFor={id} className="label">
                    {label}
                </label>
            )}
            <input
                id={id}
                className={`input ${error ? 'input-error' : ''} ${className}`.trim()}
                aria-invalid={Boolean(error)}
                aria-describedby={describedBy || undefined}
                {...inputProps}
            />
            {helperText ? (
                <div id={`${id}-helper`} className="helper-text">
                    {helperText}
                </div>
            ) : null}
            {error ? (
                <div id={`${id}-error`} className="error-text">
                    {error}
                </div>
            ) : null}
        </div>
    );
};

export default InputField;
