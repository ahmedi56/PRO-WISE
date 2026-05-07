import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageWrapper, PageHeader, CategoryCard, Spinner, EmptyState } from '../../components/index';
import { categoryService } from '../../services/categoryService';
import { Category } from '../../types/product';

export const CategoryPage: React.FC = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await categoryService.getCategories();
                // Handle paginated response { data, meta }
                setCategories(data.data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    if (loading) {
        return (
            <div className="pw-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <PageWrapper>
            <PageHeader 
                title="Hardware Directory" 
                subtitle="Browse our extensive collection of professional hardware categories" 
            />
            
            {categories.length === 0 ? (
                <EmptyState icon="folder-open-outline" title="No Categories" description="We couldn't find any hardware categories at this time." />
            ) : (
                <div className="category-grid">
                    {categories
                        .filter(cat => {
                            const parentId = typeof cat.parent === 'object' ? (cat.parent as any)?.id : cat.parent;
                            return !parentId;
                        })
                        .map(cat => (
                            <CategoryCard key={cat.id} category={cat} onClick={(id) => navigate(`/home/category/${id}`)} />
                        ))}
                </div>
            )}
        </PageWrapper>
    );
};
