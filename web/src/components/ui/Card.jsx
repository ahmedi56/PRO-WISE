import React from 'react';

const Card = ({ children, glass = false, raised = false, className = '' }) => {
    const classes = [
        glass ? 'card-glass' : 'card',
        raised ? 'card-raised' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return <section className={classes}>{children}</section>;
};

export default Card;