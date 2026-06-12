import React, { useEffect, useState } from 'react';

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

export function BulkOperationsSection({ onError, onSuccess }: BulkOperationsSectionProps) {
  const [operations, setOperations] = useState<BulkOperation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [operationType, setOperationType] = useState('visibility');
  const [formData, setFormData] = useState({
    productIds: '',
    action: 'show',
    scheduleDate: '',
  });

  const loadOperations = async () => {
    setLoading(true);
    try {
      // Mock data
      setOperations([
        {
          id: 'bulk_1',
          type: 'bulk_visibility_toggle',
          status: 'completed',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          totalItems: 150,
          processedItems: 150,
        },
        {
          id: 'bulk_2',
          type: 'bulk_inventory_update',
          status: 'processing',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          totalItems: 75,
          processedItems: 45,
        },
        {
          id: 'bulk_3',
          type: 'bulk_pricing_update',
          status: 'scheduled',
          createdAt: new Date().toISOString(),
          totalItems: 200,
          processedItems: 0,
        },
      ]);
    } catch (err) {
      onError(`Failed to load operations: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOperation = async () => {
    if (!formData.productIds) {
      onError('Product IDs are required');
      return;
    }

    try {
      const newOperation: BulkOperation = {
        id: `bulk_${Date.now()}`,
        type: `bulk_${operationType}`,
        status: formData.scheduleDate ? 'scheduled' : 'processing',
        createdAt: new Date().toISOString(),
        totalItems: formData.productIds.split(',').length,
        processedItems: 0,
      };
      setOperations([newOperation, ...operations]);
      setFormData({ productIds: '', action: 'show', scheduleDate: '' });
      setShowForm(false);
      onSuccess('Bulk operation created successfully');
    } catch (err) {
      onError(`Failed to create operation: ${err}`);
    }
  };

  const handleCancelOperation = (opId: string) => {
    try {
      setOperations(
        operations.map(op => op.id === opId ? { ...op, status: 'cancelled' } : op)
      );
      onSuccess('Bulk operation cancelled');
    } catch (err) {
      onError(`Failed to cancel operation: ${err}`);
    }
  };

  useEffect(() => {
    loadOperations();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#d4edda';
      case 'processing':
        return '#cfe2ff';
      case 'scheduled':
        return '#fff3cd';
      case 'failed':
      case 'cancelled':
        return '#f8d7da';
      default:
        return '#e2e3e5';
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Bulk Operations</h2>

      <button
        onClick={() => setShowForm(!showForm)}
        style={{
          marginBottom: '15px',
          padding: '10px 15px',
          background: '#28a745',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          borderRadius: '4px',
        }}
      >
        + New Bulk Operation
      </button>

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

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Product IDs (comma-separated):</label>
            <textarea
              value={formData.productIds}
              onChange={(e) => setFormData({ ...formData, productIds: e.target.value })}
              placeholder="e.g., prod_1, prod_2, prod_3"
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '80px' }}
            />
          </div>

          {operationType === 'visibility' && (
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
          )}

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Schedule Date (Optional):</label>
            <input
              type="datetime-local"
              value={formData.scheduleDate}
              onChange={(e) => setFormData({ ...formData, scheduleDate: e.target.value })}
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>

          <button
            onClick={handleCreateOperation}
            style={{
              padding: '8px 15px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '4px',
              marginRight: '5px',
            }}
          >
            Create
          </button>
          <button
            onClick={() => setShowForm(false)}
            style={{
              padding: '8px 15px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '4px',
            }}
          >
            Cancel
          </button>
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Operation ID</th>
            <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Type</th>
            <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Progress</th>
            <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Status</th>
            <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Created</th>
            <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {operations.map((operation) => (
            <tr key={operation.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px' }}>{operation.id}</td>
              <td style={{ padding: '10px' }}>{operation.type.replace('bulk_', '')}</td>
              <td style={{ padding: '10px' }}>
                <div style={{ background: '#e9ecef', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      background: '#28a745',
                      width: `${(operation.processedItems / operation.totalItems) * 100}%`,
                      padding: '4px 8px',
                      color: 'white',
                      fontSize: '12px',
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
                    style={{
                      padding: '5px 10px',
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: '4px',
                    }}
                  >
                    Cancel
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {operations.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
          No bulk operations found
        </div>
      )}
    </div>
  );
}
