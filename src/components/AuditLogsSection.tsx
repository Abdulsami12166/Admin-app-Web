import React, { useEffect, useState } from 'react';
import { auditLogsApi, type AuditLog } from '../services/auditLogs';

interface AuditLogsProps {
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
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
    <div>
      <h2>Audit Logs</h2>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <input
          type="text"
          placeholder="Filter by action"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', flex: 1 }}
        />
        <button
          onClick={() => handleExport('json')}
          style={{
            padding: '8px 16px',
            background: '#228be6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}>
          Export JSON
        </button>
        <button
          onClick={() => handleExport('csv')}
          style={{
            padding: '8px 16px',
            background: '#228be6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}>
          Export CSV
        </button>
      </div>

      <div
        style={{
          background: '#f5f5f5',
          padding: '15px',
          borderRadius: '5px',
          maxHeight: '600px',
          overflowY: 'auto',
        }}>
        {logs.length > 0 ? (
          logs.map((log) => (
            <div
              key={log._id}
              style={{
                marginBottom: '15px',
                padding: '10px',
                background: 'white',
                borderRadius: '3px',
                borderLeft: `4px solid ${
                  log.severity === 'critical'
                    ? '#ff6b6b'
                    : log.severity === 'warning'
                      ? '#fcc419'
                      : '#51cf66'
                }`,
              }}>
              <strong>{log.action}</strong> on {log.entityType}
              <br />
              <small>
                By: {log.actor} | Status: {log.status}
              </small>
              <br />
              <small>{new Date(log.createdAt).toLocaleString()}</small>
              {log.failureReason && (
                <p style={{ color: '#ff6b6b', margin: '5px 0 0 0' }}>Error: {log.failureReason}</p>
              )}
            </div>
          ))
        ) : (
          <p>No audit logs found</p>
        )}
      </div>

      {loading && <p>Loading...</p>}
    </div>
  );
}

