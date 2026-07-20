import { useState, useCallback } from 'react';

let toastId = 0;

let globalAddToast = null;

export function useToast() {
  const toast = useCallback((message, type = 'info') => {
    if (globalAddToast) globalAddToast({ message, type, id: ++toastId });
  }, []);

  return { toast };
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  globalAddToast = ({ message, type, id }) => {
    setToasts((prev) => [...prev, { message, type, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };

  return (
    <div className="toast-container" role="region" aria-label="Notifications">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`} role="alert">
          <span className="toast-icon">{icons[t.type] || icons.info}</span>
          <span className="toast-message">{t.message}</span>
          <button
            type="button"
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem', padding: '0 4px', marginLeft: 4 }}
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
