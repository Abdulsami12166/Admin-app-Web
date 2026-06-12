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
  | 'inventory:view'
  | 'inventory:manage'
  | 'images:upload'
  | 'orders:view'
  | 'orders:update'
  | 'transactions:view'
  | 'shipments:view'
  | 'shipments:manage'
  | 'returns:view'
  | 'returns:manage'
  | 'refunds:view'
  | 'refunds:manage'
  | 'support:view'
  | 'support:create'
  | 'support:respond'
  | 'support:manage'
  | 'support:escalate'
  | 'finance:view'
  | 'finance:manage'
  | 'audit:view'
  | 'settings:view'
  | 'settings:manage'
  | 'features:view'
  | 'features:manage'
  | 'analytics:view'
  | 'activity:view'
  | 'notifications:view'
  | 'admins:view'
  | 'products:manage';

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
  'products:manage',
  'categories:manage',
  'inventory:view',
  'inventory:manage',
  'images:upload',
  'orders:view',
  'orders:update',
  'transactions:view',
  'shipments:view',
  'shipments:manage',
  'returns:view',
  'returns:manage',
  'refunds:view',
  'refunds:manage',
  'support:view',
  'support:create',
  'support:respond',
  'support:manage',
  'support:escalate',
  'finance:view',
  'finance:manage',
  'audit:view',
  'settings:view',
  'settings:manage',
  'features:view',
  'features:manage',
  'analytics:view',
  'activity:view',
  'notifications:view',
  'admins:view',
];

export const permissionLabels: Record<Permission, string> = {
  'dashboard:view': 'Dashboard navigation',
  'admins:manage': 'Create and view admins',
  'roles:assign': 'Assign role permissions',
  'system:configure': 'System configuration',
  'users:view': 'View customers',
  'users:control': 'Block, unblock, logout customers',
  'products:view': 'View products',
  'products:create': 'Create and edit products',
  'products:publish': 'Publish products',
  'products:delete': 'Delete products',
  'categories:manage': 'Manage categories',
  'inventory:view': 'View inventory',
  'inventory:manage': 'Manage inventory',
  'images:upload': 'Upload product images',
  'orders:view': 'View orders',
  'orders:update': 'Update orders',
  'transactions:view': 'View transactions',
  'shipments:view': 'View shipments',
  'shipments:manage': 'Manage shipments',
  'returns:view': 'View returns',
  'returns:manage': 'Manage returns',
  'refunds:view': 'View refunds',
  'refunds:manage': 'Manage refunds',
  'support:view': 'View support tickets',
  'support:create': 'Create support tickets',
  'support:respond': 'Respond to tickets',
  'support:manage': 'Manage support tickets',
  'support:escalate': 'Escalate support tickets',
  'finance:view': 'View invoices and payments',
  'finance:manage': 'Manage invoices and payments',
  'audit:view': 'View audit logs',
  'settings:view': 'View settings',
  'settings:manage': 'Manage settings',
  'features:view': 'View feature toggles',
  'features:manage': 'Manage feature toggles',
  'analytics:view': 'View analytics',
  'activity:view': 'View activities',  'notifications:view': 'View notifications',
  'admins:view': 'View admins',
  'products:manage': 'Manage products',};

export const managedAdminRoles: AdminRole[] = ['product-manager', 'inventory-manager', 'support', 'finance-manager', 'customer-service'];

export const roleLabels: Record<AdminRole, string> = {
  'super-admin': 'Super Admin',
  admin: 'Admin',
  'product-manager': 'Product Manager',
  'inventory-manager': 'Inventory Manager',
  support: 'Support',
  'finance-manager': 'Finance Manager',
  'customer-service': 'Customer Service',
};

export const rolePermissions: Record<AdminRole, Permission[]> = {
  'super-admin': [
    ...allPermissions,
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
    'inventory:view',
    'inventory:manage',
    'images:upload',
    'orders:view',
    'orders:update',
    'transactions:view',
    'shipments:view',
    'shipments:manage',
    'returns:view',
    'returns:manage',
    'refunds:view',
    'refunds:manage',
    'support:view',
    'support:respond',
    'support:manage',
    'finance:view',
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
    'inventory:view',
    'inventory:manage',
    'images:upload',
    'orders:view',
    'transactions:view',
    'analytics:view',
  ],
  'inventory-manager': [
    'dashboard:view',
    'products:view',
    'inventory:view',
    'inventory:manage',
    'orders:view',
    'orders:update',
    'shipments:view',
    'shipments:manage',
    'analytics:view',
  ],
  support: [
    'dashboard:view',
    'users:view',
    'orders:view',
    'support:view',
    'support:respond',
    'activity:view',
  ],
  'finance-manager': [
    'dashboard:view',
    'orders:view',
    'transactions:view',
    'refunds:view',
    'refunds:manage',
    'finance:view',
    'finance:manage',
    'analytics:view',
  ],
  'customer-service': [
    'dashboard:view',
    'users:view',
    'users:control',
    'orders:view',
    'shipments:view',
    'returns:view',
    'refunds:view',
    'support:view',
    'support:create',
    'support:respond',
    'support:manage',
    'activity:view',
  ],
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
