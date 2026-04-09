import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearError, loginUser, resetSuccess } from '@/store/slices/authSlice';
import { Alert, Button, Card, InputField, Spinner } from '@/components/ui';
import { API_URL } from '@/config';
import { RootState, AppDispatch } from '@/store';

const LoginPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { loading, error, logoutMessage, user, registrationMessage } = useSelector((state: RootState) => state.auth);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isOnline, setIsOnline] = useState<boolean | null>(null);

    useEffect(() => {
        if (user) {
            if (user.status === 'pending') {
                navigate('/pending-approval');
                return;
            }
            if (user.status === 'deactivated') {
                dispatch(clearError());
                return;
            }
            const role = user?.role || (user as any)?.Role;
            const roleName = String(typeof role === 'object' ? role?.name : role || '').toLowerCase();
            navigate(roleName === 'administrator' || roleName === 'company_admin' || roleName === 'super_admin' ? '/admin' : '/products');
        }

        return () => {
            dispatch(clearError());
            dispatch(resetSuccess());
        };
    }, [user, navigate, dispatch]);

    useEffect(() => {
        const checkConnection = async () => {
            try {
                const res = await fetch(`${API_URL}/health`);
                setIsOnline(res.ok);
            } catch (err) {
                setIsOnline(false);
            }
        };
        checkConnection();
        const interval = setInterval(checkConnection, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        dispatch(loginUser({ email: email.trim(), password }));
    };

    return (
        <div className="auth-layout">
            {loading && <Spinner overlay={true} />}
            
            <section className="auth-form-panel">
                <Card className="max-w-md w-full glassmorphism">
                    <div className="auth-form-header">
                        <h2>Sign In</h2>
                        <p>Access your PRO-WISE workspace</p>
                    </div>

                    {error ? <Alert tone="error">{error}</Alert> : null}
                    {registrationMessage ? <Alert tone="success" className="mb-4">{registrationMessage}</Alert> : null}
                    {logoutMessage ? <Alert tone="success">{logoutMessage}</Alert> : null}

                    <form onSubmit={handleSubmit}>
                        <InputField
                            id="login-email"
                            label="Email Address"
                            type="email"
                            autoComplete="email"
                            placeholder="name@company.com"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            className="input-field-dark"
                            required
                        />
                        <InputField
                            id="login-password"
                            label="Security Token"
                            type="password"
                            autoComplete="current-password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            className="input-field-dark"
                            required
                        />
                        <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading}>
                            {loading ? 'Authenticating...' : 'Authorize Access'}
                        </Button>
                    </form>

                    <p className="auth-copy">
                        Need system access?{' '}
                        <Link className="link" to="/register">
                            Create Account
                        </Link>
                    </p>
                </Card>
            </section>

            <section className="auth-brand" aria-label="Brand panel">
                <div className="auth-brand-grid-overlay"></div>
                <div className="auth-brand-scanning-line"></div>
                
                <div className="auth-brand-content-new">
                    <div className="auth-brand-meta">
                        <div className="meta-tag">SYS-ID: 882-PW</div>
                        <div className="meta-tag">REGION: GLOBAL</div>
                        <div className="meta-tag">SEC-LEVEL: 4</div>
                    </div>

                    <div className="auth-logo-section">
                        <div className="brand-shield">
                            <div className="shield-inner"></div>
                        </div>
                        <div className="brand-titles">
                            <h1>PRO-WISE</h1>
                            <div className="brand-baseline">
                                <span className="p-dot"></span>
                                PRECISION PRODUCT INTELLIGENCE
                            </div>
                        </div>
                    </div>

                    <div className="auth-brand-footer">
                        <div className="system-status-panel">
                            <div className="status-label">INFRASTRUCTURE STATUS</div>
                            <div className="status-value">
                                <span className={`status-led ${isOnline === true ? 'online' : (isOnline === false ? 'offline' : 'connecting')}`}></span>
                                {isOnline === true ? 'OPERATIONAL' : (isOnline === false ? 'CONNECTION_ERROR' : 'INITIALIZING...')}
                            </div>
                        </div>
                        <p className="auth-brand-legal">
                            © 2026 PRO-WISE GLOBAL. ALL SYSTEMS MONITORING ACTIVE.
                        </p>
                    </div>
                </div>

                <div className="auth-brand-tech-deco">
                    <div className="deco-line l1"></div>
                    <div className="deco-line l2"></div>
                    <div className="deco-line l3"></div>
                </div>
            </section>
        </div>
    );
};

export default LoginPage;
