import type {AdminRole} from './api';

export type Permission =
  | 'dashboard:view'
  | 'admins:manage'
  | 'roles:assign'
  | 'system:configure'
  | 'users:view'
  | 'users:control'
  | 'products:view'
  | 'products:create'
  | 'products:publish'
  | 'products:delete'
  | 'categories:manage'
  | 'inventory:manage'
  | 'images:upload'
  | 'orders:view'
  | 'orders:update'
  | 'transactions:view'
  | 'analytics:view'
  | 'activity:view';

export type RolePermissionMatrix = Partial<Record<AdminRole, Permission[]>>;

export const allPermissions: Permission[] = [
  'dashboard:view',
  'admins:manage',
  'roles:assign',
  'system:configure',
  'users:view',
  'users:control',
  'products:view',
  'products:create',
  'products:publish',
  'products:delete',
  'categories:manage',
  'inventory:manage',
  'images:upload',
  'orders:view',
  'orders:update',
  'transactions:view',
  'analytics:view',
  'activity:view',
];

export const permissionLabels: Record<Permission, string> = {
  'dashboard:view': 'Dashboard navigation',
  'admins:manage': 'Create and view admins',
  'roles:assign': 'Assign role permissions',
  'system:configure': 'System configuration',
  'users:view': 'View users',
  'users:control': 'Block, unblock, logout users',
  'products:view': 'View products',
  'products:create': 'Create and edit products',
  'products:publish': 'Publish products',
  'products:delete': 'Delete products',
  'categories:manage': 'Manage categories',
  'inventory:manage': 'Manage inventory',
  'images:upload': 'Upload product images',
  'orders:view': 'View orders',
  'orders:update': 'Update orders',
  'transactions:view': 'View transactions',
  'analytics:view': 'View analytics',
  'activity:view': 'View activities',
};

export const managedAdminRoles: AdminRole[] = ['product-manager', 'inventory-manager', 'support'];

export const roleLabels: Record<AdminRole, string> = {
  'super-admin': 'Super Admin',
  admin: 'Admin',
  'product-manager': 'Product Manager',
  'inventory-manager': 'Inventory Manager',
  support: 'Support',
};

export const rolePermissions: Record<AdminRole, Permission[]> = {
  'super-admin': [
    'dashboard:view',
    'admins:manage',
    'roles:assign',
    'system:configure',
    'users:view',
    'users:control',
    'products:view',
    'products:create',
    'products:publish',
    'products:delete',
    'categories:manage',
    'inventory:manage',
    'images:upload',
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
    'products:delete',
    'categories:manage',
    'inventory:manage',
    'images:upload',
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
    'products:delete',
    'categories:manage',
    'inventory:manage',
    'images:upload',
    'orders:view',
    'transactions:view',
    'analytics:view',
  ],
  'inventory-manager': [
    'dashboard:view',
    'products:view',
    'inventory:manage',
    'orders:view',
    'orders:update',
  ],
  support: ['dashboard:view', 'users:view', 'orders:view', 'activity:view'],
};

export function applyRolePermissions(matrix?: RolePermissionMatrix) {
  if (!matrix) return;

  Object.entries(matrix).forEach(([role, permissions]) => {
    const normalizedRole = normalizeRole(role);
    rolePermissions[normalizedRole] = allPermissions.filter(permission =>
      (permissions || []).includes(permission),
    );
  });
}

export function normalizeRole(role?: string): AdminRole {
  const value = (role || '').toLowerCase().replace(/[_\s]+/g, '-');

  if (
    value === 'super-admin'
    || value === 'admin'
    || value === 'product-manager'
    || value === 'inventory-manager'
    || value === 'support'
  ) {
    return value;
  }

  return 'admin';
}

export function can(role: string | undefined, permission: Permission) {
  return rolePermissions[normalizeRole(role)].includes(permission);
}
