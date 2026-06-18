import React, { useEffect, useState } from 'react';
import { auditLogsApi, type AuditLog } from '../services/auditLogs';

interface AuditLogsProps {
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

function severityBadge(severity: string) {
  const map: Record<string, string> = {
    critical: 'badge-danger',
    warning: 'badge-warning',
    info: 'badge-info',
    low: 'badge-neutral',
  };
  return <span className={`badge ${map[severity] ?? 'badge-neutral'}`}>{severity}</span>;
}

function statusBadge(status: string) {
  return (
    <span className={`badge ${status === 'success' ? 'badge-success' : status === 'failure' ? 'badge-danger' : 'badge-neutral'}`}>
      {status}
    </span>
  );
}

export function AuditLogsSection({ onError, onSuccess }: AuditLogsProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionFilter, setActionFilter] = useState('');

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const result = await auditLogsApi.getAuditLogs(
        1,
        100,
        actionFilter ? { action: actionFilter } : undefined,
      );
      setLogs(result.data?.logs || []);
    } catch (err) {
      onError(`Failed to load audit logs: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      await auditLogsApi.exportAuditLogs(format);
      onSuccess(`Exported as ${format.toUpperCase()}`);
    } catch (err) {
      onError(`Failed to export: ${err}`);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [actionFilter]);

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2 style={{ margin: '0 0 1.25rem' }}>Audit Logs</h2>

      <div className="section-filters">
        <input
          type="text"
          placeholder="Filter by action…"
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          style={{ maxWidth: 300 }}
        />
        <button className="secondary" onClick={() => handleExport('json')}>Export JSON</button>
        <button className="secondary" onClick={() => handleExport('csv')}>Export CSV</button>
        <button className="secondary" onClick={loadAuditLogs} style={{ marginLeft: 'auto' }}>
          Refresh
        </button>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Action</th>
              <th>Entity</th>
              <th>Actor</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <React.Fragment key={log._id}>
                <tr>
                  <td style={{ fontWeight: 700 }}>{log.action}</td>
                  <td><small>{log.entityType || '—'}</small></td>
                  <td><small>{log.actor || '—'}</small></td>
                  <td>{severityBadge(log.severity || 'info')}</td>
                  <td>{statusBadge(log.status || 'info')}</td>
                  <td><small>{new Date(log.createdAt).toLocaleString()}</small></td>
                </tr>
                {log.failureReason && (
                  <tr>
                    <td colSpan={6}>
                      <small style={{ color: '#ff8b8b' }}>Error: {log.failureReason}</small>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        {!loading && !logs.length && (
          <div className="state-empty">No audit logs found. Actions performed by admins will appear here.</div>
        )}
        {loading && <div className="state-loading">Loading audit logs…</div>}
      </div>
    </div>
  );
}
