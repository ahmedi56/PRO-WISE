import React from 'react';

interface CardProps {
    children: React.ReactNode;
    glass?: boolean;
    raised?: boolean;
    className?: string;
    style?: React.CSSProperties;
}

const Card: React.FC<CardProps> = ({ children, glass = false, raised = false, className = '', ...props }) => {
    const classes = [
        glass ? 'card-glass' : 'card',
        raised ? 'card-raised' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return <section className={classes} {...props}>{children}</section>;
};

export default Card;
