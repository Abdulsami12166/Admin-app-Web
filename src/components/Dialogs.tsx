/**
 * Confirmation dialogs and modals for admin actions — dark navy theme
 */

import React, { useState } from 'react';

// ─── Shared overlay backdrop ───────────────────────────────────────────────
const Backdrop: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <div
    style={{
      position: 'fixed', inset: 0,
      background: 'rgba(4, 12, 24, 0.75)',
      backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }}
    onClick={onClick}
  >
    {children}
  </div>
);

// ─── Shared modal card ──────────────────────────────────────────────────────
const ModalCard: React.FC<{ children: React.ReactNode; maxWidth?: number }> = ({ children, maxWidth = 420 }) => (
  <div
    style={{
      background: 'linear-gradient(145deg, #0d1f33, #06101d)',
      border: '1px solid #28425f',
      borderRadius: 20,
      padding: '28px 28px 24px',
      maxWidth,
      width: '90%',
      boxShadow: '0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,210,255,0.07)',
    }}
    onClick={e => e.stopPropagation()}
  >
    {children}
  </div>
);

// ─── Confirmation Dialog ────────────────────────────────────────────────────
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
  title, message, description,
  onConfirm, onCancel,
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

  const isDisabled = loading || (requiresReason && !reason.trim());

  return (
    <Backdrop onClick={onCancel}>
      <ModalCard>
        {/* Icon */}
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: isDangerous ? 'rgba(255,139,139,0.15)' : 'rgba(99,210,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 16 }}>
          {isDangerous ? '⚠️' : '?'}
        </div>

        <h2 style={{ margin: '0 0 6px', color: '#eef4fb', fontSize: 18, fontWeight: 800 }}>{title}</h2>
        {description && <p style={{ margin: '0 0 14px', fontSize: 13, color: '#9fb6cb' }}>{description}</p>}

        {/* Message box */}
        <div style={{ marginBottom: 18, padding: '12px 14px', background: isDangerous ? 'rgba(255,139,139,0.08)' : 'rgba(99,210,255,0.07)', borderRadius: 12, border: `1px solid ${isDangerous ? 'rgba(255,139,139,0.2)' : 'rgba(99,210,255,0.15)'}` }}>
          <p style={{ margin: 0, fontSize: 14, color: '#dbe8f5', lineHeight: 1.6 }}>{message}</p>
        </div>

        {/* Optional reason textarea */}
        {requiresReason && (
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: '#9fb6cb', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Reason (required)
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder={reasonPlaceholder}
              style={{ width: '100%', minHeight: 80, padding: '10px 12px', border: '1px solid #28425f', borderRadius: 12, background: '#08111f', color: '#eef4fb', fontSize: 13, fontFamily: 'inherit', resize: 'none', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{ padding: '9px 20px', borderRadius: 12, border: '1px solid #28425f', background: 'transparent', color: '#9fb6cb', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1, fontSize: 14, fontWeight: 700, transition: 'all 0.15s' }}
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDisabled}
            style={{ padding: '9px 20px', borderRadius: 12, border: 'none', background: isDangerous ? 'rgba(255,139,139,0.2)' : '#63d2ff', color: isDangerous ? '#ff8b8b' : '#06101d', cursor: isDisabled ? 'not-allowed' : 'pointer', opacity: isDisabled ? 0.5 : 1, fontSize: 14, fontWeight: 800, transition: 'all 0.15s' }}
          >
            {loading ? 'Processing…' : confirmText}
          </button>
        </div>
      </ModalCard>
    </Backdrop>
  );
}

// ─── Success Modal ──────────────────────────────────────────────────────────
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
    <Backdrop onClick={onClose}>
      <ModalCard maxWidth={380}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(67,209,122,0.15)', border: '2px solid rgba(67,209,122,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>
            ✓
          </div>
          <h2 style={{ margin: '0 0 8px', color: '#43d17a', fontSize: 20, fontWeight: 800 }}>{title}</h2>
          <p style={{ margin: '0 0 20px', fontSize: 14, color: '#9fb6cb', lineHeight: 1.6 }}>{message}</p>
          <button
            onClick={onClose}
            style={{ padding: '9px 28px', borderRadius: 12, background: 'rgba(67,209,122,0.2)', color: '#43d17a', cursor: 'pointer', fontSize: 14, fontWeight: 700, border: '1px solid rgba(67,209,122,0.3)' } as React.CSSProperties}
          >
            Close
          </button>
        </div>
      </ModalCard>
    </Backdrop>
  );
}

// ─── Error Modal ────────────────────────────────────────────────────────────
interface ErrorModalProps {
  title: string;
  message: string;
  details?: string;
  errorCode?: string;
  onRetry?: () => void;
  onClose: () => void;
}

export function ErrorModal({ title, message, details, errorCode, onRetry, onClose }: ErrorModalProps) {
  return (
    <Backdrop onClick={onClose}>
      <ModalCard maxWidth={460}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,139,139,0.15)', border: '2px solid rgba(255,139,139,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 16 }}>
          ✕
        </div>
        <h2 style={{ margin: '0 0 8px', color: '#ff8b8b', fontSize: 20, fontWeight: 800 }}>{title}</h2>
        <p style={{ margin: '0 0 14px', fontSize: 14, color: '#9fb6cb', lineHeight: 1.6 }}>{message}</p>

        {details && (
          <div style={{ marginBottom: 12, padding: '12px 14px', background: 'rgba(255,139,139,0.08)', borderRadius: 12, border: '1px solid rgba(255,139,139,0.2)' }}>
            <p style={{ margin: 0, fontSize: 13, color: '#ff8b8b' }}>{details}</p>
          </div>
        )}

        {errorCode && (
          <div style={{ marginBottom: 16, padding: '8px 12px', background: 'rgba(10,23,40,0.8)', borderRadius: 10, border: '1px solid #28425f' }}>
            <p style={{ margin: 0, fontSize: 12, color: '#9fb6cb', fontFamily: 'monospace' }}>Error Code: {errorCode}</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ padding: '9px 20px', borderRadius: 12, border: '1px solid #28425f', background: 'transparent', color: '#9fb6cb', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}
          >
            Close
          </button>
          {onRetry && (
            <button
              onClick={onRetry}
              style={{ padding: '9px 20px', borderRadius: 12, border: 'none', background: '#63d2ff', color: '#06101d', cursor: 'pointer', fontSize: 14, fontWeight: 800 }}
            >
              Retry
            </button>
          )}
        </div>
      </ModalCard>
    </Backdrop>
  );
}

// ─── Loading Overlay ────────────────────────────────────────────────────────
interface LoadingOverlayProps {
  message?: string;
  progress?: number;
}

export function LoadingOverlay({ message = 'Loading...', progress }: LoadingOverlayProps) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(4,12,24,0.75)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
    >
      <div style={{ background: 'linear-gradient(145deg,#0d1f33,#06101d)', border: '1px solid #28425f', borderRadius: 20, padding: '32px 40px', textAlign: 'center', maxWidth: 300, boxShadow: '0 24px 60px rgba(0,0,0,0.6)' }}>
        {/* Spinner */}
        <div style={{ width: 48, height: 48, border: '3px solid #1a3050', borderTop: '3px solid #63d2ff', borderRadius: '50%', animation: 'admin-spin 0.85s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ margin: 0, fontSize: 14, color: '#9fb6cb', fontWeight: 700 }}>{message}</p>

        {typeof progress === 'number' && (
          <div style={{ marginTop: 16 }}>
            <div style={{ width: '100%', height: 5, background: '#1a3050', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg,#63d2ff,#43d17a)', transition: 'width 0.3s', borderRadius: 999 }} />
            </div>
            <p style={{ margin: '8px 0 0', fontSize: 12, color: '#9fb6cb' }}>{progress}%</p>
          </div>
        )}

        <style>{`@keyframes admin-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
