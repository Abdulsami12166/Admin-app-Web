import React, { useEffect, useState } from 'react';
import { auditLogsApi, type AuditLog } from '../services/auditLogs';
import { subscribeAdminSocketEvent } from '../services/socket';
import { socketEvents } from '../services/events';

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

function renderActor(actor: any): string {
  if (!actor) return 'System';
  if (typeof actor === 'object') {
    return `${actor.name || 'Admin'}${actor.email ? ` (${actor.email})` : ''}`;
  }
  return String(actor);
}

export function AuditLogsSection({ onError, onSuccess }: AuditLogsProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionFilter, setActionFilter] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const result = await auditLogsApi.getAuditLogs(
        1,
        100,
        actionFilter ? { action: actionFilter } : undefined,
      );
      setLogs(Array.isArray(result.data) ? result.data : (result.data?.logs || []));
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

  // Real-time socket subscription — auto-refresh when admin actions are logged
  useEffect(() => {
    const unsub = subscribeAdminSocketEvent(socketEvents.DOMAIN.AUDIT_LOG_CREATED, () => {
      loadAuditLogs();
    });
    return unsub;
  }, []);

  const toggleExpand = (logId: string) => {
    setExpandedLogId(prev => prev === logId ? null : logId);
  };

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
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <React.Fragment key={log._id}>
                <tr
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggleExpand(log._id)}
                >
                  <td style={{ fontWeight: 700 }}>{log.action}</td>
                  <td><small>{log.entityType || '—'}</small></td>
                  <td><small>{renderActor(log.actor)}</small></td>
                  <td>{severityBadge(log.severity || 'info')}</td>
                  <td>{statusBadge(log.status || 'info')}</td>
                  <td><small>{new Date(log.createdAt).toLocaleString()}</small></td>
                  <td>
                    <button
                      className="secondary"
                      style={{ padding: '0.28rem 0.65rem', fontSize: '0.75rem', margin: 0, borderRadius: '8px' }}
                      onClick={e => { e.stopPropagation(); toggleExpand(log._id); }}
                    >
                      {expandedLogId === log._id ? 'Hide' : 'View'}
                    </button>
                  </td>
                </tr>

                {/* Failure reason sub-row */}
                {log.failureReason && (
                  <tr>
                    <td colSpan={7}>
                      <small style={{ color: '#ff8b8b' }}>Error: {log.failureReason}</small>
                    </td>
                  </tr>
                )}

                {/* Expanded detail row */}
                {expandedLogId === log._id && (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        padding: '1.25rem',
                        background: 'rgba(99, 210, 255, 0.02)',
                        borderBottom: '1px solid #28425f',
                      }}
                    >
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1.2fr',
                          gap: '2rem',
                          fontSize: '0.85rem',
                        }}
                      >
                        {/* Left: request metadata */}
                        <div style={{ display: 'grid', gap: '0.5rem', alignContent: 'start' }}>
                          <h4
                            style={{
                              margin: '0 0 0.5rem',
                              color: '#63d2ff',
                              textTransform: 'uppercase',
                              fontSize: '0.8rem',
                              letterSpacing: '0.05em',
                            }}
                          >
                            Request Metadata
                          </h4>
                          <p style={{ margin: 0 }}>
                            <strong>IP Address:</strong> {log.ipAddress || '—'}
                          </p>
                          <p style={{ margin: 0, wordBreak: 'break-all' }}>
                            <strong>User Agent:</strong> {log.userAgent || '—'}
                          </p>
                          <p style={{ margin: 0 }}>
                            <strong>Resource Path:</strong>{' '}
                            <code
                              style={{
                                color: '#fcc419',
                                background: 'rgba(0,0,0,0.3)',
                                padding: '0.1rem 0.3rem',
                                borderRadius: '4px',
                              }}
                            >
                              {(log as any).resourcePath || '—'}
                            </code>
                          </p>
                          <p style={{ margin: 0 }}>
                            <strong>Entity ID:</strong> {log.entityId || '—'}
                          </p>
                        </div>

                        {/* Right: changes JSON */}
                        <div>
                          <h4
                            style={{
                              margin: '0 0 0.5rem',
                              color: '#63d2ff',
                              textTransform: 'uppercase',
                              fontSize: '0.8rem',
                              letterSpacing: '0.05em',
                            }}
                          >
                            Changes Logged
                          </h4>
                          {log.changes ? (
                            <pre
                              style={{
                                margin: 0,
                                padding: '0.75rem',
                                background: '#08111f',
                                borderRadius: '10px',
                                border: '1px solid #28425f',
                                overflow: 'auto',
                                maxHeight: '200px',
                                color: '#eef4fb',
                                fontSize: '0.75rem',
                                fontFamily: 'monospace',
                              }}
                            >
                              {JSON.stringify(log.changes, null, 2)}
                            </pre>
                          ) : (
                            <p style={{ color: '#9fb6cb', margin: 0, fontSize: '0.85rem' }}>
                              No direct field modifications recorded.
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {!loading && !logs.length && (
          <div className="state-empty">
            No audit logs found. Actions performed by admins will appear here.
          </div>
        )}
        {loading && <div className="state-loading">Loading audit logs…</div>}
      </div>
    </div>
  );
}
