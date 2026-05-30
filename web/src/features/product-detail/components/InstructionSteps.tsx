import React from 'react';
import { Badge, EmptyState } from '../../../components/ui';

interface Step {
    id: string | number;
    title: string;
    description: string;
    images?: string[];
    image?: string; // Unified model compatibility
    media?: any[]; // Legacy model compatibility
}

interface InstructionSet {
    id: string;
    title: string;
    description?: string;
    difficulty?: string;
    estimatedTime?: string;
    author?: string;
    steps: Step[];
    isVerified?: boolean;
}

interface InstructionStepsProps {
    mainGuide: InstructionSet | null;
    additionalSets: InstructionSet[];
}

const StepList: React.FC<{ steps: Step[] }> = ({ steps }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
        <div style={{ position: 'absolute', left: '19px', top: '24px', bottom: '24px', width: '2px', background: 'var(--color-border)' }} />
        {steps.map((step, idx) => (
            <div key={step.id || idx} style={{ display: 'flex', gap: '1.5rem', position: 'relative', zIndex: 1 }}>
                <div style={{ 
                    width: '40px', height: '40px', borderRadius: '50%', 
                    background: 'var(--color-surface)', border: '2px solid var(--color-primary)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    color: 'var(--color-primary)', fontWeight: 800, flexShrink: 0, fontSize: '1.1rem' 
                }}>
                    {idx + 1}
                </div>
                <div style={{ paddingTop: '0.25rem', paddingBottom: '1rem', flex: 1 }}>
                    <h5 style={{ margin: '0 0 0.5rem 0', fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-text-strong)' }}>
                        {step.title}
                    </h5>
                    <p style={{ margin: 0, fontSize: '1rem', color: 'var(--color-text)', lineHeight: 1.6 }}>
                        {step.description}
                    </p>
                    
                    {/* Media Handling (Legacy vs Unified) */}
                    {(step.image || (step.media && step.media.length > 0)) && (
                        <div style={{ marginTop: '1.25rem', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                            <img 
                                src={step.image || (step.media && (step.media[0].url || step.media[0].fileUrl))} 
                                alt={step.title} 
                                style={{ width: '100%', maxHeight: '450px', objectFit: 'cover', display: 'block' }} 
                            />
                        </div>
                    )}
                </div>
            </div>
        ))}
    </div>
);

const InstructionCard: React.FC<{ set: InstructionSet }> = ({ set }) => (
    <div style={{ background: 'var(--color-surface-raised)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', border: '1px solid var(--color-border)', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
                <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 800, fontSize: '1.3rem', color: 'var(--color-text-strong)' }}>
                    {set.title}
                </h4>
                {set.description && (
                    <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-text-muted)', maxWidth: '600px' }}>
                        {set.description}
                    </p>
                )}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                {set.isVerified && <Badge tone="info" size="lg">VERIFIED</Badge>}
                {set.difficulty && (
                    <Badge tone={set.difficulty === 'hard' ? 'danger' : 'success'} size="lg">
                        {set.difficulty.toUpperCase()}
                    </Badge>
                )}
                {set.estimatedTime && (
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                        {set.estimatedTime}
                    </span>
                )}
            </div>
        </div>
        
        <StepList steps={set.steps} />
        
        {set.author && (
            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--color-primary-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="pw-user-icon" style={{ fontSize: '0.75rem' }} />
                </div>
                <span>Curated by <strong style={{ color: 'var(--color-text-strong)' }}>{set.author}</strong></span>
            </div>
        )}
    </div>
);

export const InstructionSteps: React.FC<InstructionStepsProps> = ({ mainGuide, additionalSets }) => {
    const hasAnyContent = mainGuide || (additionalSets && additionalSets.length > 0);

    if (!hasAnyContent) {
        return <EmptyState icon="list-outline" title="No Steps" description="No step-by-step guides available yet." />;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {mainGuide && <InstructionCard set={mainGuide} />}
            {additionalSets.map((set) => (
                <InstructionCard key={set.id} set={set} />
            ))}
        </div>
    );
};
