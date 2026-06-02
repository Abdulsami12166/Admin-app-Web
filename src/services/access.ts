import type {AdminRole} from './api';

export type Permission =
  | 'dashboard:view'
  | 'rbac:manage'
  | 'users:view'
  | 'users:control'
  | 'products:view'
  | 'products:create'
  | 'products:publish'
  | 'orders:view'
  | 'orders:update'
  | 'transactions:view'
  | 'analytics:view'
  | 'activity:view';

export const roleLabels: Record<AdminRole, string> = {
  'super-admin': 'Super Admin',
  admin: 'Admin',
  'product-manager': 'Product Manager',
  support: 'Support',
};

export const rolePermissions: Record<AdminRole, Permission[]> = {
  'super-admin': [
    'dashboard:view',
    'rbac:manage',
    'users:view',
    'users:control',
    'products:view',
    'products:create',
    'products:publish',
    'orders:view',
    'orders:update',
    'transactions:view',
    'analytics:view',
    'activity:view',
  ],
  admin: [
    'dashboard:view',
    'users:view',
    'users:control',
    'products:view',
    'products:create',
    'products:publish',
    'orders:view',
    'orders:update',
    'transactions:view',
    'analytics:view',
    'activity:view',
  ],
  'product-manager': [
    'dashboard:view',
    'products:view',
    'products:create',
    'products:publish',
    'orders:view',
    'orders:update',
    'transactions:view',
    'analytics:view',
  ],
  support: ['dashboard:view', 'users:view', 'orders:view', 'activity:view'],
};

export function normalizeRole(role?: string): AdminRole {
  const value = (role || '').toLowerCase().replace(/[_\s]+/g, '-');

  if (value === 'super-admin' || value === 'admin' || value === 'product-manager' || value === 'support') {
    return value;
  }

  return 'admin';
}

export function can(role: string | undefined, permission: Permission) {
  return rolePermissions[normalizeRole(role)].includes(permission);
}
