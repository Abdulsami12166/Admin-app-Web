import React, { useEffect, useState } from 'react';
import { adminApi } from '../services/api';

interface BulkOperation {
  id: string;
  type: string;
  status: 'scheduled' | 'processing' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  totalItems: number;
  processedItems: number;
}

interface BulkOperationsSectionProps {
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

function normalizeOperation(op: any): BulkOperation {
  return {
    id: op.id || op._id || '',
    type: op.type || '',
    status: op.status || 'processing',
    createdAt: op.createdAt || new Date().toISOString(),
    totalItems: op.totalItems ?? op.totalProducts ?? op.totalUpdates ?? 0,
    processedItems: op.processedItems ?? op.processedProducts ?? op.processedUpdates ?? 0,
  };
}

function opStatusBadge(status: string) {
  const map: Record<string, string> = {
    completed: 'badge-success',
    processing: 'badge-info',
    scheduled: 'badge-warning',
    failed: 'badge-danger',
    cancelled: 'badge-danger',
  };
  return <span className={`badge ${map[status] ?? 'badge-neutral'}`}>{status}</span>;
}

export function BulkOperationsSection({ onError, onSuccess }: BulkOperationsSectionProps) {
  const [operations, setOperations] = useState<BulkOperation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [operationType, setOperationType] = useState('visibility');
  const [formData, setFormData] = useState({
    productIds: '',
    action: 'show',
    scheduleDate: '',
    categoryId: '',
    priceAdjustment: '',
    adjustmentType: 'percentage' as 'fixed' | 'percentage',
    inventoryUpdates: '',
  });

  const loadOperations = async () => {
    setLoading(true);
    try {
      const result: any = await adminApi('/admin/bulk-operations', 'GET');
      const raw: any[] = Array.isArray(result.data) ? result.data : [];
      setOperations(raw.map(normalizeOperation));
    } catch (err) {
      onError(`Failed to load bulk operations: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOperation = async () => {
    const productIdList = formData.productIds.split(',').map(id => id.trim()).filter(Boolean);

    if (operationType !== 'inventory' && productIdList.length === 0) {
      onError('Product IDs are required');
      return;
    }

    setSubmitting(true);
    try {
      let result: any;

      if (operationType === 'visibility') {
        result = await adminApi('/admin/bulk-operations/visibility', 'POST', {
          productIds: productIdList,
          visible: formData.action === 'show',
          scheduleDate: formData.scheduleDate || undefined,
        });
      } else if (operationType === 'inventory') {
        const updates = formData.inventoryUpdates
          .split(',')
          .map(entry => {
            const [productId, quantity] = entry.split(':').map(s => s.trim());
            return { productId, quantity: parseInt(quantity || '0', 10), action: 'set' };
          })
          .filter(u => u.productId);
        if (updates.length === 0) {
          onError('Inventory updates must be in "productId:quantity" format, comma-separated');
          return;
        }
        result = await adminApi('/admin/bulk-operations/inventory', 'POST', { updates });
      } else if (operationType === 'category') {
        if (!formData.categoryId.trim()) { onError('Category ID is required'); return; }
        result = await adminApi('/admin/bulk-operations/category', 'POST', {
          productIds: productIdList,
          categoryId: formData.categoryId.trim(),
        });
      } else if (operationType === 'pricing') {
        const adj = parseFloat(formData.priceAdjustment);
        if (isNaN(adj)) { onError('Price adjustment must be a number'); return; }
        result = await adminApi('/admin/bulk-operations/pricing', 'POST', {
          productIds: productIdList,
          priceAdjustment: adj,
          adjustmentType: formData.adjustmentType,
        });
      }

      if (result?.data) {
        setOperations(prev => [normalizeOperation(result.data), ...prev]);
      }
      setFormData({ productIds: '', action: 'show', scheduleDate: '', categoryId: '', priceAdjustment: '', adjustmentType: 'percentage', inventoryUpdates: '' });
      setShowForm(false);
      onSuccess('Bulk operation completed successfully');
    } catch (err) {
      onError(`Failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelOperation = async (opId: string) => {
    try {
      await adminApi(`/admin/bulk-operations/${opId}/cancel`, 'POST');
      setOperations(prev => prev.map(op => op.id === opId ? { ...op, status: 'cancelled' } : op));
      onSuccess('Operation cancelled');
    } catch (err) {
      onError(`Failed to cancel: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  useEffect(() => { loadOperations(); }, []);

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h2 style={{ margin: 0 }}>Bulk Operations</h2>
        <div className="action-bar" style={{ margin: 0 }}>
          <button className="secondary" onClick={loadOperations} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <button onClick={() => setShowForm(v => !v)}>
            {showForm ? 'Cancel' : '+ New Bulk Operation'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="section-box" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem', color: '#63d2ff', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>New Bulk Operation</h3>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', color: '#9fb6cb', fontSize: '0.85rem', fontWeight: 700 }}>
                Operation Type
              </label>
              <select value={operationType} onChange={e => setOperationType(e.target.value)}>
                <option value="visibility">Toggle Product Visibility</option>
                <option value="inventory">Update Inventory</option>
                <option value="category">Assign Category</option>
                <option value="pricing">Update Pricing</option>
              </select>
            </div>

            {operationType !== 'inventory' && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: '#9fb6cb', fontSize: '0.85rem', fontWeight: 700 }}>
                  Product IDs (comma-separated)
                </label>
                <textarea
                  value={formData.productIds}
                  onChange={e => setFormData({ ...formData, productIds: e.target.value })}
                  placeholder="e.g. 64abc123, 64def456"
                  style={{ minHeight: 80 }}
                />
              </div>
            )}

            {operationType === 'visibility' && (
              <>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', color: '#9fb6cb', fontSize: '0.85rem', fontWeight: 700 }}>Action</label>
                  <select value={formData.action} onChange={e => setFormData({ ...formData, action: e.target.value })}>
                    <option value="show">Show Products</option>
                    <option value="hide">Hide Products</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', color: '#9fb6cb', fontSize: '0.85rem', fontWeight: 700 }}>Schedule Date (Optional)</label>
                  <input
                    type="datetime-local"
                    value={formData.scheduleDate}
                    onChange={e => setFormData({ ...formData, scheduleDate: e.target.value })}
                  />
                </div>
              </>
            )}

            {operationType === 'inventory' && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: '#9fb6cb', fontSize: '0.85rem', fontWeight: 700 }}>
                  Inventory Updates — format: <code style={{ color: '#63d2ff' }}>productId:quantity</code>, comma-separated
                </label>
                <textarea
                  value={formData.inventoryUpdates}
                  onChange={e => setFormData({ ...formData, inventoryUpdates: e.target.value })}
                  placeholder="e.g. 64abc123:50, 64def456:100"
                  style={{ minHeight: 80 }}
                />
              </div>
            )}

            {operationType === 'category' && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: '#9fb6cb', fontSize: '0.85rem', fontWeight: 700 }}>Category ID</label>
                <input
                  type="text"
                  value={formData.categoryId}
                  onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                  placeholder="e.g. 64abc789"
                />
              </div>
            )}

            {operationType === 'pricing' && (
              <>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', color: '#9fb6cb', fontSize: '0.85rem', fontWeight: 700 }}>Adjustment Type</label>
                  <select value={formData.adjustmentType} onChange={e => setFormData({ ...formData, adjustmentType: e.target.value as 'fixed' | 'percentage' })}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', color: '#9fb6cb', fontSize: '0.85rem', fontWeight: 700 }}>
                    {formData.adjustmentType === 'percentage' ? 'Percentage change (e.g. -10 for 10% off)' : 'Fixed amount change (e.g. -500 for ₹500 off)'}
                  </label>
                  <input
                    type="number"
                    value={formData.priceAdjustment}
                    onChange={e => setFormData({ ...formData, priceAdjustment: e.target.value })}
                    placeholder={formData.adjustmentType === 'percentage' ? 'e.g. -10' : 'e.g. -500'}
                  />
                </div>
              </>
            )}

            <div className="action-bar">
              <button onClick={handleCreateOperation} disabled={submitting}>
                {submitting ? 'Creating…' : 'Create Operation'}
              </button>
              <button className="secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Operation ID</th>
              <th>Type</th>
              <th>Progress</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {operations.map(op => {
              const pct = op.totalItems > 0 ? Math.min(100, Math.round((op.processedItems / op.totalItems) * 100)) : 100;
              return (
                <tr key={op.id}>
                  <td><small style={{ fontFamily: 'monospace', color: '#9fb6cb' }}>{op.id.slice(-12) || '—'}</small></td>
                  <td style={{ fontWeight: 700 }}>{op.type.replace('bulk_', '').replace(/_/g, ' ')}</td>
                  <td style={{ minWidth: 120 }}>
                    <div style={{ background: '#0a1728', borderRadius: '999px', overflow: 'hidden', height: 8 }}>
                      <div style={{ background: op.status === 'completed' ? '#43d17a' : op.status === 'failed' ? '#ff8b8b' : '#63d2ff', width: `${pct}%`, height: '100%', transition: 'width 0.3s' }} />
                    </div>
                    <small style={{ color: '#9fb6cb' }}>{op.processedItems}/{op.totalItems}</small>
                  </td>
                  <td>{opStatusBadge(op.status)}</td>
                  <td><small>{new Date(op.createdAt).toLocaleString()}</small></td>
                  <td>
                    {(op.status === 'processing' || op.status === 'scheduled') && (
                      <button className="secondary danger-text" onClick={() => handleCancelOperation(op.id)}>Cancel</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && !operations.length && <div className="state-empty">No bulk operations yet. Use the button above to start one.</div>}
        {loading && <div className="state-loading">Loading operations…</div>}
      </div>
    </div>
  );
}
