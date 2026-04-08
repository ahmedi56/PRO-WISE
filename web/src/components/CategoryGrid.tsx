import React from 'react';
import CategoryCard from './CategoryCard';
import { Category } from '@/types/product';

interface CategoryGridProps {
    categories: Category[];
    onCategoryClick: (category: Category) => void;
}

const CategoryGrid: React.FC<CategoryGridProps> = ({ categories, onCategoryClick }) => {
    return (
        <div className="category-grid">
            {categories.map((category) => (
                <CategoryCard
                    key={category.id}
                    category={category}
                    onClick={() => onCategoryClick(category)}
                />
            ))}
        </div>
    );
};

export default CategoryGrid;
