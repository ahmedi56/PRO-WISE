import React, { SelectHTMLAttributes } from 'react';

interface Option {
    value: string | number;
    label: string;
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
    id: string;
    label?: string;
    options?: Option[];
    placeholder?: string;
    helperText?: string;
    error?: string;
}

const SelectField: React.FC<SelectFieldProps> = ({
    id,
    label,
    options = [],
    placeholder = 'Select an option',
    helperText,
    error,
    className = '',
    ...selectProps
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
            <select
                id={id}
                className={`select ${error ? 'input-error' : ''} ${className}`.trim()}
                aria-invalid={Boolean(error)}
                aria-describedby={describedBy || undefined}
                {...selectProps}
            >
                <option value="">{placeholder}</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
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

export default SelectField;
