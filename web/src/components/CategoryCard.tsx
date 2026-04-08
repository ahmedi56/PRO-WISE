import React from 'react';
import { CATEGORY_ICON_MAP } from '@/constants/icons';
import { Category } from '@/types/product';

interface CategoryCardProps {
    category: Category;
    onClick: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, onClick }) => {
    return (
        <div className="category-card" onClick={onClick}>
            <div className="category-card-icon">
                {category.image?.url ? (
                    <img src={category.image.url} alt={category.name} className="category-card-img" />
                ) : (
                    <ion-icon 
                        name={(CATEGORY_ICON_MAP as any)[category.name?.toLowerCase()] || category.icon || 'cube-outline'} 
                        size="large" 
                        style={{ color: 'var(--color-primary)' }}
                    ></ion-icon>
                )}
            </div>
            <div className="category-card-content">
                <h3 className="category-card-title">{category.name}</h3>
                {category.summary && <p className="category-card-desc">{category.summary}</p>}
            </div>
        </div>
    );
};

export default CategoryCard;
