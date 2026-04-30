import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { PageHeader, Spinner, EmptyState, IonIcon, InputField, SelectField } from '../../components/index';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import auditLogService, { AuditLog, AuditLogFilters } from '../../services/auditLogService';

export const AuditLogPage: React.FC = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Filters
  const [filters, setFilters] = useState<AuditLogFilters>({
    page: 1,
    limit: 50,
    q: '',
    action: '',
    targetType: '',
    severity: '',
    dateFrom: '',
    dateTo: '',
    user: ''
  });

  const fetchLogs = useCallback(async (isInitial = false) => {
    if (!token) return;
    if (isInitial) setLoading(true);
    else setRefreshing(true);
    
    try {
      const response = await auditLogService.getLogs(filters);
      
      // Normalize response shape
      let logData: AuditLog[] = [];
      let pagData = { total: 0, page: 1, limit: 50, totalPages: 0 };

      if (Array.isArray(response)) {
        logData = response;
      } else if (response && response.data) {
        logData = response.data;
        pagData = response.pagination || pagData;
      }

      setLogs(logData);
      setPagination(pagData);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch audit logs', err);
      setError(err.response?.data?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters, token]);

  useEffect(() => {
    fetchLogs(true);
  }, [filters.page, filters.limit]); // Only fetch on page change automatically

  const handleApplyFilters = () => {
    setFilters(prev => ({ ...prev, page: 1 }));
    fetchLogs(true);
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: 50,
      q: '',
      action: '',
      targetType: '',
      severity: '',
      dateFrom: '',
      dateTo: '',
      user: ''
    });
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const getActionBadge = (action: string) => {
    const lower = action.toLowerCase();
    let className = 'badge badge-neutral';
    if (lower.includes('created') || lower.includes('activated') || lower.includes('approved') || lower.includes('published')) className = 'badge badge-success';
    else if (lower.includes('deleted') || lower.includes('deactivated') || lower.includes('rejected') || lower.includes('archived')) className = 'badge badge-error';
    else if (lower.includes('updated') || lower.includes('modified') || lower.includes('submitted')) className = 'badge badge-warning';
    else if (lower.includes('login') || lower.includes('auth')) className = 'badge badge-primary';
    return <span className={className} style={{ fontSize: '10px' }}>{action}</span>;
  };

  const getSeverityBadge = (severity: string) => {
    const s = (severity || 'info').toLowerCase();
    switch (s) {
      case 'critical': return <span className="badge badge-error">CRITICAL</span>;
      case 'warning': return <span className="badge badge-warning">WARNING</span>;
      default: return <span className="badge badge-info">INFO</span>;
    }
  };

  const formatTimestamp = (ts: number | string) => {
    if (!ts) return '—';
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return String(ts);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }).format(d);
    } catch {
      return String(ts);
    }
  };

  const getUserDisplayName = (log: AuditLog): string => {
    if (log.user) return log.user.name || log.user.email || 'User';
    if (log.actorRole === 'system') return 'System';
    return 'Unknown';
  };

  return (
    <div className="audit-log-page pw-flex-col pw-gap-6">
      <PageHeader 
        title="Audit Logs" 
        subtitle={`${pagination.total || 0} security events tracked`} 
        actions={
          <div className="pw-flex pw-gap-2">
            {refreshing && <div className="pw-text-xs pw-text-primary pw-animate-pulse pw-flex pw-items-center">Updating...</div>}
            <button className="pw-btn pw-btn-outline pw-p-2" onClick={() => fetchLogs(false)} disabled={loading || refreshing}>
              <IonIcon name="refresh-outline" className={refreshing ? 'pw-animate-spin' : ''} />
            </button>
          </div>
        }
      />

      {/* Modern Search & Filter Toolbar */}
      <div className="pw-card pw-p-6">
        <div className="pw-grid pw-grid-cols-1 md:pw-grid-cols-4 pw-gap-4">
          <div className="md:pw-col-span-2">
            <InputField 
              id="filter-q"
              label="Global Search"
              placeholder="Search action, label, IP, or agent..."
              value={filters.q}
              onChange={(e) => setFilters(prev => ({ ...prev, q: e.target.value }))}
            />
          </div>
          <SelectField 
            id="filter-target-type"
            label="Target Type"
            value={filters.targetType}
            onChange={(e) => setFilters(prev => ({ ...prev, targetType: e.target.value }))}
            options={[
              { label: 'All Types', value: '' },
              { label: 'User', value: 'User' },
              { label: 'Company', value: 'Company' },
              { label: 'Product', value: 'Product' },
              { label: 'Category', value: 'Category' },
              { label: 'Guide', value: 'Guide' },
              { label: 'Content', value: 'Content' },
              { label: 'Support', value: 'Support' }
            ]}
          />
          <SelectField 
            id="filter-severity"
            label="Severity"
            value={filters.severity}
            onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
            options={[
              { label: 'All Severities', value: '' },
              { label: 'Info', value: 'info' },
              { label: 'Warning', value: 'warning' },
              { label: 'Critical', value: 'critical' }
            ]}
          />
          <InputField 
            id="filter-date-from"
            label="From Date"
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
          />
          <InputField 
            id="filter-date-to"
            label="To Date"
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
          />
          <div className="md:pw-col-span-2 pw-flex pw-items-end pw-gap-2">
            <button className="pw-btn pw-btn-primary pw-flex-1" onClick={handleApplyFilters} disabled={loading || refreshing}>
              <IonIcon name="search-outline" /> Apply Filters
            </button>
            <button className="pw-btn pw-btn-outline" onClick={handleClearFilters} title="Clear all filters">
              Clear
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="pw-p-4 pw-bg-error-light pw-text-error pw-rounded-lg pw-flex pw-justify-between pw-items-center">
          <span>{error}</span>
          <button className="pw-btn pw-btn-outline pw-btn-sm" onClick={() => fetchLogs(true)}>Retry</button>
        </div>
      )}

      {loading ? (
        <div className="pw-flex pw-justify-center pw-py-20">
          <Spinner size="lg" />
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon="shield-outline"
          title="No Logs Found"
          description={filters.q || filters.targetType ? "No events match your current search criteria." : "No audit events have been recorded yet."}
        />
      ) : (
        <div className="pw-card pw-overflow-hidden">
          <div className="pw-overflow-x-auto">
            <table className="table pw-w-full">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th className="pw-text-left">Timestamp</th>
                  <th className="pw-text-left">Actor</th>
                  <th className="pw-text-left">Event</th>
                  <th className="pw-text-left">Target</th>
                  <th className="pw-text-left">Context</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr 
                      className={`hover:pw-bg-alt pw-cursor-pointer transition-colors ${expandedId === log.id ? 'pw-bg-alt' : ''}`}
                      onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                    >
                      <td>
                        <IonIcon 
                          name={expandedId === log.id ? "chevron-down-outline" : "chevron-forward-outline"} 
                          className="pw-text-muted"
                        />
                      </td>
                      <td className="pw-text-xs pw-font-mono pw-text-muted">
                        {formatTimestamp(log.createdAt)}
                      </td>
                      <td>
                        <div className="pw-flex pw-flex-col">
                          <span className="pw-font-bold pw-text-sm pw-text-strong">{getUserDisplayName(log)}</span>
                          <div className="pw-flex pw-gap-1 pw-items-center">
                            <span className="pw-text-[10px] pw-uppercase pw-tracking-wider pw-text-muted">{log.actorRole || 'unknown'}</span>
                            {log.company && <span className="pw-text-[10px] pw-text-primary">@{log.company.name}</span>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="pw-flex pw-flex-col pw-gap-1">
                          {getActionBadge(log.action)}
                          {getSeverityBadge(log.severity)}
                        </div>
                      </td>
                      <td>
                        <div className="pw-flex pw-flex-col max-w-[200px]">
                          <span className="pw-font-semibold pw-text-xs pw-text-strong pw-truncate" title={log.targetLabel}>
                            {log.targetLabel || log.targetType || 'Unknown'}
                          </span>
                          <span className="pw-text-[10px] pw-text-muted pw-font-mono pw-truncate">
                            {log.targetType}#{log.target || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="pw-flex pw-flex-col max-w-[150px]">
                          <span className="pw-text-xs pw-font-mono">{log.ipAddress || '0.0.0.0'}</span>
                          <span className="pw-text-[10px] pw-text-muted pw-truncate" title={log.userAgent}>
                            {log.userAgent || 'Unknown agent'}
                          </span>
                        </div>
                      </td>
                    </tr>
                    {expandedId === log.id && (
                      <tr>
                        <td colSpan={6} className="pw-bg-alt pw-p-0">
                          <div className="pw-p-6 pw-border-t pw-border-border">
                            <div className="pw-text-xs pw-font-bold pw-mb-2 pw-uppercase pw-tracking-widest pw-text-muted">Event Details (JSON)</div>
                            <pre className="pw-p-4 pw-bg-surface pw-rounded-lg pw-border pw-border-border pw-text-[11px] pw-font-mono pw-overflow-auto pw-max-h-[300px]">
                              {JSON.stringify(log.details || {}, null, 2)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pw-flex pw-items-center pw-justify-between pw-p-4 pw-bg-alt/30 pw-border-t pw-border-border">
            <div className="pw-text-sm pw-text-muted">
              Page <span className="pw-text-strong pw-font-bold">{pagination.page}</span> of <span className="pw-text-strong pw-font-bold">{pagination.totalPages || 1}</span>
              <span className="pw-ml-2">({pagination.total} total events)</span>
            </div>
            <div className="pw-flex pw-gap-2">
              <button 
                className="pw-btn pw-btn-outline pw-btn-sm" 
                disabled={pagination.page <= 1 || loading || refreshing}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                Previous
              </button>
              <button 
                className="pw-btn pw-btn-outline pw-btn-sm" 
                disabled={pagination.page >= (pagination.totalPages || 1) || loading || refreshing}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
