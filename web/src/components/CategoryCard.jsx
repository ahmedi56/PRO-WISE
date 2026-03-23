import React from 'react';

const CategoryCard = ({ category, onClick }) => {
    return (
        <div className="category-card" onClick={onClick}>
            <div className="category-card-icon">
                {category.image?.url ? (
                    <img src={category.image.url} alt={category.name} className="category-card-img" />
                ) : (
                    <ion-icon name={category.icon} size="large" style={{ color: 'var(--color-primary)' }}></ion-icon>
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
