import React, { useEffect, useState } from 'react';
import { sessionsApi, type AdminSession } from '../services/sessions';

interface SessionManagementSectionProps {
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

// ─── Dark-theme design tokens ──────────────────────────────────────────────
const DS = {
  card: {
    border: '1px solid #28425f',
    borderRadius: 16,
    background: 'rgba(16,32,51,0.92)',
    padding: '1rem 1.25rem',
  } as React.CSSProperties,
  stat: {
    border: '1px solid #28425f',
    borderRadius: 16,
    background: 'rgba(16,32,51,0.92)',
    padding: '1rem',
  } as React.CSSProperties,
  th: {
    padding: '10px 14px',
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
    padding: '10px 14px',
    borderBottom: '1px solid rgba(40,66,95,0.5)',
    fontSize: 13,
    color: '#eef4fb',
    verticalAlign: 'top' as const,
  } as React.CSSProperties,
};

function uaShort(ua?: string): string {
  if (!ua) return '—';
  // Extract browser name and OS from full user-agent string
  if (ua.includes('Chrome')) return ua.includes('Mobile') ? 'Chrome Mobile' : 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return ua.slice(0, 40);
}

export function SessionManagementSection({ onError, onSuccess }: SessionManagementSectionProps) {
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [stats, setStats] = useState({ activeSessions: 0, totalSessions: 0, terminatedSessions: 0 });
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'terminated'>('all');
  const [search, setSearch] = useState('');

  const loadSessions = async () => {
    setLoading(true);
    try {
      const [sessionsRes, statsRes] = await Promise.allSettled([
        sessionsApi.getActiveSessions(1, 100, filter === 'all' ? undefined : filter),
        sessionsApi.getSessionStats(),
      ]);

      if (sessionsRes.status === 'fulfilled') {
        const rawSessions: AdminSession[] = sessionsRes.value?.data || [];
        setSessions(rawSessions);
      } else {
        onError(`Failed to load sessions: ${sessionsRes.reason?.message || sessionsRes.reason}`);
      }

      if (statsRes.status === 'fulfilled') {
        const d = statsRes.value?.data || {};
        setStats({
          activeSessions: d.activeSessions ?? 0,
          totalSessions: d.totalSessions ?? 0,
          terminatedSessions: d.terminatedSessions ?? 0,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForceLogout = async (session: AdminSession) => {
    const label = session.adminUser?.name || session.adminEmail || session._id;
    if (!window.confirm(`Force logout "${label}"? Their session will be terminated immediately.`)) return;
    setLoading(true);
    try {
      // Backend route: POST /sessions/:sessionId/logout
      // The controller looks up by sessionToken, so pass the sessionToken as the URL param
      const id = session.sessionToken || session._id;
      await sessionsApi.forceLogout(id);
      onSuccess(`Session for ${label} terminated`);
      loadSessions();
    } catch (err: any) {
      onError(`Failed to terminate session: ${err?.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleForceLogoutAll = async (adminId: string, label: string) => {
    if (!window.confirm(`Terminate ALL sessions for "${label}"?`)) return;
    setLoading(true);
    try {
      await sessionsApi.forceLogoutAllForAdmin(adminId);
      onSuccess(`All sessions for ${label} terminated`);
      loadSessions();
    } catch (err: any) {
      onError(`Failed to terminate sessions: ${err?.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSessions(); }, [filter]);

  // Client-side search filter
  const filtered = sessions.filter(s => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (s.adminUser?.name || '').toLowerCase().includes(q) ||
      (s.adminUser?.email || '').toLowerCase().includes(q) ||
      (s.adminEmail || '').toLowerCase().includes(q) ||
      (s.ipAddress || '').toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <p style={{ margin: '0 0 4px', color: '#63d2ff', fontWeight: 900, textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.12em' }}>Admin Access Control</p>
          <h2 style={{ margin: 0, color: '#eef4fb' }}>Admin Session Dashboard</h2>
          <p style={{ margin: '6px 0 0', color: '#9fb6cb', fontSize: 13 }}>Monitor admin login sessions and revoke access immediately.</p>
        </div>
        <button
          className="secondary"
          onClick={loadSessions}
          disabled={loading}
          style={{ height: 40 }}
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={DS.stat}>
          <strong style={{ display: 'block', fontSize: '2rem', color: '#63d2ff', lineHeight: 1 }}>{stats.totalSessions}</strong>
          <span style={{ display: 'block', marginTop: '0.5rem', color: '#9fb6cb', fontWeight: 700, fontSize: '0.82rem' }}>Total Login Events</span>
        </div>
        <div style={DS.stat}>
          <strong style={{ display: 'block', fontSize: '2rem', color: '#43d17a', lineHeight: 1 }}>{stats.activeSessions}</strong>
          <span style={{ display: 'block', marginTop: '0.5rem', color: '#9fb6cb', fontWeight: 700, fontSize: '0.82rem' }}>Active Sessions</span>
        </div>
        <div style={DS.stat}>
          <strong style={{ display: 'block', fontSize: '2rem', color: '#ff8b8b', lineHeight: 1 }}>{stats.terminatedSessions}</strong>
          <span style={{ display: 'block', marginTop: '0.5rem', color: '#9fb6cb', fontWeight: 700, fontSize: '0.82rem' }}>Terminated</span>
        </div>
      </div>

      {/* Filters */}
      <div className="section-filters" style={{ marginBottom: '1rem' }}>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value as any)}
          style={{ width: 160 }}
        >
          <option value="all">All Sessions</option>
          <option value="active">Active Only</option>
          <option value="terminated">Terminated Only</option>
        </select>
        <input
          type="text"
          placeholder="Search admin or IP…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 220 }}
        />
      </div>

      {/* Sessions table */}
      <div style={{ ...DS.card, padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={DS.th}>Admin User</th>
                <th style={DS.th}>Role</th>
                <th style={DS.th}>IP Address</th>
                <th style={DS.th}>Browser</th>
                <th style={DS.th}>Login Time</th>
                <th style={DS.th}>Last Activity</th>
                <th style={DS.th}>Status</th>
                <th style={DS.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(session => (
                <tr key={session._id} style={{ cursor: 'default' }}>
                  <td style={DS.td}>
                    <strong style={{ color: '#eef4fb' }}>
                      {session.adminUser?.name || session.adminEmail || '—'}
                    </strong>
                    {session.adminUser?.email && (
                      <div style={{ color: '#9fb6cb', fontSize: 11 }}>{session.adminUser.email}</div>
                    )}
                  </td>
                  <td style={DS.td}>
                    <span style={{ color: '#63d2ff', fontSize: 11, fontWeight: 700, textTransform: 'capitalize' }}>
                      {session.adminUser?.role || '—'}
                    </span>
                  </td>
                  <td style={DS.td}>
                    <span style={{ color: '#9fb6cb', fontFamily: 'monospace', fontSize: 12 }}>{session.ipAddress || '—'}</span>
                  </td>
                  <td style={DS.td}>
                    <span title={session.userAgent} style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block', color: '#9fb6cb', fontSize: 12 }}>
                      {uaShort(session.userAgent)}
                    </span>
                  </td>
                  <td style={DS.td}>
                    <span style={{ color: '#9fb6cb', fontSize: 12 }}>
                      {session.loginAt ? new Date(session.loginAt).toLocaleString() : '—'}
                    </span>
                  </td>
                  <td style={DS.td}>
                    <span style={{ color: '#9fb6cb', fontSize: 12 }}>
                      {session.lastActivityAt ? new Date(session.lastActivityAt).toLocaleString() : '—'}
                    </span>
                  </td>
                  <td style={DS.td}>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 700,
                      background: session.isActive ? 'rgba(67,209,122,0.15)' : 'rgba(255,139,139,0.15)',
                      color: session.isActive ? '#43d17a' : '#ff8b8b',
                    }}>
                      {session.isActive ? 'Active' : 'Terminated'}
                    </span>
                  </td>
                  <td style={DS.td}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {session.isActive && (
                        <button
                          onClick={() => handleForceLogout(session)}
                          disabled={loading}
                          style={{ padding: '5px 10px', background: 'rgba(255,139,139,0.15)', color: '#ff8b8b', border: '1px solid rgba(255,139,139,0.3)', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 11 }}
                        >
                          Force Logout
                        </button>
                      )}
                      {session.isActive && session.adminUser?._id && (
                        <button
                          onClick={() => handleForceLogoutAll(session.adminUser!._id!, session.adminUser?.name || session.adminEmail || '')}
                          disabled={loading}
                          style={{ padding: '5px 10px', background: 'rgba(255,139,139,0.08)', color: '#ff8b8b', border: '1px solid rgba(255,139,139,0.15)', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 11 }}
                        >
                          Logout All
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#9fb6cb' }}>
              {sessions.length > 0 ? 'No sessions match your search.' : 'No sessions found.'}
            </div>
          )}
          {loading && (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#63d2ff', fontWeight: 700 }}>Loading sessions…</div>
          )}
        </div>
      </div>
    </div>
  );
}
