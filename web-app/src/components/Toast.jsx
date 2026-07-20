import { useState, useCallback } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

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

  const getIcon = (type) => {
    switch(type) {
      case 'success': return <CheckCircle size={16} />;
      case 'error': return <XCircle size={16} />;
      default: return <Info size={16} />;
    }
  };

  return (
    <div className="toast-container" role="region" aria-label="Notifications">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`} role="alert">
          <span className="toast-icon">{getIcon(t.type)}</span>
          <span className="toast-message">{t.message}</span>
          <button
            type="button"
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4, marginLeft: 4 }}
            aria-label="Fermer"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
