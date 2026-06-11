import AsyncStorage from '@react-native-async-storage/async-storage';

import {getApiBaseUrl} from '../../config/env';

export const ADMIN_TOKEN_KEY = '@ecommerce-admin/token';
export const ADMIN_USER_KEY = '@ecommerce-admin/user';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = options.auth ? await AsyncStorage.getItem(ADMIN_TOKEN_KEY) : null;

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? {Authorization: `Bearer ${token}`} : {}),
    },
    ...(options.body ? {body: JSON.stringify(options.body)} : {}),
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = payload?.message || payload?.error || `Request failed: ${response.status}`;
    if (response.status === 401 || (response.status === 403 && message.toLowerCase().includes('admin access'))) {
      await AsyncStorage.multiRemove([ADMIN_TOKEN_KEY, ADMIN_USER_KEY]);
    }
    throw new ApiError(message, response.status);
  }

  return payload as T;
}
