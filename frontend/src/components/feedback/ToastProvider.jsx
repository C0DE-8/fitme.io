import { useCallback, useMemo, useState, useEffect } from "react";
import { FiAlertTriangle, FiCheckCircle, FiInfo, FiX } from "react-icons/fi";
import { ToastContext } from "./toastContext";
import styles from "./ToastProvider.module.css";

const icons = {
  success: FiCheckCircle,
  error: FiAlertTriangle,
  info: FiInfo,
};

function ToastItem({ toast, onClose }) {
  const Icon = icons[toast.type] || FiInfo;

  useEffect(() => {
    const timeout = window.setTimeout(() => onClose(toast.id), toast.duration);
    return () => window.clearTimeout(timeout);
  }, [onClose, toast.duration, toast.id]);

  return (
    <div className={`${styles.toast} ${styles[toast.type] || styles.info}`} role="status">
      <span className={styles.icon}>
        <Icon aria-hidden="true" />
      </span>
      <div className={styles.copy}>
        {toast.title ? <strong>{toast.title}</strong> : null}
        <p>{toast.message}</p>
      </div>
      <button type="button" onClick={() => onClose(toast.id)} aria-label="Close notification">
        <FiX aria-hidden="true" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((type, message, options = {}) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((current) => [
      ...current.slice(-3),
      {
        id,
        type,
        message,
        title: options.title || "",
        duration: options.duration || 4200,
      },
    ]);
    return id;
  }, []);

  const value = useMemo(
    () => ({
      success: (message, options) => pushToast("success", message, options),
      error: (message, options) => pushToast("error", message, options),
      info: (message, options) => pushToast("info", message, options),
      remove: removeToast,
    }),
    [pushToast, removeToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.viewport} aria-live="polite" aria-relevant="additions">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
