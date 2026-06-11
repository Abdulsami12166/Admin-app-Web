import React, { useEffect, useState } from 'react';

interface AdminSession {
  id: string;
  adminEmail: string;
  ipAddress: string;
  loginTime: string;
  lastActivityTime: string;
  status: 'active' | 'terminated';
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
      // Mock data
      const mockSessions = [
        {
          id: 'sess_1',
          adminEmail: 'admin@example.com',
          ipAddress: '192.168.1.1',
          loginTime: new Date(Date.now() - 3600000).toISOString(),
          lastActivityTime: new Date().toISOString(),
          status: 'active' as const,
        },
        {
          id: 'sess_2',
          adminEmail: 'manager@example.com',
          ipAddress: '192.168.1.5',
          loginTime: new Date(Date.now() - 7200000).toISOString(),
          lastActivityTime: new Date(Date.now() - 1800000).toISOString(),
          status: 'active' as const,
        },
        {
          id: 'sess_3',
          adminEmail: 'support@example.com',
          ipAddress: '192.168.1.10',
          loginTime: new Date(Date.now() - 86400000).toISOString(),
          lastActivityTime: new Date(Date.now() - 86400000).toISOString(),
          status: 'terminated' as const,
        },
      ];
      setSessions(mockSessions);
      setStats({
        active: mockSessions.filter(s => s.status === 'active').length,
        total: mockSessions.length,
      });
    } catch (err) {
      onError(`Failed to load sessions: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleForceLogout = async (sessionId: string) => {
    try {
      const updatedSessions = sessions.map(s => 
        s.id === sessionId ? { ...s, status: 'terminated' as const } : s
      );
      setSessions(updatedSessions);
      setStats({
        active: updatedSessions.filter(s => s.status === 'active').length,
        total: updatedSessions.length,
      });
      onSuccess('Session terminated successfully');
    } catch (err) {
      onError(`Failed to terminate session: ${err}`);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const filteredSessions = sessions.filter(s => 
    filter === 'all' ? true : s.status === filter
  );

  return (
    <div style={{ padding: '20px' }}>
      <h2>Session Management</h2>

      <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px', marginBottom: '20px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
        <div>
          <strong>Active Sessions:</strong>
          <p style={{ fontSize: '24px', color: '#28a745' }}>{stats.active}</p>
        </div>
        <div>
          <strong>Total Sessions:</strong>
          <p style={{ fontSize: '24px', color: '#007bff' }}>{stats.total}</p>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ marginRight: '10px' }}>Filter:</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
        >
          <option value="all">All Sessions</option>
          <option value="active">Active Only</option>
          <option value="terminated">Terminated Only</option>
        </select>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Admin Email</th>
            <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>IP Address</th>
            <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Login Time</th>
            <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Last Activity</th>
            <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Status</th>
            <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredSessions.map((session) => (
            <tr key={session.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px' }}>{session.adminEmail}</td>
              <td style={{ padding: '10px' }}>{session.ipAddress}</td>
              <td style={{ padding: '10px' }}>{new Date(session.loginTime).toLocaleString()}</td>
              <td style={{ padding: '10px' }}>{new Date(session.lastActivityTime).toLocaleString()}</td>
              <td style={{ padding: '10px' }}>
                <span style={{
                  background: session.status === 'active' ? '#d4edda' : '#f8d7da',
                  padding: '4px 8px',
                  borderRadius: '3px',
                }}>
                  {session.status}
                </span>
              </td>
              <td style={{ padding: '10px' }}>
                {session.status === 'active' && (
                  <button
                    onClick={() => handleForceLogout(session.id)}
                    style={{
                      padding: '5px 10px',
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: '4px',
                    }}
                  >
                    Force Logout
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filteredSessions.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
          No sessions found
        </div>
      )}
    </div>
  );
}
