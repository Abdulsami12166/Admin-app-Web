import React, { useEffect, useState } from 'react';
import {
  customerApi,
  type Customer,
  type ActivityLog,
  type NotificationPreference,
} from '../services/customers';

interface CustomersProps {
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

export function CustomersSection({ onError, onSuccess }: CustomersProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const result = await customerApi.getCustomers(page, 20, search);
      setCustomers(result.data?.customers || []);
    } catch (err) {
      onError(`Failed to load customers: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerDetail = async (customerId: string) => {
    setLoading(true);
    try {
      const [detail, logs, prefs] = await Promise.all([
        customerApi.getCustomerDetail(customerId),
        customerApi.getCustomerActivityLogs(customerId),
        customerApi.getCustomerNotificationPreferences(customerId),
      ]);
      setSelectedCustomer(detail.data?.customer || null);
      setActivityLogs(logs.data?.logs || []);
      setPreferences(prefs.data?.preferences || null);
    } catch (err) {
      onError(`Failed to load customer detail: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockCustomer = async (customerId: string) => {
    try {
      await customerApi.blockCustomer(customerId, 'Admin blocked');
      onSuccess('Customer blocked successfully');
      loadCustomers();
    } catch (err) {
      onError(`Failed to block customer: ${String(err)}`);
    }
  };

  const handleUnblockCustomer = async (customerId: string) => {
    try {
      await customerApi.unblockCustomer(customerId);
      onSuccess('Customer unblocked successfully');
      loadCustomers();
    } catch (err) {
      onError(`Failed to unblock customer: ${String(err)}`);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [page, search]);

  if (selectedCustomer) {
    return (
      <div style={{ padding: '20px' }}>
        <button
          onClick={() => setSelectedCustomer(null)}
          style={{ marginBottom: '20px' }}
        >
          ← Back
        </button>
        <h2>{selectedCustomer.name}</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <h3>Customer Info</h3>
            <p>
              <strong>Email:</strong> {selectedCustomer.email}
            </p>
            <p>
              <strong>Phone:</strong> {selectedCustomer.phone || 'N/A'}
            </p>
            <p>
              <strong>Status:</strong> {selectedCustomer.status}
            </p>
            <p>
              <strong>Total Orders:</strong> {selectedCustomer.totalOrders}
            </p>
            <p>
              <strong>Total Spent:</strong> ${selectedCustomer.totalSpent}
            </p>

            <div style={{ marginTop: '20px' }}>
              {selectedCustomer.status === 'active' ? (
                <button
                  onClick={() => handleBlockCustomer(String(selectedCustomer._id))}
                  style={{
                    background: '#ff6b6b',
                    color: 'white',
                    padding: '8px 16px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Block Customer
                </button>
              ) : (
                <button
                  onClick={() => handleUnblockCustomer(String(selectedCustomer._id))}
                  style={{
                    background: '#51cf66',
                    color: 'white',
                    padding: '8px 16px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Unblock Customer
                </button>
              )}
            </div>
          </div>

          <div>
            <h3>Notification Preferences</h3>
            {preferences && preferences.channels ? (
              <div>
                <p>
                  <strong>Email:</strong> {preferences.channels.email ? '✓ Enabled' : '✗ Disabled'}
                </p>
                <p>
                  <strong>SMS:</strong> {preferences.channels.sms ? '✓ Enabled' : '✗ Disabled'}
                </p>
                <p>
                  <strong>Push:</strong> {preferences.channels.push ? '✓ Enabled' : '✗ Disabled'}
                </p>
                <p>
                  <strong>In-App:</strong> {preferences.channels.inApp ? '✓ Enabled' : '✗ Disabled'}
                </p>
                <p>
                  <strong>Frequency:</strong> {preferences.frequency}
                </p>
              </div>
            ) : (
              <p>No preferences found.</p>
            )}
          </div>
        </div>

        <h3 style={{ marginTop: '30px' }}>Activity Logs</h3>
        <div
          style={{
            background: '#f5f5f5',
            padding: '15px',
            borderRadius: '5px',
            maxHeight: '300px',
            overflowY: 'auto',
          }}
        >
          {activityLogs.length > 0 ? (
            activityLogs.map((log) => (
              <div
                key={log._id}
                style={{
                  marginBottom: '10px',
                  padding: '10px',
                  background: 'white',
                  borderRadius: '3px',
                }}
              >
                <strong>{log.action}</strong> - {log.resource}
                <br />
                <small>{new Date(log.timestamp).toLocaleString()}</small>
              </div>
            ))
          ) : (
            <p>No activity logs found</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Customers</h2>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <input
          type="text"
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', flex: 1 }}
        />
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Name</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Email</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Status</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Orders</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Spent</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer._id} style={{ borderBottom: '1px solid #eee' }}>

                <td style={{ padding: '10px' }}>{customer.name}</td>
                <td style={{ padding: '10px' }}>{customer.email}</td>
                <td style={{ padding: '10px' }}>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: '3px',
                      background: customer.status === 'active' ? '#e7f5ff' : '#ffe7e7',
                      color: customer.status === 'active' ? '#0c5aa0' : '#d00',
                    }}
                  >
                    {customer.status}
                  </span>
                </td>
                <td style={{ padding: '10px' }}>{customer.totalOrders}</td>
                <td style={{ padding: '10px' }}>${customer.totalSpent}</td>
                <td style={{ padding: '10px' }}>
                  <button
                    onClick={() => loadCustomerDetail(String(customer._id))}
                    style={{

                      padding: '4px 8px',
                      background: '#228be6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                    }}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {loading && <p>Loading...</p>}
    </div>
  );
}

