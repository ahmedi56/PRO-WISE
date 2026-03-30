import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    createProduct,
    updateProduct,
    fetchProductById,
    fetchCompanies,
    fetchCategories,
    clearError,
    clearSuccess
} from '../store/slices/productSlice';
import { Alert, Button, Card, InputField } from '../components/ui';

const ProductFormPage = () => {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { currentProduct, companies, categories, loading, error, success } = useSelector(
        (state) => state.products
    );

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        content: '',
        manufacturer: '',
        modelNumber: '',
        category: '',
        company: '',
        components: [],
    });

    useEffect(() => {
        dispatch(fetchCompanies());
        dispatch(fetchCategories());
        if (isEdit) {
            dispatch(fetchProductById(id));
        }
        return () => {
            dispatch(clearError());
            dispatch(clearSuccess());
        };
    }, [dispatch, id, isEdit]);

    useEffect(() => {
        if (isEdit && currentProduct) {
            setFormData({
                name: currentProduct.name || '',
                description: currentProduct.description || '',
                content: currentProduct.content || '',
                manufacturer: currentProduct.manufacturer || '',
                modelNumber: currentProduct.modelNumber || '',
                category: currentProduct.category?.id || currentProduct.category || '',
                company: currentProduct.company?.id || currentProduct.company || '',
                components: Array.isArray(currentProduct.components) ? currentProduct.components : [],
            });
        }
    }, [isEdit, currentProduct]);

    useEffect(() => {
        if (success) {
            navigate('/admin');
        }
    }, [success, navigate]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleAddComponent = () => {
        setFormData(prev => ({ 
            ...prev, 
            components: [...prev.components, { name: '', type: '', manufacturer: '', modelNumber: '', specifications: '' }] 
        }));
    };

    const handleRemoveComponent = (index) => {
        setFormData(prev => ({ 
            ...prev, 
            components: prev.components.filter((_, i) => i !== index) 
        }));
    };

    const handleComponentChange = (index, field, value) => {
        setFormData(prev => {
            const newComponents = [...prev.components];
            newComponents[index] = { ...newComponents[index], [field]: value };
            return { ...prev, components: newComponents };
        });
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        const payload = { ...formData };
        if (!payload.category) delete payload.category;
        if (!payload.company) delete payload.company;

        if (isEdit) {
            dispatch(updateProduct({ id, ...payload }));
        } else {
            dispatch(createProduct(payload));
        }
    };

    return (
        <div className="page-center" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <Card className="w-full">
                <h2 className="text-center mb-6">{isEdit ? 'Edit Product' : 'New Product'}</h2>

                {error ? <Alert tone="error">{error}</Alert> : null}

                <form onSubmit={handleSubmit}>
                    <InputField
                        id="product-name"
                        label="Product Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. High-Pressure Compressor X200"
                        required
                    />

                    <div className="input-group">
                        <label className="label" htmlFor="product-description">Description</label>
                        <textarea
                            id="product-description"
                            name="description"
                            className="input"
                            rows={4}
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="A clear, professional summary. The AI search uses this to understand the product's purpose."
                            style={{ resize: 'vertical' }}
                        />
                    </div>

                    <div className="input-group">
                        <label className="label" htmlFor="product-content">Technical Specifications / Components</label>
                        <textarea
                            id="product-content"
                            name="content"
                            className="input"
                            rows={8}
                            value={formData.content}
                            onChange={handleChange}
                            placeholder="Add components, parts, technical specs, and materials. This rich data is CRITICAL for high-quality semantic search and related product recommendations."
                            style={{ resize: 'vertical' }}
                        />
                    </div>

                    <InputField
                        id="product-manufacturer"
                        label="Manufacturer"
                        name="manufacturer"
                        value={formData.manufacturer}
                        onChange={handleChange}
                        placeholder="e.g. Atlas Copco (Helps AI group similar brands)"
                    />

                    <InputField
                        id="product-model"
                        label="Model Number"
                        name="modelNumber"
                        value={formData.modelNumber}
                        onChange={handleChange}
                        placeholder="e.g. GA-55-VSD (Essential for technical accuracy)"
                    />

                    {/* --- COMPONENTS SECTION --- */}
                    <div className="input-group" style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--color-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <div>
                                <label className="label" style={{ marginBottom: '0.25rem', fontSize: '1.1rem' }}>Components & Composition</label>
                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
                                    Break down the product into its core parts (e.g., GPU, CPU, Battery). 
                                    <strong style={{ color: 'var(--color-primary)' }}> This dramatically improves AI semantic search and recommendations.</strong>
                                </p>
                            </div>
                            <Button type="button" variant="secondary" size="sm" onClick={handleAddComponent}>
                                + Add Component
                            </Button>
                        </div>

                        {formData.components.length === 0 ? (
                            <div style={{ padding: '1.5rem', textAlign: 'center', background: 'var(--color-surface-hover)', borderRadius: '8px', border: '1px dashed var(--color-border)' }}>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                    No components added. Add parts to help the AI understand this product better.
                                </p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {formData.components.map((comp, index) => (
                                    <div key={index} style={{ padding: '1rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', position: 'relative' }}>
                                        <button 
                                            type="button" 
                                            onClick={() => handleRemoveComponent(index)}
                                            style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'none', border: 'none', color: 'var(--color-error)', cursor: 'pointer', fontSize: '1.2rem', padding: '0.25rem' }}
                                            title="Remove component"
                                        >
                                            <ion-icon name="close-circle-outline"></ion-icon>
                                        </button>
                                        
                                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem', marginBottom: '0.75rem', paddingRight: '1.5rem' }}>
                                            <div>
                                                <label className="label" style={{ fontSize: '0.8rem' }}>Component Name *</label>
                                                <input className="input" style={{ padding: '0.5rem' }} placeholder="e.g. Graphics Card" value={comp.name} onChange={e => handleComponentChange(index, 'name', e.target.value)} required />
                                            </div>
                                            <div>
                                                <label className="label" style={{ fontSize: '0.8rem' }}>Type / Category</label>
                                                <input className="input" style={{ padding: '0.5rem' }} placeholder="e.g. GPU" value={comp.type} onChange={e => handleComponentChange(index, 'type', e.target.value)} />
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem', marginBottom: '0.75rem' }}>
                                            <div>
                                                <label className="label" style={{ fontSize: '0.8rem' }}>Manufacturer / Brand</label>
                                                <input className="input" style={{ padding: '0.5rem' }} placeholder="e.g. NVIDIA" value={comp.manufacturer} onChange={e => handleComponentChange(index, 'manufacturer', e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="label" style={{ fontSize: '0.8rem' }}>Model Number</label>
                                                <input className="input" style={{ padding: '0.5rem' }} placeholder="e.g. RTX 4090" value={comp.modelNumber} onChange={e => handleComponentChange(index, 'modelNumber', e.target.value)} />
                                            </div>
                                        </div>
                                        <div style={{ paddingRight: '0' }}>
                                            <label className="label" style={{ fontSize: '0.8rem' }}>Specifications / Specs</label>
                                            <input className="input" style={{ padding: '0.5rem' }} placeholder="e.g. 24GB GDDR6X, 384-bit" value={comp.specifications} onChange={e => handleComponentChange(index, 'specifications', e.target.value)} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* --------------------------- */}

                    <div className="input-group" style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--color-border)' }}>
                        <label className="label" htmlFor="product-category">Category</label>
                        <select
                            id="product-category"
                            name="category"
                            className="input select"
                            value={formData.category}
                            onChange={handleChange}
                        >
                            <option value="">Select category</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                        {categories.find(c => String(c.id) === String(formData.category))?.name === 'Phone' && (
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-primary)', marginTop: '0.5rem', fontWeight: 500 }}>
                                <ion-icon name="information-circle-outline" style={{ verticalAlign: 'middle', marginRight: '4px' }}></ion-icon>
                                Note: Selecting "Phone" will automatically route this product to the correct brand subcategory (e.g. Samsung/Apple) based on the manufacturer name.
                            </p>
                        )}
                    </div>

                    {useSelector(state => state.auth.user?.role?.name) === 'super_admin' && (
                        <div className="input-group">
                            <label className="label" htmlFor="product-company">Company</label>
                            <select
                                id="product-company"
                                name="company"
                                className="input select"
                                value={formData.company}
                                onChange={handleChange}
                            >
                                <option value="">Select company</option>
                                {companies.map((comp) => (
                                    <option key={comp.id} value={comp.id}>{comp.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="page-header-actions" style={{ marginTop: 'var(--space-6)' }}>
                        <Button type="submit" variant="primary" size="lg" disabled={loading}>
                            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Product'}
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => navigate('/admin')}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default ProductFormPage;
