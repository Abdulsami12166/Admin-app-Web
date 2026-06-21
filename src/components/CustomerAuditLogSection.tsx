import React, { useEffect, useState } from 'react';
import { customerApi } from '../services/customers';

interface CustomerAuditLogProps {
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

const DS = {
  card: {
    border: '1px solid #28425f',
    borderRadius: 16,
    background: 'rgba(16,32,51,0.92)',
    padding: 16,
  } as React.CSSProperties,
  th: {
    padding: '12px 14px',
    textAlign: 'left' as const,
    borderBottom: '2px solid #28425f',
    fontSize: 12,
    fontWeight: 700,
    color: '#9fb6cb',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    background: 'rgba(10,23,40,0.8)',
  } as React.CSSProperties,
  td: {
    padding: '12px 14px',
    borderBottom: '1px solid rgba(40,66,95,0.5)',
    fontSize: 13,
    color: '#eef4fb',
    verticalAlign: 'top' as const,
  } as React.CSSProperties,
  muted: { color: '#9fb6cb', fontSize: 12 } as React.CSSProperties,
  input: {
    padding: '9px 14px',
    border: '1px solid #28425f',
    borderRadius: 12,
    background: '#08111f',
    color: '#eef4fb',
    fontSize: 13,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
  } as React.CSSProperties,
};

const formatDate = (value?: string) => (value ? new Date(value).toLocaleString() : 'Not recorded');

export function CustomerAuditLogSection({ onError, onSuccess }: CustomerAuditLogProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [search, setSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const loadLogs = async () => {
    setLoading(true);
    try {
      const response = await customerApi.getGlobalAuditLogs(
        page,
        limit,
        search,
        selectedModule,
        selectedAction,
        selectedPlatform
      );
      if (response && response.data) {
        setLogs(response.data.logs || []);
        setPagination(response.data.pagination || { page, pages: 1, total: 0 });
      }
    } catch (err) {
      onError(`Failed to load audit logs: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadLogs, 250);
    return () => clearTimeout(timer);
  }, [page, search, selectedModule, selectedAction, selectedPlatform]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedModule('');
    setSelectedAction('');
    setSelectedPlatform('');
    setPage(1);
  };

  const getPlatformBadgeColor = (plat: string) => {
    const p = String(plat).toLowerCase();
    if (p.includes('android')) return { bg: 'rgba(164,198,57,0.15)', text: '#a4c639' };
    if (p.includes('ios')) return { bg: 'rgba(255,255,255,0.15)', text: '#ffffff' };
    if (p.includes('web')) return { bg: 'rgba(99,210,255,0.15)', text: '#63d2ff' };
    return { bg: 'rgba(159,182,203,0.15)', text: '#9fb6cb' };
  };

  return (
    <div style={{ padding: 20, display: 'grid', gap: 16 }}>
      <div>
        <p style={{ margin: '0 0 4px', color: '#63d2ff', fontWeight: 900, textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.12em' }}>Security & Audit</p>
        <h2 style={{ margin: 0, color: '#eef4fb' }}>Customer Audit Logs</h2>
      </div>

      {/* Filters Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px 180px 140px auto', gap: 10, alignItems: 'center' }}>
        <input
          type="search"
          placeholder="Search by customer name, email, or details..."
          value={search}
          onChange={(e) => { setPage(1); setSearch(e.target.value); }}
          style={DS.input}
        />
        
        <select
          value={selectedModule}
          onChange={(e) => { setPage(1); setSelectedModule(e.target.value); }}
          style={DS.input}
        >
          <option value="">All Modules</option>
          <option value="authentication">Authentication</option>
          <option value="wishlist">Wishlist</option>
          <option value="cart">Cart</option>
          <option value="orders">Orders</option>
          <option value="products">Products</option>
          <option value="support">Support</option>
          <option value="notifications">Notifications</option>
        </select>

        <select
          value={selectedPlatform}
          onChange={(e) => { setPage(1); setSelectedPlatform(e.target.value); }}
          style={DS.input}
        >
          <option value="">All Platforms</option>
          <option value="Android">Android</option>
          <option value="iOS">iOS</option>
          <option value="Web">Web</option>
          <option value="unknown">Unknown</option>
        </select>

        <button
          onClick={handleResetFilters}
          style={{
            padding: '9px 14px',
            background: 'rgba(22,48,75,0.9)',
            color: '#eef4fb',
            border: '1px solid #28425f',
            borderRadius: 12,
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: 13,
            whiteSpace: 'nowrap'
          }}
        >
          Reset Filters
        </button>
      </div>

      {/* Logs Table */}
      <div style={{ ...DS.card, padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Timestamp', 'Customer Details', 'Event / Action', 'Module', 'Description', 'Related Entity', 'Device / IP', 'Platform'].map((header) => (
                  <th key={header} style={DS.th}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const userObj = typeof log.user === 'object' && log.user !== null ? log.user : null;
                const customerName = userObj ? userObj.name : 'Unknown';
                const customerEmail = userObj ? userObj.email : (typeof log.user === 'string' ? log.user : '');
                const platStyles = getPlatformBadgeColor(log.platform || 'unknown');

                return (
                  <tr key={log._id} style={{ borderBottom: '1px solid rgba(40,66,95,0.4)' }}>
                    <td style={DS.td}>{formatDate(log.createdAt)}</td>
                    <td style={DS.td}>
                      <strong style={{ color: '#eef4fb', display: 'block' }}>{customerName}</strong>
                      <span style={{ color: '#9fb6cb', fontSize: 11 }}>{customerEmail}</span>
                    </td>
                    <td style={DS.td}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: 'rgba(99,210,255,0.1)',
                        color: '#63d2ff',
                        fontWeight: 700,
                        fontSize: 11
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={DS.td}>
                      <span style={{ textTransform: 'capitalize', fontSize: 12 }}>{log.module}</span>
                    </td>
                    <td style={DS.td} style={{ ...DS.td, maxWidth: '250px', wordBreak: 'break-word' }}>
                      {log.details}
                    </td>
                    <td style={DS.td}>
                      {log.relatedEntityId ? (
                        <span style={{
                          fontFamily: 'monospace',
                          fontSize: 11,
                          background: 'rgba(10,23,40,0.5)',
                          padding: '2px 6px',
                          borderRadius: 4,
                          color: '#eef4fb'
                        }}>
                          {log.relatedEntityId}
                        </span>
                      ) : (
                        <span style={{ color: '#5b7692' }}>—</span>
                      )}
                    </td>
                    <td style={DS.td}>
                      <div style={{ fontSize: 12, color: '#eef4fb' }}>{log.deviceInfo || 'unknown'}</div>
                      <small style={{ color: '#9fb6cb', fontSize: 11 }}>{log.ipAddress || 'unknown'}</small>
                    </td>
                    <td style={DS.td}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 700,
                        backgroundColor: platStyles.bg,
                        color: platStyles.text
                      }}>
                        {log.platform || 'unknown'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loading && !logs.length && (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#9fb6cb' }}>
              No customer activities matched the filters.
            </div>
          )}
          {loading && (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#63d2ff', fontWeight: 700 }}>
              Loading audit logs...
            </div>
          )}
        </div>
      </div>

      {/* Pagination Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={DS.muted}>{pagination.total} activities logged</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            disabled={page <= 1}
            onClick={() => setPage((cur) => Math.max(1, cur - 1))}
            style={{
              padding: '6px 14px',
              background: 'rgba(22,48,75,0.9)',
              color: '#eef4fb',
              border: '1px solid #28425f',
              borderRadius: 10,
              fontWeight: 700,
              cursor: page <= 1 ? 'not-allowed' : 'pointer',
              opacity: page <= 1 ? 0.5 : 1,
              fontSize: 13
            }}
          >
            ← Previous
          </button>
          <span style={DS.muted}>Page {page} of {Math.max(pagination.pages, 1)}</span>
          <button
            disabled={page >= pagination.pages}
            onClick={() => setPage((cur) => cur + 1)}
            style={{
              padding: '6px 14px',
              background: 'rgba(22,48,75,0.9)',
              color: '#eef4fb',
              border: '1px solid #28425f',
              borderRadius: 10,
              fontWeight: 700,
              cursor: page >= pagination.pages ? 'not-allowed' : 'pointer',
              opacity: page >= pagination.pages ? 0.5 : 1,
              fontSize: 13
            }}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
