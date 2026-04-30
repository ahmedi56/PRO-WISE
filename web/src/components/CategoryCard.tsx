import React from 'react';
import { CATEGORY_ICON_MAP } from '../constants/icons';
import { Category } from '../types/product';
import { IonIcon } from './ui';

interface CategoryCardProps {
    category: Category;
    onClick?: (id: string) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, onClick }) => {
    return (
        <div 
            className="category-card" 
            onClick={() => onClick && onClick(category.slug || category.id)}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
            <div className="category-card-icon">
                {category.image?.url ? (
                    <img src={category.image.url} alt={category.name} className="category-card-img" />
                ) : (
                    <IonIcon 
                        name={(CATEGORY_ICON_MAP as any)[category.name?.toLowerCase()] || category.icon || 'cube-outline'} 
                        style={{ fontSize: '32px', color: 'var(--color-primary)' }}
                    />
                )}
            </div>
            <div className="category-card-content">
                <h3 className="category-card-title">{category.name}</h3>
                <p className="category-card-desc">
                    {category.summary || category.description || `${category.count || 0} Products available`}
                </p>
            </div>
        </div>
    );
};
