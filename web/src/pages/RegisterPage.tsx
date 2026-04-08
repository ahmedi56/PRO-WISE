import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearError, registerUser } from '@/store/slices/authSlice';
import { Alert, Button, Card, InputField, Spinner } from '@/components/ui';
import { RootState, AppDispatch } from '@/store';

const ROLE_OPTIONS = [
    { 
        value: 'client', 
        label: 'Consumer', 
        icon: '👤'
    },
    { 
        value: 'company_admin', 
        label: 'Business', 
        icon: '🏢'
    },
];

const getStrength = (value: string) => {
    let score = 0;
    if (value.length >= 6) score += 1;
    if (value.length >= 8) score += 1;
    if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
    if (/\d/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;
    return score;
};

const RegisterPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { loading, error, success } = useSelector((state: RootState) => state.auth);
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        password: '',
        roleName: 'client',
        companyId: '',
        newCompanyName: '',
        newCompanyDescription: ''
    });

    useEffect(() => {
        if (success) {
            navigate('/login');
        }
        return () => { dispatch(clearError()); };
    }, [success, navigate, dispatch]);

    const strengthScore = useMemo(() => getStrength(formData.password), [formData.password]);
    const strengthLabels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
    const strengthTones = [
        'var(--color-error)',
        'var(--color-error)',
        'var(--color-warning)',
        'var(--color-warning)',
        'var(--color-success)',
        'var(--color-primary)',
    ];

    const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = event.target;
        setFormData((previous) => ({ ...previous, [name]: value }));
    };

    const handleRoleChange = (roleValue: string) => {
        setFormData((previous) => ({
            ...previous,
            roleName: roleValue,
            companyId: roleValue === 'company_admin' ? 'new_request' : '',
            newCompanyName: '',
            newCompanyDescription: ''
        }));
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        dispatch(registerUser(formData));
    };

    return (
        <div className="auth-layout">
            {loading && <Spinner overlay={true} />}
            
            <section className="auth-form-panel">
                <Card className="max-w-md w-full glassmorphism">
                    <div className="auth-form-header">
                        <h2>Create Account</h2>
                        <p>Join the PRO-WISE intelligence network</p>
                    </div>

                    {error ? <Alert tone="error" className="mb-4">{error}</Alert> : null}

                    <form onSubmit={handleSubmit}>
                        {/* Role Selector */}
                        <div className="role-selector-container">
                            <div className="role-selector-grid">
                                {ROLE_OPTIONS.map((role) => {
                                    const isActive = formData.roleName === role.value;
                                    return (
                                        <button
                                            key={role.value}
                                            type="button"
                                            className={`role-btn ${isActive ? 'active' : ''}`}
                                            onClick={() => handleRoleChange(role.value)}
                                        >
                                            <span className="role-icon">{role.icon}</span>
                                            <div className="role-info">
                                                <span className="role-label">{role.label}</span>
                                                <span className="role-subtext">
                                                    {role.value === 'client' ? 'Direct Access' : 'Verification Needed'}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {formData.roleName === 'company_admin' && (
                            <div className="company-info-block animate-fade-in">
                                <InputField
                                    id="register-new-company"
                                    label="Company Name"
                                    name="newCompanyName"
                                    value={formData.newCompanyName}
                                    onChange={handleChange}
                                    placeholder="Legal Business Name"
                                    required
                                    className="input-field-dark"
                                />
                                <div className="input-group">
                                    <label className="label" htmlFor="register-new-company-desc">Business Description</label>
                                    <textarea
                                        id="register-new-company-desc"
                                        className="input"
                                        name="newCompanyDescription"
                                        rows={2}
                                        value={formData.newCompanyDescription}
                                        onChange={handleChange}
                                        placeholder="Brief description of operations..."
                                    />
                                </div>
                            </div>
                        )}

                        <div className="form-grid-2">
                            <InputField
                                id="register-name"
                                label="Full Name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Full Name"
                                autoComplete="name"
                                required
                                className="input-field-dark"
                            />
                            <InputField
                                id="register-username"
                                label="Username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="Username"
                                autoComplete="username"
                                className="input-field-dark"
                            />
                        </div>

                        <InputField
                            id="register-email"
                            label="Email Address"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="name@company.com"
                            autoComplete="email"
                            required
                            className="input-field-dark"
                        />

                        <InputField
                            id="register-password"
                            label="Security Password"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            autoComplete="new-password"
                            required
                            className="input-field-dark"
                        />

                        {formData.password && (
                            <div className="strength-meter-box">
                                <div className="strength-bar-bg">
                                    <div
                                        className="strength-fill"
                                        style={{
                                            width: `${Math.max(12, (strengthScore / 5) * 100)}%`,
                                            background: strengthTones[strengthScore],
                                        }}
                                    />
                                </div>
                                <div className="strength-text" style={{ color: strengthTones[strengthScore] }}>
                                    Entropy Analysis: {strengthLabels[strengthScore]}
                                </div>
                            </div>
                        )}

                        <div className="form-actions">
                            <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading}>
                                {loading ? 'Registering...' : 'Initialize Account'}
                            </Button>
                        </div>
                    </form>

                    <p className="auth-copy">
                        Already registered?{' '}
                        <Link className="link" to="/login">
                            Sign In
                        </Link>
                    </p>
                </Card>
            </section>

            <section className="auth-brand" aria-label="Brand panel">
                <div className="auth-brand-grid-overlay"></div>
                <div className="auth-brand-scanning-line"></div>
                
                <div className="auth-brand-content-new">
                    <div className="auth-brand-meta">
                        <div className="meta-tag">SYS-ID: REG-001</div>
                        <div className="meta-tag">OP: ENROLLMENT</div>
                        <div className="meta-tag">SEC-LEVEL: 1</div>
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
                            <div className="status-label">ENROLLMENT STATUS</div>
                            <div className="status-value">
                                <span className="status-led online"></span>
                                REGISTRATION_OPEN
                            </div>
                        </div>
                        <p className="auth-brand-legal">
                            © 2026 PRO-WISE GLOBAL. ALL COMMUNICATIONS ENCRYPTED.
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

export default RegisterPage;
