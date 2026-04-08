import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { API_URL } from '@/config';
import { fetchProducts } from '@/store/slices/productSlice';
import { 
    fetchSupportContent, 
    createGuide, 
    deleteGuide, 
    createStep, 
    deleteStep, 
    createVideo, 
    deleteVideo, 
    createPDF, 
    deletePDF,
    uploadPDF,
    clearSupportState,
    clearMessages
} from '@/store/slices/supportSlice';
import { AppDispatch, RootState } from '@/store';
import '@/styles/admin-support.css';

const AdminSupportPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { products, loading: productsLoading } = useSelector((state: RootState) => state.products);
    const { content, loading: supportLoading, error, success } = useSelector((state: RootState) => state.support);
    
    const [selectedProductId, setSelectedProductId] = useState('');
    const [activeTab, setActiveTab] = useState<'guides' | 'videos' | 'pdfs'>('guides');
    const [showModal, setShowModal] = useState<'guide' | 'step' | 'video' | 'pdf' | null>(null);
    
    // Form States
    const [guideForm, setGuideForm] = useState({ 
        difficulty: 'medium', 
        estimated_time: '', 
        isPublished: false, 
        en: { title: '', description: '' }, 
        fr: { title: '', description: '' }, 
        ar: { title: '', description: '' } 
    });
    const [stepForm, setStepForm] = useState({ 
        step_number: 1, 
        estimated_time: '', 
        en: { title: '', description: '' }, 
        fr: { title: '', description: '' }, 
        ar: { title: '', description: '' }, 
        imageUrls: '' 
    });
    const [videoForm, setVideoForm] = useState({ title: '', videoId: '' });
    const [pdfForm, setPdfForm] = useState({ title: '', fileUrl: '' });
    const [pdfSource, setPdfSource] = useState<'local' | 'link'>('local');
    const [pdfFile, setPdfFile] = useState<File | null>(null);

    useEffect(() => {
        dispatch(fetchProducts({ limit: 100, manage: true }));
    }, [dispatch]);

    useEffect(() => {
        if (selectedProductId) {
            dispatch(fetchSupportContent(selectedProductId));
        } else {
            dispatch(clearSupportState());
        }
    }, [selectedProductId, dispatch]);

    useEffect(() => {
        if (success || error) {
            const timer = setTimeout(() => dispatch(clearMessages()), 3000);
            return () => clearTimeout(timer);
        }
    }, [success, error, dispatch]);

    useEffect(() => {
        if (showModal === 'step' && content.steps) {
            const nextStep = content.steps.length > 0 
                ? Math.max(...content.steps.map((s: any) => s.step_number || 0)) + 1 
                : 1;
            setStepForm(prev => ({ ...prev, step_number: nextStep }));
        }
    }, [showModal, content.steps]);

    const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedProductId(e.target.value);
    };

    const handleAddGuide = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = {
            product: selectedProductId,
            difficulty: guideForm.difficulty,
            estimated_time: guideForm.estimated_time,
            isPublished: guideForm.isPublished,
            translations: {
                en: guideForm.en,
                fr: guideForm.fr,
                ar: guideForm.ar
            }
        };
        await dispatch(createGuide(data));
        setShowModal(null);
    };

    const handleAddStep = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.guide) return;
        const data = {
            guide: content.guide.id,
            step_number: stepForm.step_number,
            estimated_time: stepForm.estimated_time,
            images: stepForm.imageUrls.split('\n').filter(url => url.trim() !== ''),
            translations: {
                en: stepForm.en,
                fr: stepForm.fr,
                ar: stepForm.ar
            }
        };
        await dispatch(createStep(data));
        setShowModal(null);
    };

    const handleAddVideo = async (e: React.FormEvent) => {
        e.preventDefault();
        await dispatch(createVideo({ product: selectedProductId, ...videoForm }));
        setShowModal(null);
        setVideoForm({ title: '', videoId: '' });
    };

    const handleAddPDF = async (e: React.FormEvent) => {
        e.preventDefault();
        
        let finalUrl = pdfForm.fileUrl;

        try {
            if (pdfSource === 'local' && pdfFile) {
                const formData = new FormData();
                formData.append('pdf', pdfFile);
                const uploadResult = await dispatch(uploadPDF(formData));
                
                if (uploadPDF.fulfilled.match(uploadResult)) {
                    finalUrl = (uploadResult.payload as any).fileUrl;
                } else {
                    return;
                }
            }

            if (!finalUrl) return;

            const createResult = await dispatch(createPDF({ 
                product: selectedProductId, 
                title: pdfForm.title, 
                fileUrl: finalUrl 
            }));

            if (createPDF.fulfilled.match(createResult)) {
                setShowModal(null);
                setPdfForm({ title: '', fileUrl: '' });
                setPdfFile(null);
            }
        } catch (err) {
            console.error('PDF Add Error:', err);
        }
    };

    const handlePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPdfFile(file);
            if (!pdfForm.title) {
                const fileName = file.name.replace(/\.[^/.]+$/, "");
                const sanitizedTitle = fileName
                    .split(/[-_]/)
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
                setPdfForm(prev => ({ ...prev, title: sanitizedTitle }));
            }
        }
    };

    const renderGuidesTab = () => {
        if (!content.guide) {
            return (
                <div className="empty-support-state">
                    <div className="empty-icon">📖</div>
                    <p>No repair guide found for this product.</p>
                    <button className="btn btn-primary" onClick={() => setShowModal('guide')}>
                        Create Repair Guide
                    </button>
                </div>
            );
        }

        return (
            <div className="guide-management">
                <div className="guide-info-card">
                    <div className="guide-meta">
                        <div className="meta-item">
                            <span className="meta-label">Difficulty</span>
                            <span className="meta-value">{String(content.guide.difficulty || '').toUpperCase()}</span>
                        </div>
                        <div className="meta-item">
                            <span className="meta-label">Estimated Time</span>
                            <span className="meta-value">{content.guide.estimated_time || 'N/A'}</span>
                        </div>
                        <div className="meta-item">
                            <span className="meta-label">Status</span>
                            <span className={`meta-value ${content.guide.isPublished ? 'text-success' : 'text-warning'}`}>
                                {content.guide.isPublished ? 'Published' : 'Draft'}
                            </span>
                        </div>
                    </div>
                    <div className="guide-actions">
                        <button className="btn btn-outline-danger btn-sm" onClick={() => window.confirm('Delete this entire guide and all its steps?') && dispatch(deleteGuide(content.guide.id))}>
                            Delete Guide
                        </button>
                    </div>
                </div>

                <div className="steps-header section-actions">
                    <button className="btn btn-primary" onClick={() => setShowModal('step')}>
                        Add New Step
                    </button>
                </div>

                <div className="steps-admin-list">
                    {content.steps.length === 0 ? (
                        <p className="text-center text-muted">No steps added yet.</p>
                    ) : (
                        content.steps.map((step: any) => (
                            <div key={step.id} className="step-admin-card">
                                <div className="step-number-badge">{step.step_number}</div>
                                <div className="step-title-text">{step.title || 'Untitled Step'}</div>
                                <div className="step-actions">
                                    <button className="btn-delete-icon" title="Delete Step" onClick={() => dispatch(deleteStep(step.id))}>
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    };

    const renderVideosTab = () => (
        <div className="video-management">
            <div className="section-actions">
                <button className="btn btn-primary" onClick={() => setShowModal('video')}>
                    Add Support Video
                </button>
            </div>
            <div className="steps-admin-list">
                {content.videos.length === 0 ? (
                    <div className="empty-support-state">No videos added.</div>
                ) : (
                    content.videos.map((video: any) => (
                        <div key={video.id} className="step-admin-card">
                            <div className="step-number-badge">🎬</div>
                            <div className="step-title-text">
                                {video.title} <span className="text-muted" style={{ fontSize: '0.8rem' }}>({video.videoId})</span>
                            </div>
                            <button className="btn-delete-icon" onClick={() => dispatch(deleteVideo(video.id))}>🗑️</button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    const renderPDFsTab = () => (
        <div className="pdf-management">
            <div className="section-actions">
                <button className="btn btn-primary" onClick={() => setShowModal('pdf')}>
                    Add Support PDF
                </button>
            </div>
            <div className="steps-admin-list">
                {content.pdfs.length === 0 ? (
                    <div className="empty-support-state">No PDFs added.</div>
                ) : (
                    content.pdfs.map((pdf: any) => (
                        <div key={pdf.id} className="step-admin-card">
                            <div className="step-number-badge">📄</div>
                            <div className="step-title-text">{pdf.title}</div>
                            <div className="step-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn btn-outline btn-sm" onClick={() => {
                                    const fullUrl = (pdf.fileUrl && (pdf.fileUrl.startsWith('http') || pdf.fileUrl.startsWith('//'))) 
                                        ? pdf.fileUrl 
                                        : `${API_URL}${pdf.fileUrl}`;
                                    window.open(fullUrl, '_blank');
                                }}>View</button>
                                <button className="btn-delete-icon" onClick={() => dispatch(deletePDF(pdf.id))}>🗑️</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    return (
        <div className="support-admin-container">
            {success && <div className="status-toast success">{success}</div>}
            {error && <div className="status-toast error">{error}</div>}

            <div className="support-header">
                <div className="header-titles">
                    <h1 className="page-title">Repair & Support Management</h1>
                    <p className="page-subtitle">Manage guides, videos, and documentation for your products.</p>
                </div>

                <div className="product-selector-wrapper" style={{ minWidth: '300px' }}>
                    <select 
                        className="select" 
                        value={selectedProductId} 
                        onChange={handleProductChange}
                        disabled={productsLoading}
                        style={{ border: 'none', background: 'transparent' }}
                    >
                        <option value="">Select a Product...</option>
                        {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {!selectedProductId ? (
                <div className="empty-support-state" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '20px' }}>
                    <div className="empty-icon">🛠️</div>
                    <h2>Welcome to Support Management</h2>
                    <p>Please select a product from the list above to begin managing its support content.</p>
                </div>
            ) : (
                <div className="support-content-shell">
                    <div className="support-tabs">
                        <div className={`support-tab ${activeTab === 'guides' ? 'active' : ''}`} onClick={() => setActiveTab('guides')}>Repair Guides</div>
                        <div className={`support-tab ${activeTab === 'videos' ? 'active' : ''}`} onClick={() => setActiveTab('videos')}>Videos</div>
                        <div className={`support-tab ${activeTab === 'pdfs' ? 'active' : ''}`} onClick={() => setActiveTab('pdfs')}>PDFs</div>
                    </div>

                    <div className="support-section">
                        {activeTab === 'guides' && renderGuidesTab()}
                        {activeTab === 'videos' && renderVideosTab()}
                        {activeTab === 'pdfs' && renderPDFsTab()}
                    </div>
                </div>
            )}

            {/* MODALS */}
            {showModal === 'guide' && (
                <div className="support-modal-overlay">
                    <div className="support-modal-content">
                        <div className="modal-header">
                            <h2>Create Repair Guide</h2>
                            <button className="close-modal" onClick={() => setShowModal(null)}>&times;</button>
                        </div>
                        <form onSubmit={handleAddGuide}>
                            <div className="support-form-grid">
                                <div className="support-form-group">
                                    <label>Difficulty</label>
                                    <select className="support-select" value={guideForm.difficulty} onChange={e => setGuideForm({...guideForm, difficulty: e.target.value})}>
                                        <option value="easy">Easy</option>
                                        <option value="medium">Medium</option>
                                        <option value="hard">Hard</option>
                                    </select>
                                </div>
                                <div className="support-form-group">
                                    <label>Est. Time (e.g. 30 mins)</label>
                                    <input className="support-input" type="text" value={guideForm.estimated_time} onChange={e => setGuideForm({...guideForm, estimated_time: e.target.value})} placeholder="30 mins" />
                                </div>
                                <div className="support-form-group full-width">
                                    <label>
                                        <input type="checkbox" checked={guideForm.isPublished} onChange={e => setGuideForm({...guideForm, isPublished: e.target.checked})} /> Publish immediately
                                    </label>
                                </div>

                                {/* English Translation */}
                                <div className="translation-box full-width">
                                    <span className="translation-lang-label">EN - ENGLISH</span>
                                    <div className="support-form-group" style={{ marginBottom: '1rem' }}>
                                        <label>Title</label>
                                        <input className="support-input" type="text" value={guideForm.en.title} onChange={e => setGuideForm({...guideForm, en: {...guideForm.en, title: e.target.value}})} required />
                                    </div>
                                    <div className="support-form-group">
                                        <label>Description</label>
                                        <textarea className="support-textarea" value={guideForm.en.description} onChange={e => setGuideForm({...guideForm, en: {...guideForm.en, description: e.target.value}})} />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer" style={{ marginTop: '2rem' }}>
                                <button type="submit" className="btn btn-primary w-100" disabled={supportLoading}>Create Guide</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showModal === 'step' && (
                <div className="support-modal-overlay">
                    <div className="support-modal-content">
                        <div className="modal-header">
                            <h2>Add Repair Step</h2>
                            <button className="close-modal" onClick={() => setShowModal(null)}>&times;</button>
                        </div>
                        <form onSubmit={handleAddStep}>
                            <div className="support-form-grid">
                                <div className="support-form-group">
                                    <label>Step Number</label>
                                    <input className="support-input" type="number" value={stepForm.step_number} onChange={e => setStepForm({...stepForm, step_number: parseInt(e.target.value)})} required />
                                </div>
                                <div className="support-form-group">
                                    <label>Est. Time</label>
                                    <input className="support-input" type="text" value={stepForm.estimated_time} onChange={e => setStepForm({...stepForm, estimated_time: e.target.value})} placeholder="5 mins" />
                                </div>
                                <div className="support-form-group full-width">
                                    <label>Image URLs (One per line)</label>
                                    <textarea className="support-textarea" value={stepForm.imageUrls} onChange={e => setStepForm({...stepForm, imageUrls: e.target.value})} placeholder="https://example.com/image1.jpg" />
                                </div>

                                <div className="translation-box full-width">
                                    <span className="translation-lang-label">EN - ENGLISH</span>
                                    <div className="support-form-group" style={{ marginBottom: '1rem' }}>
                                        <label>Title</label>
                                        <input className="support-input" type="text" value={stepForm.en.title} onChange={e => setStepForm({...stepForm, en: {...stepForm.en, title: e.target.value}})} required />
                                    </div>
                                    <div className="support-form-group">
                                        <label>Description</label>
                                        <textarea className="support-textarea" value={stepForm.en.description} onChange={e => setStepForm({...stepForm, en: {...stepForm.en, description: e.target.value}})} />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer" style={{ marginTop: '2rem' }}>
                                <button type="submit" className="btn btn-primary w-100" disabled={supportLoading}>Add Step</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showModal === 'video' && (
                <div className="support-modal-overlay">
                    <div className="support-modal-content">
                        <div className="modal-header">
                            <h2>Add Support Video</h2>
                            <button className="close-modal" onClick={() => setShowModal(null)}>&times;</button>
                        </div>
                        <form onSubmit={handleAddVideo}>
                            <div className="support-form-group" style={{ marginBottom: '1.5rem' }}>
                                <label>Video Title</label>
                                <input className="support-input" type="text" value={videoForm.title} onChange={e => setVideoForm({...videoForm, title: e.target.value})} required />
                            </div>
                            <div className="support-form-group" style={{ marginBottom: '2rem' }}>
                                <label>YouTube Link or Video ID</label>
                                <input className="support-input" type="text" value={videoForm.videoId} onChange={e => setVideoForm({...videoForm, videoId: e.target.value})} placeholder="https://www.youtube.com/watch?v=..." required />
                            </div>
                            <button type="submit" className="btn btn-primary w-100" disabled={supportLoading}>Add Video</button>
                        </form>
                    </div>
                </div>
            )}

            {showModal === 'pdf' && (
                <div className="support-modal-overlay">
                    <div className="support-modal-content">
                        <div className="modal-header">
                            <h2>Add Support PDF</h2>
                            <button className="close-modal" onClick={() => setShowModal(null)}>&times;</button>
                        </div>
                        <form onSubmit={handleAddPDF}>
                            <div className="support-form-group" style={{ marginBottom: '1.5rem' }}>
                                <label>Document Title</label>
                                <input className="support-input" type="text" value={pdfForm.title} onChange={e => setPdfForm({...pdfForm, title: e.target.value})} required />
                            </div>

                            <div className="source-toggle" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                                <button type="button" className={`btn btn-sm ${pdfSource === 'link' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setPdfSource('link')}>External Link</button>
                                <button type="button" className={`btn btn-sm ${pdfSource === 'local' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setPdfSource('local')}>Local File</button>
                            </div>

                            <div className="support-form-group" style={{ marginBottom: '2rem' }}>
                                {pdfSource === 'link' ? (
                                    <>
                                        <label>File URL</label>
                                        <input className="support-input" type="text" value={pdfForm.fileUrl} onChange={e => setPdfForm({...pdfForm, fileUrl: e.target.value})} placeholder="https://example.com/manual.pdf" required />
                                    </>
                                ) : (
                                    <>
                                        <label>Select PDF File</label>
                                        <input className="support-input" type="file" accept=".pdf" onChange={handlePdfFileChange} required />
                                    </>
                                )}
                            </div>
                            <button type="submit" className="btn btn-primary w-100" disabled={supportLoading}>
                                {supportLoading ? 'Processing...' : 'Add PDF'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSupportPage;
