import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { API_URL } from '../config';
import { Badge, Card, PageHeader, Skeleton, Alert } from '../components/ui';

const AuditLogPage = () => {
    const { token } = useSelector((state) => state.auth);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const { data } = await axios.get(`${API_URL}/audit-logs`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setLogs(data);
            } catch (err) {
                setError('Failed to load audit logs.');
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, [token]);

    return (
        <div className="page">
            <PageHeader
                title="System Audit Logs"
                subtitle="Track all sensitive actions across the platform."
            />

            {error && <Alert tone="error" className="mb-6">{error}</Alert>}

            <Card raised>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr className="table-head-row">
                                <th>Timestamp</th>
                                <th>User</th>
                                <th>Action</th>
                                <th>Target</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 10 }).map((_, i) => (
                                    <tr key={i}>
                                        <td><Skeleton width={150} /></td>
                                        <td><Skeleton width={120} /></td>
                                        <td><Skeleton width={100} /></td>
                                        <td><Skeleton width={100} /></td>
                                        <td><Skeleton width={200} /></td>
                                    </tr>
                                ))
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center p-8">No logs found.</td>
                                </tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log.id}>
                                        <td style={{ fontSize: '0.85rem' }}>
                                            {new Date(log.createdAt).toLocaleString()}
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{log.user?.name || 'System'}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                {log.user?.email || 'N/A'}
                                            </div>
                                        </td>
                                        <td>
                                            <Badge tone="info">{log.action}</Badge>
                                        </td>
                                        <td>{log.target || 'N/A'}</td>
                                        <td style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {log.details ? JSON.stringify(log.details) : '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default AuditLogPage;
