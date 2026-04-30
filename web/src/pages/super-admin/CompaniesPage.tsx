import React, { useEffect, useState } from 'react';
import { PageHeader, Button, Spinner, EmptyState, IonIcon } from '../../components/index';
import { companyService } from '../../services/companyService';

export const CompaniesPage: React.FC = () => {
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchCompanies = async () => {
        setLoading(true);
        try {
            const res = await companyService.getCompanies();
            setCompanies(res.data || res || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    const handleToggleStatus = async (id: string, currentStatus: string) => {
        setActionLoading(id);
        try {
            if (currentStatus === 'active') {
                await companyService.deactivate(id);
                setCompanies(companies.map(c => c.id === id ? { ...c, status: 'inactive' } : c));
            } else {
                await companyService.activate(id);
                setCompanies(companies.map(c => c.id === id ? { ...c, status: 'active' } : c));
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to update status');
        } finally {
            setActionLoading(null);
        }
    };

    const handleApprove = async (id: string) => {
        setActionLoading(id);
        try {
            await companyService.approve(id);
            setCompanies(companies.map(c => c.id === id ? { ...c, status: 'active' } : c));
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to approve company');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete "${name}"? This will also affect all related users and products.`)) return;
        setActionLoading(id);
        try {
            await companyService.deleteCompany(id);
            setCompanies(companies.filter(c => c.id !== id));
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete company');
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusDot = (status: string) => {
        const colors: Record<string, string> = {
            active: 'var(--color-success)',
            pending: 'var(--color-warning)',
            inactive: 'var(--color-error)',
            deactivated: 'var(--color-error)',
        };
        const color = colors[status] || 'var(--color-text-muted)';
        return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'capitalize' as const }}>{status}</span>
            </span>
        );
    };

    return (
        <div>
            <PageHeader
                title="Company Registry"
                subtitle={`${companies.length} companies on the platform`}
            />

            {/* Info Banner */}
            <div className="card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', borderLeft: '3px solid var(--color-primary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <IonIcon name="information-circle-outline" style={{ fontSize: '20px', color: 'var(--color-primary)', flexShrink: 0 }} />
                    <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                        Companies are created automatically when a user registers as a <strong style={{ color: 'var(--color-text-strong)' }}>Company Admin</strong>. You can approve, deactivate, or remove companies here.
                    </p>
                </div>
            </div>

            {loading ? (
                <div style={{ height: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size="lg" /></div>
            ) : companies.length === 0 ? (
                <EmptyState
                    icon="business-outline"
                    title="No Companies"
                    description="No companies have registered yet. They will appear here when company admins sign up."
                />
            ) : (
                <div className="card">
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Company</th>
                                    <th>Contact</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {companies.map(company => (
                                    <tr key={company.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{
                                                    width: 40, height: 40, borderRadius: 'var(--radius-lg)',
                                                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                                                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontWeight: 800, fontSize: '0.9rem', flexShrink: 0,
                                                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                                                }}>
                                                    {(company.name || 'C').charAt(0).toUpperCase()}
                                                </div>
                                                <span style={{ fontWeight: 600, color: 'var(--color-text-strong)' }}>{company.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--color-text-muted)' }}>{company.email || 'N/A'}</td>
                                        <td>{getStatusDot(company.status || 'active')}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                                {company.status === 'pending' && (
                                                    <button
                                                        className="btn btn-primary btn-sm"
                                                        onClick={() => handleApprove(company.id)}
                                                        disabled={actionLoading === company.id}
                                                    >
                                                        Approve
                                                    </button>
                                                )}
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => handleToggleStatus(company.id, company.status || 'active')}
                                                    disabled={actionLoading === company.id}
                                                >
                                                    {(company.status || 'active') === 'active' ? 'Deactivate' : 'Activate'}
                                                </button>
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => handleDelete(company.id, company.name)}
                                                    disabled={actionLoading === company.id}
                                                    style={{ color: 'var(--color-error)' }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
