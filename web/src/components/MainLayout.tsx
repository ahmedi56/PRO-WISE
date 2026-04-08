import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { API_URL } from '@/config';
import { CATEGORY_ICON_MAP } from '@/constants/icons';
import { Category } from '@/types/product';
import { RootState } from '@/store';

interface CategoryItemProps {
    category: Category & { children?: (Category & { children?: any[] })[] };
    depth?: number;
    currentCategoryId: string | null;
    onCategoryClick: (category: any) => void;
}

const CategoryItem: React.FC<CategoryItemProps> = ({ category, depth = 0, currentCategoryId, onCategoryClick }) => {
    const selected = currentCategoryId === category.id;
    const hasChildren = category.children && category.children.length > 0;
    
    // Check if any child is selected to auto-expand
    const isChildSelected = useMemo(() => {
        if (!hasChildren) return false;
        const checkChildren = (children: any[]): boolean => {
            return children.some(child => 
                child.id === currentCategoryId || (child.children && checkChildren(child.children))
            );
        };
        return checkChildren(category.children!);
    }, [category.children, currentCategoryId, hasChildren]);

    const [isExpanded, setIsExpanded] = useState(isChildSelected);

    useEffect(() => {
        if (isChildSelected) {
            setIsExpanded(true);
        }
    }, [isChildSelected]);

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    return (
        <div className="category-branch">
            <button
                type="button"
                className={`sidebar-item ${selected ? 'active' : ''}`}
                style={{ paddingLeft: `${16 + depth * 12}px` }}
                onClick={() => onCategoryClick(category)}
            >
                <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '8px' }}>
                    {hasChildren && (
                        <span 
                            onClick={handleToggle}
                            style={{ 
                                fontSize: '0.8rem', 
                                opacity: 0.6, 
                                display: 'flex',
                                transition: 'transform 0.2s',
                                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                            }}
                        >
                            <ion-icon name="chevron-forward-outline"></ion-icon>
                        </span>
                    )}
                    <ion-icon 
                        name={(CATEGORY_ICON_MAP as any)[category.name?.toLowerCase()] || category.icon || 'folder-outline'} 
                        style={{ fontSize: '1.1rem', opacity: selected ? 1 : 0.7 }}
                    ></ion-icon>
                    <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {category.name}
                    </span>
                </div>
            </button>
            {hasChildren && isExpanded && (
                <div className="category-children">
                    {category.children!.map((child: any) => (
                        <CategoryItem 
                            key={child.id} 
                            category={child} 
                            depth={depth + 1} 
                            currentCategoryId={currentCategoryId}
                            onCategoryClick={onCategoryClick}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

interface MainLayoutProps {
    children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const [categories, setCategories] = useState<any[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { token } = useSelector((state: RootState) => state.auth);
    const categoryId = searchParams.get('category');

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get(`${API_URL}/categories?tree=true`);
                setCategories(response.data);
            } catch (error) {
                console.error('Failed to fetch categories for sidebar:', error);
            }
        };
        fetchCategories();
    }, [token]);

    const handleCategoryClick = (category: any) => {
        navigate(`/products?category=${category.id}`);
    };

    return (
        <div className="layout-sidebar">
            <aside className={`sidebar ${!isSidebarOpen ? 'collapsed' : ''}`}>
                <div className="sidebar-title">
                    <span>Browse Categories</span>
                    <button 
                        onClick={() => setIsSidebarOpen(false)}
                        className="btn-ghost btn-sm"
                        style={{ marginLeft: 'auto', padding: '2px' }}
                    >
                        <ion-icon name="chevron-back-outline"></ion-icon>
                    </button>
                </div>
                
                <button
                    className={`sidebar-item ${!categoryId ? 'active' : ''}`}
                    onClick={() => { setSearchParams({}); navigate('/products'); }}
                    style={{ marginBottom: '1rem' }}
                >
                    <ion-icon name="apps-outline" style={{ marginRight: '8px' }}></ion-icon>
                    All Products
                </button>

                <div className="sidebar-scroll">
                    {categories.map(cat => (
                        <CategoryItem 
                            key={cat.id} 
                            category={cat} 
                            currentCategoryId={categoryId}
                            onCategoryClick={handleCategoryClick}
                        />
                    ))}
                </div>
            </aside>

            <main className="layout-main">
                <div className="layout-header-actions">
                    {!isSidebarOpen && (
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="btn-secondary btn-sm"
                            style={{ marginBottom: '1rem' }}
                        >
                            <ion-icon name="menu-outline" style={{ marginRight: '8px' }}></ion-icon>
                            Categories
                        </button>
                    )}
                </div>
                {children}
            </main>
        </div>
    );
};

export default MainLayout;
