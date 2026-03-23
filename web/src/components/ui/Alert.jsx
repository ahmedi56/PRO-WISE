import React from 'react';

const Alert = ({ tone = 'error', children, className = '' }) => (
    <div className={`alert alert-${tone} ${className}`.trim()} role="alert">
        {children}
    </div>
);

export default Alert;