import React from 'react';

const Button = ({
    children,
    type = 'button',
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    className = '',
    ...props
}) => {
    const classes = [
        'btn',
        `btn-${variant}`,
        size === 'sm' ? 'btn-sm' : '',
        size === 'lg' ? 'btn-lg' : '',
        fullWidth ? 'btn-full' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <button type={type} className={classes} {...props}>
            {children}
        </button>
    );
};

export default Button;