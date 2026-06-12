import React, { useEffect, useState } from 'react';
import { sessionsApi } from '../services/sessions';

interface AdminSession {
  _id: string;
  sessionToken: string;
  adminEmail: string;
  adminUser?: {
    _id?: string;
    name?: string;
    email?: string;
  };
  ipAddress: string;
  userAgent?: string;
  loginAt: string;
  lastActivityAt: string;
  logoutAt?: string;
  isActive: boolean;
}

interface SessionManagementSectionProps {
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

export function SessionManagementSection({ onError, onSuccess }: SessionManagementSectionProps) {
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [stats, setStats] = useState({ active: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'terminated'>('active');

  const loadSessions = async () => {
    setLoading(true);
    try {
      const response = await sessionsApi.getActiveSessions();
      const data = response?.data || [];
      setSessions(data.map((session: any) => ({
        ...session,
        loginAt: session.loginAt || session.createdAt,
        lastActivityAt: session.lastActivityAt || session.updatedAt,
      })));
      setStats({
        active: data.filter((session: any) => session.isActive).length,
        total: data.length,
      });
    } catch (err) {
      onError(`Failed to load sessions: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleForceLogout = async (sessionToken: string) => {
    setLoading(true);
    try {
      await sessionsApi.forceLogout(sessionToken);
      const updatedSessions = sessions.map(s =>
        s.sessionToken === sessionToken ? { ...s, isActive: false, logoutAt: new Date().toISOString() } : s
      );
      setSessions(updatedSessions);
      setStats({
        active: updatedSessions.filter(s => s.isActive).length,
        total: updatedSessions.length,
      });
      onSuccess('Session terminated successfully');
    } catch (err) {
      onError(`Failed to terminate session: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const filteredSessions = sessions.filter(s => {
    if (filter === 'all') return true;
    return filter === 'active' ? s.isActive : !s.isActive;
  });

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '20px' }}>
        <div>
          <h2>Session Management</h2>
          <p style={{ color: '#9aa', margin: '0.5rem 0 0' }}>Monitor active admin sessions and revoke access immediately.</p>
        </div>
        <button
          className="secondary"
          onClick={loadSessions}
          disabled={loading}
          style={{ height: '40px' }}
        >
          {loading ? 'Refreshing...' : 'Refresh sessions'}
        </button>
      </div>

      <div style={{ background: '#0f1a2a', padding: '15px', borderRadius: '16px', marginBottom: '20px', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px' }}>
        <div style={{ padding: '1rem', border: '1px solid #28425f', borderRadius: '16px' }}>
          <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Active sessions</strong>
          <p style={{ fontSize: '2rem', margin: 0, color: '#63d2ff' }}>{stats.active}</p>
        </div>
        <div style={{ padding: '1rem', border: '1px solid #28425f', borderRadius: '16px' }}>
          <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Total sessions</strong>
          <p style={{ fontSize: '2rem', margin: 0, color: '#7bc0ff' }}>{stats.total}</p>
        </div>
        <div style={{ padding: '1rem', border: '1px solid #28425f', borderRadius: '16px' }}>
          <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Filter</strong>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            style={{ width: '100%', padding: '8px', border: '1px solid #28425f', borderRadius: '12px', background: '#06101d', color: '#eef4fb' }}
          >
            <option value="all">All sessions</option>
            <option value="active">Active only</option>
            <option value="terminated">Terminated only</option>
          </select>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#102033' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #28425f' }}>Admin</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #28425f' }}>IP Address</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #28425f' }}>Login</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #28425f' }}>Last activity</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #28425f' }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #28425f' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSessions.map((session) => (
              <tr key={session._id} style={{ borderBottom: '1px solid #1d283b' }}>
                <td style={{ padding: '12px 16px' }}>{session.adminUser?.email || session.adminEmail}</td>
                <td style={{ padding: '12px 16px' }}>{session.ipAddress}</td>
                <td style={{ padding: '12px 16px' }}>{new Date(session.loginAt).toLocaleString()}</td>
                <td style={{ padding: '12px 16px' }}>{new Date(session.lastActivityAt).toLocaleString()}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '6px 10px',
                    borderRadius: '999px',
                    background: session.isActive ? '#1f4f73' : '#4b1f23',
                    color: '#eef4fb',
                    fontWeight: 700,
                  }}>
                    {session.isActive ? 'active' : 'terminated'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {session.isActive ? (
                    <button
                      onClick={() => handleForceLogout(session.sessionToken)}
                      style={{
                        padding: '8px 14px',
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: '10px',
                      }}
                      disabled={loading}
                    >
                      Force logout
                    </button>
                  ) : (
                    <span style={{ color: '#9aa' }}>No actions</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredSessions.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
          No sessions found
        </div>
      )}
    </div>
  );
}
