import React from 'react';

interface CardProps {
    children: React.ReactNode;
    raised?: boolean;
    className?: string;
    style?: React.CSSProperties;
    onClick?: (e?: React.MouseEvent) => void;
}

const Card: React.FC<CardProps> = ({ children, className = '', raised = false, style, onClick }) => {
    return (
        <div 
            className={`card ${raised ? 'raised' : ''} ${className} ${onClick ? 'clickable' : ''}`} 
            style={style}
            onClick={onClick}
        >
            {children}
        </div>
    );
};

export default Card;
