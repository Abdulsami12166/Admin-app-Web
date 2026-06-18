import React, { useEffect, useState } from 'react';
import { inventoryApi, type InventoryItem, type StockMovement } from '../services/inventory';

interface InventoryProps {
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

type UpdateType = 'in' | 'out' | 'adjustment' | 'damage' | 'return';

function productName(item: InventoryItem): string {
  const p = item.product as any;
  if (!p) return '—';
  if (typeof p === 'object') return p.title || p.name || String(p._id || p);
  return String(p);
}

function stockBadge(item: InventoryItem) {
  if (item.currentStock === 0) return <span className="badge badge-danger">Out of stock</span>;
  if (item.lowStockAlert) return <span className="badge badge-warning">Low stock</span>;
  return <span className="badge badge-success">In stock</span>;
}

export function InventorySection({ onError, onSuccess }: InventoryProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [updateForm, setUpdateForm] = useState<{ type: UpdateType; quantity: number; reason: string }>({
    type: 'in',
    quantity: 0,
    reason: '',
  });

  const loadInventory = async () => {
    setLoading(true);
    try {
      const [inv, statsRes] = await Promise.allSettled([
        inventoryApi.getInventory(1, 100, showLowStockOnly),
        inventoryApi.getInventoryStats(),
      ]);
      if (inv.status === 'fulfilled') {
        setInventory(inv.value.data?.inventory || inv.value.data?.items || []);
      }
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data || null);
      }
    } catch (err) {
      onError(`Failed to load inventory: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const loadItemDetail = async (item: InventoryItem) => {
    setLoading(true);
    // The backend route uses the Product's ObjectId, not the Inventory doc's _id
    const productId = typeof item.product === 'object' ? (item.product as any)._id : item.product;
    try {
      const [detail, movRes] = await Promise.all([
        inventoryApi.getProductInventory(productId),
        inventoryApi.getStockMovements(productId),
      ]);
      setSelectedItem(detail.data?.inventory || null);
      setMovements(movRes.data?.movements || movRes.data?.stockMovements || []);
    } catch (err) {
      onError(`Failed to load item detail: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async () => {
    if (!selectedItem) return;
    if (updateForm.quantity <= 0 || !updateForm.reason) {
      onError('Please enter a quantity greater than 0 and a reason.');
      return;
    }
    const productId = typeof selectedItem.product === 'object'
      ? (selectedItem.product as any)._id
      : selectedItem.product;
    try {
      await inventoryApi.updateStock(productId, updateForm);
      onSuccess('Stock updated successfully');
      setUpdateForm({ type: 'in', quantity: 0, reason: '' });
      loadItemDetail(selectedItem);
      loadInventory();
    } catch (err) {
      onError(`Failed to update stock: ${err}`);
    }
  };

  useEffect(() => { loadInventory(); }, [showLowStockOnly]);

  if (selectedItem) {
    const name = productName(selectedItem);
    return (
      <div style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <button className="secondary" onClick={() => setSelectedItem(null)}>← Back</button>
          <h2 style={{ margin: 0 }}>Inventory · {name}</h2>
        </div>

        <div className="detail-grid">
          <div className="section-box kv-list">
            <h3 style={{ margin: '0 0 1rem', color: '#63d2ff', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Stock Levels</h3>
            <p><strong>Current Stock</strong> {selectedItem.currentStock}</p>
            <p><strong>Reserved</strong> {selectedItem.reservedStock}</p>
            <p><strong>Available</strong> <span style={{ color: '#43d17a', fontWeight: 800 }}>{selectedItem.availableStock}</span></p>
            <p><strong>Reorder Level</strong> {selectedItem.reorderLevel}</p>
            <p><strong>Reorder Qty</strong> {selectedItem.reorderQuantity}</p>
            <p><strong>Status</strong> {stockBadge(selectedItem)}</p>
            {selectedItem.location && <p><strong>Location</strong> {selectedItem.location}</p>}
            {selectedItem.binLocation && <p><strong>Bin</strong> {selectedItem.binLocation}</p>}
          </div>

          <div className="section-box">
            <h3 style={{ margin: '0 0 1rem', color: '#63d2ff', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Update Stock</h3>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <select
                value={updateForm.type}
                onChange={e => setUpdateForm({ ...updateForm, type: e.target.value as UpdateType })}
              >
                <option value="in">Stock In (restock)</option>
                <option value="out">Stock Out (manual deduction)</option>
                <option value="adjustment">Adjustment</option>
                <option value="damage">Damage / Loss</option>
                <option value="return">Return from customer</option>
              </select>
              <input
                type="number"
                min={1}
                placeholder="Quantity"
                value={updateForm.quantity || ''}
                onChange={e => setUpdateForm({ ...updateForm, quantity: Number(e.target.value) })}
              />
              <input
                type="text"
                placeholder="Reason (required)"
                value={updateForm.reason}
                onChange={e => setUpdateForm({ ...updateForm, reason: e.target.value })}
              />
              <button onClick={() => handleUpdateStock()}>
                Update Stock
              </button>
            </div>
          </div>
        </div>

        <section className="panel">
          <h2>Stock Movements</h2>
          {movements.length ? movements.map((mov, i) => (
            <div key={mov._id || i} className={`timeline-entry ${mov.type === 'in' || mov.type === 'return' ? 'tl-success' : mov.type === 'damage' ? 'tl-danger' : 'tl-info'}`}>
              <strong>{mov.type.toUpperCase()} &nbsp;·&nbsp; Qty: {mov.quantity}</strong>
              <small>{mov.reason}</small>
              <small>{new Date(mov.createdAt).toLocaleString()}</small>
            </div>
          )) : <div className="state-empty">No stock movements recorded yet.</div>}
          {loading && <div className="state-loading">Loading...</div>}
        </section>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2 style={{ margin: '0 0 1.25rem' }}>Inventory Management</h2>

      <div className="stats-grid small" style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', marginBottom: '1.25rem' }}>
        <article className="stat"><strong>{stats?.totalProducts ?? inventory.length}</strong><span>SKUs Tracked</span></article>
        <article className="stat"><strong style={{ color: '#43d17a' }}>{stats?.totalStock ?? 0}</strong><span>Total Units</span></article>
        <article className="stat"><strong style={{ color: '#63d2ff' }}>{stats?.healthPercentage ?? 0}%</strong><span>Health</span></article>
        <article className="stat"><strong style={{ color: '#fcc419' }}>{stats?.lowStockCount ?? 0}</strong><span>Low Stock</span></article>
        <article className="stat"><strong style={{ color: '#ff8b8b' }}>{stats?.outOfStockCount ?? 0}</strong><span>Out of Stock</span></article>
      </div>

      <div className="section-filters">
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#dbe8f5', fontWeight: 700, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showLowStockOnly}
            onChange={e => setShowLowStockOnly(e.target.checked)}
            style={{ width: 'auto' }}
          />
          Show Low Stock Only
        </label>
        <button className="secondary" onClick={loadInventory} style={{ marginLeft: 'auto' }}>
          Refresh
        </button>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Current</th>
              <th>Reserved</th>
              <th>Available</th>
              <th>Reorder Level</th>
              <th>Last Restocked</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map(item => (
              <tr key={item._id}>
                <td style={{ fontWeight: 700 }}>{productName(item)}</td>
                <td>{item.currentStock}</td>
                <td>{item.reservedStock ?? 0}</td>
                <td style={{ color: item.availableStock === 0 ? '#ff8b8b' : '#43d17a', fontWeight: 700 }}>{item.availableStock}</td>
                <td>{item.reorderLevel}</td>
                <td><small>{item.lastRestockedAt ? new Date(item.lastRestockedAt).toLocaleDateString() : '—'}</small></td>
                <td>{stockBadge(item)}</td>
                <td>
                  <button className="secondary" onClick={() => loadItemDetail(item)}>
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !inventory.length && <div className="state-empty">No inventory records found. Products will appear here once created.</div>}
        {loading && <div className="state-loading">Loading inventory...</div>}
      </div>
    </div>
  );
}
