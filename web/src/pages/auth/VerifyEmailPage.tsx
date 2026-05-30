import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button, IonIcon } from '../../components/ui';
import { API_URL } from '../../config';

export const VerifyEmailPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('Verifying your email address...');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid or missing verification token.');
            return;
        }

        const verify = async () => {
            try {
                const { data } = await axios.post(`${API_URL}/users/verify-email`, { token });
                setStatus('success');
                setMessage(data.message || 'Email verified successfully!');
            } catch (err: any) {
                setStatus('error');
                setMessage(err.response?.data?.message || 'Verification failed. The link may have expired.');
            }
        };

        verify();
    }, [token]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                <Link to="/" style={{ display: 'inline-block', marginBottom: '1.5rem' }}>
                    <img src="/pro-wise.svg" alt="PRO-WISE Logo" style={{ height: '80px', width: 'auto' }} />
                </Link>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-strong)', marginBottom: '0.5rem' }}>
                    Email Verification
                </h2>
            </div>

            <div style={{
                padding: '1.25rem',
                backgroundColor: status === 'success'
                    ? 'rgba(var(--color-success-rgb), 0.1)'
                    : status === 'error'
                        ? 'rgba(var(--color-error-rgb), 0.1)'
                        : 'rgba(var(--color-primary-rgb), 0.1)',
                border: `1px solid ${status === 'success'
                    ? 'var(--color-success-light)'
                    : status === 'error'
                        ? 'var(--color-error-light)'
                        : 'var(--color-primary-light)'}`,
                borderRadius: '12px',
                color: status === 'success'
                    ? 'var(--color-success)'
                    : status === 'error'
                        ? 'var(--color-error)'
                        : 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
            }}>
                <IonIcon
                    name={status === 'success'
                        ? 'checkmark-circle-outline'
                        : status === 'error'
                            ? 'alert-circle-outline'
                            : 'hourglass-outline'}
                    style={{ fontSize: '1.5rem', flexShrink: 0 }}
                />
                <p style={{ fontSize: '0.9375rem', fontWeight: 500 }}>{message}</p>
            </div>

            {status === 'success' && (
                <Button fullWidth onClick={() => navigate('/login')} style={{ height: '52px', fontSize: '1rem', fontWeight: 600, borderRadius: 'var(--radius-lg)' }}>
                    Continue to Login
                </Button>
            )}

            {status === 'error' && (
                <Button variant="outline" fullWidth onClick={() => navigate('/login')} style={{ height: '48px', borderRadius: 'var(--radius-lg)' }}>
                    Back to Login
                </Button>
            )}
        </div>
    );
};
