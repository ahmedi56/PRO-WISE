import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { loginUser, googleLogin, clearError } from '../../store/slices/authSlice';
import { RootState, AppDispatch } from '../../store';
import { Button, IonIcon } from '../../components/index';
import { InputField } from '../../components/ui/InputField';

export const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const location = useLocation();
    
    const { loading, error } = useSelector((state: RootState) => state.auth);
    
    const from = (location.state as any)?.from?.pathname || '/home';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        dispatch(clearError());
        
        const resultAction = await dispatch(loginUser({ email, password }));
        if (loginUser.fulfilled.match(resultAction)) {
            navigate(from, { replace: true });
        }
    };

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            // Usually we get an access_token here, but for idToken we might need a different flow or use GoogleLogin component
            // However, most modern setups prefer sending the access_token to backend to fetch user info there
            const resultAction = await dispatch(googleLogin(tokenResponse.access_token));
            if (googleLogin.fulfilled.match(resultAction)) {
                navigate(from, { replace: true });
            }
        },
        onError: () => {
            console.error('Google Login Failed');
        }
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-strong)', marginBottom: '0.5rem' }}>Welcome Back</h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>Sign in to access your dashboard</p>
            </div>

            {error && (
                <div style={{ 
                    padding: '0.875rem', 
                    backgroundColor: 'rgba(var(--color-error-rgb), 0.1)', 
                    border: '1px solid var(--color-error-light)', 
                    borderRadius: '12px', 
                    color: 'var(--color-error)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                }}>
                    <IonIcon name="alert-circle-outline" style={{ fontSize: '1.25rem' }} />
                    <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <InputField 
                    id="email"
                    label="Email or Username" 
                    type="text" 
                    icon="mail-outline"
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="Enter your email or username"
                    required 
                />
                
                <InputField 
                    id="password"
                    label="Password" 
                    type="password" 
                    icon="lock-closed-outline"
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="••••••••"
                    required 
                />
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-0.5rem' }}>
                    <Link to="/forgot-password" style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>
                        Forgot Password?
                    </Link>
                </div>
                
                <Button type="submit" fullWidth loading={loading} style={{ height: '48px', fontSize: '1rem', fontWeight: 600 }}>
                    Sign In
                </Button>
            </form>
            
            <div style={{ position: 'relative', margin: '0.5rem 0' }}>
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', backgroundColor: 'var(--color-border)' }} />
                <span style={{ 
                    position: 'relative', display: 'block', width: 'max-content', margin: '0 auto', 
                    padding: '0 1rem', backgroundColor: 'var(--color-surface)', 
                    color: 'var(--color-text-muted)', fontSize: '0.8125rem', fontWeight: 500
                }}>
                    OR
                </span>
            </div>
            
            <Button 
                variant="outline" 
                fullWidth 
                onClick={() => handleGoogleLogin()}
                loading={loading}
                style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}
            >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '20px', height: '20px' }} />
                <span style={{ fontWeight: 500 }}>Continue with Google</span>
            </Button>

            <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                Don't have an account? <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>Create Account</Link>
            </p>
        </div>
    );
};


