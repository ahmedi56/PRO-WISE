import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'success' | 'ghost' | 'neutral' | 'outline';
    tone?: string;
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    icon?: React.ReactNode;
    loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
    children,
    type = 'button',
    variant,
    tone,
    size = 'md',
    fullWidth = false,
    icon,
    loading = false,
    className = '',
    disabled,
    ...props
}) => {
    const resolvedVariant = variant || tone || 'primary';
    const classes = [
        'btn',
        `btn-${resolvedVariant}`,
        size === 'sm' ? 'btn-sm' : '',
        size === 'lg' ? 'btn-lg' : '',
        fullWidth ? 'btn-full' : '',
        loading ? 'loading' : '',
        className,
    ].filter(Boolean).join(' ');

    return (
        <button 
            type={type} 
            className={classes} 
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <span className="pw-spinner-sm" style={{ marginRight: children ? '0.5rem' : 0 }}></span>
            ) : icon ? (
                <span className="btn-icon" style={{ marginRight: children ? '0.5rem' : 0 }}>{icon}</span>
            ) : null}
            {children}
        </button>
    );
};

export default Button;
