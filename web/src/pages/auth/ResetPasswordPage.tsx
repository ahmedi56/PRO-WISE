import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Input, Button, IonIcon } from '../../components/ui';
import { API_URL } from '../../config';

export const ResetPasswordPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (!token) {
            setMessage({ type: 'error', text: 'Invalid or missing reset token.' });
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match.' });
            return;
        }

        if (password.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const response = await axios.post(`${API_URL}/auth/reset-password`, { token, password });
            setMessage({ type: 'success', text: response.data.message });
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            setMessage({ 
                type: 'error', 
                text: err.response?.data?.message || 'Failed to reset password. The link may have expired.' 
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
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-strong)', marginBottom: '0.5rem' }}>Set New Password</h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>Create a strong, secure password for your account</p>
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

            {(!message || message.type !== 'success') && token && (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <Input 
                        id="password"
                        label="New Password" 
                        type="password" 
                        icon="lock-closed-outline"
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        placeholder="••••••••"
                        required 
                    />

                    <Input 
                        id="confirmPassword"
                        label="Confirm New Password" 
                        type="password" 
                        icon="shield-checkmark-outline"
                        value={confirmPassword} 
                        onChange={e => setConfirmPassword(e.target.value)} 
                        placeholder="••••••••"
                        required 
                    />
                    
                    <Button type="submit" fullWidth loading={loading} style={{ height: '52px', fontSize: '1rem', fontWeight: 600, borderRadius: 'var(--radius-lg)' }}>
                        Update Password
                    </Button>
                </form>
            )}
            
            <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none', fontSize: '0.875rem' }}>
                    Back to Login
                </Link>
            </div>
        </div>
    );
};
