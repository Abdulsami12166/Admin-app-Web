import {apiRequest} from './client';

export type AdminUser = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  blocked?: boolean;
  isVerified?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
};

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
};

export type AdminOrder = {
  _id: string;
  totalAmount?: number;
  orderStatus?: string;
  paymentStatus?: string;
  createdAt?: string;
  user?: AdminUser;
  items?: Array<{title?: string; quantity?: number}>;
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
  recentOrders?: AdminOrder[];
  recentUsers?: AdminUser[];
  recentActivities?: ActivityItem[];
  fetchedAt?: string;
};

export type ActivityItem = {
  _id?: string;
  action?: string;
  details?: string;
  createdAt?: string;
  user?: AdminUser;
};

export type AdminLoginResponse = {
  success: boolean;
  token: string;
  user: AdminUser;
  message?: string;
};

export async function loginAdmin(email: string, password: string) {
  return apiRequest<AdminLoginResponse>('/admin/auth/login', {
    method: 'POST',
    body: {email, password},
  });
}

export async function getDashboardMetrics() {
  return apiRequest<{data: DashboardMetrics}>('/admin/dashboard/metrics', {auth: true});
}

export async function getActivities() {
  return apiRequest<{data: {activities: ActivityItem[]}}>('/admin/activities', {auth: true});
}

export async function getUsers() {
  return apiRequest<{data: {users: AdminUser[]}}>('/admin/users', {auth: true});
}

export async function blockUser(userId: string) {
  return apiRequest(`/admin/users/${userId}/block`, {method: 'POST', auth: true});
}

export async function unblockUser(userId: string) {
  return apiRequest(`/admin/users/${userId}/unblock`, {method: 'POST', auth: true});
}

export async function forceLogoutUser(userId: string) {
  return apiRequest(`/admin/users/${userId}/logout`, {method: 'POST', auth: true});
}

export async function getProducts() {
  const adminResponse = await apiRequest<{data: {products: AdminProduct[]}}>('/admin/products', {auth: true});
  if (adminResponse.data?.products?.length) {
    return adminResponse;
  }

  try {
    const publicResponse = await apiRequest<{data: {products: AdminProduct[]}}>('/products?limit=100');
    if (publicResponse.data?.products?.length) {
      return publicResponse;
    }
  } catch {
    // Keep the authenticated admin response when the public catalog is unavailable.
  }

  return adminResponse;
}

export async function createProduct(body: {
  title: string;
  description: string;
  category: string;
  brand?: string;
  price: number;
  discountedPrice?: number;
  stock?: number;
  image?: string;
  images?: string[];
  sizes?: string[];
  isPublished?: boolean;
}) {
  return apiRequest<{data: {product: AdminProduct}}>('/admin/products', {
    method: 'POST',
    body,
    auth: true,
  });
}

export async function getOrders() {
  return apiRequest<{data: {orders: AdminOrder[]}}>('/admin/orders', {auth: true});
}

export async function updateOrderStatus(
  orderId: string,
  body: {orderStatus?: string; paymentStatus?: string},
) {
  return apiRequest(`/admin/orders/${orderId}/status`, {
    method: 'PATCH',
    body,
    auth: true,
  });
}
