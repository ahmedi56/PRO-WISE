import React, { useState, useMemo } from 'react';
import { IonIcon } from '../../../components/ui';
import { MediaGallery } from './MediaGallery';
import { FAQAccordion } from './FAQAccordion';
import { InstructionSteps } from './InstructionSteps';

interface SupportSectionProps {
    data: {
        guide: any;
        instructionSets: any[];
        videos: any[];
        documents: any[];
        faqs: any[];
    };
    onPlayVideo?: (video: any) => void;
}

const SUPPORT_TABS = [
    { key: 'steps', label: 'Steps', icon: 'list-outline' },
    { key: 'videos', label: 'Videos', icon: 'videocam-outline' },
    { key: 'pdfs', label: 'Documents', icon: 'document-text-outline' },
    { key: 'faqs', label: 'FAQs', icon: 'help-circle-outline' },
] as const;

type SupportTabKey = typeof SUPPORT_TABS[number]['key'];

export const SupportSection: React.FC<SupportSectionProps> = ({ data, onPlayVideo }) => {
    const [activeTab, setActiveTab] = useState<SupportTabKey>('steps');

    const counts = useMemo(() => ({
        steps: (data.guide?.steps?.length || 0) + data.instructionSets.length,
        videos: data.videos.length,
        pdfs: data.documents.length,
        faqs: data.faqs.length
    }), [data]);

    const renderContent = () => {
        switch (activeTab) {
            case 'steps':
                return <InstructionSteps mainGuide={data.guide} additionalSets={data.instructionSets} />;
            case 'videos':
                return <MediaGallery type="videos" assets={data.videos} onPlayVideo={onPlayVideo} />;
            case 'pdfs':
                return <MediaGallery type="documents" assets={data.documents} />;
            case 'faqs':
                return <FAQAccordion faqs={data.faqs} />;
            default:
                return null;
        }
    };

    return (
        <section className="card" style={{ overflow: 'hidden', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-raised)', overflowX: 'auto' }}>
                {SUPPORT_TABS.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            flex: 1, padding: '1.25rem 1rem', border: 'none', background: 'none', cursor: 'pointer',
                            color: activeTab === tab.key ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            borderBottom: `3px solid ${activeTab === tab.key ? 'var(--color-primary)' : 'transparent'}`,
                            fontWeight: activeTab === tab.key ? 700 : 500, fontSize: '1.05rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                            transition: 'all 0.2s', minWidth: '150px'
                        }}
                    >
                        <IonIcon name={tab.icon} style={{ fontSize: '1.2rem' }} />
                        {tab.label}
                        {counts[tab.key] > 0 && (
                            <span style={{ 
                                background: activeTab === tab.key ? 'var(--color-primary)' : 'var(--color-border)', 
                                color: activeTab === tab.key ? '#fff' : 'inherit',
                                padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700 
                            }}>
                                {counts[tab.key]}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <div style={{ padding: '2.5rem' }} className="fade-in">
                {renderContent()}
            </div>
        </section>
    );
};
