import React from 'react';

const Skeleton = ({ width = '100%', height = 16, borderRadius = 6, className = '' }) => (
    <div
        className={`skeleton ${className}`.trim()}
        style={{ width, height, borderRadius }}
        aria-hidden="true"
    />
);

export default Skeleton;