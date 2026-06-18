import React from 'react';
import type { AdminRole } from '../services/api';
import { roleLabels } from '../services/access';

export default function AdminNavigation({
  adminRoles,
  manageableRoles,
  usersCount,
  ordersCount,
  sessionsCount,
}: {
  adminRoles: AdminRole[];
  manageableRoles: AdminRole[];
  usersCount: number;
  ordersCount: number;
  sessionsCount: number;
}) {
  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ margin: '0 0 4px', color: '#63d2ff', fontWeight: 900, textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.12em' }}>Role Overview</p>
        <h2 style={{ margin: 0, color: '#eef4fb' }}>Admin Navigation</h2>
      </div>

      {/* Role grid */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem', color: '#eef4fb', fontSize: '1rem' }}>Admin Roles ({adminRoles.length})</h3>
        {adminRoles && adminRoles.length ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
            {adminRoles.map(r => (
              <div
                key={r}
                style={{
                  border: '1px solid #28425f',
                  borderRadius: 16,
                  background: 'rgba(16,32,51,0.92)',
                  padding: '1rem 1.2rem',
                  display: 'grid',
                  gap: '0.4rem',
                }}
              >
                <strong style={{ color: '#eef4fb', fontSize: '0.95rem' }}>
                  {(roleLabels as Record<string, string>)[r] || r}
                </strong>
                <span style={{ fontSize: 11, color: '#9fb6cb', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>
                  {r}
                </span>
                <div style={{ marginTop: 4 }}>
                  {manageableRoles.includes(r) ? (
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: 'rgba(67,209,122,0.15)', color: '#43d17a' }}>
                      Manageable
                    </span>
                  ) : (
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: 'rgba(159,182,203,0.1)', color: '#9fb6cb' }}>
                      Protected
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ border: '1px solid #28425f', borderRadius: 16, background: 'rgba(16,32,51,0.92)', padding: '2rem', textAlign: 'center', color: '#9fb6cb' }}>
            No admin roles available. Roles are loaded from the access control API.
          </div>
        )}
      </div>

      {/* Counts overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: '1rem' }}>
        {[
          { label: 'Registered Users', value: usersCount, color: '#63d2ff' },
          { label: 'Total Orders', value: ordersCount, color: '#43d17a' },
          { label: 'Admin Accounts', value: sessionsCount, color: '#fcc419' },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            style={{ border: '1px solid #28425f', borderRadius: 16, background: 'rgba(16,32,51,0.92)', padding: '1.2rem' }}
          >
            <strong style={{ display: 'block', fontSize: '2rem', color, lineHeight: 1 }}>{value}</strong>
            <span style={{ display: 'block', marginTop: '0.5rem', color: '#9fb6cb', fontWeight: 700, fontSize: '0.85rem' }}>{label}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '1.5rem', border: '1px solid rgba(99,210,255,0.2)', borderRadius: 16, background: 'rgba(99,210,255,0.05)', padding: '1rem 1.25rem' }}>
        <p style={{ margin: 0, color: '#9fb6cb', fontSize: 13, lineHeight: 1.6 }}>
          Use <strong style={{ color: '#63d2ff' }}>Admin Management</strong> to view individual admin profiles, audit logs, and session history.
          Use <strong style={{ color: '#63d2ff' }}>Access</strong> to manage role permissions and create new admin accounts.
          Use <strong style={{ color: '#63d2ff' }}>Sessions</strong> to monitor and terminate active admin sessions.
        </p>
      </div>
    </div>
  );
}
