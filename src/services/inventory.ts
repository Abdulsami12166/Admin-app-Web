import { adminApi } from './api';

export interface InventoryItem {
  _id: string;
  product: string | { _id: string; title?: string; name?: string; sku?: string; category?: string; price?: number };
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  reorderLevel: number;
  reorderQuantity: number;
  location?: string;        // warehouse location
  binLocation?: string;     // specific bin/shelf
  lastRestockedAt?: string; // ISO date of last restock
  lowStockAlert: boolean;
  outOfStockAlert?: boolean;
}

export interface StockMovement {
  _id: string;
  type: 'in' | 'out' | 'adjustment' | 'damage' | 'return';
  quantity: number;
  reference?: string;
  reason: string;
  createdBy: string;
  createdAt: string;
}

export const inventoryApi = {
  async getInventory(page = 1, limit = 20, lowStockOnly = false, search = '') {
    return adminApi(`/admin/inventory?page=${page}&limit=${limit}&lowStock=${lowStockOnly}&search=${search}`, 'GET');
  },

  async getProductInventory(productId: string) {
    return adminApi(`/admin/inventory/product/${productId}`, 'GET');
  },

  async updateStock(productId: string, data: {type: string; quantity: number; reason: string; reference?: string}) {
    return adminApi(`/admin/inventory/product/${productId}/stock`, 'PATCH', data);
  },

  async updateReorderSettings(productId: string, data: {reorderLevel: number; reorderQuantity: number}) {
    return adminApi(`/admin/inventory/product/${productId}/reorder`, 'PATCH', data);
  },

  async getLowStockProducts() {
    return adminApi('/admin/inventory/low-stock', 'GET');
  },

  async getStockMovements(productId: string, page = 1, limit = 50) {
    return adminApi(`/admin/inventory/product/${productId}/movements?page=${page}&limit=${limit}`, 'GET');
  },

  async getInventoryStats() {
    return adminApi('/admin/inventory/stats', 'GET');
  },
};
