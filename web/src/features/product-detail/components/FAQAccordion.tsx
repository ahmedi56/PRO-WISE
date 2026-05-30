import React, { useState } from 'react';
import { IonIcon } from '../../../components/ui';

interface FAQ {
    id: string;
    question: string;
    answer: string;
    author?: string;
}

interface FAQAccordionProps {
    faqs: FAQ[];
}

const FAQItem: React.FC<{ faq: FAQ, defaultOpen?: boolean }> = ({ faq, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div 
            style={{ 
                background: 'var(--color-surface-raised)', 
                borderRadius: 'var(--radius-lg)', 
                border: '1px solid var(--color-border)', 
                overflow: 'hidden',
                transition: 'all 0.3s ease'
            }}
            className="pw-animate-in"
        >
            <button 
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '100%',
                    padding: '1.25rem 1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left'
                }}
            >
                <h5 style={{ 
                    margin: 0, 
                    fontWeight: 700, 
                    fontSize: '1.05rem', 
                    color: isOpen ? 'var(--color-primary)' : 'var(--color-text-strong)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    lineHeight: 1.4
                }}>
                    <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: isOpen ? 'var(--color-primary)' : 'var(--color-primary-faint)',
                        color: isOpen ? '#fff' : 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem',
                        transition: 'all 0.2s',
                        flexShrink: 0
                    }}>
                        <IonIcon name="help-outline" />
                    </div>
                    {faq.question}
                </h5>
                <IonIcon 
                    name={isOpen ? "chevron-up" : "chevron-down"} 
                    style={{ 
                        fontSize: '1.2rem', 
                        color: 'var(--color-text-muted)',
                        transition: 'transform 0.3s'
                    }} 
                />
            </button>
            
            {isOpen && (
                <div style={{ 
                    padding: '0 1.5rem 1.5rem 4.1rem',
                    animation: 'pw-fade-in 0.3s ease-out'
                }}>
                    <div style={{ height: '1px', background: 'var(--color-border)', marginBottom: '1.25rem', opacity: 0.3 }}></div>
                    <p style={{ 
                        margin: 0, 
                        color: 'var(--color-text)', 
                        lineHeight: 1.8,
                        fontSize: '0.95rem'
                    }}>
                        {faq.answer}
                    </p>
                    {faq.author && (
                        <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Verified by: {faq.author}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export const FAQAccordion: React.FC<FAQAccordionProps> = ({ faqs }) => {
    if (!faqs || faqs.length === 0) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {faqs.map((faq, idx) => (
                <FAQItem key={faq.id || idx} faq={faq} defaultOpen={idx === 0} />
            ))}
        </div>
    );
};
