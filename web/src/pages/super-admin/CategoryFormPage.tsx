import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader, Button, InputField, SelectField, IonIcon, Spinner } from '../../components/index';
import { categoryService } from '../../services/categoryService';

export const CategoryFormPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        summary: '',
        description: '',
        visibility: 'public'
    });
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEdit);

    useEffect(() => {
        if (isEdit) {
            const fetchCategory = async () => {
                try {
                    const res = await categoryService.getCategoryById(id);
                    const cat = res.data || res;
                    setFormData({
                        name: cat.name || '',
                        slug: cat.slug || '',
                        summary: cat.summary || '',
                        description: cat.description || '',
                        visibility: cat.visibility || 'public'
                    });
                } catch (err) {
                    console.error(err);
                } finally {
                    setInitialLoading(false);
                }
            };
            fetchCategory();
        }
    }, [id, isEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEdit) {
                await categoryService.updateCategory(id!, formData);
            } else {
                await categoryService.createCategory(formData);
            }
            navigate('/admin/categories');
        } catch (err) {
            console.error(err);
            alert('Failed to save category');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div style={{ height: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Button variant="ghost" onClick={() => navigate('/admin/categories')} icon={<IonIcon name="arrow-back-outline" />}>
                    Back to Categories
                </Button>
            </div>

            <PageHeader
                title={isEdit ? 'Edit Category' : 'Add New Category'}
                subtitle="Configure category details and taxonomy"
            />

            <form onSubmit={handleSubmit}>
                <div className="card" style={{ marginTop: '1rem' }}>
                    <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                            <InputField
                                id="cat-name"
                                label="Category Name"
                                placeholder="e.g. Workstations"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                required
                                icon="folder-outline"
                            />
                            <InputField
                                id="cat-slug"
                                label="Slug (optional)"
                                placeholder="e.g. workstations"
                                value={formData.slug}
                                onChange={(e) => setFormData({...formData, slug: e.target.value})}
                                icon="link-outline"
                            />
                        </div>

                        <SelectField
                            id="cat-visibility"
                            label="Visibility"
                            value={formData.visibility}
                            onChange={(e) => setFormData({...formData, visibility: e.target.value})}
                            options={[
                                { value: 'public', label: 'Public (Visible in Directory)' },
                                { value: 'private', label: 'Private (Hidden from Directory)' }
                            ]}
                        />

                        <InputField
                            id="cat-summary"
                            label="Summary"
                            placeholder="Short summary of the category"
                            value={formData.summary}
                            onChange={(e) => setFormData({...formData, summary: e.target.value})}
                        />

                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label className="label">Full Description</label>
                            <textarea
                                className="input"
                                rows={4}
                                placeholder="Detailed description..."
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                style={{ resize: 'vertical' }}
                            />
                        </div>
                    </div>

                    <div style={{
                        display: 'flex', justifyContent: 'flex-end', gap: '0.75rem',
                        padding: 'var(--space-4) var(--space-6)',
                        borderTop: '1px solid var(--color-border)'
                    }}>
                        <Button variant="ghost" type="button" onClick={() => navigate('/admin/categories')}>
                            Cancel
                        </Button>
                        <Button type="submit" loading={loading}>
                            {isEdit ? 'Save Changes' : 'Create Category'}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
};
