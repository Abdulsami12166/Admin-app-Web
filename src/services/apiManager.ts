/**
 * Enhanced admin API wrapper with unified error handling and feedback
 */

import { useToast } from './toast';
import { ErrorModal, LoadingOverlay, SuccessModal } from '../components/Dialogs';

interface APIError {
  success: false;
  message: string;
  code?: string;
  details?: string;
  errors?: Array<{ field: string; message: string; code: string }>;
}

interface APISuccess<T> {
  success: true;
  message: string;
  data?: T;
  code?: string;
}

type APIResponse<T> = APISuccess<T> | APIError;

export interface APIRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  showSuccess?: boolean | string;
  showError?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: APIError) => void;
}

class APIManager {
  private baseURL: string;
  private token: string | null = null;
  private toastContext: any = null;

  constructor(baseURL: string = '/api/v1') {
    this.baseURL = baseURL;
    this.loadToken();
  }

  setToastContext(context: any) {
    this.toastContext = context;
  }

  private loadToken() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('ecommerce-admin-web-token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('ecommerce-admin-web-token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ecommerce-admin-web-token');
    }
  }

  async request<T = any>(path: string, options: APIRequestOptions = {}): Promise<APIResponse<T>> {
    const {
      method = 'GET',
      body,
      headers = {},
      showSuccess = false,
      showError = true,
      onSuccess,
      onError,
    } = options;

    try {
      const url = `${this.baseURL}${path}`;
      const fetchOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      };

      if (this.token) {
        fetchOptions.headers = {
          ...(fetchOptions.headers as Record<string, string>),
          Authorization: `Bearer ${this.token}`,
        };
      }

      if (body) {
        fetchOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url, fetchOptions);

      if (!response.ok && response.status === 401) {
        this.clearToken();
        window.location.href = '/admin/login';
        throw new Error('Session expired. Please login again.');
      }

      const data = await response.json();

      if (!response.ok) {
        const error = data as APIError;

        if (showError && this.toastContext) {
          if (error.errors && error.errors.length > 0) {
            error.errors.forEach(e => {
              this.toastContext.error(`${e.field}: ${e.message}`);
            });
          } else {
            this.toastContext.error(error.message || 'Operation failed');
          }
        }

        if (onError) onError(error);

        return error;
      }

      const success = data as APISuccess<T>;

      if (showSuccess) {
        const successMsg = typeof showSuccess === 'string' ? showSuccess : success.message;
        if (this.toastContext) {
          this.toastContext.success(successMsg);
        }
      }

      if (onSuccess) onSuccess(success.data);

      return success;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred';

      if (showError && this.toastContext) {
        this.toastContext.error(errorMsg);
      }

      return {
        success: false,
        message: errorMsg,
        code: 'NETWORK_ERROR',
      };
    }
  }

  get<T = any>(path: string, options: Omit<APIRequestOptions, 'method' | 'body'> = {}) {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  post<T = any>(path: string, body?: any, options: Omit<APIRequestOptions, 'method' | 'body'> = {}) {
    return this.request<T>(path, { ...options, method: 'POST', body });
  }

  patch<T = any>(path: string, body?: any, options: Omit<APIRequestOptions, 'method' | 'body'> = {}) {
    return this.request<T>(path, { ...options, method: 'PATCH', body });
  }

  put<T = any>(path: string, body?: any, options: Omit<APIRequestOptions, 'method' | 'body'> = {}) {
    return this.request<T>(path, { ...options, method: 'PUT', body });
  }

  delete<T = any>(path: string, options: Omit<APIRequestOptions, 'method' | 'body'> = {}) {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }
}

export const apiManager = new APIManager('/api/v1');

/**
 * Hook to use enhanced API with automatic toast feedback
 */
export function useAdminAPI() {
  const toast = useToast();

  React.useEffect(() => {
    apiManager.setToastContext(toast);
  }, [toast]);

  return {
    get: <T = any>(path: string, options?: Omit<APIRequestOptions, 'method' | 'body'>) =>
      apiManager.get<T>(path, options),
    post: <T = any>(path: string, body?: any, options?: Omit<APIRequestOptions, 'method' | 'body'>) =>
      apiManager.post<T>(path, body, options),
    patch: <T = any>(path: string, body?: any, options?: Omit<APIRequestOptions, 'method' | 'body'>) =>
      apiManager.patch<T>(path, body, options),
    put: <T = any>(path: string, body?: any, options?: Omit<APIRequestOptions, 'method' | 'body'>) =>
      apiManager.put<T>(path, body, options),
    delete: <T = any>(path: string, options?: Omit<APIRequestOptions, 'method' | 'body'>) =>
      apiManager.delete<T>(path, options),
  };
}
