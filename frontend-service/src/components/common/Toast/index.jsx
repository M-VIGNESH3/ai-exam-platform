import React from 'react';
import { usePlatform } from '../../../contexts/PlatformContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ToastContainer = () => {
  const { toasts, removeToast } = usePlatform();

  if (toasts.length === 0) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="toast-icon text-success" size={20} style={{ color: 'var(--color-success)' }} />;
      case 'danger':
        return <AlertCircle className="toast-icon text-danger" size={20} style={{ color: 'var(--color-danger)' }} />;
      case 'warning':
        return <AlertTriangle className="toast-icon text-warning" size={20} style={{ color: 'var(--color-warning)' }} />;
      case 'info':
      default:
        return <Info className="toast-icon text-info" size={20} style={{ color: 'var(--color-info)' }} />;
    }
  };

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
          role="alert"
        >
          {getIcon(toast.type)}
          <div className="toast-content">
            <div className="toast-title">{toast.title}</div>
            {toast.message && <div className="toast-message">{toast.message}</div>}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              padding: '0.15rem'
            }}
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
