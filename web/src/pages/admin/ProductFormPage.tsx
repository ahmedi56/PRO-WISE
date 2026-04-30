import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader, Button, InputField, SelectField, IonIcon, Spinner } from '../../components/index';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { geminiService } from '../../services/geminiService';

export const ProductFormPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        status: 'draft'
    });
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEdit);
    const [isAiLoading, setIsAiLoading] = useState(false);

    const handleAiGenerate = async () => {
        if (!formData.name) {
            alert('Please enter a product name first.');
            return;
        }
        setIsAiLoading(true);
        try {
            const categoryName = categories.find(c => c.id === formData.category)?.name || '';
            const description = await geminiService.generateDescription(formData.name, categoryName);
            setFormData({ ...formData, description });
        } catch (err) {
            console.error('AI generation failed', err);
            alert('Failed to generate description with AI.');
        } finally {
            setIsAiLoading(false);
        }
    };

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await categoryService.getCategories();
                setCategories(res.data || res || []);
            } catch (err) {
                console.error(err);
            }
        };
        fetchCategories();

        if (isEdit) {
            const fetchProduct = async () => {
                try {
                    const res = await productService.getProductById(id!);
                    const prod = res.data || res;
                    setFormData({
                        name: prod.name || '',
                        description: prod.description || '',
                        category: typeof prod.category === 'object' ? prod.category?.id : (prod.category || ''),
                        status: prod.status || 'draft'
                    });
                } catch (err) {
                    console.error(err);
                } finally {
                    setInitialLoading(false);
                }
            };
            fetchProduct();
        }
    }, [id, isEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEdit) {
                await productService.updateProduct(id!, formData);
            } else {
                await productService.createProduct(formData);
            }
            navigate('/admin/products');
        } catch (err) {
            console.error(err);
            alert('Failed to save product');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return <div style={{ height: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size="lg" /></div>;
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Button variant="ghost" onClick={() => navigate('/admin/products')} icon={<IonIcon name="arrow-back-outline" />}>
                    Back to Products
                </Button>
            </div>

            <PageHeader 
                title={isEdit ? 'Edit Product' : 'Add New Product'} 
                subtitle="Configure your product details and availability"
            />

            <form onSubmit={handleSubmit} className="card" style={{ marginTop: '1rem' }}>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <InputField 
                        id="product-name"
                        label="Product Name" 
                        placeholder="e.g. ASUS Zenbook 14 OLED"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                        icon="cube-outline"
                    />
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                        <SelectField 
                            id="product-category"
                            label="Category"
                            value={formData.category}
                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                            required
                            placeholder="Select a category"
                            options={categories.map(cat => ({ value: cat.id, label: cat.name }))}
                        />

                        <SelectField 
                            id="product-status"
                            label="Status"
                            value={formData.status}
                            onChange={(e) => setFormData({...formData, status: e.target.value})}
                            options={[
                                { value: 'draft', label: 'Draft' },
                                { value: 'published', label: 'Published' },
                                { value: 'archived', label: 'Archived' }
                            ]}
                        />
                    </div>

                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <label className="label" style={{ marginBottom: 0 }}>Description</label>
                            <button 
                                type="button" 
                                onClick={handleAiGenerate}
                                disabled={isAiLoading}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.25rem',
                                    fontSize: 'var(--text-xs)', fontWeight: 600,
                                    color: 'var(--color-primary)', background: 'var(--color-primary-light)',
                                    border: 'none', padding: '4px 8px', borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer'
                                }}
                            >
                                <IonIcon name="sparkles" style={{ fontSize: '14px' }} />
                                {isAiLoading ? 'Generating...' : 'AI Generate'}
                            </button>
                        </div>
                        <textarea
                            className="input"
                            rows={5}
                            placeholder="Describe your product's key features..."
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            required
                            style={{ resize: 'vertical' }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', padding: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
                    <Button variant="ghost" type="button" onClick={() => navigate('/admin/products')}>Cancel</Button>
                    <Button type="submit" loading={loading} icon={<IonIcon name="save-outline" />}>
                        {isEdit ? 'Save Product' : 'Create Product'}
                    </Button>
                </div>
            </form>
        </div>
    );
};
