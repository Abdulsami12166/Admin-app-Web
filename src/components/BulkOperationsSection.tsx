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

// Normalize field name differences between operation types returned by the backend
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
    // Inventory update: comma-separated "productId:quantity" pairs
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
    const productIdList = formData.productIds
      .split(',')
      .map(id => id.trim())
      .filter(Boolean);

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
        if (!formData.categoryId.trim()) {
          onError('Category ID is required');
          return;
        }
        result = await adminApi('/admin/bulk-operations/category', 'POST', {
          productIds: productIdList,
          categoryId: formData.categoryId.trim(),
        });
      } else if (operationType === 'pricing') {
        const adj = parseFloat(formData.priceAdjustment);
        if (isNaN(adj)) {
          onError('Price adjustment must be a number');
          return;
        }
        result = await adminApi('/admin/bulk-operations/pricing', 'POST', {
          productIds: productIdList,
          priceAdjustment: adj,
          adjustmentType: formData.adjustmentType,
        });
      }

      if (result?.data) {
        setOperations(prev => [normalizeOperation(result.data), ...prev]);
      }
      setFormData({
        productIds: '',
        action: 'show',
        scheduleDate: '',
        categoryId: '',
        priceAdjustment: '',
        adjustmentType: 'percentage',
        inventoryUpdates: '',
      });
      setShowForm(false);
      onSuccess('Bulk operation created successfully');
    } catch (err) {
      onError(`Failed to create operation: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelOperation = async (opId: string) => {
    try {
      await adminApi(`/admin/bulk-operations/${opId}/cancel`, 'POST');
      setOperations(prev =>
        prev.map(op => op.id === opId ? { ...op, status: 'cancelled' } : op)
      );
      onSuccess('Bulk operation cancelled');
    } catch (err) {
      onError(`Failed to cancel operation: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  useEffect(() => {
    loadOperations();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#d4edda';
      case 'processing': return '#cfe2ff';
      case 'scheduled': return '#fff3cd';
      case 'failed':
      case 'cancelled': return '#f8d7da';
      default: return '#e2e3e5';
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Bulk Operations</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={loadOperations}
            disabled={loading}
            style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 4, cursor: 'pointer' }}
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{ padding: '10px 15px', background: '#28a745', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
          >
            + New Bulk Operation
          </button>
        </div>
      </div>

      {showForm && (
        <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Operation Type:</label>
            <select
              value={operationType}
              onChange={(e) => setOperationType(e.target.value)}
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
            >
              <option value="visibility">Toggle Product Visibility</option>
              <option value="inventory">Update Inventory</option>
              <option value="category">Assign Category</option>
              <option value="pricing">Update Pricing</option>
            </select>
          </div>

          {operationType !== 'inventory' && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Product IDs (comma-separated):</label>
              <textarea
                value={formData.productIds}
                onChange={(e) => setFormData({ ...formData, productIds: e.target.value })}
                placeholder="e.g., 64abc123, 64def456"
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '80px', boxSizing: 'border-box' }}
              />
            </div>
          )}

          {operationType === 'visibility' && (
            <>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Action:</label>
                <select
                  value={formData.action}
                  onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="show">Show Products</option>
                  <option value="hide">Hide Products</option>
                </select>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Schedule Date (Optional):</label>
                <input
                  type="datetime-local"
                  value={formData.scheduleDate}
                  onChange={(e) => setFormData({ ...formData, scheduleDate: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                />
              </div>
            </>
          )}

          {operationType === 'inventory' && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Inventory Updates (format: <code>productId:quantity</code>, comma-separated):
              </label>
              <textarea
                value={formData.inventoryUpdates}
                onChange={(e) => setFormData({ ...formData, inventoryUpdates: e.target.value })}
                placeholder="e.g., 64abc123:50, 64def456:100"
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '80px', boxSizing: 'border-box' }}
              />
            </div>
          )}

          {operationType === 'category' && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Category ID:</label>
              <input
                type="text"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                placeholder="e.g., 64abc789"
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
              />
            </div>
          )}

          {operationType === 'pricing' && (
            <>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Adjustment Type:</label>
                <select
                  value={formData.adjustmentType}
                  onChange={(e) => setFormData({ ...formData, adjustmentType: e.target.value as 'fixed' | 'percentage' })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount ($)</option>
                </select>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>
                  {formData.adjustmentType === 'percentage' ? 'Percentage Change (e.g. -10 for 10% off):' : 'Fixed Amount Change (e.g. -5 for $5 off):'}
                </label>
                <input
                  type="number"
                  value={formData.priceAdjustment}
                  onChange={(e) => setFormData({ ...formData, priceAdjustment: e.target.value })}
                  placeholder={formData.adjustmentType === 'percentage' ? 'e.g., -10' : 'e.g., -5'}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                />
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleCreateOperation}
              disabled={submitting}
              style={{ padding: '8px 15px', background: '#28a745', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
            >
              {submitting ? 'Creating…' : 'Create'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              style={{ padding: '8px 15px', background: '#6c757d', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            {['Operation ID', 'Type', 'Progress', 'Status', 'Created', 'Actions'].map(h => (
              <th key={h} style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {operations.map((operation) => (
            <tr key={operation.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px', fontFamily: 'monospace', fontSize: 12 }}>{operation.id}</td>
              <td style={{ padding: '10px' }}>{operation.type.replace('bulk_', '').replace(/_/g, ' ')}</td>
              <td style={{ padding: '10px' }}>
                <div style={{ background: '#e9ecef', borderRadius: '4px', overflow: 'hidden', minWidth: 80 }}>
                  <div
                    style={{
                      background: '#28a745',
                      width: operation.totalItems > 0 ? `${Math.min(100, (operation.processedItems / operation.totalItems) * 100)}%` : '0%',
                      padding: '4px 8px',
                      color: 'white',
                      fontSize: '12px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {operation.processedItems}/{operation.totalItems}
                  </div>
                </div>
              </td>
              <td style={{ padding: '10px' }}>
                <span style={{ background: getStatusColor(operation.status), padding: '4px 8px', borderRadius: '3px' }}>
                  {operation.status}
                </span>
              </td>
              <td style={{ padding: '10px' }}>{new Date(operation.createdAt).toLocaleString()}</td>
              <td style={{ padding: '10px' }}>
                {(operation.status === 'processing' || operation.status === 'scheduled') && (
                  <button
                    onClick={() => handleCancelOperation(operation.id)}
                    style={{ padding: '5px 10px', background: '#dc3545', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                  >
                    Cancel
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {!loading && operations.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
          No bulk operations found. Create one using the button above.
        </div>
      )}
      {loading && <div style={{ padding: 16, color: '#666' }}>Loading operations…</div>}
    </div>
  );
}
