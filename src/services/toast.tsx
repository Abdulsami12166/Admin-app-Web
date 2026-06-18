/**
 * Toast notification system for admin panel
 * Provides modern feedback for all admin actions
 */

import React, { useCallback, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, options?: Partial<Toast>) => void;
  removeToast: (id: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

export const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((
    type: ToastType,
    message: string,
    options: Partial<Toast> = {},
  ) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const duration = options.duration ?? (type === 'error' ? 5000 : 3000);

    const toast: Toast = {
      id,
      type,
      message,
      title: options.title,
      duration,
      action: options.action,
    };

    setToasts(prev => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  }, [removeToast]);

  const success = useCallback((message: string, title?: string) => {
    addToast('success', message, { title });
  }, [addToast]);

  const error = useCallback((message: string, title?: string) => {
    addToast('error', message, { title: title || 'Error' });
  }, [addToast]);

  const warning = useCallback((message: string, title?: string) => {
    addToast('warning', message, { title: title || 'Warning' });
  }, [addToast]);

  const info = useCallback((message: string, title?: string) => {
    addToast('info', message, { title });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

/**
 * Toast display component
 */
export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      default: return '';
    }
  };

  const getStyle = (type: ToastType) => {
    const baseStyle: React.CSSProperties = {
      display: 'flex',
      gap: '12px',
      padding: '12px 16px',
      borderRadius: '8px',
      marginBottom: '12px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      alignItems: 'flex-start',
      animation: 'slideInRight 0.3s ease-out',
    };

    const typeStyles = {
      success: { backgroundColor: 'rgba(10, 41, 27, 0.95)', color: '#43d17a', borderLeft: '4px solid #43d17a', border: '1px solid rgba(67, 209, 122, 0.2)' },
      error: { backgroundColor: 'rgba(45, 22, 22, 0.95)', color: '#ff8b8b', borderLeft: '4px solid #ff8b8b', border: '1px solid rgba(255, 139, 139, 0.2)' },
      warning: { backgroundColor: 'rgba(43, 32, 11, 0.95)', color: '#ffc107', borderLeft: '4px solid #ffc107', border: '1px solid rgba(255, 193, 7, 0.2)' },
      info: { backgroundColor: 'rgba(13, 37, 60, 0.95)', color: '#63d2ff', borderLeft: '4px solid #63d2ff', border: '1px solid rgba(99, 210, 255, 0.2)' },
    };

    return { ...baseStyle, ...typeStyles[type] };
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        maxWidth: '400px',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
      {toasts.map(toast => (
        <div key={toast.id} style={{ ...getStyle(toast.type), pointerEvents: 'auto' }}>
          <span style={{ fontSize: '18px', fontWeight: 'bold', minWidth: '20px' }}>{getIcon(toast.type)}</span>
          <div style={{ flex: 1 }}>
            {toast.title && <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{toast.title}</div>}
            <div style={{ fontSize: '14px' }}>{toast.message}</div>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
              padding: 0,
              color: 'inherit',
              opacity: 0.7,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
