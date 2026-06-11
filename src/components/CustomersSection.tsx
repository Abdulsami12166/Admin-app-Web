import React, { useEffect, useState } from 'react';
import { customerApi, type Customer, type ActivityLog, type NotificationPreference } from '../services/customers';

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
      onError(`Failed to load customers: ${err}`);
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
      onError(`Failed to load customer detail: ${err}`);
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
      onError(`Failed to block customer: ${err}`);
    }
  };

  const handleUnblockCustomer = async (customerId: string) => {
    try {
      await customerApi.unblockCustomer(customerId);
      onSuccess('Customer unblocked successfully');
      loadCustomers();
    } catch (err) {
      onError(`Failed to unblock customer: ${err}`);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [page, search]);

  if (selectedCustomer) {
    return (
      <div style={{ padding: '20px' }}>
        <button onClick={() => setSelectedCustomer(null)} style={{ marginBottom: '20px' }}>← Back</button>
        <h2>{selectedCustomer.name}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <h3>Customer Info</h3>
            <p><strong>Email:</strong> {selectedCustomer.email}</p>
            <p><strong>Phone:</strong> {selectedCustomer.phone || 'N/A'}</p>
            <p><strong>Status:</strong> {selectedCustomer.status}</p>
            <p><strong>Total Orders:</strong> {selectedCustomer.totalOrders}</p>
            <p><strong>Total Spent:</strong> ${selectedCustomer.totalSpent}</p>
            <div style={{ marginTop: '20px' }}>
              {selectedCustomer.status === 'active' ? (
                <button onClick={() => handleBlockCustomer(selectedCustomer._id)} style={{ background: '#ff6b6b', color: 'white', padding: '8px 16px', border: 'none', cursor: 'pointer' }}>
                  Block Customer\n                </button>\n              ) : (\n                <button onClick={() => handleUnblockCustomer(selectedCustomer._id)} style={{ background: '#51cf66', color: 'white', padding: '8px 16px', border: 'none', cursor: 'pointer' }}>\n                  Unblock Customer\n                </button>\n              )}\n            </div>\n          </div>\n          <div>\n            <h3>Notification Preferences</h3>\n            {preferences && (\n              <div>\n                <p><strong>Email:</strong> {preferences.channels.email ? '✓ Enabled' : '✗ Disabled'}</p>\n                <p><strong>SMS:</strong> {preferences.channels.sms ? '✓ Enabled' : '✗ Disabled'}</p>\n                <p><strong>Push:</strong> {preferences.channels.push ? '✓ Enabled' : '✗ Disabled'}</p>\n                <p><strong>In-App:</strong> {preferences.channels.inApp ? '✓ Enabled' : '✗ Disabled'}</p>\n                <p><strong>Frequency:</strong> {preferences.frequency}</p>\n              </div>\n            )}\n          </div>\n        </div>\n        <h3 style={{ marginTop: '30px' }}>Activity Logs</h3>\n        <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px', maxHeight: '300px', overflowY: 'auto' }}>\n          {activityLogs.length > 0 ? (\n            activityLogs.map((log) => (\n              <div key={log._id} style={{ marginBottom: '10px', padding: '10px', background: 'white', borderRadius: '3px' }}>\n                <strong>{log.action}</strong> - {log.resource}\n                <br />\n                <small>{new Date(log.timestamp).toLocaleString()}</small>\n              </div>\n            ))\n          ) : (\n            <p>No activity logs found</p>\n          )}\n        </div>\n      </div>\n    );\n  }\n\n  return (\n    <div style={{ padding: '20px' }}>\n      <h2>Customers</h2>\n      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>\n        <input\n          type=\"text\"\n          placeholder=\"Search customers...\"\n          value={search}\n          onChange={(e) => setSearch(e.target.value)}\n          style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', flex: 1 }}\n        />\n      </div>\n      <div style={{ overflowX: 'auto' }}>\n        <table style={{ width: '100%', borderCollapse: 'collapse' }}>\n          <thead>\n            <tr style={{ background: '#f5f5f5' }}>\n              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Name</th>\n              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Email</th>\n              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Status</th>\n              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Orders</th>\n              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Spent</th>\n              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Action</th>\n            </tr>\n          </thead>\n          <tbody>\n            {customers.map((customer) => (\n              <tr key={customer._id} style={{ borderBottom: '1px solid #eee' }}>\n                <td style={{ padding: '10px' }}>{customer.name}</td>\n                <td style={{ padding: '10px' }}>{customer.email}</td>\n                <td style={{ padding: '10px' }}>\n                  <span style={{ \n                    padding: '4px 8px', \n                    borderRadius: '3px', \n                    background: customer.status === 'active' ? '#e7f5ff' : '#ffe7e7',\n                    color: customer.status === 'active' ? '#0c5aa0' : '#d00'\n                  }}>\n                    {customer.status}\n                  </span>\n                </td>\n                <td style={{ padding: '10px' }}>{customer.totalOrders}</td>\n                <td style={{ padding: '10px' }}>${customer.totalSpent}</td>\n                <td style={{ padding: '10px' }}>\n                  <button\n                    onClick={() => loadCustomerDetail(customer._id)}\n                    style={{ padding: '4px 8px', background: '#228be6', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}\n                  >\n                    View\n                  </button>\n                </td>\n              </tr>\n            ))}\n          </tbody>\n        </table>\n      </div>\n      {loading && <p>Loading...</p>}\n    </div>\n  );\n}
