/**
 * Confirmation dialogs and modals for admin actions
 */

import React, { useState } from 'react';

interface ConfirmationDialogProps {
  title: string;
  message: string;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  requiresReason?: boolean;
  reasonPlaceholder?: string;
}

export function ConfirmationDialog({
  title,
  message,
  description,
  onConfirm,
  onCancel,
  loading = false,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false,
  requiresReason = false,
  reasonPlaceholder = 'Please enter reason...',
}: ConfirmationDialogProps) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (requiresReason && !reason.trim()) {
      alert('Please provide a reason');
      return;
    }
    onConfirm();
  };

  const isConfirmDisabled = loading || (requiresReason && !reason.trim());

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{title}</h2>
          {description && (
            <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#666' }}>
              {description}
            </p>
          )}
        </div>

        <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#333' }}>{message}</p>
        </div>

        {requiresReason && (
          <div style={{ marginBottom: '20px' }}>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder={reasonPlaceholder}
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'none',
              }}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              backgroundColor: '#fff',
              color: '#333',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: isDangerous ? '#dc3545' : '#007bff',
              color: 'white',
              cursor: isConfirmDisabled ? 'not-allowed' : 'pointer',
              opacity: isConfirmDisabled ? 0.5 : 1,
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

interface SuccessModalProps {
  title: string;
  message: string;
  onClose: () => void;
  autoCloseDelay?: number;
}

export function SuccessModal({ title, message, onClose, autoCloseDelay = 3000 }: SuccessModalProps) {
  React.useEffect(() => {
    if (autoCloseDelay > 0) {
      const timer = setTimeout(onClose, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [autoCloseDelay, onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
          textAlign: 'center',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ marginBottom: '16px', fontSize: '48px' }}>✓</div>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#28a745', marginBottom: '8px' }}>
          {title}
        </h2>
        <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>{message}</p>

        <button
          onClick={onClose}
          style={{
            marginTop: '20px',
            padding: '8px 24px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: '#28a745',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

interface ErrorModalProps {
  title: string;
  message: string;
  details?: string;
  errorCode?: string;
  onRetry?: () => void;
  onClose: () => void;
}

export function ErrorModal({
  title,
  message,
  details,
  errorCode,
  onRetry,
  onClose,
}: ErrorModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '450px',
          width: '90%',
          boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ marginBottom: '16px', fontSize: '48px' }}>✕</div>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#dc3545', marginBottom: '8px' }}>
          {title}
        </h2>
        <p style={{ margin: 0, fontSize: '14px', color: '#666', marginBottom: '12px' }}>{message}</p>

        {details && (
          <div style={{ marginBottom: '12px', padding: '12px', backgroundColor: '#f8d7da', borderRadius: '6px' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#721c24' }}>{details}</p>
          </div>
        )}

        {errorCode && (
          <div style={{ marginBottom: '16px', padding: '8px 12px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>Error Code: {errorCode}</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              backgroundColor: '#fff',
              color: '#333',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            Close
          </button>
          {onRetry && (
            <button
              onClick={onRetry}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#007bff',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface LoadingOverlayProps {
  message?: string;
  progress?: number;
}

export function LoadingOverlay({ message = 'Loading...', progress }: LoadingOverlayProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px',
          textAlign: 'center',
          maxWidth: '300px',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            border: '4px solid #f0f0f0',
            borderTop: '4px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }}
        />
        <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>{message}</p>
        {typeof progress === 'number' && (
          <div style={{ marginTop: '12px' }}>
            <div
              style={{
                width: '100%',
                height: '4px',
                backgroundColor: '#f0f0f0',
                borderRadius: '2px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  backgroundColor: '#007bff',
                  transition: 'width 0.3s',
                }}
              />
            </div>
            <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#999' }}>
              {progress}%
            </p>
          </div>
        )}
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
