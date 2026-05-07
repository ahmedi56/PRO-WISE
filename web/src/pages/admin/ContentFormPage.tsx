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
        answer: '',
        videoId: '',
        fileUrl: ''
    });
    
    const [steps, setSteps] = useState<Step[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
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
                        answer: content.answer || '',
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

    const handleAIFill = async () => {
        if (!formData.title) {
            setError('Please enter a title first so the AI knows what to generate.');
            return;
        }

        setAiLoading(true);
        setError(null);

        try {
            // 1. Generate Description
            const product = products.find(p => p.id === formData.product);
            const descRes = await axios.post(`${API_URL}/ai/generate-description`, {
                productName: formData.title,
                category: product?.name || ''
            }, { headers });

            if (descRes.data.success) {
                setFormData(prev => ({ ...prev, description: descRes.data.data.text }));
            }

            // 2. Generate Steps if it's a guide
            if (formData.type === 'guide') {
                const stepsRes = await axios.post(`${API_URL}/ai/suggest-steps`, {
                    guideTitle: formData.title,
                    productContext: product?.name || ''
                }, { headers });

                if (stepsRes.data.success) {
                    const generatedSteps = stepsRes.data.data.steps.map((s: string) => ({
                        title: s,
                        description: '',
                        image: ''
                    }));
                    setSteps(generatedSteps);
                }
            }
        } catch (err: any) {
            console.error('AI Fill Error:', err);
            setError('AI generation failed. Please try again or fill fields manually.');
        } finally {
            setAiLoading(false);
        }
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

            <form onSubmit={handleSubmit} className="form-layout">
                {/* Basic Information Section */}
                <div className="form-card">
                    <div className="section-header">
                        <div className="section-icon">
                            <IonIcon name="information-circle" />
                        </div>
                        <div className="section-title-group">
                            <h2 className="section-title">Basic Information</h2>
                            <span className="section-subtitle">Define the core metadata for this content resource</span>
                        </div>
                        <Button 
                            variant="primary" 
                            type="button" 
                            size="sm"
                            loading={aiLoading}
                            onClick={handleAIFill} 
                            icon={<IonIcon name="sparkles" />}
                            style={{ marginLeft: 'auto', background: 'var(--color-primary-glow)', border: 'none' }}
                        >
                            AI Magic Fill
                        </Button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <InputField
                            id="content-title"
                            label="Title / Heading"
                            placeholder="e.g. Precision Maintenance for X-Series"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            required
                            icon="document-text"
                        />

                        <div className="grid-responsive">
                            <SelectField
                                id="content-type"
                                label="Content Type"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                options={[
                                    { value: 'article', label: '📖 Knowledge Base Article' },
                                    { value: 'guide', label: '🛠️ Step-by-Step Repair Guide' },
                                    { value: 'faq', label: '❓ FAQ Entry' },
                                    { value: 'tutorial', label: '🎬 Video Episode' }
                                ]}
                            />

                            <SelectField
                                id="content-product"
                                label="Associated Product"
                                value={formData.product}
                                onChange={e => setFormData({ ...formData, product: e.target.value })}
                                placeholder="Select a product"
                                options={products.map(p => ({ value: p.id, label: p.name }))}
                            />
                        </div>
                    </div>
                </div>

                {/* FAQ Specific Fields */}
                {formData.type === 'faq' && (
                    <div className="form-card fade-enter-active">
                        <div className="section-header">
                            <div className="section-icon">
                                <IonIcon name="help-circle" />
                            </div>
                            <div className="section-title-group">
                                <h2 className="section-title">FAQ Details</h2>
                                <span className="section-subtitle">Define the question and its definitive answer</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div className="pw-textarea-group">
                                <label className="pw-label">The Question</label>
                                <textarea
                                    className="pw-textarea"
                                    rows={4}
                                    placeholder="Enter the common user question here..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="pw-textarea-group">
                                <label className="pw-label">The Answer</label>
                                <textarea
                                    className="pw-textarea"
                                    rows={6}
                                    placeholder="Enter the official solution or answer..."
                                    value={formData.answer}
                                    onChange={e => setFormData({ ...formData, answer: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Repair Guide Specific Fields */}
                {formData.type === 'guide' && (
                    <div className="form-card fade-enter-active">
                        <div className="section-header">
                            <div className="section-icon">
                                <IonIcon name="construct" />
                            </div>
                            <div className="section-title-group">
                                <h2 className="section-title">Repair Configuration</h2>
                                <span className="section-subtitle">Technical specs and estimated workflow duration</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div className="grid-responsive">
                                <SelectField
                                    id="content-difficulty"
                                    label="Technical Difficulty"
                                    value={formData.difficulty}
                                    onChange={e => setFormData({ ...formData, difficulty: e.target.value })}
                                    options={[
                                        { value: 'easy', label: 'Easy (Beginner)' },
                                        { value: 'medium', label: 'Medium (Standard)' },
                                        { value: 'hard', label: 'Hard (Professional)' },
                                        { value: 'expert', label: 'Expert (Master)' }
                                    ]}
                                />

                                <InputField
                                    id="content-time"
                                    label="Total Est. Time"
                                    placeholder="e.g. 45-60 mins"
                                    value={formData.estimatedTime}
                                    onChange={e => setFormData({ ...formData, estimatedTime: e.target.value })}
                                    icon="time"
                                />
                            </div>

                            <div className="pw-textarea-group">
                                <label className="pw-label">Guide Overview</label>
                                <textarea
                                    className="pw-textarea"
                                    rows={4}
                                    placeholder="Brief summary of what this guide covers..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="section-header" style={{ marginTop: '3rem', justifyContent: 'space-between' }}>
                            <div className="section-title-group">
                                <h2 className="section-title">Workflow Steps</h2>
                                <span className="section-subtitle">Break down the repair into actionable phases</span>
                            </div>
                            <Button variant="ghost" type="button" onClick={handleAddStep} icon={<IonIcon name="add-circle" />}>
                                Add Step
                            </Button>
                        </div>

                        {steps.length === 0 ? (
                            <div className="empty-steps-state">
                                <IonIcon name="layers" className="empty-icon" />
                                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--color-text-strong)', marginBottom: '0.5rem' }}>No Steps Defined</h3>
                                <p style={{ maxWidth: '400px', margin: '0 auto 2rem', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                                    Professional guides require detailed steps. Click the button below to initialize your workflow.
                                </p>
                                <Button variant="primary" type="button" onClick={handleAddStep} icon={<IonIcon name="add" />} style={{ padding: '0 2.5rem' }}>
                                    Initialize Workflow
                                </Button>
                            </div>
                        ) : (
                            <div className="steps-container">
                                {steps.map((step, index) => (
                                    <div key={index} className="pw-step-card fade-enter-active">
                                        <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                                            <Button variant="danger" size="sm" type="button" onClick={() => handleRemoveStep(index)} style={{ borderRadius: '50%', width: '32px', height: '32px', padding: 0 }}>
                                                <IonIcon name="close" />
                                            </Button>
                                        </div>

                                        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
                                            <div className="step-number-badge">
                                                {index + 1}
                                            </div>
                                            
                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                                <div className="grid-responsive">
                                                    <InputField
                                                        id={`step-title-${index}`}
                                                        label="Phase Title"
                                                        placeholder="e.g. Removing the panel"
                                                        value={step.title}
                                                        onChange={e => handleStepChange(index, 'title', e.target.value)}
                                                        required
                                                    />
                                                    <InputField
                                                        id={`step-image-${index}`}
                                                        label="Reference Image URL"
                                                        placeholder="https://..."
                                                        value={step.image}
                                                        onChange={e => handleStepChange(index, 'image', e.target.value)}
                                                        icon="image"
                                                    />
                                                </div>

                                                {step.image && (
                                                    <div className="step-image-preview">
                                                        <img src={step.image} alt={`Step ${index + 1}`} />
                                                    </div>
                                                )}

                                                <div className="pw-textarea-group">
                                                    <label className="pw-label">Instructions</label>
                                                    <textarea
                                                        className="pw-textarea"
                                                        rows={4}
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
                            </div>
                        )}
                    </div>
                )}

                {/* Video Specific Fields */}
                {formData.type === 'tutorial' && (
                    <div className="form-card fade-enter-active">
                        <div className="section-header">
                            <div className="section-icon">
                                <IonIcon name="play-circle" />
                            </div>
                            <div className="section-title-group">
                                <h2 className="section-title">Video Configuration</h2>
                                <span className="section-subtitle">Embed instructions for high-impact visual tutorials</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <InputField
                                id="content-video"
                                label="YouTube URL / ID"
                                placeholder="e.g. https://www.youtube.com/watch?v=..."
                                value={formData.videoId}
                                onChange={e => setFormData({ ...formData, videoId: e.target.value })}
                                icon="logo-youtube"
                                required
                            />
                            <div className="pw-textarea-group">
                                <label className="pw-label">Video Synopsis</label>
                                <textarea
                                    className="pw-textarea"
                                    rows={5}
                                    placeholder="Describe what users will learn in this video..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Article Specific Fields */}
                {formData.type === 'article' && (
                    <div className="form-card fade-enter-active">
                        <div className="section-header">
                            <div className="section-icon">
                                <IonIcon name="reader" />
                            </div>
                            <div className="section-title-group">
                                <h2 className="section-title">Article Body</h2>
                                <span className="section-subtitle">Draft the technical documentation or long-form article</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div className="pw-textarea-group">
                                <label className="pw-label">Content Body</label>
                                <textarea
                                    className="pw-textarea"
                                    rows={12}
                                    placeholder="Type or paste your full article here..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    required
                                />
                            </div>
                            <InputField
                                id="content-file"
                                label="Technical PDF Attachment (Optional)"
                                placeholder="https://..."
                                value={formData.fileUrl}
                                onChange={e => setFormData({ ...formData, fileUrl: e.target.value })}
                                icon="attach"
                            />
                        </div>
                    </div>
                )}

                {/* Fixed Submission Bar */}
                <div className="form-actions-fixed">
                    <div className="action-status-hint">
                        <IonIcon name="shield-checkmark" style={{ color: 'var(--color-primary)', fontSize: '20px' }} />
                        <span>Ready for AI Audit</span>
                    </div>
                    
                    <Button variant="ghost" type="button" onClick={() => navigate('/admin/support')} style={{ height: '52px', padding: '0 2rem' }}>
                        Discard Changes
                    </Button>
                    
                    <Button 
                        type="submit" 
                        loading={loading} 
                        icon={<IonIcon name="cloud-upload" />} 
                        style={{ minWidth: '220px', height: '52px', fontSize: 'var(--text-base)', borderRadius: 'var(--radius-lg)' }}
                    >
                        {isEdit ? 'Update Resource' : 'Finalize & Create'}
                    </Button>
                </div>
            </form>
        </div>
    );
};
