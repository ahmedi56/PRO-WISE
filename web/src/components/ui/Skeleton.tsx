import React from 'react';

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    borderRadius?: number;
    className?: string;
    style?: React.CSSProperties;
}

const Skeleton: React.FC<SkeletonProps> = ({ width = '100%', height = 16, borderRadius = 6, className = '', style, ...props }) => (
    <div
        className={`skeleton ${className}`.trim()}
        style={{ width, height, borderRadius, ...style }}
        aria-hidden="true"
        {...props}
    />
);

export default Skeleton;
