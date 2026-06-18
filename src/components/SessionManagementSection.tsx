import React, { useEffect, useState } from 'react';
import { adminApi } from '../services/api';

interface UserSession {
  _id: string;
  userId?: string;
  user?: { _id?: string; name?: string; email?: string };
  email?: string;
  name?: string;
  ipAddress?: string;
  userAgent?: string;
  loginAt?: string;
  lastActivityAt?: string;
  logoutAt?: string;
  isActive?: boolean;
  action?: string;
  createdAt?: string;
  details?: string | Record<string, unknown>;
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
      // Load all users (customers only)
      const usersRes = await adminApi.getUsers();
      const users: any[] = (usersRes.data?.users || []).filter((u: any) => !ADMIN_ROLES.has(u.role));
      setAllUsers(users);

      // Load recent activities (login/logout events) for all users
      const activitiesRes = await adminApi.getActivities();
      const rawActivities: any[] = activitiesRes.data?.activities || [];

      // Also try /admin/activities which might have login events
      const sessionData = parseSessions(rawActivities);
      setSessions(sessionData);

      const activeCount = sessionData.filter(s => s.isActive).length;
      setStats({
        active: activeCount,
        total: sessionData.length,
        uniqueUsers: new Set(sessionData.map(s => s.userId || s.email)).size,
      });
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

  const handleForceLogout = async (userId: string, userName: string) => {
    if (!window.confirm(`Force logout ${userName}? Their active sessions will be terminated.`)) return;
    setLoading(true);
    try {
      await adminApi.forceLogoutUser(userId);
      onSuccess(`${userName} has been forcefully logged out`);
      loadSessions();
      if (selectedUser?._id === userId) loadUserLoginHistory(selectedUser);
    } catch (err) {
      onError(`Failed to terminate session: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const filteredSessions = allUsers.filter(u => {
    if (filter === 'all') return true;
    if (filter === 'active') return !u.blocked;
    return u.blocked;
  });

  // ─── User detail panel ─────────────────────────────────────────────────
  if (selectedUser) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <p style={{ margin: '0 0 4px', color: '#63d2ff', fontWeight: 900, textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.12em' }}>User Sessions</p>
            <h2 style={{ margin: 0, color: '#eef4fb' }}>{selectedUser.name || selectedUser.email}</h2>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => handleForceLogout(selectedUser._id || selectedUser.id, selectedUser.name || selectedUser.email)}
              style={{ padding: '8px 16px', background: 'rgba(255,139,139,0.2)', color: '#ff8b8b', border: '1px solid rgba(255,139,139,0.3)', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
              disabled={loading}
            >
              Force Logout
            </button>
            <button
              onClick={() => { setSelectedUser(null); setUserSessions([]); }}
              style={{ padding: '8px 16px', background: 'rgba(22,48,75,0.9)', color: '#eef4fb', border: '1px solid #28425f', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
            >
              ← Back
            </button>
          </div>
        </div>

        {/* User info */}
        <div style={{ ...DS.card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: '1.25rem' }}>
          <div><small style={{ color: '#9fb6cb' }}>Email</small><div style={{ color: '#eef4fb', fontSize: 13 }}>{selectedUser.email}</div></div>
          <div><small style={{ color: '#9fb6cb' }}>Status</small><div style={{ color: selectedUser.blocked ? '#ff8b8b' : '#43d17a', fontWeight: 700, fontSize: 13 }}>{selectedUser.blocked ? '🔒 Blocked' : '✓ Active'}</div></div>
          <div><small style={{ color: '#9fb6cb' }}>Last Login</small><div style={{ color: '#eef4fb', fontSize: 13 }}>{selectedUser.lastLoginAt ? new Date(selectedUser.lastLoginAt).toLocaleString() : 'Never'}</div></div>
          <div><small style={{ color: '#9fb6cb' }}>Verified</small><div style={{ color: selectedUser.isVerified ? '#43d17a' : '#9fb6cb', fontSize: 13 }}>{selectedUser.isVerified ? 'Yes' : 'No'}</div></div>
        </div>

        {/* Login history table */}
        <div style={{ ...DS.card, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #28425f' }}>
            <h3 style={{ margin: 0, color: '#eef4fb', fontSize: '0.95rem' }}>Login &amp; Activity History</h3>
          </div>
          {detailLoading ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#63d2ff', fontWeight: 700 }}>Loading session history…</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={DS.th}>Event</th>
                    <th style={DS.th}>IP Address</th>
                    <th style={DS.th}>User Agent</th>
                    <th style={DS.th}>Status</th>
                    <th style={DS.th}>Date / Time</th>
                  </tr>
                </thead>
                <tbody>
                  {userSessions.map((s, idx) => {
                    const isLogin = (s.action || '').toLowerCase().includes('login') && !(s.action || '').toLowerCase().includes('logout');
                    const isLogout = (s.action || '').toLowerCase().includes('logout');
                    return (
                      <tr key={s._id || idx}>
                        <td style={DS.td}>
                          <span style={{ fontWeight: 700, color: isLogin ? '#43d17a' : isLogout ? '#ff8b8b' : '#63d2ff' }}>
                            {s.action || '—'}
                          </span>
                        </td>
                        <td style={DS.td}><span style={{ color: '#9fb6cb', fontFamily: 'monospace', fontSize: 12 }}>{s.ipAddress}</span></td>
                        <td style={DS.td}><span title={s.userAgent} style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block', color: '#9fb6cb', fontSize: 12 }}>{s.userAgent}</span></td>
                        <td style={DS.td}>
                          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: isLogin ? 'rgba(67,209,122,0.15)' : 'rgba(159,182,203,0.1)', color: isLogin ? '#43d17a' : '#9fb6cb' }}>
                            {isLogin ? 'Session Active' : isLogout ? 'Ended' : 'Event'}
                          </span>
                        </td>
                        <td style={DS.td}><span style={{ color: '#9fb6cb', fontSize: 12 }}>{s.createdAt ? new Date(s.createdAt).toLocaleString() : '—'}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!detailLoading && !userSessions.length && (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: '#9fb6cb' }}>No session history recorded for this user.</div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Users list with session overview ─────────────────────────────────
  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <p style={{ margin: '0 0 4px', color: '#63d2ff', fontWeight: 900, textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.12em' }}>User Access Control</p>
          <h2 style={{ margin: 0, color: '#eef4fb' }}>Session Management</h2>
          <p style={{ margin: '6px 0 0', color: '#9fb6cb', fontSize: 13 }}>Monitor user login sessions and revoke access immediately.</p>
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
              <option value="all">All users</option>
              <option value="active">Active only</option>
              <option value="terminated">Blocked only</option>
            </select>
          </div>
          <span style={{ display: 'block', marginTop: '0.4rem', color: '#9fb6cb', fontWeight: 700, fontSize: '0.82rem' }}>Filter</span>
        </div>
      </div>

      {/* Users table */}
      <div style={{ ...DS.card, padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={DS.th}>User</th>
                <th style={DS.th}>Email</th>
                <th style={DS.th}>Status</th>
                <th style={DS.th}>Last Login</th>
                <th style={DS.th}>Verified</th>
                <th style={DS.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map(user => (
                <tr key={user._id} style={{ cursor: 'pointer' }}>
                  <td style={DS.td}>
                    <strong style={{ color: '#eef4fb' }}>{user.name || 'Unnamed'}</strong>
                  </td>
                  <td style={DS.td}><span style={{ color: '#9fb6cb', fontSize: 12 }}>{user.email}</span></td>
                  <td style={DS.td}>
                    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: user.blocked ? 'rgba(255,139,139,0.15)' : 'rgba(67,209,122,0.15)', color: user.blocked ? '#ff8b8b' : '#43d17a' }}>
                      {user.blocked ? 'Blocked' : 'Active'}
                    </span>
                  </td>
                  <td style={DS.td}><span style={{ color: '#9fb6cb', fontSize: 12 }}>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}</span></td>
                  <td style={DS.td}>
                    <span style={{ color: user.isVerified ? '#43d17a' : '#9fb6cb', fontSize: 12 }}>{user.isVerified ? '✓ Yes' : 'No'}</span>
                  </td>
                  <td style={DS.td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => loadUserLoginHistory(user)}
                        style={{ padding: '5px 10px', background: '#63d2ff', color: '#06101d', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 11 }}
                      >
                        View Sessions
                      </button>
                      {!user.blocked && (
                        <button
                          onClick={() => handleForceLogout(user._id, user.name || user.email)}
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
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#9fb6cb' }}>No users found.</div>
          )}
          {loading && (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#63d2ff', fontWeight: 700 }}>Loading users…</div>
          )}
        </div>
      </div>
    </div>
  );
}
