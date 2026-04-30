import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Button, Badge, Spinner, EmptyState, IonIcon } from '../../components/index';
import { productService } from '../../services/productService';
import { Product } from '../../types/product';
import { useAuth } from '../../hooks/useAuth';

export const ProductsPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // Safely extract companyId
                const companyId = (user?.company && typeof user.company === 'object') 
                    ? (user.company as any).id 
                    : user?.company;
                
                const response = await productService.getProducts(companyId ? { company: companyId, manage: true } : { manage: true });
                setProducts(response.data || response || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [user]);

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        try {
            await productService.deleteProduct(id);
            setProducts(products.filter(p => p.id !== id));
        } catch (err) {
            console.error(err);
            alert('Failed to delete product');
        }
    };

    return (
        <div>
            <PageHeader 
                title="Product Management" 
                actions={
                    <Button onClick={() => navigate('/admin/products/new')} icon={<IonIcon name="add-outline" />}>
                        Add Product
                    </Button>
                }
            />

            {loading ? (
                <div style={{ height: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size="lg" /></div>
            ) : products.length === 0 ? (
                <EmptyState 
                    icon="cube-outline" 
                    title="No Products" 
                    description="You haven't added any products yet."
                    action={<Button onClick={() => navigate('/admin/products/new')}>Add Your First Product</Button>}
                />
            ) : (
                <div className="card">
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Product Name</th>
                                    <th>Category</th>
                                    <th>Status</th>
                                    <th>Rating</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(prod => (
                                    <tr key={prod.id}>
                                        <td>
                                            <div style={{ fontWeight: 600, color: 'var(--color-text-strong)' }}>{prod.name}</div>
                                        </td>
                                        <td style={{ color: 'var(--color-text-muted)' }}>
                                            {typeof prod.category === 'object' ? prod.category?.name : 'Category'}
                                        </td>
                                        <td>
                                            <Badge tone={prod.status === 'published' ? 'success' : 'warning'}>
                                                {prod.status || 'Draft'}
                                            </Badge>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600, color: 'var(--color-warning)' }}>
                                                <IonIcon name="star" style={{ fontSize: '14px' }} />
                                                {prod.averageRating?.toFixed(1) || '0.0'}
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/products/${prod.id}/edit`)}>Edit</Button>
                                                <Button variant="danger" size="sm" onClick={() => handleDelete(prod.id)}>Delete</Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
