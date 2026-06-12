import React from 'react';
import type { AdminRole } from '../services/api';

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
    <div className="admin-nav-page">
      <h2>Admin Navigation</h2>
      <p>This page lists admin roles and quick links to user/customer data.</p>

      <section className="roles-panel">
        <h3>Admin Roles</h3>
        {adminRoles && adminRoles.length ? (
          <div className="role-list">
            {adminRoles.map(r => (
              <div key={r} className="role-item">
                <strong>{r}</strong>
                <div className="role-meta">Manageable: {manageableRoles.includes(r) ? 'Yes' : 'No'}</div>
              </div>
            ))}
          </div>
        ) : (
          <p>No admin roles available.</p>
        )}
      </section>

      <section className="customer-panel">
        <h3>User / Customer Overview</h3>
        <ul>
          <li>Registered users: <strong>{usersCount}</strong></li>
          <li>Orders total: <strong>{ordersCount}</strong></li>
          <li>Active sessions: <strong>{sessionsCount}</strong></li>
        </ul>
        <p>Use the existing sections (Customers, Sessions, Orders) for full details.</p>
      </section>
    </div>
  );
}
