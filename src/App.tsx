import React from 'react';
import {
  ActivityItem,
  AdminOrder,
  AdminProduct,
  AdminTransaction,
  AdminUser,
  ADMIN_TOKEN_KEY,
  ADMIN_USER_KEY,
  DashboardMetrics,
  adminApi,
  loginAdmin,
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

type TabKey = 'dashboard' | 'access' | 'users' | 'products' | 'orders' | 'transactions' | 'analytics' | 'activity';
type FeedItem = {id: string; title: string; detail: string; createdAt: number};

const tabs: Array<{key: TabKey; label: string; permission: Parameters<typeof can>[1]}> = [
  {key: 'dashboard', label: 'Dashboard', permission: 'dashboard:view'},
  {key: 'access', label: 'Access', permission: 'admins:manage'},
  {key: 'users', label: 'Users', permission: 'users:view'},
  {key: 'products', label: 'Products', permission: 'products:view'},
  {key: 'orders', label: 'Orders', permission: 'orders:view'},
  {key: 'transactions', label: 'Transactions', permission: 'transactions:view'},
  {key: 'analytics', label: 'Analytics', permission: 'analytics:view'},
  {key: 'activity', label: 'Activity', permission: 'activity:view'},
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

const nextStatusMap: Record<string, string> = {
  pending: 'processing',
  paid: 'processing',
  processing: 'shipped',
  shipped: 'delivered',
  delivered: 'delivered',
  cancelled: 'cancelled',
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
  const [managedAdmins, setManagedAdmins] = React.useState<AdminUser[]>([]);
  const [feed, setFeed] = React.useState<FeedItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const role = normalizeRole(user?.role);

  const pushFeed = React.useCallback((title: string, detail: string) => {
    setFeed(current => [{id: `${Date.now()}-${Math.random()}`, title, detail, createdAt: Date.now()}, ...current].slice(0, 40));
  }, []);

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
        setManagedAdmins(accessResult.value.data?.admins || []);
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
    refreshAll().catch(error => pushFeed('Refresh failed', error.message));
    return connectAdminSocket((title, detail) => {
      pushFeed(title, detail);
      refreshAll().catch(() => undefined);
    });
  }, [pushFeed, refreshAll, user]);

  function logout() {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
    setUser(null);
  }

  if (!user) {
    return <LoginScreen onLoggedIn={setUser} />;
  }

  const visibleTabs = tabs.filter(tab => can(role, tab.permission));

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

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Least privilege active</p>
            <h1>{tabs.find(tab => tab.key === activeTab)?.label}</h1>
          </div>
          <button className="secondary" onClick={() => refreshAll().catch(error => pushFeed('Refresh failed', error.message))}>
            {loading ? 'Refreshing...' : 'Refresh all'}
          </button>
        </header>

        {activeTab === 'dashboard' && <Dashboard metrics={metrics} feed={feed} />}
        {activeTab === 'access' && (
          <Access
            role={role}
            users={users}
            activities={activities}
            permissionMatrix={permissionMatrix}
            managedAdmins={managedAdmins}
            onUpdated={async message => {
              pushFeed('Access updated', message);
              await refreshAll();
            }}
          />
        )}
        {activeTab === 'users' && <Users users={users} refreshAll={refreshAll} role={role} />}
        {activeTab === 'products' && <Products products={products} refreshAll={refreshAll} role={role} pushFeed={pushFeed} />}
        {activeTab === 'orders' && <Orders orders={orders} refreshAll={refreshAll} role={role} />}
        {activeTab === 'transactions' && <Transactions transactions={transactions} />}
        {activeTab === 'analytics' && <Analytics metrics={metrics} />}
        {activeTab === 'activity' && <Activity activities={activities} feed={feed} users={users} />}
      </main>
    </div>
  );
}

function LoginScreen({onLoggedIn}: {onLoggedIn: (user: AdminUser) => void}) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
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
        <h1>Admin Login</h1>
        <label>Email</label>
        <input value={email} onChange={event => setEmail(event.target.value)} placeholder="admin@example.com" />
        <label>Password</label>
        <input value={password} onChange={event => setPassword(event.target.value)} placeholder="Password" type="password" />
        {error && <p className="error">{error}</p>}
        <button>{loading ? 'Signing in...' : 'Sign in'}</button>
        <small>CAPTCHA/rate-limit should be enforced by backend or gateway in production.</small>
      </form>
    </main>
  );
}

function Dashboard({metrics, feed}: {metrics: DashboardMetrics; feed: FeedItem[]}) {
  return (
    <section>
      <div className="stats-grid">
        <Stat label="Users" value={metrics.totalUsers || 0} />
        <Stat label="Orders" value={metrics.totalOrders || 0} />
        <Stat label="Products" value={metrics.productCount || 0} />
        <Stat label="Revenue" value={`₹${metrics.revenue || 0}`} />
      </div>
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
  managedAdmins,
  onUpdated,
}: {
  role: ReturnType<typeof normalizeRole>;
  users: AdminUser[];
  activities: ActivityItem[];
  permissionMatrix: RolePermissionMatrix;
  managedAdmins: AdminUser[];
  onUpdated: (message: string) => Promise<void>;
}) {
  const [draftMatrix, setDraftMatrix] = React.useState<RolePermissionMatrix>(permissionMatrix);
  const [savingRole, setSavingRole] = React.useState<string>('');
  const [newAdmin, setNewAdmin] = React.useState({
    name: '',
    email: '',
    password: '',
    role: managedAdminRoles[0],
  });
  const subAdmins = managedAdmins.filter(admin => managedAdminRoles.includes(normalizeRole(admin.role)));

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
    setNewAdmin({name: '', email: '', password: '', role: managedAdminRoles[0]});
    await onUpdated(`${response.data.admin.email} created as ${roleLabels[normalizeRole(response.data.admin.role)]}.`);
  }

  return (
    <section className="grid-two">
      <Panel title="Role & access manager">
        <article className="row-card">
          <strong>{roleLabels['super-admin']}</strong>
          <span>Full access is always enabled and cannot be restricted.</span>
        </article>
        {managedAdminRoles.map(roleKey => (
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
              {allPermissions
                .filter(permission => !['admins:manage', 'roles:assign', 'system:configure'].includes(permission))
                .map(permission => (
                  <label className="permission-check" key={`${roleKey}-${permission}`}>
                    <input
                      type="checkbox"
                      checked={(draftMatrix[roleKey] || []).includes(permission)}
                      onChange={() => togglePermission(roleKey, permission)}
                    />
                    <span>{permissionLabels[permission]}</span>
                  </label>
                ))}
            </div>
          </article>
        ))}
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
            {managedAdminRoles.map(roleKey => (
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
    if (user.blocked) await adminApi.unblockUser(id);
    else await adminApi.blockUser(id);
    await refreshAll();
  }

  async function forceLogout(user: AdminUser) {
    const id = getId(user);
    if (!id || !can(role, 'users:control')) return;
    await adminApi.forceLogoutUser(id);
    await refreshAll();
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
      pushFeed('Image required', 'Upload at least one product image before creating a product.');
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

    setUploadProgress(35);
    await adminApi.createProduct(payload);
    setUploadProgress(100);
    pushFeed('Product created', `${form.title} was published in ${form.category} / ${form.subCategory}.`);
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
    setTimeout(() => setUploadProgress(0), 800);
  }

  return (
    <section className="products-layout">
      <Panel title="Category management with show / hide">
        {[...new Set([...productCategories, ...categories])].map(category => {
          const hidden = hiddenCategories.includes(category);
          return (
            <article className="row-card split" key={category}>
              <div>
                <strong>{category}</strong>
                <span>{products.filter(product => (product.category || 'Uncategorized') === category).length} products • {hidden ? 'Hidden' : 'Visible'}</span>
              </div>
              <button className="secondary" onClick={() => setHiddenCategories(current => hidden ? current.filter(item => item !== category) : [...current, category])}>
                {hidden ? 'Show' : 'Hide'}
              </button>
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

      <Panel title="Product list">
        <div className="card-list">
          {products.map(product => (
            <article className="data-card" key={product._id}>
              <strong>{product.title || product.name || product.slug || 'Product'}</strong>
              <span>ID: {product._id}</span>
              <span>{product.category || 'n/a'} / {product.subCategory || 'n/a'} / {product.type || 'n/a'}</span>
              <span>Stock {product.stock || 0} • ₹{product.price || 0} • {product.isPublished ? 'Published' : 'Hidden'}</span>
            </article>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function Orders({orders, refreshAll, role}: {orders: AdminOrder[]; refreshAll: () => Promise<void>; role: string}) {
  async function advance(order: AdminOrder) {
    if (!can(role, 'orders:update')) return;
    await adminApi.updateOrderStatus(order._id, nextStatusMap[order.orderStatus || 'pending'] || 'processing');
    await refreshAll();
  }

  return (
    <Panel title="Orders management">
      <div className="table-card plain">
        <table>
          <thead><tr><th>Customer</th><th>Status</th><th>Items</th><th>Created</th><th>Action</th></tr></thead>
          <tbody>
            {orders.map(order => (
              <tr key={order._id}>
                <td>{order.user?.name || 'Customer'}<small>{maskEmail(order.user?.email)}</small></td>
                <td>{order.orderStatus || 'pending'}</td>
                <td>{order.items?.map(item => `${item.quantity || 0}x ${item.title || 'item'}`).join(', ') || 'n/a'}</td>
                <td>{formatDate(order.createdAt)}</td>
                <td><button disabled={!can(role, 'orders:update')} onClick={() => advance(order)}>Advance status</button></td>
              </tr>
            ))}
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
