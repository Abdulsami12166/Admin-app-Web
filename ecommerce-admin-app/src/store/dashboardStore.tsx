import React, {createContext, useContext, useEffect, useMemo, useState} from 'react';

import {
  ActivityItem,
  AdminOrder,
  AdminProduct,
  AdminUser,
  DashboardMetrics,
  getActivities,
  createProduct as createProductRequest,
  getDashboardMetrics,
  getOrders,
  getProducts,
  getUsers,
} from '../services/api/admin';
import {
  connectAdminSocket,
  disconnectAdminSocket,
  subscribeToConnectionStatus,
  subscribeToEvent,
} from '../services/socket/adminSocket';
import {useAdminAuth} from './authStore';

type FeedItem = {
  id: string;
  title: string;
  detail: string;
  timestamp: number;
};

type DashboardContextValue = {
  activities: ActivityItem[];
  createProduct: (payload: {
    title: string;
    description: string;
    category: string;
    brand?: string;
    price: number;
    discountedPrice?: number;
    stock?: number;
    image?: string;
    sizes?: string[];
  }) => Promise<void>;
  isRealtimeConnected: boolean;
  isRefreshing: boolean;
  lastSyncAt: number | null;
  metrics: DashboardMetrics;
  orders: AdminOrder[];
  products: AdminProduct[];
  realtimeFeed: FeedItem[];
  refreshActivities: () => Promise<void>;
  refreshAll: () => Promise<void>;
  refreshMetrics: () => Promise<void>;
  refreshOrders: () => Promise<void>;
  refreshProducts: () => Promise<void>;
  refreshUsers: () => Promise<void>;
  resetFeed: () => void;
  users: AdminUser[];
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

const buildFeedItem = (title: string, detail: string): FeedItem => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title,
  detail,
  timestamp: Date.now(),
});

export const DashboardProvider = ({children}: React.PropsWithChildren) => {
  const {isAuthenticated} = useAdminAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics>({});
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [realtimeFeed, setRealtimeFeed] = useState<FeedItem[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);

  async function refreshMetrics() {
    const response = await getDashboardMetrics();
    setMetrics(response.data || {});
  }

  async function refreshActivities() {
    const response = await getActivities();
    setActivities(response.data?.activities || []);
  }

  async function refreshUsers() {
    const response = await getUsers();
    setUsers(response.data?.users || []);
  }

  async function refreshProducts() {
    const response = await getProducts();
    setProducts(response.data?.products || []);
  }

  async function refreshOrders() {
    const response = await getOrders();
    setOrders(response.data?.orders || []);
  }

  async function createProduct(payload: {
    title: string;
    description: string;
    category: string;
    brand?: string;
    price: number;
    discountedPrice?: number;
    stock?: number;
    image?: string;
    sizes?: string[];
  }) {
    await createProductRequest(payload);
    await refreshProducts();
    await refreshMetrics();
    pushRealtimeEvent('Product pushed', `${payload.title} was published to the ecommerce app.`);
  }

  async function refreshAll() {
    setIsRefreshing(true);
    try {
      const results = await Promise.allSettled([
        refreshMetrics(),
        refreshActivities(),
        refreshUsers(),
        refreshProducts(),
        refreshOrders(),
      ]);
      const failedCount = results.filter(result => result.status === 'rejected').length;
      if (failedCount) {
        pushRealtimeEvent('Refresh incomplete', `${failedCount} admin request${failedCount > 1 ? 's' : ''} failed. Loaded the available data.`);
      }
      setLastSyncAt(Date.now());
    } finally {
      setIsRefreshing(false);
    }
  }

  function pushRealtimeEvent(title: string, detail: string) {
    setRealtimeFeed(current => [buildFeedItem(title, detail), ...current].slice(0, 60));
  }

  useEffect(() => {
    if (!isAuthenticated) {
      setActivities([]);
      setIsRealtimeConnected(false);
      setLastSyncAt(null);
      setMetrics({});
      setOrders([]);
      setProducts([]);
      setRealtimeFeed([]);
      setUsers([]);
      disconnectAdminSocket();
      return;
    }

    let disposed = false;
    const cleanups: Array<() => void> = [];

    refreshAll().catch(() => {});

    connectAdminSocket()
      .then(() => {
        if (disposed) {
          return;
        }

        cleanups.push(subscribeToConnectionStatus(setIsRealtimeConnected));

        const handleUserLogin = (payload: any) => {
          pushRealtimeEvent(
            'User login',
            `${payload?.name || payload?.email || 'A user'} signed in.`,
          );
          refreshMetrics().catch(() => {});
          refreshActivities().catch(() => {});
          refreshUsers().catch(() => {});
        };

        const handleUserLogout = (payload: any) => {
          pushRealtimeEvent(
            'User logout',
            `${payload?.name || payload?.email || 'A user'} signed out.`,
          );
          refreshMetrics().catch(() => {});
          refreshActivities().catch(() => {});
          refreshUsers().catch(() => {});
        };

        const handleOrderCreated = (payload: any) => {
          pushRealtimeEvent(
            'New order',
            `Order ${payload?.orderId || 'unknown'} was placed for Rs ${payload?.totalAmount || 0}.`,
          );
          refreshMetrics().catch(() => {});
          refreshActivities().catch(() => {});
          refreshOrders().catch(() => {});
        };

        const handleOrderUpdated = (payload: any) => {
          pushRealtimeEvent(
            'Order updated',
            `Order ${payload?.orderId || 'unknown'} is now ${payload?.orderStatus || 'updated'}.`,
          );
          refreshMetrics().catch(() => {});
          refreshActivities().catch(() => {});
          refreshOrders().catch(() => {});
        };

        const handleForceLogout = (payload: any) => {
          pushRealtimeEvent(
            'Forced logout',
            payload?.message || 'A user session was revoked by admin.',
          );
          refreshActivities().catch(() => {});
          refreshUsers().catch(() => {});
        };

        const handleProductCreated = (payload: any) => {
          pushRealtimeEvent(
            'Product pushed',
            `${payload?.title || 'A new product'} is now visible in the ecommerce app.`,
          );
          refreshMetrics().catch(() => {});
          refreshActivities().catch(() => {});
          refreshProducts().catch(() => {});
        };

        cleanups.push(subscribeToEvent('user-login', handleUserLogin));
        cleanups.push(subscribeToEvent('auth.user.logged_in', handleUserLogin));
        cleanups.push(subscribeToEvent('auth.user.logged_out', handleUserLogout));
        cleanups.push(subscribeToEvent('new-order', handleOrderCreated));
        cleanups.push(subscribeToEvent('order.created', handleOrderCreated));
        cleanups.push(subscribeToEvent('order-status-changed', handleOrderUpdated));
        cleanups.push(subscribeToEvent('order.updated', handleOrderUpdated));
        cleanups.push(subscribeToEvent('user-force-logout', handleForceLogout));
        cleanups.push(subscribeToEvent('product.created', handleProductCreated));
      })
      .catch(() => {});

    return () => {
      disposed = true;
      cleanups.forEach(cleanup => cleanup());
      disconnectAdminSocket();
    };
  }, [isAuthenticated]);

  const value = useMemo(
    () => ({
      activities,
      createProduct,
      isRealtimeConnected,
      isRefreshing,
      lastSyncAt,
      metrics,
      orders,
      products,
      realtimeFeed,
      refreshActivities,
      refreshAll,
      refreshMetrics,
      refreshOrders,
      refreshProducts,
      refreshUsers,
      resetFeed: () => setRealtimeFeed([]),
      users,
    }),
    [activities, createProduct, isRealtimeConnected, isRefreshing, lastSyncAt, metrics, orders, products, realtimeFeed, users],
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
};

export const useDashboardStore = () => {
  const value = useContext(DashboardContext);

  if (!value) {
    throw new Error('useDashboardStore must be used within DashboardProvider');
  }

  return value;
};
