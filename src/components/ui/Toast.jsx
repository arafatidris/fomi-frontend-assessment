'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CircleAlert, CircleCheck, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const ToastContext = createContext(null);

const ICONS = { success: CircleCheck, error: CircleAlert };

/**
 * Lightweight toasts announced through a polite live region.
 * toast({ title, description?, tone?: 'success' | 'error', action?: { label, onClick } })
 */
export function ToastProvider({ children, className }) {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast)));
    setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 200);
  }, []);

  const toast = useCallback((options) => {
    counter.current += 1;
    const id = counter.current;
    setToasts((current) => [...current.slice(-2), { id, ...options }]);
    return id;
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-relevant="additions"
        className={cn(
          'pointer-events-none fixed inset-x-0 bottom-[calc(var(--toast-offset,1.25rem)+env(safe-area-inset-bottom))] z-900 flex flex-col items-center gap-2 px-4',
          className,
        )}
      >
        {toasts.map((item) => (
          <ToastItem key={item.id} toast={item} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }) {
  const [paused, setPaused] = useState(false);
  const Icon = ICONS[toast.tone];

  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(() => onDismiss(toast.id), toast.tone === 'error' ? 6500 : 3200);
    return () => clearTimeout(timer);
  }, [paused, toast.id, toast.tone, onDismiss]);

  return (
    <div
      role={toast.tone === 'error' ? 'alert' : 'status'}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-white/10 bg-[#1c1917] py-2.5 pl-3.5 pr-2 text-sm text-white shadow-pop',
        'transition-[opacity,translate] duration-200 ease-out starting:translate-y-2 starting:opacity-0',
        toast.leaving && 'translate-y-1 opacity-0',
      )}
    >
      {Icon && <Icon aria-hidden className={cn('size-4 shrink-0', toast.tone === 'error' ? 'text-[#ff9c8a]' : 'text-[#7ee0a8]')} />}
      <div className="min-w-0 flex-1">
        <p className="font-medium">{toast.title}</p>
        {toast.description && <p className="mt-0.5 text-[13px] text-white/70">{toast.description}</p>}
      </div>
      {toast.action && (
        <button
          type="button"
          onClick={() => {
            toast.action.onClick();
            onDismiss(toast.id);
          }}
          className="shrink-0 rounded-full px-2.5 py-1 text-[13px] font-semibold text-[#ffb4a2] transition-colors hover:bg-white/10"
        >
          {toast.action.label}
        </button>
      )}
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded-full p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
      >
        <X aria-hidden className="size-3.5" />
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>.');
  return context;
}
