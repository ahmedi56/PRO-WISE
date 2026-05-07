import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { registerUser, googleLogin, clearError } from '../../store/slices/authSlice';
import { RootState, AppDispatch } from '../../store';
import { Button, IonIcon } from '../../components/index';
import { InputField } from '../../components/ui/InputField';
import { categoryService } from '../../services/categoryService';

export const RegisterPage: React.FC = () => {
    const [formData, setFormData] = useState({
        username: '',
        name: '',
        email: '',
        password: '',
        roleName: 'client',
        newCompanyName: '',
        newCompanyDescription: '',
        newCompanyCategory: '',
        companyId: ''
    });

    const [categories, setCategories] = useState<any[]>([]);
    
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { loading, error } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await categoryService.getCategories();
                setCategories(res.data || res || []);
            } catch (err) {
                console.error('Failed to fetch categories');
            }
        };
        fetchCategories();
    }, []);

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        dispatch(clearError());
        
        const submissionData = { ...formData };
        if (formData.roleName === 'company_admin') {
            submissionData.companyId = 'new_request';
        }
        
        const resultAction = await dispatch(registerUser(submissionData));
        if (registerUser.fulfilled.match(resultAction)) {
            if (formData.roleName === 'company_admin') {
                navigate('/pending-approval');
            } else {
                navigate('/home');
            }
        }
    };

    const handleGoogleRegister = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            const resultAction = await dispatch(googleLogin(tokenResponse.access_token));
            if (googleLogin.fulfilled.match(resultAction)) {
                navigate('/home', { replace: true });
            }
        },
        onError: () => console.error('Google Registration Failed')
    });

    const isCompanyAdmin = formData.roleName === 'company_admin';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '0.25rem' }}>
                <Link to="/" style={{ display: 'inline-block', marginBottom: '1.25rem' }}>
                    <img src="/pro-wise.svg" alt="PRO-WISE Logo" style={{ height: '70px', width: 'auto' }} />
                </Link>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-strong)', marginBottom: '0.5rem' }}>Create Account</h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>Join the PRO-WISE community</p>
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

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <InputField 
                        id="name"
                        name="name"
                        label="Full Name" 
                        icon="person-outline"
                        value={formData.name} 
                        onChange={handleChange} 
                        placeholder="John Doe"
                        required 
                    />
                    <InputField 
                        id="username"
                        name="username"
                        label="Username" 
                        icon="at-outline"
                        value={formData.username} 
                        onChange={handleChange} 
                        placeholder="johndoe"
                        required 
                    />
                </div>
                
                <InputField 
                    id="email"
                    name="email"
                    label="Email Address" 
                    type="email" 
                    icon="mail-outline"
                    value={formData.email} 
                    onChange={handleChange} 
                    placeholder="you@example.com"
                    required 
                />
                
                <InputField 
                    id="password"
                    name="password"
                    label="Password" 
                    type="password" 
                    icon="lock-closed-outline"
                    value={formData.password} 
                    onChange={handleChange} 
                    placeholder="••••••••"
                    required 
                    minLength={6}
                />
                
                <div className="input-group">
                    <label className="label pw-mb-3" style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem' }}>Account Type</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div 
                            onClick={() => setFormData(prev => ({ ...prev, roleName: 'client' }))}
                            style={{
                                padding: '1rem',
                                borderRadius: 'var(--radius-lg)',
                                border: `2px solid ${formData.roleName === 'client' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                background: formData.roleName === 'client' ? 'rgba(var(--color-primary-rgb), 0.1)' : 'transparent',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.5rem',
                                textAlign: 'center'
                            }}
                        >
                            <IonIcon name="person-outline" style={{ fontSize: '1.5rem', color: formData.roleName === 'client' ? 'var(--color-primary)' : 'var(--color-text-muted)' }} />
                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: formData.roleName === 'client' ? 'var(--color-text-strong)' : 'var(--color-text-muted)' }}>Customer</span>
                        </div>
                        <div 
                            onClick={() => setFormData(prev => ({ ...prev, roleName: 'company_admin' }))}
                            style={{
                                padding: '1rem',
                                borderRadius: 'var(--radius-lg)',
                                border: `2px solid ${formData.roleName === 'company_admin' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                background: formData.roleName === 'company_admin' ? 'rgba(var(--color-primary-rgb), 0.1)' : 'transparent',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.5rem',
                                textAlign: 'center'
                            }}
                        >
                            <IonIcon name="business-outline" style={{ fontSize: '1.5rem', color: formData.roleName === 'company_admin' ? 'var(--color-primary)' : 'var(--color-text-muted)' }} />
                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: formData.roleName === 'company_admin' ? 'var(--color-text-strong)' : 'var(--color-text-muted)' }}>Company Admin</span>
                        </div>
                    </div>
                </div>

                {isCompanyAdmin && (
                    <div style={{ 
                        padding: '1.25rem', 
                        backgroundColor: 'var(--color-bg)', 
                        borderRadius: '16px', 
                        border: '1px dashed var(--color-primary-light)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        animation: 'fadeIn 0.3s ease-out'
                    }}>
                        <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-primary)', margin: 0 }}>Company Information</h4>
                        
                        <InputField 
                            id="newCompanyName"
                            name="newCompanyName"
                            label="Company Name" 
                            icon="business-outline"
                            value={formData.newCompanyName} 
                            onChange={handleChange} 
                            placeholder="My Repair Shop"
                            required 
                        />

                        <div className="input-group">
                            <label className="label" htmlFor="newCompanyCategory">Primary Category</label>
                            <div style={{ position: 'relative' }}>
                                <IonIcon 
                                    name="grid-outline" 
                                    style={{ 
                                        position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', 
                                        color: 'var(--color-text-muted)', fontSize: '1.1rem', zIndex: 1 
                                    }} 
                                />
                                <select 
                                    id="newCompanyCategory"
                                    name="newCompanyCategory" 
                                    value={formData.newCompanyCategory} 
                                    onChange={handleChange}
                                    className="input"
                                    style={{ paddingLeft: '38px', height: '48px', appearance: 'none' }}
                                    required
                                >
                                    <option value="">Select a category</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <InputField 
                            id="newCompanyDescription"
                            name="newCompanyDescription"
                            label="Description" 
                            textArea
                            value={formData.newCompanyDescription} 
                            onChange={handleChange} 
                            placeholder="Tell us about your services..."
                            required 
                        />
                    </div>
                )}
                
                <Button type="submit" fullWidth loading={loading} style={{ height: '52px', fontSize: '1rem', fontWeight: 600, marginTop: '0.5rem', borderRadius: 'var(--radius-lg)' }}>
                    {isCompanyAdmin ? 'Request Administrator Access' : 'Create Account'}
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
                onClick={() => handleGoogleRegister()}
                loading={loading}
                style={{ height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', borderRadius: 'var(--radius-lg)' }}
            >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '20px', height: '20px' }} />
                <span style={{ fontWeight: 500 }}>Sign up with Google</span>
            </Button>

            <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                Already have an account? <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
            </p>
        </div>
    );
};


