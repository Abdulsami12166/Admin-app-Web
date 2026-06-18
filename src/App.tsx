import React from 'react';
import {
  ActivityItem,
  AdminOrder,
  AdminProduct,
  AdminVariant,
  AdminTransaction,
  AdminUser,
  ADMIN_TOKEN_KEY,
  ADMIN_USER_KEY,
  DashboardMetrics,
  adminApi,
  loginAdmin,
  forgotPassword,
} from './services/api';
import {
  allPermissions,
  applyRolePermissions,
  can,
  managedAdminRoles,
  normalizeRole,
  type Permission,
  permissionLabels,
  roleLabels,
  rolePermissions,
  type RolePermissionMatrix,
} from './services/access';
import {connectAdminSocket} from './services/socket';
import { useToast } from './services/toast';
import { LoadingOverlay } from './components/Dialogs';
import { CustomersSection } from './components/CustomersSection';
import { InventorySection } from './components/InventorySection';
import { ShipmentsSection } from './components/ShipmentsSection';
import { TicketsSection } from './components/TicketsSection';
import { InvoicesSection } from './components/InvoicesSection';
import { ReturnsRefundsSection } from './components/ReturnsRefundsSection';
import RefundsAdminSection from './components/RefundsAdminSection';
import { AuditLogsSection } from './components/AuditLogsSection';
import { SettingsSection } from './components/SettingsSection';
import { FeatureTogglesSection } from './components/FeatureTogglesSection';
import { NotificationsSection } from './components/NotificationsSection';
import { SessionManagementSection } from './components/SessionManagementSection';
import { OrderTimelineSection } from './components/OrderTimelineSection';
import { BulkOperationsSection } from './components/BulkOperationsSection';
import { ReportsSection } from './components/ReportsSection';
import AdminManagementSection from './components/AdminManagementSection';
import UserHistorySection from './components/UserHistorySection';

type TabKey = 'dashboard' | 'admin-management' | 'user-history' | 'access' | 'users' | 'products' | 'orders' | 'transactions' | 'analytics' | 'activity' | 'customers' | 'inventory' | 'shipments' | 'tickets' | 'invoices' | 'returns-refunds' | 'audit-logs' | 'settings' | 'feature-toggles' | 'notifications' | 'sessions' | 'order-timeline' | 'bulk-operations' | 'reports';
type FeedItem = {id: string; title: string; detail: string; createdAt: number};

const tabs: Array<{key: TabKey; label: string; permission: Parameters<typeof can>[1]}> = [
  {key: 'dashboard', label: 'Dashboard', permission: 'dashboard:view'},
  {key: 'admin-management', label: 'Admin Management', permission: 'admins:manage'},
  {key: 'user-history', label: 'User History', permission: 'users:view'},
  {key: 'access', label: 'Access', permission: 'admins:manage'},
  {key: 'users', label: 'Users', permission: 'users:view'},
  {key: 'customers', label: 'Customers', permission: 'users:view'},
  {key: 'products', label: 'Products', permission: 'products:view'},
  {key: 'inventory', label: 'Inventory', permission: 'inventory:view'},
  {key: 'orders', label: 'Orders', permission: 'orders:view'},
  {key: 'transactions', label: 'Transactions', permission: 'transactions:view'},
  {key: 'shipments', label: 'Shipments', permission: 'shipments:view'},
  {key: 'tickets', label: 'Tickets', permission: 'support:view'},
  {key: 'invoices', label: 'Invoices', permission: 'finance:view'},
  {key: 'returns-refunds', label: 'Returns/Refunds', permission: 'returns:view'},
  {key: 'order-timeline', label: 'Order Timeline', permission: 'orders:view'},
  {key: 'analytics', label: 'Analytics', permission: 'analytics:view'},
  {key: 'activity', label: 'Activity', permission: 'activity:view'},
  {key: 'audit-logs', label: 'Audit Logs', permission: 'audit:view'},
  {key: 'settings', label: 'Settings', permission: 'settings:view'},
  {key: 'feature-toggles', label: 'Feature Toggles', permission: 'features:view'},
  {key: 'notifications', label: 'Notifications', permission: 'notifications:view'},
  {key: 'sessions', label: 'Sessions', permission: 'admins:view'},
  {key: 'bulk-operations', label: 'Bulk Operations', permission: 'products:manage'},
  {key: 'reports', label: 'Reports', permission: 'analytics:view'},
];

const productCategories = [
  'Mobiles',
  'Laptops',
  'Fashion',
  'Accessories',
  'Gaming',
  'Electronics',
];
const categoryConfig: Record<string, {subCategories: string[]; attributes: Array<{key: string; label: string; placeholder?: string}>; sizes?: string[]}> = {
  Mobiles: {
    subCategories: ['Gaming Phones', 'Camera Phones', 'Performance Phones', 'Battery Phones', 'Budget Phones', 'Flagship Phones'],
    attributes: [
      {key: 'ram', label: 'RAM', placeholder: '8GB'},
      {key: 'storage', label: 'Storage', placeholder: '256GB'},
      {key: 'battery', label: 'Battery', placeholder: '5000mAh'},
      {key: 'camera', label: 'Camera', placeholder: '64MP'},
      {key: 'processor', label: 'Processor', placeholder: 'Snapdragon 8 Gen 3'},
    ],
  },
  Laptops: {
    subCategories: ['Gaming Laptops', 'Performance Laptops', 'Student Laptops', 'Business Laptops', 'Creator Laptops', 'Budget Laptops'],
    attributes: [
      {key: 'processor', label: 'Processor', placeholder: 'Intel Core i7'},
      {key: 'ram', label: 'RAM', placeholder: '16GB'},
      {key: 'storage', label: 'Storage', placeholder: '1TB SSD'},
      {key: 'gpu', label: 'GPU', placeholder: 'RTX 4060'},
      {key: 'displaySize', label: 'Display Size', placeholder: '15.6 inch'},
    ],
  },
  Fashion: {
    subCategories: ['Men', 'Women', 'Kids', 'Footwear', 'Traditional', 'Casual', 'Formal'],
    attributes: [
      {key: 'size', label: 'Size', placeholder: 'S, M, L'},
      {key: 'color', label: 'Color', placeholder: 'Black'},
      {key: 'material', label: 'Material', placeholder: 'Cotton'},
      {key: 'brand', label: 'Brand', placeholder: 'Brand name'},
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  Accessories: {
    subCategories: ['Watches', 'Headphones', 'Chargers', 'Power Banks', 'Cases'],
    attributes: [
      {key: 'brand', label: 'Brand', placeholder: 'Brand name'},
      {key: 'color', label: 'Color', placeholder: 'Black'},
      {key: 'material', label: 'Material', placeholder: 'Silicone'},
    ],
  },
  Gaming: {
    subCategories: ['Gaming Consoles', 'Gaming Accessories', 'Gaming Laptops', 'Gaming Phones'],
    attributes: [
      {key: 'platform', label: 'Platform', placeholder: 'PS5'},
      {key: 'storage', label: 'Storage', placeholder: '1TB'},
      {key: 'edition', label: 'Edition', placeholder: 'Standard'},
    ],
  },
  Electronics: {
    subCategories: ['Audio', 'Cameras', 'Wearables', 'Smart Home', 'Storage'],
    attributes: [
      {key: 'brand', label: 'Brand', placeholder: 'Brand name'},
      {key: 'model', label: 'Model', placeholder: 'Model number'},
      {key: 'warranty', label: 'Warranty', placeholder: '1 year'},
    ],
  },
};

const orderStatusLabels: Record<string, string> = {
  pending: 'Pending',
  paid: 'Paid',
  processing: 'Processing',
  'order-confirmed': 'Order Confirmed',
  packed: 'Packed',
  shipping: 'Shipping',
  shipped: 'Shipped',
  'near-delivery': 'Near Delivery',
  'out-for-delivery': 'Out For Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

function getId(item: {_id?: string; id?: string}) {
  return item._id || item.id || '';
}

function formatDate(value?: string | number) {
  return value ? new Date(value).toLocaleString() : 'Not recorded';
}

function maskEmail(email?: string) {
  if (!email || !email.includes('@')) return email || 'No email';
  const [name, domain] = email.split('@');
  return `${name.slice(0, 2)}***@${domain}`;
}

export function App() {
  const [user, setUser] = React.useState<AdminUser | null>(() => {
    if (!localStorage.getItem(ADMIN_TOKEN_KEY)) return null;
    const saved = localStorage.getItem(ADMIN_USER_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  const [activeTab, setActiveTab] = React.useState<TabKey>('dashboard');
  const [metrics, setMetrics] = React.useState<DashboardMetrics>({});
  const [users, setUsers] = React.useState<AdminUser[]>([]);
  const [products, setProducts] = React.useState<AdminProduct[]>([]);
  const [orders, setOrders] = React.useState<AdminOrder[]>([]);
  const [transactions, setTransactions] = React.useState<AdminTransaction[]>([]);
  const [activities, setActivities] = React.useState<ActivityItem[]>([]);
  const [permissionMatrix, setPermissionMatrix] = React.useState<RolePermissionMatrix>(rolePermissions);
  const [adminRoles, setAdminRoles] = React.useState<AdminRole[]>(Object.keys(roleLabels) as AdminRole[]);
  const [manageableRoles, setManageableRoles] = React.useState<AdminRole[]>(managedAdminRoles);
  const [adminUsers, setAdminUsers] = React.useState<AdminUser[]>([]);
  const [feed, setFeed] = React.useState<FeedItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [actionBusy, setActionBusy] = React.useState(false);
  const [busyMessage, setBusyMessage] = React.useState('');
  const role = normalizeRole(user?.role);
  const toast = useToast();

  const pushFeed = React.useCallback((title: string, detail: string) => {
    setFeed(current => [{id: `${Date.now()}-${Math.random()}`, title, detail, createdAt: Date.now()}, ...current].slice(0, 40));
  }, []);

  const showSuccess = React.useCallback((title: string, detail: string) => {
    toast.success(detail, title);
    pushFeed(title, detail);
  }, [pushFeed, toast]);

  const showError = React.useCallback((title: string, detail: string) => {
    toast.error(detail, title);
    pushFeed(title, detail);
  }, [pushFeed, toast]);

  React.useEffect(() => {
    if (user?.permissions?.length) {
      const nextMatrix: RolePermissionMatrix = {[role]: user.permissions as Permission[]};
      applyRolePermissions(nextMatrix);
      setPermissionMatrix(current => ({...current, ...nextMatrix}));
    }
  }, [role, user?.permissions]);

  const refreshAll = React.useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        adminApi.getMetrics(),
        can(role, 'admins:manage') ? adminApi.getAccessControl() : Promise.resolve(null),
        can(role, 'users:view') ? adminApi.getUsers() : Promise.resolve({data: {users: []}}),
        can(role, 'products:view') ? adminApi.getProducts() : Promise.resolve({data: {products: []}}),
        can(role, 'orders:view') ? adminApi.getOrders() : Promise.resolve({data: {orders: []}}),
        can(role, 'transactions:view') ? adminApi.getTransactions() : Promise.resolve({data: {transactions: []}}),
        can(role, 'activity:view') ? adminApi.getActivities() : Promise.resolve({data: {activities: []}}),
      ]);

      const [metricResult, accessResult, usersResult, productsResult, ordersResult, transactionsResult, activitiesResult] = results;
      if (metricResult.status === 'fulfilled') setMetrics(metricResult.value.data || {});
      if (accessResult.status === 'fulfilled' && accessResult.value) {
        applyRolePermissions(accessResult.value.data?.permissionsByRole);
        setPermissionMatrix(accessResult.value.data?.permissionsByRole || rolePermissions);
        setAdminRoles(accessResult.value.data?.roles || (Object.keys(roleLabels) as AdminRole[]));
        setManageableRoles(accessResult.value.data?.managedRoles || managedAdminRoles);
        setAdminUsers(accessResult.value.data?.admins || []);
      }
      if (usersResult.status === 'fulfilled') setUsers(usersResult.value.data?.users || []);
      if (productsResult.status === 'fulfilled') setProducts(productsResult.value.data?.products || []);
      if (ordersResult.status === 'fulfilled') setOrders(ordersResult.value.data?.orders || []);
      if (transactionsResult.status === 'fulfilled') setTransactions(transactionsResult.value.data?.transactions || []);
      if (activitiesResult.status === 'fulfilled') setActivities(activitiesResult.value.data?.activities || []);

      const failedCount = results.filter(result => result.status === 'rejected').length;
      if (failedCount) {
        pushFeed('Refresh incomplete', `${failedCount} admin request${failedCount > 1 ? 's' : ''} failed. Loaded the available data.`);
      }
    } finally {
      setLoading(false);
    }
  }, [pushFeed, role]);

  React.useEffect(() => {
    const handleAuthExpired = () => {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_USER_KEY);
      setUser(null);
    };
    window.addEventListener('admin-auth-expired', handleAuthExpired);
    return () => window.removeEventListener('admin-auth-expired', handleAuthExpired);
  }, []);

  React.useEffect(() => {
    if (!user) return;
    refreshAll().catch(error => showError('Refresh failed', error.message));
    return connectAdminSocket((title, detail) => {
      showSuccess(title, detail);
      refreshAll().catch(() => undefined);
    });
  }, [pushFeed, refreshAll, showError, showSuccess, user]);

  function logout() {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
    setUser(null);
    showSuccess('Signed out', 'You have been signed out successfully.');
  }

  if (!user) {
    return <LoginScreen onLoggedIn={setUser} />;
  }

  const visibleTabs = tabs.filter(tab => {
    if (role === 'super-admin') {
      return true;
    }
    if (tab.key === 'sessions') {
      return role === 'super-admin' && can(role, tab.permission);
    }
    return can(role, tab.permission);
  });
  const latestFeedItem = feed[0];

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">E</span>
          <div>
            <strong>Admin Web</strong>
            <small>Single vendor ecommerce</small>
          </div>
        </div>
        <nav className="nav-list">
          {visibleTabs.map(tab => (
            <button
              key={tab.key}
              className={activeTab === tab.key ? 'active' : ''}
              onClick={() => setActiveTab(tab.key)}>
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="session-card">
          <small>Signed in</small>
          <strong>{maskEmail(user.email)}</strong>
          <span>{roleLabels[role]}</span>
          <button className="ghost danger-text" onClick={logout}>Logout</button>
        </div>
      </aside>

      { actionBusy && (
        <LoadingOverlay
          message={busyMessage || 'Processing request...'}
        />
      )}
      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Least privilege active</p>
            <h1>{tabs.find(tab => tab.key === activeTab)?.label}</h1>
          </div>
          <div className="topbar-actions">
            {latestFeedItem ? (
              <div className="status-notification" aria-live="polite">
                <strong>{latestFeedItem.title}</strong>
                <span>{latestFeedItem.detail}</span>
              </div>
            ) : null}
            <button className="secondary" onClick={() => refreshAll().catch(error => showError('Refresh failed', error.message))}>
              {loading ? 'Refreshing...' : 'Refresh all'}
            </button>
          </div>
        </header>

        {activeTab === 'dashboard' && <Dashboard metrics={metrics} feed={feed} adminRoles={adminRoles} />}
        {activeTab === 'admin-management' && can(role, 'admins:manage') && (
          <AdminManagementSection onError={(m)=>showError('Error',m)} onSuccess={(m)=>showSuccess('Success',m)} />
        )}
        {activeTab === 'user-history' && can(role, 'users:view') && (
          <UserHistorySection onError={(m)=>showError('Error',m)} onSuccess={(m)=>showSuccess('Success',m)} />
        )}
        {activeTab === 'access' && (
          <Access
            role={role}
            users={users}
            activities={activities}
            permissionMatrix={permissionMatrix}
            manageableRoles={manageableRoles}
            adminUsers={adminUsers}
            onUpdated={async message => {
              pushFeed('Access updated', message);
              await refreshAll();
            }}
          />
        )}
        {activeTab === 'users' && <Users users={users} refreshAll={refreshAll} role={role} />}
        {activeTab === 'products' && <Products products={products} refreshAll={refreshAll} role={role} pushFeed={pushFeed} />}
        {activeTab === 'customers' && can(role, 'users:view') && (
          <CustomersSection 
            onError={(msg) => pushFeed('Error', msg)} 
            onSuccess={(msg) => pushFeed('Success', msg)} 
          />
        )}
        {activeTab === 'inventory' && can(role, 'inventory:view') && (
          <InventorySection 
            onError={(msg) => pushFeed('Error', msg)} 
            onSuccess={(msg) => pushFeed('Success', msg)} 
          />
        )}
        {activeTab === 'shipments' && can(role, 'shipments:view') && (
          <ShipmentsSection 
            onError={(msg) => pushFeed('Error', msg)} 
            onSuccess={(msg) => pushFeed('Success', msg)} 
          />
        )}
        {activeTab === 'tickets' && can(role, 'support:view') && (
          <TicketsSection 
            onError={(msg) => pushFeed('Error', msg)} 
            onSuccess={(msg) => pushFeed('Success', msg)} 
          />
        )}
        {activeTab === 'invoices' && can(role, 'finance:view') && (
          <InvoicesSection 
            onError={(msg) => pushFeed('Error', msg)} 
            onSuccess={(msg) => pushFeed('Success', msg)} 
          />
        )}
        {activeTab === 'returns-refunds' && can(role, 'returns:view') && (
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16}}>
            <ReturnsRefundsSection 
              onError={(msg) => pushFeed('Error', msg)} 
              onSuccess={(msg) => pushFeed('Success', msg)} 
            />
            <div>
              <RefundsAdminSection />
            </div>
          </div>
        )}
        {activeTab === 'orders' && <Orders orders={orders} refreshAll={refreshAll} role={role} />}
        {activeTab === 'transactions' && <Transactions transactions={transactions} />}
        {activeTab === 'audit-logs' && can(role, 'audit:view') && (
          <AuditLogsSection 
            onError={(msg) => pushFeed('Error', msg)} 
            onSuccess={(msg) => pushFeed('Success', msg)} 
          />
        )}
        {activeTab === 'settings' && can(role, 'settings:view') && (
          <SettingsSection 
            onError={(msg) => pushFeed('Error', msg)} 
            onSuccess={(msg) => pushFeed('Success', msg)} 
          />
        )}
        {activeTab === 'feature-toggles' && can(role, 'features:view') && (
          <FeatureTogglesSection 
            onError={(msg) => pushFeed('Error', msg)} 
            onSuccess={(msg) => pushFeed('Success', msg)} 
          />
        )}
        {activeTab === 'notifications' && can(role, 'notifications:view') && (
          <NotificationsSection 
            onError={(msg) => pushFeed('Error', msg)} 
            onSuccess={(msg) => pushFeed('Success', msg)} 
          />
        )}
        {activeTab === 'sessions' && can(role, 'admins:view') && (
          <SessionManagementSection 
            onError={(msg) => pushFeed('Error', msg)} 
            onSuccess={(msg) => pushFeed('Success', msg)} 
          />
        )}
        {activeTab === 'order-timeline' && can(role, 'orders:view') && (
          <OrderTimelineSection 
            onError={(msg) => pushFeed('Error', msg)} 
            onSuccess={(msg) => pushFeed('Success', msg)} 
          />
        )}
        {activeTab === 'bulk-operations' && can(role, 'products:manage') && (
          <BulkOperationsSection 
            onError={(msg) => pushFeed('Error', msg)} 
            onSuccess={(msg) => pushFeed('Success', msg)} 
          />
        )}
        {activeTab === 'reports' && can(role, 'analytics:view') && (
          <ReportsSection 
            onError={(msg) => pushFeed('Error', msg)} 
            onSuccess={(msg) => pushFeed('Success', msg)} 
          />
        )}
        {activeTab === 'analytics' && <Analytics metrics={metrics} />}
        {activeTab === 'activity' && <Activity activities={activities} feed={feed} users={users} />}
      </main>
    </div>
  );
}

function LoginScreen({onLoggedIn}: {onLoggedIn: (user: AdminUser) => void}) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [forgotMode, setForgotMode] = React.useState(false);
  const [forgotEmail, setForgotEmail] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setStatus('');
    setLoading(true);
    try {
      if (forgotMode) {
        const response = await forgotPassword(forgotEmail.trim());
        setStatus(response?.message || 'Password reset instructions were sent if the email exists.');
        setForgotEmail('');
        setForgotMode(false);
        return;
      }

      const response = await loginAdmin(email.trim(), password);
      if (!response?.token || !response.user) {
        throw new Error('Admin login did not return a valid session. Please try again.');
      }
      localStorage.setItem(ADMIN_TOKEN_KEY, response.token);
      localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(response.user));
      onLoggedIn(response.user);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={submit}>
        <p className="eyebrow">Secure operations</p>
        <h1>{forgotMode ? 'Reset admin password' : 'Admin Login'}</h1>

        <label>Email</label>
        <input
          value={forgotMode ? forgotEmail : email}
          onChange={event => (forgotMode ? setForgotEmail(event.target.value) : setEmail(event.target.value))}
          placeholder="admin@example.com"
          type="email"
          required
        />

        {!forgotMode && (
          <>
            <label>Password</label>
            <input
              value={password}
              onChange={event => setPassword(event.target.value)}
              placeholder="Password"
              type="password"
              required
            />
          </>
        )}

        {error && <p className="error">{error}</p>}
        {status && <p className="info">{status}</p>}

        <button>{loading ? (forgotMode ? 'Sending...' : 'Signing in...') : (forgotMode ? 'Send reset link' : 'Sign in')}</button>

        <div className="login-footnote">
          <button type="button" className="ghost" onClick={() => {
            setForgotMode(current => !current);
            setError('');
            setStatus('');
          }}>
            {forgotMode ? 'Back to login' : 'Forgot password?'}
          </button>
          <small>CAPTCHA / rate limit should be enforced by backend or gateway in production.</small>
        </div>
      </form>
    </main>
  );
}

function Dashboard({metrics, feed, adminRoles}: {metrics: DashboardMetrics; feed: FeedItem[]; adminRoles: AdminRole[]}) {
  return (
    <section>
      <div className="stats-grid">
        <Stat label="Users" value={metrics.totalUsers || 0} />
        <Stat label="Orders" value={metrics.totalOrders || 0} />
        <Stat label="Products" value={metrics.productCount || 0} />
        <Stat label="Revenue" value={`₹${metrics.revenue || 0}`} />
      </div>
      <div className="stats-grid small">
        <Stat label="Blocked users" value={metrics.blockedUsers || 0} />
        <Stat label="New users today" value={metrics.newUsersToday || 0} />
        <Stat label="Orders last 24h" value={metrics.ordersLast24h || 0} />
        <Stat label="Active users" value={metrics.activeUsersLast24h || 0} />
      </div>
      <Panel title="Active admin roles">
        <div className="tag-list">
          {adminRoles.length ? adminRoles.map(roleKey => (
            <span className="tag" key={roleKey}>{roleLabels[roleKey]}</span>
          )) : <p>No admin roles available.</p>}
        </div>
      </Panel>
      <Panel title="Realtime notifications">
        <FeedList feed={feed} empty="Waiting for websocket updates." />
      </Panel>
    </section>
  );
}

function Access({
  role,
  users,
  activities,
  permissionMatrix,
  manageableRoles,
  adminUsers,
  onUpdated,
}: {
  role: ReturnType<typeof normalizeRole>;
  users: AdminUser[];
  activities: ActivityItem[];
  permissionMatrix: RolePermissionMatrix;
  manageableRoles: AdminRole[];
  adminUsers: AdminUser[];
  onUpdated: (message: string) => Promise<void>;
}) {
  const availableRoles = manageableRoles.length ? manageableRoles : managedAdminRoles;
  const [draftMatrix, setDraftMatrix] = React.useState<RolePermissionMatrix>(permissionMatrix);
  const [savingRole, setSavingRole] = React.useState<string>('');
  const [newAdmin, setNewAdmin] = React.useState({
    name: '',
    email: '',
    password: '',
    role: availableRoles[0],
  });
  const subAdmins = adminUsers.filter(admin => availableRoles.includes(normalizeRole(admin.role)));

  React.useEffect(() => {
    setDraftMatrix(permissionMatrix);
  }, [permissionMatrix]);

  function togglePermission(roleKey: ReturnType<typeof normalizeRole>, permission: Permission) {
    setDraftMatrix(current => {
      const currentPermissions = current[roleKey] || [];
      const nextPermissions = currentPermissions.includes(permission)
        ? currentPermissions.filter(item => item !== permission)
        : [...currentPermissions, permission];

      return {
        ...current,
        [roleKey]: allPermissions.filter(item => nextPermissions.includes(item)),
      };
    });
  }

  async function saveRole(roleKey: ReturnType<typeof normalizeRole>) {
    setSavingRole(roleKey);
    try {
      const response = await adminApi.updateRolePermissions(roleKey, draftMatrix[roleKey] || []);
      applyRolePermissions(response.data.permissionsByRole);
      await onUpdated(`${roleLabels[roleKey]} permissions saved.`);
    } finally {
      setSavingRole('');
    }
  }

  async function submitAdmin(event: React.FormEvent) {
    event.preventDefault();
    const response = await adminApi.createAdmin(newAdmin);
    setNewAdmin({name: '', email: '', password: '', role: availableRoles[0]});
    await onUpdated(`${response.data.admin.email} created as ${roleLabels[normalizeRole(response.data.admin.role)]}.`);
  }

  return (
    <section className="grid-two">
      <Panel title="Role & access manager">
        <article className="row-card">
          <strong>{roleLabels['super-admin']}</strong>
          <span>Full access is always enabled and cannot be restricted.</span>
        </article>
        {availableRoles.map(roleKey => {
          const defaultPermissions = rolePermissions[roleKey] || [];
          const rolePermissionOptions = roleKey === 'super-admin' ? allPermissions : defaultPermissions;
          const checkedPermissions = draftMatrix[roleKey] ?? defaultPermissions;

          return (
            <article className="row-card" key={roleKey}>
              <div className="split">
                <strong>{roleLabels[roleKey]}</strong>
                <button
                  type="button"
                  className="secondary"
                  disabled={savingRole === roleKey}
                  onClick={() => saveRole(roleKey)}>
                  {savingRole === roleKey ? 'Saving...' : 'Save permissions'}
                </button>
              </div>
              <div className="permission-grid">
                {rolePermissionOptions
                  .filter(permission => !['admins:manage', 'roles:assign', 'system:configure'].includes(permission))
                  .map(permission => (
                    <label className="permission-check" key={`${roleKey}-${permission}`}>
                      <input
                        type="checkbox"
                        checked={checkedPermissions.includes(permission)}
                        onChange={() => togglePermission(roleKey, permission)}
                      />
                      <span>{permissionLabels[permission]}</span>
                    </label>
                  ))}
              </div>
            </article>
          );
        })}
      </Panel>
      <Panel title="Create sub admin">
        <form className="product-form" onSubmit={submitAdmin}>
          <input
            required
            placeholder="Full name"
            value={newAdmin.name}
            onChange={event => setNewAdmin(current => ({...current, name: event.target.value}))}
          />
          <input
            required
            type="email"
            placeholder="Admin email"
            value={newAdmin.email}
            onChange={event => setNewAdmin(current => ({...current, email: event.target.value}))}
          />
          <input
            required
            type="password"
            minLength={10}
            placeholder="Temporary password"
            value={newAdmin.password}
            onChange={event => setNewAdmin(current => ({...current, password: event.target.value}))}
          />
          <select
            value={newAdmin.role}
            onChange={event => setNewAdmin(current => ({...current, role: normalizeRole(event.target.value)}))}>
            {availableRoles.map(roleKey => (
              <option key={roleKey} value={roleKey}>{roleLabels[roleKey]}</option>
            ))}
          </select>
          <button type="submit">Create admin</button>
        </form>
        <div className="card-list access-list">
          {subAdmins.map(admin => (
            <article className="data-card" key={getId(admin) || admin.email}>
              <strong>{admin.name || 'Unnamed admin'}</strong>
              <span>{maskEmail(admin.email)} | {roleLabels[normalizeRole(admin.role)]}</span>
              <small>{admin.blocked ? 'Blocked' : 'Active'} | Last login: {formatDate(admin.lastLoginAt)}</small>
            </article>
          ))}
        </div>
      </Panel>
      <Panel title="Current admin session">
        <div className="check-list">
          <span>✓ Current role: {roleLabels[role]}</span>
          <span>✓ Admin users monitored: {subAdmins.length || users.filter(item => normalizeRole(item.role) === 'admin' || normalizeRole(item.role) === 'super-admin').length || 1}</span>
          <span>✓ Token revocation: logout + force logout actions</span>
          <span>✓ Audit entries loaded: {activities.length}</span>
          <span>✓ Least privilege: permissions are stored in MongoDB and applied to API routes</span>
        </div>
      </Panel>
    </section>
  );
}

function Users({users, refreshAll, role}: {users: AdminUser[]; refreshAll: () => Promise<void>; role: string}) {
  async function toggle(user: AdminUser) {
    const id = getId(user);
    if (!id || !can(role, 'users:control')) return;
    const action = user.blocked ? 'Unblock' : 'Block';
    if (!window.confirm(`${action} ${user.name || user.email || 'this user'}?`)) return;

    setActionBusy(true);
    setBusyMessage(`${action}ing user...`);
    try {
      const response = user.blocked ? await adminApi.unblockUser(id) : await adminApi.blockUser(id);
      if (response?.success) {
        showSuccess(`${action} successful`, `${user.name || user.email || 'User'} was ${user.blocked ? 'unblocked' : 'blocked'}.`);
        await refreshAll();
      } else {
        showError(`${action} failed`, response?.message || `Unable to ${action.toLowerCase()} user`);
      }
    } catch (error) {
      showError(`${action} failed`, error instanceof Error ? error.message : `Unable to ${action.toLowerCase()} user`);
    } finally {
      setActionBusy(false);
      setBusyMessage('');
    }
  }

  async function forceLogout(user: AdminUser) {
    const id = getId(user);
    if (!id || !can(role, 'users:control')) return;
    if (!window.confirm(`Force ${user.name || user.email || 'this user'} to sign in again?`)) return;

    setActionBusy(true);
    setBusyMessage('Forcing logout...');
    try {
      const response = await adminApi.forceLogoutUser(id);
      if (response?.success) {
        showSuccess('User forced offline', `${user.name || user.email || 'User'} will be signed out immediately.`);
        await refreshAll();
      } else {
        showError('Force logout failed', response?.message || 'Unable to force logout');
      }
    } catch (error) {
      showError('Force logout failed', error instanceof Error ? error.message : 'Unable to force logout');
    } finally {
      setActionBusy(false);
      setBusyMessage('');
    }
  }

  return (
    <section>
      <div className="stats-grid small">
        <Stat label="Customers" value={users.length} />
        <Stat label="Verified" value={users.filter(user => user.isVerified).length} />
        <Stat label="Blocked" value={users.filter(user => user.blocked).length} />
      </div>
      <div className="table-card">
        <table>
          <thead>
            <tr><th>User</th><th>Profile</th><th>Status</th><th>Preferences</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={getId(user) || user.email}>
                <td>{user.name || 'Unnamed'}<small>{roleLabels[normalizeRole(user.role)]}</small></td>
                <td>{maskEmail(user.email)}<small>{user.phone || 'No phone'} | PII masked</small></td>
                <td>{user.blocked ? 'Blocked' : 'Active'}<small>{user.isVerified ? 'Verified' : 'Unverified'}</small></td>
                <td>Consent enforced<small>Notification opt-in/out visible here</small></td>
                <td>
                  <button disabled={!can(role, 'users:control')} onClick={() => toggle(user)}>{user.blocked ? 'Unblock' : 'Block'}</button>
                  <button disabled={!can(role, 'users:control')} className="secondary" onClick={() => forceLogout(user)}>Force logout</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function VariantManager({product, refreshAll, pushFeed}: {product: AdminProduct; refreshAll: () => Promise<void>; pushFeed: (title: string, detail: string) => void}) {
  const emptyDraft = {name: '', value: '', color: '#000000', price: '', stock: '', sku: '', attributes: ''};
  const [editingId, setEditingId] = React.useState('');
  const [draft, setDraft] = React.useState(emptyDraft);
  const [variantImage, setVariantImage] = React.useState<File | null>(null);

  function editVariant(variant: AdminVariant) {
    setEditingId(variant._id || '');
    setDraft({
      name: variant.name || '',
      value: variant.value || '',
      color: String(variant.attributes?.color || '#000000'),
      price: variant.price === undefined ? '' : String(variant.price),
      stock: String(variant.stock ?? 0),
      sku: variant.sku || '',
      attributes: Object.entries(variant.attributes || {}).map(([key, value]) => `${key}: ${String(value)}`).join(', '),
    });
  }

  function buildPayload(): AdminVariant {
    const attributes = draft.attributes.split(',').reduce<Record<string, string>>((next, item) => {
      const [key, ...valueParts] = item.split(':');
      if (key?.trim() && valueParts.join(':').trim()) next[key.trim()] = valueParts.join(':').trim();
      return next;
    }, {});
    if (draft.color) attributes.color = draft.color;
    return {
      name: draft.name,
      value: draft.value,
      price: draft.price === '' ? undefined : Number(draft.price),
      stock: Number(draft.stock || 0),
      sku: draft.sku,
      attributes,
    };
  }

  async function saveVariant(event: React.FormEvent) {
    event.preventDefault();
    const payload = buildPayload();
    const body = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined) body.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
    });
    if (variantImage) body.append('images', variantImage);

    setActionBusy(true);
    setBusyMessage(editingId ? 'Updating variant...' : 'Creating variant...');
    try {
      const response = editingId
        ? await adminApi.updateVariant(product._id, editingId, body)
        : await adminApi.createVariant(product._id, body);

      if (response?.success) {
        showSuccess('Variant saved', `${product.title || product.name || 'Product'} variants were updated.`);
        setEditingId('');
        setDraft(emptyDraft);
        setVariantImage(null);
        await refreshAll();
      } else {
        showError('Variant save failed', response?.message || 'Unable to save variant');
      }
    } catch (error) {
      showError('Variant save failed', error instanceof Error ? error.message : 'Unable to save variant');
    } finally {
      setActionBusy(false);
      setBusyMessage('');
    }
  }

  async function deleteVariant(variant: AdminVariant) {
    if (!variant._id || !window.confirm(`Delete variant ${variant.value || variant.sku || ''}?`)) return;

    setActionBusy(true);
    setBusyMessage('Deleting variant...');
    try {
      const response = await adminApi.deleteVariant(product._id, variant._id);
      if (response?.success) {
        showSuccess('Variant removed', `${variant.value || variant.sku || 'Variant'} was removed.`);
        await refreshAll();
      } else {
        showError('Delete failed', response?.message || 'Unable to remove variant');
      }
    } catch (error) {
      showError('Delete failed', error instanceof Error ? error.message : 'Unable to remove variant');
    } finally {
      setActionBusy(false);
      setBusyMessage('');
    }
  }

  return (
    <div className="variant-manager">
      <strong>Variants</strong>
      {(product.variants || []).map(variant => (
        <div className="variant-row" key={variant._id || `${variant.name}-${variant.value}`}>
          <span>
            {variant.attributes?.color ? <i className="color-swatch" style={{backgroundColor: String(variant.attributes.color)}} /> : null}
            {variant.name || 'Variant'}: {variant.value || 'Default'} | SKU {variant.sku || 'n/a'} | Stock {variant.stock ?? 0} | ₹{variant.price ?? product.price ?? 0}
          </span>
          <div>
            <button className="secondary" onClick={() => editVariant(variant)}>Edit</button>
            <button className="secondary danger-text" onClick={() => deleteVariant(variant)}>Delete</button>
          </div>
        </div>
      ))}
      <form className="variant-form" onSubmit={saveVariant}>
        <input required placeholder="Variant name (Memory / Size)" value={draft.name} onChange={event => setDraft(current => ({...current, name: event.target.value}))} />
        <input required placeholder="Value (8GB / 512GB / Black)" value={draft.value} onChange={event => setDraft(current => ({...current, value: event.target.value}))} />
        <label className="color-field">Color <input type="color" value={draft.color} onChange={event => setDraft(current => ({...current, color: event.target.value}))} /></label>
        <input type="number" min="0" placeholder="Price" value={draft.price} onChange={event => setDraft(current => ({...current, price: event.target.value}))} />
        <input type="number" min="0" placeholder="Stock" value={draft.stock} onChange={event => setDraft(current => ({...current, stock: event.target.value}))} />
        <input placeholder="SKU" value={draft.sku} onChange={event => setDraft(current => ({...current, sku: event.target.value}))} />
        <input placeholder="Attributes: ram: 8GB, storage: 512GB, color: Black" value={draft.attributes} onChange={event => setDraft(current => ({...current, attributes: event.target.value}))} />
        <label className="variant-image-field">Variant image <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={event => setVariantImage(event.target.files?.[0] || null)} /></label>
        <button>{editingId ? 'Update variant' : 'Add variant'}</button>
        {editingId ? <button type="button" className="secondary" onClick={() => { setEditingId(''); setDraft(emptyDraft); setVariantImage(null); }}>Cancel</button> : null}
      </form>
    </div>
  );
}

function Products({products, refreshAll, role, pushFeed}: {products: AdminProduct[]; refreshAll: () => Promise<void>; role: string; pushFeed: (title: string, detail: string) => void}) {
  const [hiddenCategories, setHiddenCategories] = React.useState<string[]>([]);
  const [imageFiles, setImageFiles] = React.useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [previewUrls, setPreviewUrls] = React.useState<string[]>([]);
  const [form, setForm] = React.useState({
    title: '',
    description: '',
    category: productCategories[0],
    subCategory: categoryConfig[productCategories[0]].subCategories[0],
    brand: '',
    price: '',
    discountedPrice: '',
    stock: '',
    sku: '',
    tags: '',
    attributes: {} as Record<string, string>,
    isPublished: true,
  });
  const currentConfig = categoryConfig[form.category] || categoryConfig.Accessories;
  const categories = Array.from(new Set(products.map(product => product.category || 'Uncategorized')));
  const canCreateProducts = can(role, 'products:create');
  const canDeleteProducts = can(role, 'products:delete');
  const canManageInventory = can(role, 'inventory:manage');
  const [selectedCategory, setSelectedCategory] = React.useState('All');
  const [stockDrafts, setStockDrafts] = React.useState<Record<string, string>>({});
  const visibleProducts = selectedCategory === 'All'
    ? products
    : products.filter(product => (product.category || 'Uncategorized') === selectedCategory);

  React.useEffect(() => {
    const nextPreviewUrls = imageFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(nextPreviewUrls);
    return () => nextPreviewUrls.forEach(url => URL.revokeObjectURL(url));
  }, [imageFiles]);

  function updateField(name: string, value: string | boolean) {
    setForm(current => {
      if (name === 'category') {
        const nextConfig = categoryConfig[String(value)] || categoryConfig.Accessories;
        return {
          ...current,
          category: String(value),
          subCategory: nextConfig.subCategories[0],
          attributes: {},
        };
      }

      return {...current, [name]: value};
    });
  }

  function updateAttribute(key: string, value: string) {
    setForm(current => ({
      ...current,
      attributes: {
        ...current.attributes,
        [key]: value,
      },
    }));
  }

  function addFiles(files: FileList | null) {
    const nextFiles = Array.from(files || []).filter(file => file.type.startsWith('image/'));
    setImageFiles(current => [...current, ...nextFiles].slice(0, 8));
  }

  function removeImage(index: number) {
    setImageFiles(current => current.filter((_, itemIndex) => itemIndex !== index));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canCreateProducts) return;
    if (!imageFiles.length) {
      showError('Image required', 'Upload at least one product image before creating a product.');
      return;
    }

    const payload = new FormData();
    payload.append('title', form.title);
    payload.append('name', form.title);
    payload.append('description', form.description);
    payload.append('category', form.category);
    payload.append('subcategory', form.subCategory);
    payload.append('subCategory', form.subCategory);
    payload.append('brand', form.brand || form.attributes.brand || '');
    payload.append('price', form.price);
    payload.append('discountedPrice', form.discountedPrice);
    payload.append('stock', form.stock || '0');
    payload.append('sku', form.sku);
    payload.append('tags', form.tags);
    payload.append('attributes', JSON.stringify(form.attributes));
    payload.append('inventory', JSON.stringify({sku: form.sku, stock: Number(form.stock || 0)}));
    payload.append('isPublished', String(form.isPublished));
    imageFiles.forEach(file => payload.append('images', file));

    setActionBusy(true);
    setBusyMessage('Creating product...');
    setUploadProgress(35);

    try {
      const response = await adminApi.createProduct(payload);
      if (response?.data?.product) {
        showSuccess('Product created', `${form.title} was published in ${form.category} / ${form.subCategory}.`);
        setForm(current => ({
          ...current,
          title: '',
          description: '',
          price: '',
          discountedPrice: '',
          stock: '',
          sku: '',
          brand: '',
          tags: '',
          attributes: {},
        }));
        setImageFiles([]);
        await refreshAll();
      } else {
        showError('Create product failed', response?.message || 'Unable to create product');
      }
    } catch (error) {
      showError('Create product failed', error instanceof Error ? error.message : 'Unable to create product');
    } finally {
      setActionBusy(false);
      setBusyMessage('');
      setTimeout(() => setUploadProgress(0), 800);
    }
  }

  async function deleteProduct(product: AdminProduct) {
    if (!canDeleteProducts) return;
    const title = product.title || product.name || product.slug || 'this product';
    if (!window.confirm(`Delete ${title}? This removes it from listings, categories, search, and product pages.`)) {
      return;
    }

    setActionBusy(true);
    setBusyMessage(`Deleting ${title}...`);
    try {
      const response = await adminApi.deleteProduct(product._id);
      if (response?.success) {
        showSuccess('Product deleted', `${title} was removed from the live catalog.`);
        await refreshAll();
      } else {
        showError('Delete failed', response?.message || 'Unable to delete product');
      }
    } catch (error) {
      showError('Delete product failed', error instanceof Error ? error.message : 'Unable to delete product');
    } finally {
      setActionBusy(false);
      setBusyMessage('');
    }
  }

  async function updateStock(product: AdminProduct) {
    if (!canManageInventory) return;
    const nextStock = Number(stockDrafts[product._id] ?? product.stock ?? 0);
    if (!Number.isFinite(nextStock) || nextStock < 0) {
      showError('Invalid stock', 'Stock must be a positive number.');
      return;
    }

    setActionBusy(true);
    setBusyMessage('Updating stock...');
    try {
      const response = await adminApi.updateInventory(product._id, {stock: nextStock});
      if (response?.success) {
        showSuccess('Inventory updated', `${product.title || product.name || 'Product'} stock set to ${nextStock}.`);
        await refreshAll();
      } else {
        showError('Stock update failed', response?.message || 'Unable to update inventory');
      }
    } catch (error) {
      showError('Stock update failed', error instanceof Error ? error.message : 'Unable to update inventory');
    } finally {
      setActionBusy(false);
      setBusyMessage('');
    }
  }

  return (
    <section className="products-layout">
      <Panel title="Category management with show / hide">
        <article className="row-card split">
          <div>
            <strong>All products</strong>
            <span>{products.length} products</span>
          </div>
          <button className="secondary" onClick={() => setSelectedCategory('All')}>Open</button>
        </article>
        {[...new Set([...productCategories, ...categories])].map(category => {
          const hidden = hiddenCategories.includes(category);
          return (
            <article className="row-card split" key={category}>
              <div>
                <strong>{category}</strong>
                <span>{products.filter(product => (product.category || 'Uncategorized') === category).length} products • {hidden ? 'Hidden' : 'Visible'}</span>
              </div>
              <div>
                <button className="secondary" onClick={() => setSelectedCategory(category)}>Open</button>
                <button className="secondary" onClick={() => setHiddenCategories(current => hidden ? current.filter(item => item !== category) : [...current, category])}>
                  {hidden ? 'Show' : 'Hide'}
                </button>
              </div>
            </article>
          );
        })}
      </Panel>

      <Panel title="Add product">
        {!canCreateProducts ? (
          <p className="error">Your role can view operations data, but cannot create products.</p>
        ) : null}
        <form className="product-form" onSubmit={submit}>
          <input required placeholder="Product name" value={form.title} onChange={event => updateField('title', event.target.value)} />
          <textarea required placeholder="Description" value={form.description} onChange={event => updateField('description', event.target.value)} />
          <div className="form-grid">
            <select value={form.category} onChange={event => updateField('category', event.target.value)}>
              {productCategories.map(category => <option key={category}>{category}</option>)}
            </select>
            <select value={form.subCategory} onChange={event => updateField('subCategory', event.target.value)}>
              {currentConfig.subCategories.map(category => <option key={category}>{category}</option>)}
            </select>
            <input placeholder="Brand" value={form.brand} onChange={event => updateField('brand', event.target.value)} />
            <input placeholder="SKU" value={form.sku} onChange={event => updateField('sku', event.target.value)} />
          </div>
          <div className="form-grid">
            <input required type="number" placeholder="Price" value={form.price} onChange={event => updateField('price', event.target.value)} />
            <input type="number" placeholder="Discounted price" value={form.discountedPrice} onChange={event => updateField('discountedPrice', event.target.value)} />
            <input type="number" placeholder="Stock" value={form.stock} onChange={event => updateField('stock', event.target.value)} />
            <input placeholder="Tags: premium, launch" value={form.tags} onChange={event => updateField('tags', event.target.value)} />
          </div>
          <div className="form-grid">
            {currentConfig.attributes.map(attribute => (
              <input
                key={attribute.key}
                placeholder={`${attribute.label}${attribute.placeholder ? ` (${attribute.placeholder})` : ''}`}
                value={form.attributes[attribute.key] || ''}
                onChange={event => updateAttribute(attribute.key, event.target.value)}
              />
            ))}
          </div>
          <label
            className="upload-box"
            onDragOver={event => event.preventDefault()}
            onDrop={event => {
              event.preventDefault();
              addFiles(event.dataTransfer.files);
            }}>
            <strong>Upload product images</strong>
            <span>Drop images here or click to choose up to 8 images. JPEG, PNG, WebP, and AVIF are accepted.</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              onChange={event => addFiles(event.target.files)}
            />
          </label>
          {previewUrls.length ? (
            <div className="image-preview-grid">
              {previewUrls.map((url, index) => (
                <button type="button" className="image-preview" key={url} onClick={() => removeImage(index)}>
                  <img src={url} alt={`Product preview ${index + 1}`} />
                  <span>Remove</span>
                </button>
              ))}
            </div>
          ) : null}
          {uploadProgress ? (
            <div className="upload-progress">
              <span style={{width: `${uploadProgress}%`}} />
            </div>
          ) : null}
          <label className="check-line">
            <input type="checkbox" checked={form.isPublished} onChange={event => updateField('isPublished', event.target.checked)} />
            Publish product immediately
          </label>
          <button disabled={!canCreateProducts}>Create product</button>
        </form>
      </Panel>

      <Panel title={`Product list - ${selectedCategory}`}>
        <div className="card-list">
          {visibleProducts.map(product => (
            <article className="data-card" key={product._id}>
              {product.images?.[0] ? (
                <img
                  className="product-card-image"
                  src={product.images[0]}
                  alt=""
                  onError={event => {
                    event.currentTarget.hidden = true;
                  }}
                />
              ) : null}
              <strong>{product.title || product.name || product.slug || 'Product'}</strong>
              <span>ID: {product._id}</span>
              <span>{product.category || 'n/a'} / {product.subCategory || 'n/a'} / {product.type || 'n/a'}</span>
              {canManageInventory ? (
                <div className="stock-editor">
                  <input
                    type="number"
                    min="0"
                    aria-label={`Stock for ${product.title || product.name || 'product'}`}
                    value={stockDrafts[product._id] ?? String(product.stock ?? 0)}
                    onChange={event => setStockDrafts(current => ({...current, [product._id]: event.target.value}))}
                  />
                  <button className="secondary" onClick={() => updateStock(product)}>Save stock</button>
                </div>
              ) : null}
              <button
                className="secondary danger-text"
                disabled={!canDeleteProducts}
                onClick={() => deleteProduct(product)}>
                Delete product
              </button>
              {canCreateProducts ? <VariantManager product={product} refreshAll={refreshAll} pushFeed={pushFeed} /> : null}
              <span>Stock {product.stock || 0} • ₹{product.price || 0} • {product.isPublished ? 'Published' : 'Hidden'}</span>
            </article>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function Orders({orders, refreshAll, role}: {orders: AdminOrder[]; refreshAll: () => Promise<void>; role: string}) {
  async function updateStatus(order: AdminOrder, orderStatus: string) {
    if (!can(role, 'orders:update')) return;
    setActionBusy(true);
    setBusyMessage('Saving order status...');
    try {
      const response = await adminApi.updateOrderStatus(order._id, orderStatus);
      if (response?.success) {
        showSuccess('Order updated', `Order ${order._id} status changed to ${orderStatus}.`);
        await refreshAll();
      } else {
        showError('Update failed', response?.message || 'Unable to update order status');
      }
    } catch (error) {
      showError('Update failed', error instanceof Error ? error.message : 'Unable to update order status');
    } finally {
      setActionBusy(false);
      setBusyMessage('');
    }
  }

  return (
    <Panel title="Orders management">
      <div className="table-card plain">
        <table>
          <thead><tr><th>Customer</th><th>Status</th><th>Items</th><th>Created</th><th>Action</th></tr></thead>
          <tbody>
            {orders.map(order => {
              const currentStatus = order.orderStatus || 'pending';
              const updateOptions = [
                'pending',
                'processing',
                'order-confirmed',
                'packed',
                'shipped',
                'out-for-delivery',
                'delivered',
                'cancelled',
              ];

              return (
                <tr key={order._id}>
                  <td>{order.user?.name || 'Customer'}<small>{maskEmail(order.user?.email)}</small></td>
                  <td>{orderStatusLabels[currentStatus] || currentStatus}</td>
                  <td>{order.items?.map(item => `${item.quantity || 0}x ${item.title || 'item'}`).join(', ') || 'n/a'}</td>
                  <td>{formatDate(order.createdAt)}</td>
                  <td>
                    <select
                      disabled={!can(role, 'orders:update')}
                      value={currentStatus}
                      onChange={event => updateStatus(order, event.target.value)}>
                      {updateOptions.map(status => (
                        <option key={status} value={status}>{orderStatusLabels[status] || status}</option>
                      ))}
                    </select>
                    <small>{order.statusHistory?.map(item => item.label || item.status).join(' → ') || 'No checkpoints yet'}</small>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function Transactions({transactions}: {transactions: AdminTransaction[]}) {
  return (
    <section>
      <div className="stats-grid small">
        <Stat label="Transactions" value={transactions.length} />
        <Stat label="Paid" value={transactions.filter(item => item.paymentStatus === 'paid').length} />
        <Stat label="Pending" value={transactions.filter(item => item.paymentStatus === 'pending').length} />
      </div>
      <Panel title="Payment transactions">
        <div className="table-card plain">
          <table>
            <thead><tr><th>Customer</th><th>Amount</th><th>Payment</th><th>Razorpay</th><th>Created</th></tr></thead>
            <tbody>
              {transactions.map(transaction => (
                <tr key={transaction._id}>
                  <td>{transaction.user?.name || 'Customer'}<small>{maskEmail(transaction.user?.email)}</small></td>
                  <td>₹{transaction.totalAmount || 0}<small>{transaction.orderStatus || 'processing'}</small></td>
                  <td>{transaction.paymentStatus || 'pending'}<small>{transaction.paymentMethod || 'Razorpay'}</small></td>
                  <td>{transaction.razorpayPaymentId || transaction.paymentReference || 'Not recorded'}<small>{transaction.razorpayOrderId || transaction.transactionStatus || 'n/a'}</small></td>
                  <td>{formatDate(transaction.createdAt)}<small>{transaction.transactionVerifiedAt ? `Verified ${formatDate(transaction.transactionVerifiedAt)}` : 'Not verified'}</small></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!transactions.length && <p className="note">No payment transactions found yet.</p>}
        </div>
      </Panel>
    </section>
  );
}

function Analytics({metrics}: {metrics: DashboardMetrics}) {
  return (
    <section>
      <div className="stats-grid">
        <Stat label="Blocked users" value={metrics.blockedUsers || 0} />
        <Stat label="New today" value={metrics.newUsersToday || 0} />
        <Stat label="Orders 24h" value={metrics.ordersLast24h || 0} />
        <Stat label="Active users 24h" value={metrics.activeUsersLast24h || 0} />
      </div>
      <Panel title="Order mix">
        {Object.entries(metrics.ordersByStatus || {}).map(([status, count]) => (
          <article className="row-card split" key={status}><strong>{status}</strong><span>{count} orders</span></article>
        ))}
      </Panel>
    </section>
  );
}

function Activity({activities, feed, users}: {activities: ActivityItem[]; feed: FeedItem[]; users: AdminUser[]}) {
  const activeUsers = users
    .filter(user => user.lastLoginAt)
    .sort((first, second) => new Date(second.lastLoginAt || 0).getTime() - new Date(first.lastLoginAt || 0).getTime());

  return (
    <section>
      <div className="stats-grid small">
        <Stat label="Users with login time" value={activeUsers.length} />
        <Stat label="Active users 24h" value={activeUsers.filter(user => {
          const loginTime = new Date(user.lastLoginAt || 0).getTime();
          return loginTime >= Date.now() - 24 * 60 * 60 * 1000;
        }).length} />
        <Stat label="Audit entries" value={activities.length} />
      </div>
      <Panel title="Active user login times">
        <div className="card-list">
          {activeUsers.length ? activeUsers.map(user => (
            <article className="data-card" key={getId(user) || user.email}>
              <strong>{user.name || 'Unnamed user'}</strong>
              <span>{maskEmail(user.email)} | {user.blocked ? 'Blocked' : 'Active'} | {user.isVerified ? 'Verified' : 'Unverified'}</span>
              <small>Last login: {formatDate(user.lastLoginAt)}</small>
            </article>
          )) : <p className="note">No user login times recorded yet.</p>}
        </div>
      </Panel>
      <section className="grid-two">
      <Panel title="Backend activity">
        <div className="card-list">
          {activities.map(activity => (
            <article className="data-card" key={activity._id || `${activity.action}-${activity.createdAt}`}>
              <strong>{activity.action || 'Activity'}</strong>
              <span>{activity.details || 'No details'}</span>
              <small>{formatDate(activity.createdAt)}</small>
            </article>
          ))}
        </div>
      </Panel>
      <Panel title="Realtime feed">
        <FeedList feed={feed} empty="No websocket activity yet." />
      </Panel>
      </section>
    </section>
  );
}

function Panel({title, children}: React.PropsWithChildren<{title: string}>) {
  return <section className="panel"><h2>{title}</h2>{children}</section>;
}

function Stat({label, value}: {label: string; value: string | number}) {
  return <article className="stat"><strong>{value}</strong><span>{label}</span></article>;
}

function FeedList({feed, empty}: {feed: FeedItem[]; empty: string}) {
  if (!feed.length) return <p className="note">{empty}</p>;
  return (
    <div className="card-list">
      {feed.map(item => (
        <article className="data-card" key={item.id}>
          <strong>{item.title}</strong>
          <span>{item.detail}</span>
          <small>{formatDate(item.createdAt)}</small>
        </article>
      ))}
    </div>
  );
}
