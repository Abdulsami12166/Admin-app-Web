import React, { useEffect, useState } from 'react';
import { adminApi } from '../services/api';

interface UserSession {
  _id: string;
  adminUser?: { _id?: string; name?: string; email?: string; role?: string };
  adminEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  loginAt?: string;
  lastActivityAt?: string;
  logoutAt?: string;
  isActive?: boolean;
  sessionToken?: string;
}

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

function parseSessions(activities: any[]): UserSession[] {
  return activities
    .filter(a => {
      const action = (a.action || '').toLowerCase();
      return action.includes('login') || action.includes('logout') || action.includes('session');
    })
    .map(a => {
      let details: any = {};
      if (typeof a.details === 'string') {
        try { details = JSON.parse(a.details); } catch { details = {}; }
      } else if (typeof a.details === 'object' && a.details) {
        details = a.details;
      }
      return {
        _id: a._id || String(Math.random()),
        userId: a.userId || a.user?._id,
        user: a.user,
        email: a.email || a.user?.email || details?.email,
        name: a.name || a.user?.name || details?.name,
        ipAddress: a.ipAddress || details?.ipAddress || '—',
        userAgent: a.userAgent || details?.userAgent || '—',
        loginAt: a.action?.toLowerCase().includes('login') ? (a.createdAt || a.timestamp) : undefined,
        lastActivityAt: a.updatedAt || a.createdAt,
        logoutAt: a.action?.toLowerCase().includes('logout') ? (a.createdAt || a.timestamp) : undefined,
        isActive: a.action?.toLowerCase().includes('login') && !a.action?.toLowerCase().includes('logout'),
        action: a.action,
        createdAt: a.createdAt || a.timestamp,
        details: a.details,
      };
    });
}

export function SessionManagementSection({ onError, onSuccess }: SessionManagementSectionProps) {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userSessions, setUserSessions] = useState<UserSession[]>([]);
  const [stats, setStats] = useState({ active: 0, total: 0, uniqueUsers: 0 });
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'terminated'>('all');

  const ADMIN_ROLES = new Set(['super-admin', 'admin', 'product-manager', 'inventory-manager', 'support', 'finance-manager', 'customer-service']);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const [sessionsRes, statsRes] = await Promise.allSettled([
        adminApi('/admin/sessions', 'GET'),
        adminApi('/admin/sessions/stats', 'GET')
      ]);

      if (sessionsRes.status === 'fulfilled') {
        const rawSessions: any[] = sessionsRes.value.data || [];
        setSessions(rawSessions);
      }
      
      if (statsRes.status === 'fulfilled') {
        setStats({
          active: statsRes.value.data?.activeSessions || 0,
          total: statsRes.value.data?.totalSessions || 0,
          uniqueUsers: statsRes.value.data?.sessionsByAdmin?.length || 0,
        });
      }
    } catch (err) {
      onError(`Failed to load sessions: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const loadUserLoginHistory = async (user: any) => {
    setSelectedUser(user);
    setDetailLoading(true);
    try {
      const userId = user._id || user.id;
      const [actRes, loginRes] = await Promise.allSettled([
        adminApi.getUserActivities(userId, 1, 50),
        adminApi.getUserLoginHistory(userId, 1, 50),
      ]);
      const activities = actRes.status === 'fulfilled' ? actRes.value.data?.activities || [] : [];
      const logins = loginRes.status === 'fulfilled' ? loginRes.value.data?.history || [] : [];
      const combined = [...activities, ...logins].sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      setUserSessions(combined.map((a: any) => {
        let details: any = {};
        if (typeof a.details === 'string') { try { details = JSON.parse(a.details); } catch { details = {}; } }
        else if (typeof a.details === 'object' && a.details) details = a.details;
        return {
          _id: a._id || String(Math.random()),
          action: a.action,
          ipAddress: a.ipAddress || details?.ipAddress || '—',
          userAgent: a.userAgent || details?.userAgent || '—',
          isActive: (a.action || '').toLowerCase().includes('login') && !(a.action || '').toLowerCase().includes('logout'),
          createdAt: a.createdAt || a.timestamp,
        };
      }));
    } catch (err) {
      onError(`Failed to load user sessions: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleForceLogout = async (sessionToken: string, adminEmail: string) => {
    if (!window.confirm(`Force logout admin ${adminEmail}? This session will be terminated.`)) return;
    setLoading(true);
    try {
      await adminApi(`/admin/sessions/${sessionToken}/force-logout`, 'POST');
      onSuccess(`Session for ${adminEmail} has been terminated`);
      loadSessions();
    } catch (err) {
      onError(`Failed to terminate session: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const filteredSessions = sessions.filter(s => {
    if (filter === 'all') return true;
    if (filter === 'active') return s.isActive;
    return !s.isActive;
  });



  // ─── Users list with session overview ─────────────────────────────────
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
          <strong style={{ display: 'block', fontSize: '2rem', color: '#63d2ff', lineHeight: 1 }}>{stats.total}</strong>
          <span style={{ display: 'block', marginTop: '0.5rem', color: '#9fb6cb', fontWeight: 700, fontSize: '0.82rem' }}>Login Events</span>
        </div>
        <div style={DS.stat}>
          <strong style={{ display: 'block', fontSize: '2rem', color: '#43d17a', lineHeight: 1 }}>{allUsers.filter(u => !u.blocked).length}</strong>
          <span style={{ display: 'block', marginTop: '0.5rem', color: '#9fb6cb', fontWeight: 700, fontSize: '0.82rem' }}>Active Users</span>
        </div>
        <div style={DS.stat}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select
              value={filter}
              onChange={e => setFilter(e.target.value as any)}
              style={{ width: '100%', padding: '8px', border: '1px solid #28425f', borderRadius: '12px', background: '#06101d', color: '#eef4fb', fontSize: 12 }}
            >
              <option value="all">All sessions</option>
              <option value="active">Active only</option>
              <option value="terminated">Terminated only</option>
            </select>
          </div>
          <span style={{ display: 'block', marginTop: '0.4rem', color: '#9fb6cb', fontWeight: 700, fontSize: '0.82rem' }}>Filter</span>
        </div>
      </div>

      {/* Sessions table */}
      <div style={{ ...DS.card, padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={DS.th}>Admin User</th>
                <th style={DS.th}>IP Address</th>
                <th style={DS.th}>Browser/Device</th>
                <th style={DS.th}>Login Time</th>
                <th style={DS.th}>Last Activity</th>
                <th style={DS.th}>Status</th>
                <th style={DS.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map(session => (
                <tr key={session._id} style={{ cursor: 'pointer' }}>
                  <td style={DS.td}>
                    <strong style={{ color: '#eef4fb' }}>{session.adminUser?.name || session.adminEmail}</strong>
                    <div style={{ color: '#9fb6cb', fontSize: 11 }}>{session.adminUser?.role}</div>
                  </td>
                  <td style={DS.td}><span style={{ color: '#9fb6cb', fontFamily: 'monospace', fontSize: 12 }}>{session.ipAddress}</span></td>
                  <td style={DS.td}><span title={session.userAgent} style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block', color: '#9fb6cb', fontSize: 12 }}>{session.userAgent}</span></td>
                  <td style={DS.td}><span style={{ color: '#9fb6cb', fontSize: 12 }}>{session.loginAt ? new Date(session.loginAt).toLocaleString() : '—'}</span></td>
                  <td style={DS.td}><span style={{ color: '#9fb6cb', fontSize: 12 }}>{session.lastActivityAt ? new Date(session.lastActivityAt).toLocaleString() : '—'}</span></td>
                  <td style={DS.td}>
                    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: !session.isActive ? 'rgba(255,139,139,0.15)' : 'rgba(67,209,122,0.15)', color: !session.isActive ? '#ff8b8b' : '#43d17a' }}>
                      {!session.isActive ? 'Terminated' : 'Active'}
                    </span>
                  </td>
                  <td style={DS.td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {session.isActive && (
                        <button
                          onClick={() => handleForceLogout(session.sessionToken!, session.adminEmail!)}
                          disabled={loading}
                          style={{ padding: '5px 10px', background: 'rgba(255,139,139,0.15)', color: '#ff8b8b', border: '1px solid rgba(255,139,139,0.2)', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 11 }}
                        >
                          Force Logout
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filteredSessions.length === 0 && (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#9fb6cb' }}>No sessions found.</div>
          )}
          {loading && (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#63d2ff', fontWeight: 700 }}>Loading sessions…</div>
          )}
        </div>
      </div>
    </div>
  );
}
