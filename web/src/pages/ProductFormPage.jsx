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
        <div className="page-center">
            <Card className="w-full" style={{ maxWidth: 560 }}>
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
                            placeholder="Detailed product description..."
                            style={{ resize: 'vertical' }}
                        />
                    </div>

                    <div className="input-group">
                        <label className="label" htmlFor="product-content">Product Content / Details</label>
                        <textarea
                            id="product-content"
                            name="content"
                            className="input"
                            rows={8}
                            value={formData.content}
                            onChange={handleChange}
                            placeholder="Full product details, specifications, technical content..."
                            style={{ resize: 'vertical' }}
                        />
                    </div>

                    <InputField
                        id="product-manufacturer"
                        label="Manufacturer"
                        name="manufacturer"
                        value={formData.manufacturer}
                        onChange={handleChange}
                        placeholder="e.g. Atlas Copco"
                    />

                    <InputField
                        id="product-model"
                        label="Model Number"
                        name="modelNumber"
                        value={formData.modelNumber}
                        onChange={handleChange}
                        placeholder="e.g. GA-55-VSD"
                    />

                    <div className="input-group">
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
