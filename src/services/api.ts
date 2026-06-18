import type {Permission, RolePermissionMatrix} from './access';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');
const PRODUCTION_ADMIN_API_BASE_URL = 'https://backend-admin-qe72.onrender.com/api/v1';

const API_BASE_URL =
  trimTrailingSlash(
    import.meta.env.VITE_ADMIN_API_BASE_URL
      || (import.meta.env.PROD ? PRODUCTION_ADMIN_API_BASE_URL : '/api/v1'),
  );

const SOCKET_BASE_URL =
  trimTrailingSlash(
    import.meta.env.VITE_ADMIN_SOCKET_URL
      || (import.meta.env.PROD
        ? API_BASE_URL.replace(/\/api\/v1$/, '')
        : 'https://backend-admin-qe72.onrender.com')
  );

export const ADMIN_TOKEN_KEY = 'ecommerce-admin-web-token';
export const ADMIN_USER_KEY = 'ecommerce-admin-web-user';

export type AdminUser = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: AdminRole | string;
  permissions?: Permission[] | string[];
  blocked?: boolean;
  isVerified?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
};

export type AdminRole = 'super-admin' | 'admin' | 'product-manager' | 'inventory-manager' | 'support' | 'finance-manager' | 'customer-service';

export type AdminProduct = {
  _id: string;
  title?: string;
  name?: string;
  description?: string;
  slug?: string;
  category?: string;
  subCategory?: string;
  type?: string;
  price?: number;
  discountedPrice?: number;
  stock?: number;
  brand?: string;
  sizes?: string[];
  isPublished?: boolean;
  images?: string[];
  attributes?: Record<string, unknown>;
  specifications?: Record<string, unknown>;
  variants?: AdminVariant[];
};

export type AdminVariant = {
  _id?: string;
  name?: string;
  value?: string;
  attributes?: Record<string, unknown>;
  price?: number;
  stock?: number;
  sku?: string;
  images?: string[];
};

export type AdminOrder = {
  _id: string;
  totalAmount?: number;
  orderStatus?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  paymentReference?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  transactionStatus?: string;
  transactionVerifiedAt?: string;
  createdAt?: string;
  user?: AdminUser;
  items?: Array<{title?: string; quantity?: number}>;
  statusHistory?: Array<{status: string; label?: string; timestamp?: string}>;
};

export type AdminTransaction = Pick<
  AdminOrder,
  | '_id'
  | 'totalAmount'
  | 'orderStatus'
  | 'paymentStatus'
  | 'paymentMethod'
  | 'paymentReference'
  | 'razorpayOrderId'
  | 'razorpayPaymentId'
  | 'transactionStatus'
  | 'transactionVerifiedAt'
  | 'createdAt'
  | 'user'
>;

export type ActivityItem = {
  _id?: string;
  action?: string;
  details?: string;
  createdAt?: string;
  user?: AdminUser;
};

export type DashboardMetrics = {
  totalUsers?: number;
  totalOrders?: number;
  productCount?: number;
  revenue?: number;
  blockedUsers?: number;
  newUsersToday?: number;
  ordersLast24h?: number;
  activeUsersLast24h?: number;
  ordersByStatus?: Record<string, number>;
  recentActivities?: ActivityItem[];
};

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean;
  params?: Record<string, unknown>;
};

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function apiRequest<T = any>(path: string, options: RequestOptions = {}): Promise<{success?: boolean; message?: string} & T> {
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin);
  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }
  const requestUrl = url.toString();
  const token = options.auth ? localStorage.getItem(ADMIN_TOKEN_KEY) : null;
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const requestBody: BodyInit | undefined = options.body
    ? isFormData
      ? options.body as FormData
      : JSON.stringify(options.body)
    : undefined;
  const response = await fetch(requestUrl, {
    method: options.method || 'GET',
    headers: {
      ...(isFormData ? {} : {'Content-Type': 'application/json'}),
      ...(token ? {Authorization: `Bearer ${token}`} : {}),
    },
    ...(requestBody ? {body: requestBody} : {}),
  });
  const text = await response.text();
  let payload: unknown = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      throw new ApiError('Server returned an invalid response. Check the admin API URL.', response.status);
    }
  }

  if (!response.ok) {
    const errorPayload = payload && typeof payload === 'object' ? payload as {message?: string; error?: string} : null;
    const message = errorPayload?.message || errorPayload?.error || `Request failed: ${response.status}`;
    const normalizedMessage = message.toLowerCase();
    if (
      response.status === 401
      || (response.status === 403 && (
        normalizedMessage.includes('admin access')
        || normalizedMessage.includes('blocked by an administrator')
      ))
    ) {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_USER_KEY);
      window.dispatchEvent(new Event('admin-auth-expired'));
    }
    throw new ApiError(message, response.status);
  }

  if (!payload) {
    throw new ApiError('Server returned an empty response. Check the admin API URL.', response.status);
  }

  return payload as {success?: boolean; message?: string} & T;
}

export async function loginAdmin(email: string, password: string) {
  return apiRequest<{success: boolean; token: string; user: AdminUser; message?: string}>(
    '/admin/auth/login',
    {method: 'POST', body: {email, password}},
  );
}

export async function forgotPassword(email: string) {
  return apiRequest<{message: string}>(
    '/auth/forgot-password',
    {method: 'POST', body: {email}, auth: false},
  );
}
 
type AdminApiRequestMethod = RequestOptions['method'];

const adminApiFunction = async <T = any>(path: string, method: AdminApiRequestMethod = 'GET', body?: unknown) =>
  apiRequest<T>(path, {method, body, auth: true});

const adminApiMethods = {
  get: async <T = any>(path: string, options: Omit<RequestOptions, 'method'> = {}) =>
    apiRequest<T>(path, {method: 'GET', ...options, auth: options.auth ?? true}),
  post: async <T = any>(path: string, body?: unknown, options: Omit<RequestOptions, 'method'> = {}) =>
    apiRequest<T>(path, {method: 'POST', body, ...options, auth: options.auth ?? true}),
  patch: async <T = any>(path: string, body?: unknown, options: Omit<RequestOptions, 'method'> = {}) =>
    apiRequest<T>(path, {method: 'PATCH', body, ...options, auth: options.auth ?? true}),
  delete: async <T = any>(path: string, options: Omit<RequestOptions, 'method' | 'body'> = {}) =>
    apiRequest<T>(path, {method: 'DELETE', ...options, auth: options.auth ?? true}),
};

export const adminApi = Object.assign(adminApiFunction, {
  ...adminApiMethods,
  getAccessControl: () => apiRequest<{
    data: {
      roles: AdminRole[];
      managedRoles: AdminRole[];
      permissions: Permission[];
      permissionsByRole: RolePermissionMatrix;
      admins: AdminUser[];
    };
  }>('/admin/access-control', {auth: true}),
  updateRolePermissions: (role: string, permissions: Permission[]) =>
    apiRequest<{data: {permissionsByRole: RolePermissionMatrix}}>(`/admin/roles/${role}/permissions`, {
      method: 'PUT',
      body: {permissions},
      auth: true,
    }),
  createAdmin: (body: {name: string; email: string; password: string; role: string}) =>
    apiRequest<{data: {admin: AdminUser}}>('/admin/admins', {
      method: 'POST',
      body,
      auth: true,
    }),
  getMetrics: () => apiRequest<{data: DashboardMetrics}>('/admin/dashboard/metrics', {auth: true}),
  getActivities: () => apiRequest<{data: {activities: ActivityItem[]}}>('/admin/activities', {auth: true}),
  getUsers: () => apiRequest<{data: {users: AdminUser[]}}>('/admin/users', {auth: true}),
  getUserActivities: (userId: string, page = 1, limit = 50) => apiRequest<{data: {activities: ActivityItem[]}}>(`/admin/users/${userId}/activity?page=${page}&limit=${limit}`, {auth: true}),
  getUserLoginHistory: (userId: string, page = 1, limit = 50) => apiRequest<{data: {history: ActivityItem[]}}>(`/admin/users/${userId}/login-history?page=${page}&limit=${limit}`, {auth: true}),
  getUserPayments: (userId: string, page = 1, limit = 50) => apiRequest<{data: {payments: AdminOrder[]}}>(`/admin/users/${userId}/payments?page=${page}&limit=${limit}`, {auth: true}),
  blockUser: (userId: string) => apiRequest(`/admin/users/${userId}/block`, {method: 'POST', auth: true}),
  unblockUser: (userId: string) => apiRequest(`/admin/users/${userId}/unblock`, {method: 'POST', auth: true}),
  forceLogoutUser: (userId: string) => apiRequest(`/admin/users/${userId}/logout`, {method: 'POST', auth: true}),
  getProducts: () => apiRequest<{data: {products: AdminProduct[]}}>('/admin/products', {auth: true}),
  createProduct: (body: Record<string, unknown> | FormData) =>
    apiRequest<{data: {product: AdminProduct}}>('/admin/products', {
      method: 'POST',
      body,
      auth: true,
    }),
  deleteProduct: (productId: string) =>
    apiRequest(`/admin/products/${productId}`, {
      method: 'DELETE',
      auth: true,
    }),
  updateInventory: (productId: string, body: {stock: number; sku?: string}) =>
    apiRequest<{data: {product: AdminProduct}}>(`/admin/products/${productId}/inventory`, {
      method: 'PATCH',
      body,
      auth: true,
    }),
  createVariant: (productId: string, body: AdminVariant | FormData) =>
    apiRequest(`/admin/products/${productId}/variants`, {method: 'POST', body, auth: true}),
  updateVariant: (productId: string, variantId: string, body: AdminVariant | FormData) =>
    apiRequest(`/admin/products/${productId}/variants/${variantId}`, {method: 'PATCH', body, auth: true}),
  deleteVariant: (productId: string, variantId: string) =>
    apiRequest(`/admin/products/${productId}/variants/${variantId}`, {method: 'DELETE', auth: true}),
  getOrders: () => apiRequest<{data: {orders: AdminOrder[]}}>('/admin/orders', {auth: true}),
  getTransactions: async () => {
    const response = await apiRequest<{data: {orders: AdminOrder[]}}>('/admin/orders', {auth: true});
    return {data: {transactions: response.data?.orders || []}};
  },
  updateOrderStatus: (orderId: string, orderStatus: string) =>
    apiRequest(`/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      body: {orderStatus},
      auth: true,
    }),
  // Refunds
  getRefunds: (page = 1, limit = 20, status?: string) =>
    apiRequest<{data: {refunds: any[]; pagination: any}}>(`/admin/refunds?page=${page}&limit=${limit}${status ? `&status=${status}` : ''}`, {auth: true}),
  getRefundDetails: (refundId: string) => apiRequest<{data: {refund: any}}>(`/admin/refunds/${refundId}`, {auth: true}),
  approveRefund: (refundId: string, body?: {actualRefundAmount?: number; notes?: string}) =>
    apiRequest(`/admin/refunds/${refundId}/approve`, {method: 'POST', body, auth: true}),
  rejectRefund: (refundId: string, body?: {reason?: string}) =>
    apiRequest(`/admin/refunds/${refundId}/reject`, {method: 'POST', body, auth: true}),
  processRefund: (refundId: string, body?: {paymentGateway?: string; transactionId?: string}) =>
    apiRequest(`/admin/refunds/${refundId}/process`, {method: 'POST', body, auth: true}),
  completeRefund: (refundId: string) => apiRequest(`/admin/refunds/${refundId}/complete`, {method: 'POST', auth: true}),
  getRefundStats: () => apiRequest<{data: any}>(`/admin/refunds/stats`, {auth: true}),
  getAdminProfile: (adminId: string) =>
    apiRequest<{
      data: {
        admin: AdminUser;
        permissions: string[];
        loginHistory: any[];
        logoutHistory: any[];
        forceLogoutEvents: any[];
        blockHistory: any[];
        unblockHistory: any[];
        permissionChanges: any[];
        productActions: any[];
        orderActions: any[];
        inventoryActions: any[];
        ticketActions: any[];
        activityTimeline: any[];
        auditLogs: any[];
      }
    }>(`/admin/admins/${adminId}/profile`, {auth: true}),
});

export function getSocketBaseUrl() {
  return SOCKET_BASE_URL;
}
