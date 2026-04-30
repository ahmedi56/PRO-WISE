import React from 'react';

interface IonIconProps {
    name?: string;
    src?: string;
    size?: string;
    color?: string;
    className?: string;
    style?: React.CSSProperties;
    onClick?: (e: any) => void;
}

const IonIcon: React.FC<IonIconProps> = ({ 
    name, 
    src, 
    size, 
    color, 
    className = '', 
    style,
    onClick
}) => {
    // We use a lowercase tag string and cast to any to bypass TS intrinsic element check
    const Tag = 'ion-icon' as any;
    
    return (
        <Tag 
            name={name} 
            src={src} 
            size={size} 
            style={{ color, ...style }} 
            class={className}
            onClick={onClick}
        />
    );
};

export default IonIcon;
