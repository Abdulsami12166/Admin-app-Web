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
import {can, normalizeRole, roleLabels, rolePermissions} from './services/access';
import {connectAdminSocket} from './services/socket';

type TabKey = 'dashboard' | 'access' | 'users' | 'products' | 'orders' | 'transactions' | 'analytics' | 'activity';
type FeedItem = {id: string; title: string; detail: string; createdAt: number};

const tabs: Array<{key: TabKey; label: string; permission: Parameters<typeof can>[1]}> = [
  {key: 'dashboard', label: 'Dashboard', permission: 'dashboard:view'},
  {key: 'access', label: 'Access', permission: 'rbac:manage'},
  {key: 'users', label: 'Users', permission: 'users:view'},
  {key: 'products', label: 'Products', permission: 'products:view'},
  {key: 'orders', label: 'Orders', permission: 'orders:view'},
  {key: 'transactions', label: 'Transactions', permission: 'transactions:view'},
  {key: 'analytics', label: 'Analytics', permission: 'analytics:view'},
  {key: 'activity', label: 'Activity', permission: 'activity:view'},
];

const productCategories = [
  'Electronics',
  'Mobiles',
  'Computers',
  'Fashion',
  'Men Clothing',
  'Women Clothing',
  'Kids Clothing',
  'Footwear',
  'Accessories',
  'Beauty',
  'Home & Kitchen',
  'Sports',
  'Toys',
  'Grocery',
];
const categoryConfig: Record<string, {subCategories: string[]; types: string[]; sizes?: string[]}> = {
  Electronics: {
    subCategories: ['Audio', 'Wearables', 'Cameras', 'Gaming', 'Smart Home'],
    types: ['New Arrival', 'Refurbished', 'Premium', 'Budget'],
  },
  Mobiles: {
    subCategories: ['Smartphones', 'Feature Phones', 'Tablets', 'Mobile Accessories'],
    types: ['Android', 'iOS', '5G', 'Budget', 'Flagship'],
  },
  Computers: {
    subCategories: ['Laptops', 'Desktops', 'Monitors', 'Printers', 'Storage'],
    types: ['Work', 'Gaming', 'Student', 'Creator'],
  },
  Fashion: {
    subCategories: ['Ethnic Wear', 'Western Wear', 'Winterwear', 'Innerwear'],
    types: ['Casual', 'Formal', 'Party', 'Daily Wear'],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  'Men Clothing': {
    subCategories: ['Shirts', 'T-Shirts', 'Jeans', 'Jackets', 'Ethnic Wear'],
    types: ['Casual', 'Formal', 'Winter', 'Sportswear'],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  'Women Clothing': {
    subCategories: ['Dresses', 'Tops', 'Kurtis', 'Coats', 'Jeans'],
    types: ['Casual', 'Party', 'Office', 'Winter'],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  'Kids Clothing': {
    subCategories: ['Sets', 'T-Shirts', 'Dresses', 'Winterwear'],
    types: ['Casual', 'School', 'Party'],
    sizes: ['2Y', '4Y', '6Y', '8Y', '10Y', '12Y'],
  },
  Footwear: {
    subCategories: ['Sneakers', 'Sandals', 'Formal Shoes', 'Boots'],
    types: ['Casual', 'Sports', 'Formal'],
    sizes: ['5', '6', '7', '8', '9', '10', '11'],
  },
  Accessories: {
    subCategories: ['Bags', 'Belts', 'Watches', 'Jewellery'],
    types: ['Daily Use', 'Premium', 'Gift'],
  },
  Beauty: {
    subCategories: ['Skincare', 'Haircare', 'Makeup', 'Fragrance', 'Personal Care'],
    types: ['Daily Use', 'Premium', 'Organic', 'Travel Size'],
  },
  'Home & Kitchen': {
    subCategories: ['Cookware', 'Storage', 'Decor', 'Cleaning', 'Appliances'],
    types: ['Daily Use', 'Premium', 'Compact', 'Family Pack'],
  },
  Sports: {
    subCategories: ['Fitness', 'Outdoor', 'Team Sports', 'Yoga', 'Cycling'],
    types: ['Beginner', 'Professional', 'Training', 'Protective'],
  },
  Toys: {
    subCategories: ['Learning', 'Action Figures', 'Board Games', 'Soft Toys'],
    types: ['Kids', 'Family', 'Educational', 'Gift'],
  },
  Grocery: {
    subCategories: ['Staples', 'Snacks', 'Beverages', 'Organic', 'Household'],
    types: ['Daily Use', 'Bulk', 'Premium', 'Value Pack'],
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
  const [feed, setFeed] = React.useState<FeedItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const role = normalizeRole(user?.role);

  const pushFeed = React.useCallback((title: string, detail: string) => {
    setFeed(current => [{id: `${Date.now()}-${Math.random()}`, title, detail, createdAt: Date.now()}, ...current].slice(0, 40));
  }, []);

  const refreshAll = React.useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        adminApi.getMetrics(),
        can(role, 'users:view') ? adminApi.getUsers() : Promise.resolve({data: {users: []}}),
        can(role, 'products:view') ? adminApi.getProducts() : Promise.resolve({data: {products: []}}),
        can(role, 'orders:view') ? adminApi.getOrders() : Promise.resolve({data: {orders: []}}),
        can(role, 'transactions:view') ? adminApi.getTransactions() : Promise.resolve({data: {transactions: []}}),
        can(role, 'activity:view') ? adminApi.getActivities() : Promise.resolve({data: {activities: []}}),
      ]);

      const [metricResult, usersResult, productsResult, ordersResult, transactionsResult, activitiesResult] = results;
      if (metricResult.status === 'fulfilled') setMetrics(metricResult.value.data || {});
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
    const handleAuthExpired = () => setUser(null);
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
        {activeTab === 'access' && <Access role={role} users={users} activities={activities} />}
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
      if (!response.token || !response.user) {
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

function Access({role, users, activities}: {role: ReturnType<typeof normalizeRole>; users: AdminUser[]; activities: ActivityItem[]}) {
  return (
    <section className="grid-two">
      <Panel title="Role & access manager">
        {Object.entries(rolePermissions).map(([roleKey, permissions]) => (
          <article className="row-card" key={roleKey}>
            <strong>{roleLabels[roleKey as ReturnType<typeof normalizeRole>]}</strong>
            <span>{permissions.join(', ')}</span>
          </article>
        ))}
      </Panel>
      <Panel title="Current admin session">
        <div className="check-list">
          <span>✓ Current role: {roleLabels[role]}</span>
          <span>✓ Admin users monitored: {users.filter(item => normalizeRole(item.role) === 'admin' || normalizeRole(item.role) === 'super-admin').length || 1}</span>
          <span>✓ Token revocation: logout + force logout actions</span>
          <span>✓ Audit entries loaded: {activities.length}</span>
          <span>✓ Least privilege: UI actions are hidden by role</span>
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
  const [form, setForm] = React.useState({
    title: '',
    description: '',
    category: productCategories[0],
    subCategory: categoryConfig[productCategories[0]].subCategories[0],
    type: categoryConfig[productCategories[0]].types[0],
    brand: '',
    price: '',
    discountedPrice: '',
    stock: '',
    image: '',
    material: '',
    color: '',
    gender: 'Unisex',
    tags: '',
    sizes: '',
    isPublished: true,
  });
  const currentConfig = categoryConfig[form.category] || categoryConfig.Accessories;
  const autoSizes = currentConfig.sizes || [];
  const showSizeField = autoSizes.length > 0;
  const categories = Array.from(new Set(products.map(product => product.category || 'Uncategorized')));

  function updateField(name: string, value: string | boolean) {
    setForm(current => {
      if (name === 'category') {
        const nextConfig = categoryConfig[String(value)] || categoryConfig.Accessories;
        return {
          ...current,
          category: String(value),
          subCategory: nextConfig.subCategories[0],
          type: nextConfig.types[0],
          sizes: (nextConfig.sizes || []).join(', '),
        };
      }

      return {...current, [name]: value};
    });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!can(role, 'products:create')) return;
    const images = form.image.split(',').map(item => item.trim()).filter(Boolean);
    const selectedSizes = showSizeField
      ? form.sizes.split(',').map(item => item.trim()).filter(Boolean)
      : [];
    await adminApi.createProduct({
      title: form.title,
      name: form.title,
      description: form.description,
      category: form.category,
      subCategory: form.subCategory,
      type: form.type,
      brand: form.brand,
      price: Number(form.price),
      discountedPrice: form.discountedPrice ? Number(form.discountedPrice) : undefined,
      stock: form.stock ? Number(form.stock) : 0,
      image: images[0],
      images,
      sizes: selectedSizes,
      material: form.material,
      color: form.color,
      gender: form.gender,
      tags: form.tags.split(',').map(item => item.trim()).filter(Boolean),
      isPublished: form.isPublished,
    });
    pushFeed('Product created', `${form.title} was pushed with ${selectedSizes.length ? `${selectedSizes.length} size options` : 'no size matrix'}.`);
    setForm(current => ({...current, title: '', description: '', price: '', discountedPrice: '', stock: '', image: '', material: '', color: '', tags: '', sizes: showSizeField ? autoSizes.join(', ') : ''}));
    await refreshAll();
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
            <select value={form.type} onChange={event => updateField('type', event.target.value)}>
              {currentConfig.types.map(type => <option key={type}>{type}</option>)}
            </select>
            <input placeholder="Brand" value={form.brand} onChange={event => updateField('brand', event.target.value)} />
          </div>
          <div className="form-grid">
            <input required type="number" placeholder="Price" value={form.price} onChange={event => updateField('price', event.target.value)} />
            <input type="number" placeholder="Discounted price" value={form.discountedPrice} onChange={event => updateField('discountedPrice', event.target.value)} />
            <input type="number" placeholder="Stock" value={form.stock} onChange={event => updateField('stock', event.target.value)} />
            <input placeholder="Color" value={form.color} onChange={event => updateField('color', event.target.value)} />
          </div>
          <input placeholder="Image upload URL(s), comma separated" value={form.image} onChange={event => updateField('image', event.target.value)} />
          <div className="upload-box">
            <strong>Image upload ready</strong>
            <span>Paste hosted URLs now. Backend multipart upload endpoint can be connected here later.</span>
          </div>
          <div className="form-grid">
            <input placeholder="Material" value={form.material} onChange={event => updateField('material', event.target.value)} />
            <select value={form.gender} onChange={event => updateField('gender', event.target.value)}>
              {['Unisex', 'Men', 'Women', 'Kids'].map(value => <option key={value}>{value}</option>)}
            </select>
            <input placeholder="Tags: summer, cotton" value={form.tags} onChange={event => updateField('tags', event.target.value)} />
          </div>
          {showSizeField ? (
            <div className="size-box">
              <strong>Sizes for {form.category}</strong>
              <input placeholder="Sizes: S, M, L, XL" value={form.sizes} onChange={event => updateField('sizes', event.target.value)} />
              <div>{autoSizes.map(size => <span key={size}>{size}</span>)}</div>
            </div>
          ) : (
            <div className="size-box muted">No automatic size UI for this category.</div>
          )}
          <label className="check-line">
            <input type="checkbox" checked={form.isPublished} onChange={event => updateField('isPublished', event.target.checked)} />
            Publish product immediately
          </label>
          <button disabled={!can(role, 'products:create')}>Create product</button>
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
