import React, { useEffect, useState } from 'react';
import { inventoryApi, type InventoryItem, type StockMovement } from '../services/inventory';

interface InventoryProps {
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

type UpdateType = 'in' | 'out' | 'adjustment' | 'damage' | 'return';

type UpdateForm = {
  type: UpdateType;
  quantity: number;
  reason: string;
};

export function InventorySection({ onError, onSuccess }: InventoryProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [updateForm, setUpdateForm] = useState<UpdateForm>({
    type: 'in',
    quantity: 0,
    reason: '',
  });

  const loadInventory = async () => {
    setLoading(true);
    try {
      const result = await inventoryApi.getInventory(1, 50, showLowStockOnly);
      setInventory(result.data?.inventory || []);
    } catch (err) {
      onError(`Failed to load inventory: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const loadItemDetail = async (itemId: string) => {
    setLoading(true);
    try {
      const [detail, stockMovements] = await Promise.all([
        inventoryApi.getProductInventory(itemId),
        inventoryApi.getStockMovements(itemId),
      ]);
      setSelectedItem(detail.data?.inventory || null);
      setMovements(stockMovements.data?.movements || []);
    } catch (err) {
      onError(`Failed to load item detail: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async (productId: string) => {
    if (updateForm.quantity <= 0 || !updateForm.reason) {
      onError('Please fill all fields');
      return;
    }

    try {
      await inventoryApi.updateStock(productId, updateForm);
      onSuccess('Stock updated successfully');
      setUpdateForm({ type: 'in', quantity: 0, reason: '' });
      loadItemDetail(productId);
    } catch (err) {
      onError(`Failed to update stock: ${err}`);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [showLowStockOnly]);

  if (selectedItem) {
    return (
      <div style={{ padding: '20px' }}>
        <button onClick={() => setSelectedItem(null)} style={{ marginBottom: '20px' }}>
          ← Back
        </button>
        <h2>Inventory: {selectedItem.product}</h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            marginBottom: '30px',
          }}
        >
          <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px' }}>
            <h3>Stock Levels</h3>
            <p>
              <strong>Current Stock:</strong> {selectedItem.currentStock}
            </p>
            <p>
              <strong>Reserved:</strong> {selectedItem.reservedStock}
            </p>
            <p>
              <strong>Available:</strong> {selectedItem.availableStock}
            </p>
            <p>
              <strong>Reorder Level:</strong> {selectedItem.reorderLevel}
            </p>
            <p>
              <strong>Reorder Qty:</strong> {selectedItem.reorderQuantity}
            </p>
            {selectedItem.lowStockAlert && (
              <p style={{ color: '#ff6b6b' }}>⚠ Low Stock Alert Active</p>
            )}
          </div>

          <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px' }}>
            <h3>Update Stock</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <select
                value={updateForm.type}
                onChange={(e) => setUpdateForm({ ...updateForm, type: e.target.value as UpdateType })}
                style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="in">Stock In</option>
                <option value="out">Stock Out</option>
                <option value="adjustment">Adjustment</option>
                <option value="damage">Damage</option>
                <option value="return">Return</option>
              </select>

              <input
                type="number"
                placeholder="Quantity"
                value={updateForm.quantity}
                onChange={(e) => setUpdateForm({ ...updateForm, quantity: Number(e.target.value) })}
                style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />

              <input
                type="text"
                placeholder="Reason"
                value={updateForm.reason}
                onChange={(e) => setUpdateForm({ ...updateForm, reason: e.target.value })}
                style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />

              <button
                onClick={() => handleUpdateStock(selectedItem._id)}
                style={{
                  padding: '8px',
                  background: '#51cf66',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Update Stock
              </button>
            </div>
          </div>
        </div>

        <h3>Stock Movements</h3>
        <div
          style={{
            background: '#f5f5f5',
            padding: '15px',
            borderRadius: '5px',
            maxHeight: '300px',
            overflowY: 'auto',
          }}
        >
          {movements.length > 0 ? (
            movements.map((mov) => (
              <div
                key={mov._id}
                style={{
                  marginBottom: '10px',
                  padding: '10px',
                  background: 'white',
                  borderRadius: '3px',
                }}
              >
                <strong>{mov.type.toUpperCase()}</strong> - Qty: {mov.quantity}
                <br />
                <small>{mov.reason}</small>
                <br />
                <small>{new Date(mov.createdAt).toLocaleString()}</small>
              </div>
            ))
          ) : (
            <p>No movements found</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Inventory Management</h2>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="checkbox"
            checked={showLowStockOnly}
            onChange={(e) => setShowLowStockOnly(e.target.checked)}
          />
          Show Low Stock Only
        </label>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Product</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Current</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Available</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Reorder Level</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Alert</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => (
              <tr key={item._id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px' }}>{item.product}</td>
                <td style={{ padding: '10px' }}>{item.currentStock}</td>
                <td style={{ padding: '10px' }}>{item.availableStock}</td>
                <td style={{ padding: '10px' }}>{item.reorderLevel}</td>
                <td style={{ padding: '10px' }}>
                  {item.lowStockAlert && <span style={{ color: '#ff6b6b' }}>⚠</span>}
                </td>
                <td style={{ padding: '10px' }}>
                  <button
                    onClick={() => loadItemDetail(item._id)}
                    style={{
                      padding: '4px 8px',
                      background: '#228be6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                    }}
                  >
                    Manage
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

