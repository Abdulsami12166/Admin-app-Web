import React, { useEffect, useState } from 'react';
import { inventoryApi, type InventoryItem, type StockMovement } from '../services/inventory';

interface InventoryProps {
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

export function InventorySection({ onError, onSuccess }: InventoryProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [updateForm, setUpdateForm] = useState({ type: 'in', quantity: 0, reason: '' });

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
        <button onClick={() => setSelectedItem(null)} style={{ marginBottom: '20px' }}>← Back</button>\n        <h2>Inventory: {selectedItem.product}</h2>\n        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>\n          <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px' }}>\n            <h3>Stock Levels</h3>\n            <p><strong>Current Stock:</strong> {selectedItem.currentStock}</p>\n            <p><strong>Reserved:</strong> {selectedItem.reservedStock}</p>\n            <p><strong>Available:</strong> {selectedItem.availableStock}</p>\n            <p><strong>Reorder Level:</strong> {selectedItem.reorderLevel}</p>\n            <p><strong>Reorder Qty:</strong> {selectedItem.reorderQuantity}</p>\n            {selectedItem.lowStockAlert && <p style={{ color: '#ff6b6b' }}>⚠ Low Stock Alert Active</p>}\n          </div>\n          <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px' }}>\n            <h3>Update Stock</h3>\n            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>\n              <select\n                value={updateForm.type}\n                onChange={(e) => setUpdateForm({ ...updateForm, type: e.target.value })}\n                style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}\n              >\n                <option value=\"in\">Stock In</option>\n                <option value=\"out\">Stock Out</option>\n                <option value=\"adjustment\">Adjustment</option>\n                <option value=\"damage\">Damage</option>\n                <option value=\"return\">Return</option>\n              </select>\n              <input\n                type=\"number\"\n                placeholder=\"Quantity\"\n                value={updateForm.quantity}\n                onChange={(e) => setUpdateForm({ ...updateForm, quantity: Number(e.target.value) })}\n                style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}\n              />\n              <input\n                type=\"text\"\n                placeholder=\"Reason\"\n                value={updateForm.reason}\n                onChange={(e) => setUpdateForm({ ...updateForm, reason: e.target.value })}\n                style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}\n              />\n              <button\n                onClick={() => handleUpdateStock(selectedItem._id)}\n                style={{ padding: '8px', background: '#51cf66', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}\n              >\n                Update Stock\n              </button>\n            </div>\n          </div>\n        </div>\n        <h3>Stock Movements</h3>\n        <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px', maxHeight: '300px', overflowY: 'auto' }}>\n          {movements.length > 0 ? (\n            movements.map((mov) => (\n              <div key={mov._id} style={{ marginBottom: '10px', padding: '10px', background: 'white', borderRadius: '3px' }}>\n                <strong>{mov.type.toUpperCase()}</strong> - Qty: {mov.quantity}\n                <br />\n                <small>{mov.reason}</small>\n                <br />\n                <small>{new Date(mov.createdAt).toLocaleString()}</small>\n              </div>\n            ))\n          ) : (\n            <p>No movements found</p>\n          )}\n        </div>\n      </div>\n    );\n  }\n\n  return (\n    <div style={{ padding: '20px' }}>\n      <h2>Inventory Management</h2>\n      <div style={{ marginBottom: '20px' }}>\n        <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>\n          <input\n            type=\"checkbox\"\n            checked={showLowStockOnly}\n            onChange={(e) => setShowLowStockOnly(e.target.checked)}\n          />\n          Show Low Stock Only\n        </label>\n      </div>\n      <div style={{ overflowX: 'auto' }}>\n        <table style={{ width: '100%', borderCollapse: 'collapse' }}>\n          <thead>\n            <tr style={{ background: '#f5f5f5' }}>\n              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Product</th>\n              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Current</th>\n              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Available</th>\n              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Reorder Level</th>\n              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Alert</th>\n              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Action</th>\n            </tr>\n          </thead>\n          <tbody>\n            {inventory.map((item) => (\n              <tr key={item._id} style={{ borderBottom: '1px solid #eee' }}>\n                <td style={{ padding: '10px' }}>{item.product}</td>\n                <td style={{ padding: '10px' }}>{item.currentStock}</td>\n                <td style={{ padding: '10px' }}>{item.availableStock}</td>\n                <td style={{ padding: '10px' }}>{item.reorderLevel}</td>\n                <td style={{ padding: '10px' }}>\n                  {item.lowStockAlert && <span style={{ color: '#ff6b6b' }}>⚠</span>}\n                </td>\n                <td style={{ padding: '10px' }}>\n                  <button\n                    onClick={() => loadItemDetail(item._id)}\n                    style={{ padding: '4px 8px', background: '#228be6', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}\n                  >\n                    Manage\n                  </button>\n                </td>\n              </tr>\n            ))}\n          </tbody>\n        </table>\n      </div>\n      {loading && <p>Loading...</p>}\n    </div>\n  );\n}
