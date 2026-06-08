import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error:   (msg) => addToast(msg, 'error', 5000),
    warning: (msg) => addToast(msg, 'warning'),
    info:    (msg) => addToast(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast container — top-right */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: 360 }}>
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

// ── Single Toast ──────────────────────────────────────────────
const STYLES = {
  success: {
    icon: CheckCircle2,
    bar:  'bg-emerald-500',
    bg:   'bg-slate-900 border-emerald-500/30',
    text: 'text-emerald-400',
  },
  error: {
    icon: XCircle,
    bar:  'bg-rose-500',
    bg:   'bg-slate-900 border-rose-500/30',
    text: 'text-rose-400',
  },
  warning: {
    icon: AlertTriangle,
    bar:  'bg-amber-500',
    bg:   'bg-slate-900 border-amber-500/30',
    text: 'text-amber-400',
  },
  info: {
    icon: Info,
    bar:  'bg-blue-500',
    bg:   'bg-slate-900 border-blue-500/30',
    text: 'text-blue-400',
  },
};

function Toast({ toast, onDismiss }) {
  const s = STYLES[toast.type] || STYLES.success;
  const Icon = s.icon;

  return (
    <div
      className={`pointer-events-auto w-full flex items-start gap-3 p-4 rounded-xl border shadow-2xl toast-enter ${s.bg}`}
    >
      {/* Colored left bar */}
      <div className={`absolute left-0 top-2 bottom-2 w-1 rounded-full ${s.bar}`} style={{ position: 'relative', width: 4, flexShrink: 0, borderRadius: 999 }} />
      <Icon size={18} className={`flex-shrink-0 mt-0.5 ${s.text}`} />
      <p className="text-slate-200 text-sm flex-1 leading-relaxed">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
      >
        <X size={15} />
      </button>
    </div>
  );
}
