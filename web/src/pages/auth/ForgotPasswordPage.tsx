import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Input, Button, IonIcon } from '../../components/ui';
import { API_URL } from '../../config';

export const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
            setMessage({ type: 'success', text: response.data.message });
        } catch (err: any) {
            setMessage({ 
                type: 'error', 
                text: err.response?.data?.message || 'Something went wrong. Please try again.' 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                <Link to="/" style={{ display: 'inline-block', marginBottom: '1.5rem' }}>
                    <img src="/pro-wise.svg" alt="PRO-WISE Logo" style={{ height: '80px', width: 'auto' }} />
                </Link>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-strong)', marginBottom: '0.5rem' }}>Password Recovery</h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>Enter your email to receive a secure reset link</p>
            </div>

            {message && (
                <div style={{ 
                    padding: '0.875rem', 
                    backgroundColor: message.type === 'success' ? 'rgba(var(--color-success-rgb), 0.1)' : 'rgba(var(--color-error-rgb), 0.1)', 
                    border: `1px solid ${message.type === 'success' ? 'var(--color-success-light)' : 'var(--color-error-light)'}`, 
                    borderRadius: '12px', 
                    color: message.type === 'success' ? 'var(--color-success)' : 'var(--color-error)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                }}>
                    <IonIcon name={message.type === 'success' ? "checkmark-circle-outline" : "alert-circle-outline"} style={{ fontSize: '1.25rem' }} />
                    <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>{message.text}</p>
                </div>
            )}

            {!message || message.type === 'error' ? (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <Input 
                        id="email"
                        label="Account Email" 
                        type="email" 
                        icon="mail-outline"
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        placeholder="operator@prowise.network"
                        required 
                    />
                    
                    <Button type="submit" fullWidth loading={loading} style={{ height: '52px', fontSize: '1rem', fontWeight: 600, borderRadius: 'var(--radius-lg)' }}>
                        Send Reset Link
                    </Button>
                </form>
            ) : (
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                        Didn't receive an email? Check your spam folder or try again.
                    </p>
                    <Button variant="outline" fullWidth onClick={() => setMessage(null)} style={{ height: '48px', borderRadius: 'var(--radius-lg)' }}>
                        Try Another Email
                    </Button>
                </div>
            )}
            
            <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <IonIcon name="arrow-back-outline" />
                    Back to Login
                </Link>
            </div>
        </div>
    );
};
