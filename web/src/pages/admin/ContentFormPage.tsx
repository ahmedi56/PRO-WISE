import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader, Button, InputField, SelectField, IonIcon, Spinner, Badge } from '../../components/index';
import axios from 'axios';
import { API_URL } from '../../config';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { productService } from '../../services/productService';
import '../../styles/admin-forms.css';

interface Step {
    title: string;
    description: string;
    image?: string;
}

export const ContentFormPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;
    const navigate = useNavigate();
    const { token } = useSelector((state: RootState) => state.auth);
    const headers = { Authorization: `Bearer ${token}` };

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'article',
        product: '',
        status: 'draft',
        difficulty: 'medium',
        estimatedTime: '',
        videoId: '',
        fileUrl: ''
    });
    
    const [steps, setSteps] = useState<Step[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const prodRes = await productService.getProducts({ limit: 100, manage: true });
                setProducts(prodRes.data || prodRes || []);
            } catch (err) {
                console.error('Failed to fetch products', err);
            }

            if (isEdit) {
                try {
                    const { data } = await axios.get(`${API_URL}/content/${id}`, { headers });
                    const content = data.data || data;
                    setFormData({
                        title: content.title || '',
                        description: content.description || '',
                        type: content.type || 'article',
                        product: typeof content.product === 'object' ? content.product?.id : (content.product || ''),
                        status: content.status || 'draft',
                        difficulty: content.difficulty || 'medium',
                        estimatedTime: content.estimatedTime || '',
                        videoId: content.videoId || '',
                        fileUrl: content.fileUrl || ''
                    });
                    setSteps(content.steps || []);
                } catch (err) {
                    console.error('Failed to fetch content', err);
                    setError('Failed to load content details.');
                }
            }

            setInitialLoading(false);
        };
        fetchOptions();
    }, [id, isEdit]);

    const handleAddStep = () => {
        setSteps([...steps, { title: '', description: '', image: '' }]);
    };

    const handleRemoveStep = (index: number) => {
        setSteps(steps.filter((_, i) => i !== index));
    };

    const handleStepChange = (index: number, field: keyof Step, value: string) => {
        const newSteps = [...steps];
        newSteps[index] = { ...newSteps[index], [field]: value };
        setSteps(newSteps);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        const payload = {
            ...formData,
            steps: formData.type === 'guide' ? steps : []
        };

        try {
            if (isEdit) {
                await axios.put(`${API_URL}/content/${id}`, payload, { headers });
            } else {
                await axios.post(`${API_URL}/content`, payload, { headers });
            }
            navigate('/admin/support');
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || err.response?.data?.error || 'Failed to save content');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="admin-form-container">
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button variant="ghost" onClick={() => navigate('/admin/support')} icon={<IonIcon name="arrow-back-outline" />}>
                    Back to Library
                </Button>
                {isEdit && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 500 }}>ID: {id}</span>
                        <Badge tone={formData.status === 'approved' ? 'success' : formData.status === 'rejected' ? 'error' : 'warning'}>
                            {formData.status.toUpperCase()}
                        </Badge>
                    </div>
                )}
            </div>

            <PageHeader
                title={isEdit ? 'Edit Repair Resource' : 'Create Repair Resource'}
                subtitle="Design professional guides and documentation for your products"
            />

            {error && (
                <div style={{ 
                    padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', 
                    border: '1px solid var(--color-error)', borderRadius: 'var(--radius-md)',
                    color: 'var(--color-error)', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center'
                }}>
                    <IonIcon name="alert-circle-outline" style={{ fontSize: '20px' }} />
                    <span style={{ fontWeight: 500 }}>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                {/* General Info Section */}
                <section className="form-section">
                    <div className="section-header">
                        <div className="section-icon">
                            <IonIcon name="information-circle-outline" />
                        </div>
                        <h2 className="section-title">General Information</h2>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <InputField
                            id="content-title"
                            label="Guide/Article Title"
                            placeholder="e.g. iPhone 13 Screen Replacement"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            required
                            icon="document-text-outline"
                        />

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
                            <SelectField
                                id="content-type"
                                label="Resource Type"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                options={[
                                    { value: 'article', label: 'Knowledge Base Article' },
                                    { value: 'guide', label: 'Step-by-Step Repair Guide' },
                                    { value: 'faq', label: 'FAQ' },
                                    { value: 'tutorial', label: 'Video Tutorial' }
                                ]}
                            />

                            <SelectField
                                id="content-product"
                                label="Target Product"
                                value={formData.product}
                                onChange={e => setFormData({ ...formData, product: e.target.value })}
                                placeholder="Select a product"
                                options={products.map(p => ({ value: p.id, label: p.name }))}
                            />
                        </div>

                        {formData.type === 'guide' && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
                                <SelectField
                                    id="content-difficulty"
                                    label="Repair Difficulty"
                                    value={formData.difficulty}
                                    onChange={e => setFormData({ ...formData, difficulty: e.target.value })}
                                    options={[
                                        { value: 'easy', label: 'Easy (Beginner Friendly)' },
                                        { value: 'medium', label: 'Medium (Requires Tools)' },
                                        { value: 'hard', label: 'Hard (Professional Only)' },
                                        { value: 'expert', label: 'Expert (Advanced Repair)' }
                                    ]}
                                />

                                <InputField
                                    id="content-time"
                                    label="Estimated Time"
                                    placeholder="e.g. 45 minutes"
                                    value={formData.estimatedTime}
                                    onChange={e => setFormData({ ...formData, estimatedTime: e.target.value })}
                                    icon="time-outline"
                                />
                            </div>
                        )}
                        

                        <div className="pw-textarea-group">
                            <label className="pw-label">
                                {formData.type === 'guide' ? 'Guide Overview / Summary' : formData.type === 'faq' ? 'Question' : 'Content Body'}
                            </label>
                            <textarea
                                className="pw-textarea"
                                rows={6}
                                placeholder={formData.type === 'faq' ? 'Enter the question here...' : 'Provide a high-level overview or the full article body here...'}
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                required
                            />
                        </div>

                        {formData.type === 'faq' && (
                            <div className="pw-textarea-group conditional-field-wrapper">
                                <label className="pw-label">Answer</label>
                                <textarea
                                    className="pw-textarea"
                                    rows={6}
                                    placeholder="Enter the answer here..."
                                    value={formData.estimatedTime}
                                    onChange={e => setFormData({ ...formData, estimatedTime: e.target.value })}
                                />
                            </div>
                        )}

                        {formData.type === 'tutorial' && (
                            <div className="conditional-field-wrapper">
                                <InputField
                                    id="content-video"
                                    label="YouTube Video ID or URL"
                                    placeholder="e.g. dQw4w9WgXcQ"
                                    value={formData.videoId}
                                    onChange={e => setFormData({ ...formData, videoId: e.target.value })}
                                    icon="play-circle-outline"
                                    required
                                />
                            </div>
                        )}

                        {(formData.type === 'article' || formData.type === 'guide') && (
                            <div className="conditional-field-wrapper">
                                <InputField
                                    id="content-file"
                                    label="Attachment / PDF URL"
                                    placeholder="https://example.com/document.pdf"
                                    value={formData.fileUrl}
                                    onChange={e => setFormData({ ...formData, fileUrl: e.target.value })}
                                    icon="document-attach-outline"
                                />
                            </div>
                        )}
                    </div>
                </section>

                {formData.type === 'guide' && (
                    <section className="form-section">
                        <div className="section-header" style={{ justifyContent: 'space-between', marginBottom: '2.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div className="section-icon">
                                    <IonIcon name="list-outline" />
                                </div>
                                <h2 className="section-title">Repair Workflow Steps</h2>
                            </div>
                            <Button variant="ghost" type="button" onClick={handleAddStep} icon={<IonIcon name="add-circle-outline" />}>
                                Add New Step
                            </Button>
                        </div>

                        {steps.length === 0 ? (
                            <div className="empty-steps-state">
                                <IonIcon name="construct-outline" className="empty-icon" />
                                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--color-text-strong)', marginBottom: '0.5rem' }}>No steps defined yet</h3>
                                <p style={{ maxWidth: '400px', margin: '0 auto 2rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>Break down the repair process into easy-to-follow steps for your technicians and users.</p>
                                <Button variant="primary" type="button" onClick={handleAddStep} icon={<IonIcon name="add-outline" />} style={{ padding: '0 2.5rem' }}>
                                    Start Adding Steps
                                </Button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                {steps.map((step, index) => (
                                    <div key={index} className="pw-step-card">
                                        <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem' }}>
                                            <Button variant="danger" size="sm" type="button" onClick={() => handleRemoveStep(index)} style={{ borderRadius: '50%', width: '32px', height: '32px', padding: 0 }}>
                                                <IonIcon name="trash-outline" />
                                            </Button>
                                        </div>

                                        <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'flex-start' }}>
                                            <div className="step-number-badge">
                                                {index + 1}
                                            </div>
                                            
                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                                    <InputField
                                                        id={`step-title-${index}`}
                                                        label={`Step ${index + 1} Title`}
                                                        placeholder="e.g. Unplugging the battery connector"
                                                        value={step.title}
                                                        onChange={e => handleStepChange(index, 'title', e.target.value)}
                                                        required
                                                    />
                                                    <InputField
                                                        id={`step-image-${index}`}
                                                        label="Step Image URL"
                                                        placeholder="https://example.com/step1.jpg"
                                                        value={step.image}
                                                        onChange={e => handleStepChange(index, 'image', e.target.value)}
                                                        icon="image-outline"
                                                    />
                                                </div>

                                                {step.image && (
                                                    <div className="step-image-preview">
                                                        <img src={step.image} alt={`Step ${index + 1}`} />
                                                    </div>
                                                )}

                                                <div className="pw-textarea-group">
                                                    <label className="pw-label">Instructions & Tips</label>
                                                    <textarea
                                                        className="pw-textarea"
                                                        rows={5}
                                                        placeholder="Describe the technical process..."
                                                        value={step.description}
                                                        onChange={e => handleStepChange(index, 'description', e.target.value)}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                
                                <Button 
                                    variant="ghost" 
                                    type="button" 
                                    onClick={handleAddStep} 
                                    icon={<IonIcon name="add-outline" />}
                                    style={{ padding: '1.5rem', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-lg)' }}
                                >
                                    Add Another Step
                                </Button>
                            </div>
                        )}
                    </section>
                )}

                {/* Submit Actions */}
                <div className="form-actions-bar">
                    <Button variant="ghost" type="button" onClick={() => navigate('/admin/support')} style={{ padding: '0 2.5rem' }}>Discard</Button>
                    <Button type="submit" loading={loading} icon={<IonIcon name="save-outline" />} style={{ minWidth: '220px', height: '56px', fontSize: 'var(--text-base)', borderRadius: 'var(--radius-lg)' }}>
                        {isEdit ? 'Update Resource' : 'Create & Save Draft'}
                    </Button>
                </div>
            </form>
        </div>
    );
};
