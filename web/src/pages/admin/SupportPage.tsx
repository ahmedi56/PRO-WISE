import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { API_URL } from '../../config';
import { fetchProducts } from '../../store/slices/productSlice';
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
} from '../../store/slices/supportSlice';
import { AppDispatch, RootState } from '../../store';
import { IonIcon, EmptyState } from '../../components/ui';
import '../../styles/admin-support.css';

export const SupportPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { products, loading: productsLoading } = useSelector((state: RootState) => state.products);
    const { content, loading: supportLoading, error, success } = useSelector((state: RootState) => state.support);
    
    const [selectedProductId, setSelectedProductId] = useState('');
    const [activeTab, setActiveTab] = useState<'guides' | 'videos' | 'pdfs'>('guides');
    const [showModal, setShowModal] = useState<'guide' | 'step' | 'video' | 'pdf' | null>(null);
    
    const [guideForm, setGuideForm] = useState({ 
        difficulty: 'medium', 
        estimated_time: '', 
        isPublished: false, 
        en: { title: '', description: '' }
    });
    const [stepForm, setStepForm] = useState({ 
        step_number: 1, 
        estimated_time: '', 
        en: { title: '', description: '' },
        imageUrls: '',
        videoUrls: '',
        pdfUrls: ''
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
            dispatch(fetchSupportContent({ productId: selectedProductId, manage: true }));
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
            translations: { en: guideForm.en }
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
            videos: stepForm.videoUrls.split('\n').filter(url => url.trim() !== ''),
            pdfs: stepForm.pdfUrls.split('\n').filter(url => url.trim() !== ''),
            translations: { en: stepForm.en }
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
                } else return;
            }
            if (!finalUrl) return;
            const createResult = await dispatch(createPDF({ product: selectedProductId, title: pdfForm.title, fileUrl: finalUrl }));
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
                setPdfForm(prev => ({ ...prev, title: fileName }));
            }
        }
    };

    return (
        <div className="support-admin-container">
            {success && <div className="status-toast success">{success}</div>}
            {error && <div className="status-toast error">{error}</div>}

            <div className="support-header">
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Repair & Support</h1>
                    <p style={{ color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>Manage technical content and documents.</p>
                </div>

                <div className="product-selector-wrapper">
                    <IonIcon name="cube-outline" style={{ color: 'var(--color-primary)' }} />
                    <select className="product-select" value={selectedProductId} onChange={handleProductChange} disabled={productsLoading}>
                        <option value="">Select Product...</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
            </div>

            {!selectedProductId ? (
                <EmptyState 
                    icon="cube-outline"
                    title="No Product Selected"
                    description="Select a product from the dropdown above to start managing its technical documentation."
                />
            ) : (
                <div className="support-dashboard-grid">
                    {/* ─── SECTION: REPAIR GUIDE ─── */}
                    <div className="support-card section-guides">
                        <div className="section-header">
                            <h3><IonIcon name="document-text-outline" /> Repair Guides & Steps</h3>
                            {content.guide && <button className="btn btn-primary btn-sm" onClick={() => setShowModal('step')}>Add Step</button>}
                        </div>
                        
                        {!content.guide ? (
                            <div className="empty-section-lite">
                                <p>No repair guide found.</p>
                                <button className="btn btn-outline btn-sm" onClick={() => setShowModal('guide')}>Initialize Guide</button>
                            </div>
                        ) : (
                            <div className="guide-content-preview">
                                <div className="guide-mini-meta">
                                    <span><strong>Diff:</strong> {content.guide.difficulty?.toUpperCase()}</span>
                                    <span><strong>Time:</strong> {content.guide.estimated_time || 'N/A'}</span>
                                    <button className="text-danger-link" onClick={() => window.confirm('Delete guide?') && dispatch(deleteGuide(content.guide!.id))}>Delete</button>
                                </div>
                                
                                <div className="steps-scroll-list">
                                    {content.steps.length === 0 ? (
                                        <p className="empty-hint">No steps added yet.</p>
                                    ) : (
                                        content.steps.map(step => (
                                            <div key={step.id} className="step-item-mini">
                                                <span className="step-idx">{step.step_number}</span>
                                                <span className="step-title">{step.title}</span>
                                                <div className="step-media-badges">
                                                    {(step.images?.length ?? 0) > 0 && <IonIcon name="image-outline" />}
                                                    {(step.videos?.length ?? 0) > 0 && <IonIcon name="logo-youtube" />}
                                                    {(step.pdfs?.length ?? 0) > 0 && <IonIcon name="document-outline" />}
                                                </div>
                                                <button className="btn-icon-sm" onClick={() => dispatch(deleteStep(step.id))}><IonIcon name="trash-outline" /></button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ─── SECTION: VIDEOS ─── */}
                    <div className="support-card section-videos">
                        <div className="section-header">
                            <h3><IonIcon name="play-circle-outline" /> Support Videos</h3>
                            <button className="btn btn-primary btn-sm" onClick={() => setShowModal('video')}>Add Video</button>
                        </div>
                        <div className="content-scroll-list">
                            {content.videos.length === 0 ? (
                                <p className="empty-hint">No videos linked.</p>
                            ) : (
                                content.videos.map(video => (
                                    <div key={video.id} className="content-item-mini">
                                        <IonIcon name="logo-youtube" className="item-icon video" />
                                        <span className="item-title">{video.title}</span>
                                        <button className="btn-icon-sm" onClick={() => dispatch(deleteVideo(video.id))}><IonIcon name="trash-outline" /></button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* ─── SECTION: PDFS ─── */}
                    <div className="support-card section-pdfs">
                        <div className="section-header">
                            <h3><IonIcon name="document-attach-outline" /> Technical Documents (PDF)</h3>
                            <button className="btn btn-primary btn-sm" onClick={() => setShowModal('pdf')}>Add PDF</button>
                        </div>
                        <div className="content-scroll-list">
                            {content.pdfs.length === 0 ? (
                                <p className="empty-hint">No documents uploaded.</p>
                            ) : (
                                content.pdfs.map(pdf => (
                                    <div key={pdf.id} className="content-item-mini">
                                        <IonIcon name="document-outline" className="item-icon pdf" />
                                        <span className="item-title">{pdf.title}</span>
                                        <button className="btn-icon-sm" onClick={() => dispatch(deletePDF(pdf.id))}><IonIcon name="trash-outline" /></button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showModal === 'guide' && (
                <div className="support-modal-overlay">
                    <div className="support-modal-content card">
                        <h2>Create Guide</h2>
                        <form onSubmit={handleAddGuide}>
                            <select className="support-select" value={guideForm.difficulty} onChange={e => setGuideForm({...guideForm, difficulty: e.target.value})} style={{ marginBottom: '1rem' }}>
                                <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                            </select>
                            <input className="support-input" type="text" placeholder="Title" value={guideForm.en.title} onChange={e => setGuideForm({...guideForm, en: {...guideForm.en, title: e.target.value}})} required style={{ marginBottom: '1rem' }} />
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setShowModal(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showModal === 'step' && (
                <div className="support-modal-overlay">
                    <div className="support-modal-content card">
                        <h2>Add Step</h2>
                        <form onSubmit={handleAddStep}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label className="label">Step Number</label>
                                    <input className="support-input" type="number" min="1" value={stepForm.step_number} onChange={e => setStepForm({...stepForm, step_number: parseInt(e.target.value) || 1})} required />
                                </div>
                                <div>
                                    <label className="label">Estimated Time</label>
                                    <input className="support-input" type="text" placeholder="e.g. 5 minutes" value={stepForm.estimated_time} onChange={e => setStepForm({...stepForm, estimated_time: e.target.value})} />
                                </div>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="label">Step Title</label>
                                <input className="support-input" type="text" placeholder="Step title" value={stepForm.en.title} onChange={e => setStepForm({...stepForm, en: {...stepForm.en, title: e.target.value}})} required />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="label">Description</label>
                                <textarea className="support-input" rows={3} placeholder="Describe this step in detail..." value={stepForm.en.description} onChange={e => setStepForm({...stepForm, en: {...stepForm.en, description: e.target.value}})} style={{ resize: 'vertical', width: '100%' }} />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="label">Image URLs (one per line)</label>
                                <textarea className="support-input" rows={2} placeholder="https://example.com/image1.jpg" value={stepForm.imageUrls} onChange={e => setStepForm({...stepForm, imageUrls: e.target.value})} style={{ resize: 'vertical', width: '100%', marginBottom: '1rem' }} />
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label className="label">YouTube Video URLs</label>
                                        <textarea className="support-input" rows={2} placeholder="https://youtube.com/..." value={stepForm.videoUrls} onChange={e => setStepForm({...stepForm, videoUrls: e.target.value})} style={{ resize: 'vertical', width: '100%' }} />
                                    </div>
                                    <div>
                                        <label className="label">PDF Document URLs</label>
                                        <textarea className="support-input" rows={2} placeholder="https://example.com/manual.pdf" value={stepForm.pdfUrls} onChange={e => setPdfForm ? setStepForm({...stepForm, pdfUrls: e.target.value}) : setStepForm({...stepForm, pdfUrls: e.target.value})} style={{ resize: 'vertical', width: '100%' }} />
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setShowModal(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Add Step</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showModal === 'video' && (
                <div className="support-modal-overlay">
                    <div className="support-modal-content card">
                        <h2>Add Video</h2>
                        <form onSubmit={handleAddVideo}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="label">Video Title</label>
                                <input className="support-input" type="text" placeholder="e.g. Battery Replacement Tutorial" value={videoForm.title} onChange={e => setVideoForm({...videoForm, title: e.target.value})} required />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="label">YouTube Video ID</label>
                                <input className="support-input" type="text" placeholder="e.g. dQw4w9WgXcQ" value={videoForm.videoId} onChange={e => setVideoForm({...videoForm, videoId: e.target.value})} required />
                                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>The ID from the YouTube URL (youtube.com/watch?v=<strong>THIS_PART</strong>)</p>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setShowModal(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Add Video</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showModal === 'pdf' && (
                <div className="support-modal-overlay">
                    <div className="support-modal-content card">
                        <h2>Add PDF</h2>
                        <form onSubmit={handleAddPDF}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="label">PDF Title</label>
                                <input className="support-input" type="text" placeholder="e.g. User Manual v2.0" value={pdfForm.title} onChange={e => setPdfForm({...pdfForm, title: e.target.value})} required />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="label">Source</label>
                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input type="radio" checked={pdfSource === 'local'} onChange={() => setPdfSource('local')} /> Upload File
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input type="radio" checked={pdfSource === 'link'} onChange={() => setPdfSource('link')} /> Paste Link
                                    </label>
                                </div>
                                {pdfSource === 'local' ? (
                                    <input className="support-input" type="file" accept=".pdf" onChange={handlePdfFileChange} required={!pdfForm.fileUrl} />
                                ) : (
                                    <input className="support-input" type="url" placeholder="https://example.com/manual.pdf" value={pdfForm.fileUrl} onChange={e => setPdfForm({...pdfForm, fileUrl: e.target.value})} required />
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" className="btn btn-outline" onClick={() => { setShowModal(null); setPdfFile(null); }}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Add PDF</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupportPage;
